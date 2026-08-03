# Projekt: SerwisPod Ręką — mobilny serwis komputerowy

Mobilny serwis komputerowy (JDG). Odbiór i dowóz sprzętu gratis w promieniu 50 km od bazy.
Pełne wymagania: `BRIEF.md`. Pracujemy fazami — po każdej fazie STOP na akceptację właściciela.

## Dane firmy
- Nazwa: **SerwisPod Ręką** · Domena: **serwispodreka.pl** (jeszcze bez rejestracji/DNS)
- Telefon: **+48 531 809 749** (E.164: `+48531809749`)
- E-mail kontaktowy: **serwispodreka@gmail.com** · nadawca maili: `noreply@serwispodreka.pl`
- Baza/warsztat: **Warszawa (Białołęka)**,
  współrzędne `52.321, 20.9876` — środek promienia 50 km.
  **Adresu NIE publikujemy na stronie** (GBP: obszar obsługi zamiast adresu).
- Godziny: **całodobowo, 7 dni w tygodniu.** Nocą — **dopłata** (kwota/okno: TODO).
- NIP: brak (JDG jeszcze niezarejestrowana).

## Komendy
- `pnpm dev` — serwer deweloperski (Turbopack)
- `pnpm build` / `pnpm start` — build produkcyjny / start
- `pnpm lint` — ESLint · `pnpm format` / `format:check` — Prettier
- `pnpm test` / `pnpm test:watch` — Vitest (unit)
- `pnpm db:generate` / `db:push` / `db:migrate` / `db:studio` — Drizzle Kit
- `pnpm db:seed` — seed (Faza 1) · `pnpm db:anonymize` — anonimizacja RODO (Faza 9)

## Stack
Next 16 (App Router, TS strict) · Tailwind v4 · Drizzle ORM + Supabase (Postgres) · Zod ·
własne sesje admina + @node-rs/argon2 · Resend + react-email · Telegram Bot API ·
Vercel Blob · Cloudflare Turnstile · Vitest + Playwright · pnpm · hosting Vercel (fra1).

## Architektura
- Logika biznesowa TYLKO w `src/services/` — UI (Server Actions), route handlery i webhook
  Telegrama wołają te same funkcje. Zero duplikacji.
- Maszyna stanów: `src/lib/ticket-state.ts` — czyste funkcje; zmiana statusu wyłącznie przez
  `canTransition()`. Każde przejście zapisuje `ticket_event` w tej samej transakcji.
- Schematy Zod: `src/lib/validation/` — współdzielone client/server; każdy input walidowany
  po stronie serwera (nawet jeśli walidował klient).
- Baza: `src/db/` — Supabase Postgres, sterownik **postgres.js** z `prepare: false`
  (pooler transakcyjny Supavisor, 6543). Transakcje interaktywne działają (maszyna stanów).

## Konwencje
- Interfejs, treści, komunikaty błędów, dane w bazie: po polsku.
- Nazwy zmiennych, funkcji, tabel, plików: po angielsku.
- Kolumny DB w snake_case (drizzle `casing: "snake_case"`), pola TS w camelCase.
- Ceny w groszach (integer), formatowane przy wyświetlaniu.
- Telefony normalizowane do E.164 (+48…) przy zapisie.
- Daty i godziny w strefie Europe/Warsaw.
- TS strict + noUncheckedIndexedAccess/noImplicitOverride/noFallthroughCasesInSwitch;
  zero `any`, zero `@ts-ignore`.
- Kroje: Bricolage Grotesque (display), Inter Tight (tekst), JetBrains Mono (kody) —
  subset `latin-ext` dla polskich znaków.

## Decyzje projektowe

### Faza 0 (init)
- **Next 16** zamiast dosłownie 15 — create-next-app instaluje najnowszy; warunek „15+" spełniony.
- **Auth: własny system sesji** (tabela `sessions` + cookie httpOnly/Secure/SameSite=Lax +
  @node-rs/argon2), BEZ Auth.js. Powód: Auth.js v5 credentials wymusza JWT i nie umie sesji
  w bazie — sprzeczne z briefem. Własne = ~100 linii, mniej zależności, zgodne z modelem danych.
- **Baza: Supabase Postgres** (zamiast Neon — decyzja właściciela). Sterownik postgres.js,
  `prepare: false` dla poolera transakcyjnego (6543); migracje przez `DIRECT_URL` (5432).
