<div align="center">

# SerwisPod Ręką

**Full-stack platform for a mobile PC repair business — public site, repair tickets, admin panel, customer tracking.**

[![CI](https://github.com/faceitall123qwe-hub/serwis/actions/workflows/ci.yml/badge.svg)](https://github.com/faceitall123qwe-hub/serwis/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_strict-3178C6?logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)

### [▶ Live demo](https://serwis-pi.vercel.app) · [Admin panel](https://serwis-pi.vercel.app/panel/login) · [AWS / Terraform version](https://github.com/faceitall123qwe-hub/serwis-infra)

<sub>Demo login: <code>demo@serwis.demo</code> / <code>demo-panel-2026</code> — all data is fictional; e-mail, Telegram and Turnstile are off.</sub>

<img src="docs/screenshots/home.png" alt="Home page" width="860">

</div>

---

## What it does

A one-person repair business picks devices up from customers, repairs them in a workshop
and brings them back. This app runs the whole flow:

1. **Customer** files a request (works with and without JavaScript) → gets a ticket code
2. **Owner** gets a Telegram message with inline buttons and manages the ticket in the panel
3. Every status change is logged; the customer is e-mailed at the steps that matter
4. **Customer** tracks the repair at `/status` and accepts or rejects the quote online

<table>
<tr>
<td width="50%"><img src="docs/screenshots/panel.png" alt="Admin dashboard"><p align="center"><sub>Admin dashboard</sub></p></td>
<td width="50%"><img src="docs/screenshots/tickets.png" alt="Ticket list"><p align="center"><sub>Ticket list with filters</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/request-form.png" alt="Repair request form"><p align="center"><sub>Multi-step request form</sub></p></td>
<td width="50%" align="center"><img src="docs/screenshots/mobile.png" alt="Mobile" width="220"><p align="center"><sub>Mobile-first</sub></p></td>
</tr>
</table>

## Architecture

```mermaid
flowchart LR
    C[Customer] -->|form / status lookup| UI[Next.js App Router<br/>Server Actions]
    TG[Telegram webhook<br/>inline buttons] --> SVC
    UI --> SVC[src/services<br/>single business layer]
    SVC --> SM[ticket-state.ts<br/>pure state machine]
    SVC -->|tx: status + event| DB[(Postgres<br/>RLS deny-all)]
    SVC -.after commit.-> N[Resend e-mail<br/>Telegram Bot API]
    CRON[Daily cron] --> SVC
```

**Ticket lifecycle** — every transition goes through `canTransition()` and writes a
`ticket_event` in the same transaction; quote/close transitions require a price.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> NOWE
    NOWE --> POTWIERDZONE
    POTWIERDZONE --> ODBIOR_ZAPLANOWANY
    ODBIOR_ZAPLANOWANY --> ODEBRANE
    ODEBRANE --> W_DIAGNOZIE
    W_DIAGNOZIE --> WYCENA_WYSLANA
    WYCENA_WYSLANA --> W_NAPRAWIE: quote accepted
    WYCENA_WYSLANA --> ODRZUCONA_WYCENA: quote rejected
    W_NAPRAWIE --> GOTOWE
    GOTOWE --> ZWROT_ZAPLANOWANY
    ODRZUCONA_WYCENA --> ZWROT_ZAPLANOWANY
    ZWROT_ZAPLANOWANY --> ZAKONCZONE
    ZAKONCZONE --> [*]
```
<sub>Any non-terminal state can also go to <code>ANULOWANE</code> (cancelled).</sub>

## Engineering highlights

| Area | What was done |
|---|---|
| **Domain logic** | Pure state machine, single service layer reused by UI, route handlers and the Telegram webhook — zero duplicated business rules |
| **Auth** | Own DB sessions + httpOnly/Secure/SameSite cookies + Argon2. Auth.js rejected on purpose: v5 credentials forces JWT, the design needed revocable sessions |
| **Privacy (GDPR / RODO)** | Raw IPs never stored (salted SHA-256), RLS deny-all on every table, explicit consent, tracking endpoint selects only customer-safe columns |
| **Abuse protection** | Honeypot, minimum fill time, optional Turnstile, sliding-window rate limit in Postgres (no Redis); status lookup has constant-time responses to avoid a timing oracle |
| **Service area** | Haversine distance from base via local postal-code dataset — no external API on the hot path |
| **SEO** | 24 service + 18 town pages prerendered (SSG), JSON-LD (`ComputerRepairService`, `FAQPage`, `BreadcrumbList`), sitemap |
| **Progressive enhancement** | Request form is a server-side form without JS and a 4-step wizard with JS |
| **Ops** | Vercel (fra1) + Neon for the demo; Dockerfile + OIDC deploy workflow for the [AWS stack](https://github.com/faceitall123qwe-hub/serwis-infra) |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Drizzle ORM · postgres.js ·
Zod · Argon2 · Resend + react-email · Telegram Bot API · Cloudflare Turnstile · Vitest · pnpm

## Run locally

```bash
pnpm install
cp .env.example .env.local     # only DATABASE_URL is required
pnpm db:push                   # create schema
pnpm db:seed                   # services, towns, admin (ADMIN_EMAIL/ADMIN_PASSWORD), sample tickets
pnpm dev                       # http://localhost:3000
```

```bash
pnpm test                      # state machine + distance unit tests
pnpm lint && pnpm exec tsc --noEmit
```

Optional integrations (Resend, Telegram, Turnstile) are skipped gracefully when their keys are empty.

## Project structure

```
src/
├── app/(public)/     public pages: services, pricing, area, request form, status tracking
├── app/(admin)/      admin panel (guarded layout + login)
├── app/api/          Telegram webhook, cron
├── services/         business logic — the only place that mutates data
├── lib/              state machine, auth, distance, validation (Zod), rate limit
├── db/               Drizzle schema + seed
└── emails/           react-email templates
```
