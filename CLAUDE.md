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

## Do uzupełnienia przez właściciela (aktywne placeholdery)
- **`DATABASE_URL`** + **`DIRECT_URL`** — projekt na supabase.com (region EU/Frankfurt);
  potrzebne od Fazy 1 do `db:push`/seed.
- Sekrety: `SESSION_SECRET`, `IP_HASH_SALT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` (Faza 4).
- Turnstile keys (Faza 2), `RESEND_API_KEY` (Faza 4), `BLOB_READ_WRITE_TOKEN`.
- **NIP** — po rejestracji JDG. **Dopłata nocna** — ustalić kwotę i okno godzin.
- Ceny usług w seedzie — do weryfikacji (Faza 1).

Rozwiązane: nazwa, domena, telefon, e-mail, adres bazy + współrzędne, godziny (całodobowo).