- **RLS / Data API (RODO):** tabele z danymi klientów są w schemacie `public`, który Supabase
  wystawia przez auto-REST (klucz anon). W Fazie 1 włączamy **RLS deny-all** na każdej tabeli
  (nasze połączenie jako `postgres` omija RLS) lub wyłączamy Data API — inaczej zgłoszenia
  byłyby czytelne przez publiczny endpoint.
- **Dystans: haversine, baza = Białołęka (52.321, 20.9876),
  promień 50 km w linii prostej.** Współrzędne w `BASE_LAT`/`BASE_LNG`.
- **Formularz bez JS:** jednostronicowy fallback serwerowy (Server Action) + wersja 4-krokowa
  z JS. Turnstile działa tylko w wersji z JS.
- **Argon2: @node-rs/argon2** (prebuilt, bez kompilacji na Windows) — instalacja w Fazie 3.
- **Analityka i Playwright/e2e odłożone do Fazy 8.** W Fazie 0 skonfigurowany tylko Vitest.
- **Prettier + prettier-plugin-tailwindcss** dodane do formatowania.
- **Design zatwierdzony** (właściciel: „zrób sam"). Plan z sekcji 10 przyjęty; paleta wpisana
  w tokeny `globals.css` (ink/pcb/signal/paper/surface/steel/line/alert).

### Faza 1 (schemat + logika)
- Wszystkie tabele w `public` z **RLS bez polityk (deny-all)**. Połączenie jako `postgres`
  (właściciel) omija RLS; anon/authenticated dostają 0 wierszy — ochrona danych klientów.
- ID: app-side **uuidv7** (`src/lib/ids.ts`, `$defaultFn`), bez rozszerzeń Postgresa.
- Kolumny snake_case przez `casing: "snake_case"` (potwierdzone w `db:push`).
- Seed idempotentny (`onConflictDoNothing`); zgłoszenia testowe tylko poza production.
  Ceny w seedzie: placeholdery `// TODO: zweryfikuj ceny`.
- Skrypty TS przez `node --env-file=.env.local --import tsx` (dev-dep `tsx`).
- `strict: false` w drizzle.config, aby `db:push` nie wisiał na potwierdzeniu.

### Faza 2 (formularz zgłoszenia)
- `createTicket` (`src/services/tickets.ts`) — jedyne miejsce tworzenia zgłoszenia; transakcja
  (ticket + ticket_event), kod `SRV-RRRR-NNNN` przez atomowy licznik `ticket_counters`.
- Server Action `submitTicket` z progresywnym wzbogaceniem — działa też bez JS (Next renderuje
  formularz jako MPA-action). Wersja 4-krokowa tylko z JS (jeden `<form>`, kroki ukrywane atrybutem).
- Anty-spam: honeypot + minimalny czas (JS) + Turnstile (gdy token) + rate-limit 3/h/IP-hash
  w tabeli `rate_limits` (przesuwane okno, bez Redisa).
- Dystans z lokalnego `data/kody-pocztowe.json` (bez API na hot path); nieznany kod → `inServiceArea=null`.
- Moduły w `src/lib` i `src/services` używają importów **względnych** (działają pod tsx/skryptami);
  komponenty w `app/` używają aliasu `@/`.
- Skrypty tsx muszą mieć `main()` (tsx kompiluje .ts do CJS — brak top-level await).

## Do uzupełnienia przez właściciela (aktywne placeholdery)
- **DEV-sekrety ustawione** w `.env.local` (`SESSION_SECRET`, `IP_HASH_SALT`,
  `ADMIN_PASSWORD=<dev-only, see .env.local>`, testowe klucze Turnstile) — **wszystkie do wymiany przed produkcją**.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` (Faza 4).
- `RESEND_API_KEY` (Faza 4), `BLOB_READ_WRITE_TOKEN` (Faza 3), `CRON_SECRET` (Faza 8).
- **NIP** — po rejestracji JDG. **Dopłata nocna** — ustalić kwotę i okno godzin.
- **Ceny usług w seedzie** — placeholdery, do potwierdzenia.
- Produkcyjne klucze Turnstile + pełniejszy `data/kody-pocztowe.json` przed produkcją.

Rozwiązane: dane firmy, Supabase, schemat + seed, formularz zgłoszenia end-to-end.
