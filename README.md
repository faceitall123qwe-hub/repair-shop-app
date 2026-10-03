# SerwisPod Ręką — mobile PC repair: website + ticket backend

Full-stack app for a one-person mobile computer repair business: the customer files a
repair request, the technician picks the device up, repairs it in the workshop and brings
it back. Public site, repair-request form, customer status tracking, admin panel,
e-mail + Telegram notifications.

**Live demo:** _coming soon_ (seeded with fictional data)

## Stack

Next.js 16 (App Router, TS strict) · Tailwind v4 · Drizzle ORM · Postgres (postgres.js) ·
Zod · custom DB sessions + Argon2 · Resend + react-email · Telegram Bot API ·
Cloudflare Turnstile · Vitest · Vercel (cron)

## Highlights

- **Ticket state machine** — `src/lib/ticket-state.ts`, pure functions. Every status change
  goes through `canTransition()` and writes a `ticket_event` row in the same transaction;
  price-gated transitions (quote sent, closed) are validated server-side.

  ```
  NOWE → POTWIERDZONE → ODBIOR_ZAPLANOWANY → ODEBRANE → W_DIAGNOZIE → WYCENA_WYSLANA
       → W_NAPRAWIE → GOTOWE → ZWROT_ZAPLANOWANY → ZAKONCZONE
                    ↘ ODRZUCONA_WYCENA ↗           (ANULOWANE from any non-terminal state)
  ```

- **Single service layer** — business logic lives only in `src/services/`. Server Actions,
  route handlers and the Telegram webhook (inline buttons → status change) call the same
  functions.
- **Auth** — own session table + httpOnly/Secure/SameSite cookie + Argon2. Auth.js was
  rejected on purpose: v5 credentials provider forces JWT, while the design required
  revocable DB sessions. Two-step guard: `proxy.ts` + `requireUser()` in the protected layout.
- **RODO / GDPR** — raw IPs never stored (salted SHA-256), RLS deny-all on every table,
  explicit consent on the form, tracking endpoint selects only customer-safe columns,
  privacy policy and terms pages.
- **Customer tracking** — `/status` lookup by ticket code + last 4 phone digits with rate
  limiting and constant-time response (no timing oracle); tokenised `/status/[token]` links
  with quote accept/reject.
- **Anti-spam without third-party lock-in** — honeypot, minimum fill time, optional
  Turnstile, sliding-window rate limit in Postgres (no Redis).
- **Service area** — haversine distance from the base using a local postal-code dataset
  (no API on the hot path): free zone ≤ 50 km, "to be agreed" ≤ 70 km, courier beyond.
- **SEO** — SSG pages for 24 services and 18 towns, JSON-LD (`ComputerRepairService`,
  `Service`, `FAQPage`, `BreadcrumbList`), sitemap, robots.
- Progressive enhancement: the request form works without JavaScript (Server Action), and
  becomes a 4-step wizard with JS.

## Run locally

```bash
pnpm install
cp .env.example .env.local     # DATABASE_URL is the only hard requirement
pnpm db:push                   # create schema
pnpm db:seed                   # services, towns, admin (ADMIN_EMAIL/ADMIN_PASSWORD), sample tickets
pnpm dev
pnpm test                      # unit tests (state machine, distance)
```

Optional integrations (Resend, Telegram, Turnstile) are skipped gracefully when their
keys are empty.

## Infrastructure

An AWS alternative to the Vercel deployment is described as code in
[serwis-infra](https://github.com/faceitall123qwe-hub/serwis-infra) (Terraform).
