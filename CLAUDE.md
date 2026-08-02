# Projekt: {{NAZWA_FIRMY}} — mobilny serwis komputerowy

Mobilny serwis komputerowy (JDG). Odbiór i dowóz sprzętu gratis w promieniu 50 km od bazy.
Pełne wymagania: `BRIEF.md`. Pracujemy fazami — po każdej fazie STOP na akceptację właściciela.

## Komendy
- `pnpm dev` — serwer deweloperski (Turbopack)
- `pnpm build` / `pnpm start` — build produkcyjny / start
- `pnpm lint` — ESLint · `pnpm format` / `format:check` — Prettier
- `pnpm test` / `pnpm test:watch` — Vitest (unit)
- `pnpm db:generate` / `db:push` / `db:migrate` / `db:studio` — Drizzle Kit
- `pnpm db:seed` — seed (Faza 1) · `pnpm db:anonymize` — anonimizacja RODO (Faza 9)

## Stack
Next 16 (App Router, TS strict) · Tailwind v4 · Drizzle ORM + Neon (Postgres) · Zod ·
własne sesje admina + @node-rs/argon2 · Resend + react-email · Telegram Bot API ·
Vercel Blob · Cloudflare Turnstile · Vitest + Playwright · pnpm · hosting Vercel (fra1).

## Architektura
- Logika biznesowa TYLKO w `src/services/` — UI (Server Actions), route handlery i webhook
  Telegrama wołają te same funkcje. Zero duplikacji.
- Maszyna stanów: `src/lib/ticket-state.ts` — czyste funkcje; zmiana statusu wyłącznie przez
  `canTransition()`. Każde przejście zapisuje `ticket_event` w tej samej transakcji.
- Schematy Zod: `src/lib/validation/` — współdzielone client/server; każdy input walidowany
  po stronie serwera (nawet jeśli walidował klient).
- Baza: `src/db/` — sterownik **neon-serverless (WebSocket)**, NIE neon-http (ten nie
  obsługuje interaktywnych transakcji).

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
- **Sterownik Neon: neon-serverless (Pool/WebSocket)** — neon-http nie wspiera transakcji
  interaktywnych wymaganych przez maszynę stanów.
- **Dystans: haversine, baza = centrum Warszawy (52.2297, 21.0122), promień 50 km w linii
  prostej.** Do potwierdzenia, jeśli bazą jest konkretny warsztat poza centrum.
- **Formularz bez JS:** jednostronicowy fallback serwerowy (Server Action) + wersja 4-krokowa
  z JS. Turnstile działa tylko w wersji z JS.
- **Argon2: @node-rs/argon2** (prebuilt, bez kompilacji na Windows) — instalacja w Fazie 3.
- **Analityka i Playwright/e2e odłożone do Fazy 8.** W Fazie 0 skonfigurowany tylko Vitest.
- **Prettier + prettier-plugin-tailwindcss** dodane do formatowania.

## Do uzupełnienia przez właściciela (aktywne placeholdery)
- Dane firmy: `NAZWA_FIRMY`, `DOMENA`, `TELEFON`, `EMAIL_KONTAKT`, `BAZA_ADRES`, `GODZINY`, `NIP`.
- `DATABASE_URL` — utwórz projekt na neon.tech (potrzebne od Fazy 1).
- Sekrety: `SESSION_SECRET`, `IP_HASH_SALT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` (Faza 4).
- Turnstile keys (Faza 2), `RESEND_API_KEY` + `EMAIL_FROM` (Faza 4), `BLOB_READ_WRITE_TOKEN`.
- Weryfikacja: baza = centrum Warszawy czy konkretny warsztat? Ceny usług w seedzie (Faza 1).
