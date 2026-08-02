# PROMPT DLA CLAUDE CODE — Mobilny serwis komputerowy (strona + backend zgłoszeń)

> **Jak użyć:** uzupełnij sekcję `0. DANE DO UZUPEŁNIENIA`, wrzuć ten plik do pustego katalogu projektu jako `BRIEF.md`, odpal `claude` w tym katalogu i napisz:
> „Przeczytaj `BRIEF.md`. Zacznij od Fazy 0 i zatrzymaj się po niej na akceptację. Nie przechodź do kolejnej fazy bez mojego OK."

---

## 0. DANE DO UZUPEŁNIENIA (placeholdery — użyj ich w całym kodzie)

```
NAZWA_FIRMY      = {{np. SerwisPod Ręką}}
DOMENA           = {{np. serwispodreka.pl}}
TELEFON          = {{+48 XXX XXX XXX}}
EMAIL_KONTAKT    = {{kontakt@domena.pl}}
BAZA_ADRES       = {{Radzymin, woj. mazowieckie}}
BAZA_LAT_LNG     = {{52.4155, 21.1786}}   # punkt, od którego liczony jest promień
PROMIEN_KM       = 50
GODZINY          = {{pn–pt 9:00–20:00, sob 10:00–16:00}}
NIP              = {{do uzupełnienia po rejestracji JDG}}
TELEGRAM_CHAT_ID = {{ID czatu admina}}
```

Jeśli wartość jest pusta — użyj placeholdera w formacie `{{...}}` i wypisz na końcu fazy listę miejsc do uzupełnienia. Nigdy nie wymyślaj numeru telefonu ani NIP.

---

## 1. KONTEKST BIZNESOWY

Jednoosobowa działalność (JDG w trakcie rejestracji) — **mobilny serwis komputerowy** działający w promieniu 50 km od bazy.

**Model usługi (to jest cała przewaga konkurencyjna — musi być widoczna w hero, nie w podstronie „O nas"):**
1. Klient zgłasza sprzęt przez formularz lub telefon.
2. Serwis **sam przyjeżdża po sprzęt** — pod dom, pod pracę, pod szkołę, w umówionym oknie czasowym.
3. Naprawa w warsztacie.
4. Sprzęt wraca do klienta. Odbiór i dowóz **gratis w promieniu 50 km**.

Klient nie traci czasu na dojazd, nie szuka wolnego popołudnia, nie stoi w kolejce w punkcie. To jest komunikat nr 1.

**Zakres usług (prace lekkie i średnie — bez BGA, bez lutowania płyt, bez odzysku danych z uszkodzonych fizycznie dysków):**

| Kategoria | Usługi |
|---|---|
| Diagnostyka | diagnoza laptopa / PC, diagnoza po zalaniu (kwalifikacja), wycena naprawy |
| Naprawa | wymiana podzespołów (SSD, RAM, dysk, zasilacz, wentylator, klawiatura, matryca), naprawa PC, usuwanie BSOD/błędów systemowych |
| Serwis okresowy | czyszczenie laptopa/PC z kurzu, wymiana pasty termoprzewodzącej, wymiana padów termicznych, serwis układu chłodzenia |
| Software | instalacja Windows/Linux, reinstalacja z zachowaniem danych, konfiguracja systemu, usuwanie wirusów, przyspieszenie/optymalizacja, migracja HDD→SSD |
| Składanie | dobór podzespołów, montaż PC z części klienta, upgrade istniejącego zestawu |
| iPhone / telefony | wymiana szybki, wymiana wyświetlacza, wymiana baterii |

**Czego NIE robimy** (ma być na stronie, buduje wiarygodność i filtruje leady): naprawy poziomu układowego / BGA, odzysk danych z fizycznie uszkodzonych nośników, sprzęt firmowy na gwarancji producenta (kieruj do ASO).

**Płatności:** gotówka, BLIK, przelew. **Brak płatności online w tym projekcie** — nie implementuj Stripe/P24 i nie zostawiaj po nich stubów.

---

## 2. STACK (decyzja podjęta — nie zmieniaj bez pytania)

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript strict** | jeden repo na front i API, SSR pod SEO lokalne |
| Style | **Tailwind CSS v4** + CSS variables na tokeny | bez gotowych szablonów/motywów |
| Komponenty | ręcznie pisane; `shadcn/ui` **tylko** w panelu admina (tabela, dialog, dropdown) | strona publiczna ma nie wyglądać jak template |
| Baza | **PostgreSQL — Neon** (free tier, branching) | serverless, zero utrzymania |
| ORM | **Drizzle ORM + drizzle-kit** | typowane migracje, lekki |
| Walidacja | **Zod** — jeden schemat współdzielony client/server | |
| Auth (admin) | **Auth.js v5 (credentials) + argon2**, sesje w bazie | jeden–dwóch adminów, bez OAuth |
| E-mail | **Resend** + **react-email** na szablony | |
| Telegram | Bot API — powiadomienia + webhook z inline buttons | |
| Pliki (zdjęcia sprzętu) | **Vercel Blob** | |
| Anty-spam | **Cloudflare Turnstile** + honeypot + rate limit | |
| Analityka | **Umami Cloud** lub Plausible (cookieless) | bez banera cookies |
| Hosting | **Vercel** (region `fra1`) | |
| Testy | **Vitest** (unit) + **Playwright** (e2e) | |
| Package manager | **pnpm** | |

**Zasada:** żadnej dodatkowej zależności bez pytania mnie. Jeśli coś da się napisać w 40 liniach, pisz w 40 liniach zamiast instalować paczkę.

---

## 3. MODEL DANYCH

Schemat w `src/db/schema.ts` (Drizzle, Postgres). Wszystkie tabele: `id` (uuid v7 lub cuid2), `createdAt`, `updatedAt`.

### `tickets` — zgłoszenia (rdzeń systemu)
```
code                 text unique       # SRV-2026-0417, generowany transakcyjnie
status               enum              # patrz maszyna stanów
priority             enum(NISKI, NORMALNY, PILNY)
source               enum(FORMULARZ, TELEFON, TELEGRAM, POLECENIE, INNE)

# klient
customerName         text
customerPhone        text              # normalizowany do E.164 (+48...)
customerEmail        text nullable
addressLine          text
city                 text
postalCode           text
lat, lng             numeric nullable
distanceKm           numeric nullable  # liczone przy zapisie
inServiceArea        boolean

# sprzęt
deviceType           enum(LAPTOP, PC, IPHONE, ANDROID, KONSOLA, INNE)
deviceBrand          text nullable
deviceModel          text nullable
problemDescription   text
serviceIds           uuid[]            # wstępnie wybrane usługi z katalogu

# logistyka
preferredPickupDate  date nullable
preferredPickupSlot  enum(RANO_8_12, POPOLUDNIE_12_17, WIECZOR_17_21, DOWOLNIE)
pickupNote           text nullable     # „pod pracę, ul. X, recepcja"

# wycena i realizacja
estimatedPriceMin    integer nullable  # grosze
estimatedPriceMax    integer nullable
finalPrice           integer nullable
partsCost            integer nullable
publicNote           text nullable     # widoczne dla klienta w trackingu
internalNote         text nullable     # tylko admin

# zgody i audyt
consentRodo          boolean not null  # wymagana
consentMarketing     boolean default false
ipHash               text              # SHA-256(ip + salt), nigdy surowe IP
userAgent            text
trackingToken        text unique       # do linku statusu w mailu
closedAt             timestamp nullable
```

### `ticket_events` — oś czasu zgłoszenia (append-only, nic nie kasujemy)
```
ticketId, type enum(STATUS_CHANGE, NOTE, EMAIL_SENT, TELEGRAM_SENT, PRICE_SET, ATTACHMENT_ADDED),
fromStatus, toStatus, payload jsonb, actor text, createdAt
```

### `attachments`
```
ticketId, url, kind enum(ZDJECIE_PRZED, ZDJECIE_PO, PROTOKOL, INNE), mimeType, sizeBytes, uploadedBy
```

### `services` — katalog usług (edytowalny z panelu, zasila cennik i strony usług)
```
slug unique, name, category enum, shortDesc, longDesc (markdown),
priceFromGrosze, priceToGrosze nullable, priceNote ("od", "wycena po diagnozie"),
turnaround text ("24–48 h"), deviceTypes enum[], isActive, isPopular, sortOrder,
seoTitle, seoDescription, faq jsonb  # [{q, a}] → schema FAQPage
```

### `service_areas` — miejscowości pod SEO lokalne
```
slug unique, name, distanceKm, isActive, customIntro text nullable
```

### `admin_users`, `sessions`, `notification_log`
```
admin_users:      email unique, passwordHash (argon2id), name, role enum(OWNER, STAFF), lastLoginAt
notification_log: channel enum(EMAIL, TELEGRAM), ticketId, template, recipient, status, error, sentAt
```

### Seed (`pnpm db:seed`)
- ~22 usługi z tabeli w sekcji 1, z realistycznymi widełkami cen (oznacz `// TODO: zweryfikuj ceny` — nie udawaj, że znasz mój cennik),
- ~18 miejscowości w promieniu 50 km od bazy z policzonym `distanceKm`,
- 1 konto admina z hasłem z `.env`,
- 6 przykładowych zgłoszeń w różnych statusach (tylko w trybie `NODE_ENV !== 'production'`).

---

## 4. MASZYNA STANÓW ZGŁOSZENIA

```
NOWE
 ├─→ POTWIERDZONE ──→ ODBIOR_ZAPLANOWANY ──→ ODEBRANE ──→ W_DIAGNOZIE
 │                                                            │
 │                                            WYCENA_WYSLANA ←┘
 │                                              ├─→ W_NAPRAWIE ─→ GOTOWE
 │                                              │                   │
 │                                              │   ZWROT_ZAPLANOWANY ←┘
 │                                              │        └─→ ZAKONCZONE
 │                                              └─→ ODRZUCONA_WYCENA ─→ ZWROT_ZAPLANOWANY
 └─→ ANULOWANE  (dostępne z każdego stanu przed ZAKONCZONE)
```

Wymagania:
- Przejścia zaimplementowane jako **czysta funkcja** `canTransition(from, to): boolean` + mapa dozwolonych przejść w jednym pliku `src/lib/ticket-state.ts`. Pokryta testami jednostkowymi w 100%.
- API odrzuca niedozwolone przejście z 422 i czytelnym komunikatem.
- Każde przejście zapisuje `ticket_event` **w tej samej transakcji** co zmiana statusu.
- Przejścia `WYCENA_WYSLANA` i `ZAKONCZONE` wymagają ustawionej ceny — walidacja po stronie serwera.
- Każdy status ma: etykietę PL, kolor tokenu, opis dla klienta w trackingu, flagę `notifyCustomer`.

---

## 5. FUNKCJE — STRONA PUBLICZNA

### Routing
```
/                          strona główna
/uslugi                    katalog (z DB, filtr po typie sprzętu)
/uslugi/[slug]             pojedyncza usługa: co robimy, cena od, czas, FAQ, CTA
/cennik                    tabela z DB, grupowana po kategoriach
/jak-to-dziala             4 kroki + FAQ o odbiorze
/obszar                    mapa + lista miejscowości
/obszar/[miasto]           landing SEO per miejscowość
/zgloszenie                formularz (główna konwersja)
/status                    sprawdzenie statusu (kod + 4 ostatnie cyfry telefonu)
/status/[token]            widok z linku e-mail, bez podawania danych
/o-mnie                    kto naprawia, doświadczenie, czego nie robię
/kontakt                   telefon, mail, godziny, formularz uproszczony
/polityka-prywatnosci  /regulamin
```

### Formularz zgłoszenia — kluczowy element
- **Wieloetapowy, 4 kroki, bez przeładowań**, stan w URL (`?krok=2`) żeby dało się wrócić:
  1. **Co naprawiamy** — typ sprzętu (duże, klikalne kafle z ikonami), marka/model (opcjonalne), objaw z listy + pole tekstowe.
  2. **Gdzie i kiedy odbieramy** — kod pocztowy → natychmiastowa walidacja zasięgu, adres, data + okno czasowe, notatka („odbiór spod pracy, recepcja").
  3. **Kontakt** — imię, telefon, e-mail (opcjonalny, ale wtedy brak linku do trackingu — powiedz to wprost), zgoda RODO.
  4. **Podsumowanie** — pokaż wszystko, wstępne widełki cenowe na podstawie wybranych usług, dopiero potem przycisk „Wyślij zgłoszenie".
- Walidacja **na blur, nie na keypress**. Błędy mówią, co zrobić („Podaj numer w formacie 123 456 789"), nie „Invalid input".
- Wysyłka przez **Server Action**, nie przez `fetch` do route handlera.
- Progres zapisywany w `sessionStorage` — powrót nie kasuje danych.
- Po sukcesie: strona `/zgloszenie/potwierdzenie` z kodem `SRV-...`, co się teraz stanie i w jakim czasie oddzwonię.
- Działa bez JS w podstawowym zakresie (progressive enhancement) — jeśli to zbyt kosztowne, powiedz mi i pomiń, ale nie rób tego po cichu.

### Walidacja promienia 50 km
- Dataset polskich kodów pocztowych z lat/lng **wbudowany w repo** (`data/kody-pocztowe.json`, tylko woj. mazowieckie + ościenne powiaty żeby nie puchło) — **bez** zewnętrznego API na hot path.
- Dystans liczony wzorem haversine od `BAZA_LAT_LNG`. Wynik cache'owany na zgłoszeniu.
- ≤ 50 km → „Odbiór i dowóz gratis, jesteś X km od bazy".
- 50–70 km → „Poza strefą gratis — dojazd do ustalenia, wyślij zgłoszenie, odezwę się z wyceną". Formularz **nie blokuje wysyłki**.
- \> 70 km → informacja + sugestia wysyłki kurierem, formularz nadal dostępny.
- Nieznany kod → nie blokuj, oznacz `inServiceArea = null` do ręcznej weryfikacji.

### Tracking statusu dla klienta
- `/status`: kod zgłoszenia + 4 ostatnie cyfry telefonu, **rate limit 5 prób / 15 min / IP**, stały czas odpowiedzi (bez wycieku informacji przez timing).
- Widok: oś czasu ze statusami, `publicNote`, wycena jeśli wysłana, zdjęcia `ZDJECIE_PRZED/PO`, przycisk „Akceptuję wycenę" / „Rezygnuję" → zmienia status i wysyła powiadomienie do mnie.
- **Nigdy** nie pokazuj `internalNote`, kosztu części, danych innych zgłoszeń.

---

## 6. FUNKCJE — PANEL ADMINA (`/panel`)

Chroniony middleware'em, `noindex`, osobny layout.

- **Dashboard:** liczniki wg statusu, zgłoszenia wymagające reakcji (NOWE > 2 h bez kontaktu — podświetlone), dzisiejsze odbiory i zwroty, przychód bieżącego miesiąca.
- **Lista zgłoszeń:** tabela z filtrem po statusie/typie sprzętu/mieście/dacie, wyszukiwarka po kodzie, nazwisku, telefonie i modelu; sortowanie; paginacja serwerowa; zapisywane filtry w URL.
- **Widok zgłoszenia:** wszystkie dane, edycja inline, zmiana statusu (tylko dozwolone przejścia w dropdownie), pole wyceny (min/max, cena finalna, koszt części → marża liczona automatycznie), notatka publiczna vs wewnętrzna, upload zdjęć, pełna oś czasu, `tel:` i `sms:` jako klikalne linki (używam z telefonu).
- **Widok dnia / trasa:** lista dzisiejszych odbiorów i zwrotów posortowana wg okna czasowego, z linkami `https://maps.google.com/?q=<adres>`; prosta sugestia kolejności po dystansie od bazy (greedy nearest-neighbour, bez API map).
- **Katalog usług:** CRUD, zmiana cen, włączanie/wyłączanie, kolejność.
- **Obszar działania:** CRUD miejscowości.
- **Ustawienia:** dane firmy, godziny, treści powiadomień, test wysyłki maila i Telegrama.
- Wszystko **w pełni używalne na telefonie** — panel obsługuję w terenie jedną ręką. Docelowa szerokość projektowa: 390 px.

---

## 7. POWIADOMIENIA

### Telegram (do mnie)
- Nowe zgłoszenie → wiadomość z: kod, typ sprzętu, miasto + dystans, objaw (skrót), telefon jako klikalny link, okno odbioru.
- Inline buttons: `Potwierdź` · `Zaplanuj odbiór` · `Otwórz w panelu`.
- Webhook `POST /api/telegram/webhook` — weryfikacja nagłówka `X-Telegram-Bot-Api-Secret-Token`, obsługa `callback_query`, zmiana statusu przez tę samą warstwę serwisową co panel (żadnej duplikacji logiki).
- Komendy: `/dzis` (odbiory i zwroty na dziś), `/nowe` (nieobsłużone), `/szukaj <fraza>`.
- Codzienny brief o 8:00 przez Vercel Cron.

### E-mail (do klienta, react-email + Resend)
Szablony (tylko przy statusach z `notifyCustomer`):
1. **Potwierdzenie zgłoszenia** — kod, podsumowanie, link do trackingu, co dalej.
2. **Odbiór zaplanowany** — data, okno, jak przygotować sprzęt (hasło do systemu, backup, wyjęcie karty SIM).
3. **Wycena** — widełki lub cena finalna, zakres prac, link do akceptacji.
4. **Sprzęt gotowy** — co zrobiono, cena, propozycja terminu zwrotu.
5. **Zakończone** — podsumowanie, faktura/paragon w załączniku jeśli dodany, prośba o opinię w Google.

Wymagania: wszystkie maile w PL z poprawnymi diakrytykami, plain-text fallback, stopka z danymi firmy i informacją RODO, każda wysyłka do `notification_log`, retry 1× przy błędzie, **niepowodzenie maila nie może wywalić transakcji biznesowej**.

---

## 8. SEO LOKALNE

- `generateMetadata` na każdej trasie; unikalne title/description; canonical.
- JSON-LD: `LocalBusiness` (podtyp `ComputerRepairService`) z `areaServed` jako `GeoCircle` o promieniu 50 000 m, `openingHoursSpecification`, `priceRange`; `Service` na stronach usług; `FAQPage` tam, gdzie jest FAQ; `BreadcrumbList`.
- Strony `/obszar/[miasto]`: **każda musi mieć unikalną treść** — dystans, orientacyjny czas dojazdu, 2–3 zdania specyficzne dla miejscowości z `customIntro`. Nie generuj 18 klonów z podmienioną nazwą (Google to karze i ja to widzę).
- `sitemap.ts` i `robots.ts` generowane dynamicznie z bazy. `/panel/*` i `/status/*` wykluczone.
- OG images przez `next/og` — dynamiczne dla usług i miejscowości.
- Cele: LCP < 2.0 s na 4G, CLS < 0.05, INP < 200 ms, brak layout shiftu na fontach (`next/font`, `display: swap`, preload display face).
- Obrazy tylko przez `next/image`, formaty AVIF/WebP, jawne wymiary.
- W README: checklist Google Business Profile (kategoria, obszar obsługi zamiast adresu, zdjęcia, pierwsze opinie).

---

## 9. BEZPIECZEŃSTWO I RODO

- **Rate limiting:** formularz 3 zgłoszenia / h / IP-hash, tracking 5 / 15 min, login 5 / 15 min z progresywnym opóźnieniem. Implementacja w Postgresie (tabela + okno czasowe) — bez Redisa.
- **Turnstile** na formularzu zgłoszenia i kontaktowym + honeypot + minimalny czas wypełnienia (bot wypełnia w < 3 s).
- Zod waliduje **każdy** input po stronie serwera, nawet jeśli walidował już klient. Rozmiar uploadu ≤ 8 MB, whitelist MIME, sprawdzanie magic bytes.
- Argon2id na hasła, sesje httpOnly + Secure + SameSite=Lax, CSRF na Server Actions.
- Nagłówki: CSP (bez `unsafe-inline` — użyj nonce), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **RODO:** surowe IP nigdy nie trafia do bazy (tylko SHA-256 z solą z env). Zgoda RODO jako osobny, niezaznaczony domyślnie checkbox z linkiem do polityki — bez pre-checkowania, bez łączenia z akceptacją regulaminu. Zgoda marketingowa osobno i opcjonalnie. Retencja: zgłoszenia zamknięte anonimizowane po 24 miesiącach (skrypt `pnpm db:anonymize`, uruchamiany cronem). W README: lista podmiotów przetwarzających (Vercel, Neon, Resend, Cloudflare, Telegram) do umów powierzenia.
- Sekrety wyłącznie w `.env.local`, w repo `.env.example` z opisami. `.env*` w `.gitignore` od pierwszego commita.

---

## 10. KIERUNEK WIZUALNY

Nie chcę wyglądu „szablon SaaS": gradientowy hero, trzy karty z ikonkami lucide, sekcja z liczbami, stopka. Chcę czegoś, co wygląda jak narzędzie serwisanta.

**Kotwica koncepcyjna: karta przyjęcia sprzętu / protokół serwisowy.** Papier techniczny, numer zlecenia monospace, pola wypełniane, pieczątka statusu.

**Element sygnaturowy (jeden, wykonany porządnie):** w miarę wypełniania formularza po prawej (na desktopie) / na dole (na mobile) **wypełnia się w czasie rzeczywistym karta zgłoszenia** — ten sam wizualny obiekt, który klient potem zobaczy w trackingu i który ja widzę w panelu. Jeden artefakt, trzy konteksty. Kod zlecenia „stemplowany" na koniec.

**Tokeny startowe** (zweryfikuj, dopracuj i uzasadnij zmiany — nie traktuj jako świętości):
```css
--ink:     #10161C   /* tekst, ciemne płaszczyzny */
--pcb:     #0F5C42   /* kolor marki — zieleń laminatu PCB */
--signal:  #F0A821   /* bursztyn diody stanu — akcent, używać rzadko */
--paper:   #ECEEEA   /* tło, chłodny papier — NIE ciepła kremówka */
--steel:   #6B7A88   /* tekst drugorzędny, linie */
--alert:   #C0392B   /* tylko błędy i status ANULOWANE */
```
Zakazane, bo to sygnatura „AI wygenerowało stronę": ciepłe kremowe tło z terakotowym akcentem (#D97757 i okolice), czarne tło z jednym kwaśno-zielonym akcentem, layout „broadsheet" z włoskowatymi liniami i zerowym border-radius.

**Typografia:** display o wyraźnym charakterze technicznym używany oszczędnie (rozważ Bricolage Grotesque / Familjen Grotesk / Archivo), tekst — czytelny grotesk (Inter Tight / Public Sans), mono — JetBrains Mono na kody zleceń, statusy i dane techniczne. **Warunek twardy: pełne wsparcie polskich znaków (ą ć ę ł ń ó ś ź ż) we wszystkich trzech krojach — sprawdź to, zanim wybierzesz.**

**Ruch:** jedna zorganizowana sekwencja przy ładowaniu hero + mikrointerakcje na formularzu (stempel statusu, wypełnianie karty). Bez parallaxu, bez animacji na scroll w każdej sekcji. `prefers-reduced-motion` respektowany.

**Copy:** piszę do człowieka, któremu nie działa laptop i który jest zirytowany. Konkret zamiast marketingu. „Przyjadę po sprzęt jutro między 17 a 21" jest lepsze niż „Kompleksowe rozwiązania IT dla Twojego biznesu". Bez emoji na stronie publicznej. Bez wykrzykników. Ceny zawsze z „od" i informacją, kiedy jest wiążąca.

**Zanim napiszesz choćby jedną linijkę CSS:** przedstaw mi plan designu (paleta z hexami, pary krojów, ASCII-wireframe strony głównej i formularza, opis elementu sygnaturowego) i poczekaj na akceptację.

**Podłoga jakościowa** (nie do negocjacji, nie do chwalenia się w komentarzach): pełna responsywność od 360 px, widoczny focus klawiatury, kontrast AA, formularz obsługiwalny samą klawiaturą, aria-live na komunikatach walidacji, `<label>` przy każdym polu.

---

## 11. STRUKTURA PROJEKTU

```
src/
  app/
    (public)/          # strona publiczna, wspólny layout
    (admin)/panel/     # panel, własny layout + auth guard
    api/
      telegram/webhook/
      cron/{daily-brief,anonymize}/
      upload/
  components/{ui,forms,public,admin}/
  db/{schema.ts,index.ts,seed.ts,migrations/}
  lib/
    ticket-state.ts    # maszyna stanów — czyste funkcje
    distance.ts        # haversine + lookup kodów pocztowych
    validation/        # schematy Zod współdzielone
    notifications/{email,telegram}/
    rate-limit.ts
    auth.ts
  services/            # logika biznesowa — JEDNO miejsce, używane przez UI, API i webhook
emails/                # szablony react-email
data/kody-pocztowe.json
tests/{unit,e2e}/
CLAUDE.md
```

**Reguła architektoniczna:** żadna operacja biznesowa (utworzenie zgłoszenia, zmiana statusu, ustawienie wyceny) nie jest implementowana dwa razy. Server Action, route handler i webhook Telegrama wołają tę samą funkcję z `src/services/`.

---

## 12. PLAN FAZOWY — pracuj po kolei, zatrzymaj się po każdej fazie

**Po każdej fazie:** `pnpm build` + `pnpm lint` + `pnpm test` muszą przechodzić. Potem krótkie podsumowanie (co zrobione, jakie decyzje, co wymaga mojej weryfikacji) i **czekasz na moje OK**.

| Faza | Zakres | Kryterium ukończenia |
|---|---|---|
| **0** | Init projektu, konfiguracja, `CLAUDE.md`, `.env.example`, Neon podłączony, pusty layout, plan designu do akceptacji | `pnpm dev` startuje, plan designu zatwierdzony |
| **1** | Schemat DB, migracje, seed, `ticket-state.ts` + `distance.ts` z testami | `pnpm db:push && pnpm db:seed` działa, testy jednostkowe zielone |
| **2** | Formularz zgłoszenia end-to-end + walidacja zasięgu + zapis + strona potwierdzenia | zgłoszenie ląduje w bazie z poprawnym `distanceKm` i kodem |
| **3** | Panel admina: auth, lista, widok zgłoszenia, zmiana statusu, wycena, widok dnia | mogę obsłużyć zgłoszenie od NOWE do ZAKONCZONE z telefonu |
| **4** | Powiadomienia: Telegram (z inline buttons + webhook) i wszystkie szablony e-mail, `notification_log` | zgłoszenie testowe generuje wiadomość na Telegramie i maila |
| **5** | Tracking klienta (`/status`, `/status/[token]`), akceptacja wyceny | klient widzi oś czasu i akceptuje wycenę |
| **6** | Strony publiczne: główna, usługi, cennik, jak to działa, obszar + landingi, o mnie, kontakt, polityka, regulamin | wszystkie trasy z treścią, zero lorem ipsum |
| **7** | Design polish, SEO, JSON-LD, sitemap, OG, wydajność, a11y | Lighthouse ≥ 95 na wszystkich czterech osiach na mobile |
| **8** | Testy e2e Playwright, nagłówki bezpieczeństwa, crony, deploy na Vercel, README z runbookiem | działający deploy + instrukcja wdrożenia domeny |
| **9 (opcjonalna)** | Protokół przekazania sprzętu jako PDF z panelu | — |

---

## 13. ZASADY PRACY

1. **Nie pisz kodu, dopóki nie przedstawisz planu fazy** i nie dostaniesz akceptacji. Plan ma być krótki, konkretny, z listą plików.
2. Nie generuj wypełniacza. Jeśli nie znasz mojej ceny, doświadczenia czy liczby napraw — zostaw `{{...}}` i wypisz to na końcu, zamiast wymyślać „ponad 500 zadowolonych klientów".
3. Nie instaluj zależności bez pytania. Uzasadnij każdą.
4. Nie uruchamiaj destrukcyjnych komend na bazie (`drop`, `reset`, `push --force`) bez wyraźnej zgody.
5. Commity: Conventional Commits, po polsku lub angielsku — byle konsekwentnie. Jeden commit = jedna sensowna zmiana.
6. TypeScript strict, zero `any`, zero `@ts-ignore`. Jeśli typ jest za trudny — powiedz, nie zamiataj.
7. Komentarze tylko tam, gdzie tłumaczą **dlaczego**. Nie opisuj, co robi `const x = 5`.
8. Jeśli którakolwiek moja decyzja w tym briefie jest technicznie zła lub kosztowna — **powiedz mi to wprost przed implementacją**, z alternatywą i ceną każdego wariantu. Nie realizuj po cichu czegoś, co uważasz za błąd, i nie zgadzaj się ze mną z grzeczności.
9. Na koniec każdej fazy aktualizuj `CLAUDE.md` (decyzje, konwencje, komendy) — to jest kontekst dla następnych sesji.
10. Jeśli coś jest niejednoznaczne, zadaj pytanie zamiast zgadywać. Lepiej jedno pytanie niż dzień pracy do wyrzucenia.

---

## 14. CO MA POWSTAĆ W `CLAUDE.md`

```markdown
# Projekt: {{NAZWA_FIRMY}} — mobilny serwis komputerowy

## Komendy
pnpm dev / build / lint / test / test:e2e
pnpm db:push / db:seed / db:studio / db:anonymize

## Architektura
- Logika biznesowa TYLKO w src/services/ — UI, API i webhook wołają te same funkcje
- Maszyna stanów: src/lib/ticket-state.ts, zmiany wyłącznie przez canTransition()
- Schematy Zod w src/lib/validation/ — współdzielone client/server

## Konwencje
- Interfejs, treści, komunikaty błędów, dane w bazie: po polsku
- Nazwy zmiennych, funkcji, tabel, plików: po angielsku
- Ceny przechowywane w groszach (integer), formatowane przy wyświetlaniu
- Telefony normalizowane do E.164 przy zapisie
- Daty i godziny w Europe/Warsaw

## Decyzje projektowe
(uzupełniane po każdej fazie — co, dlaczego, jakie odrzucono alternatywy)

## Do uzupełnienia przez właściciela
(lista aktywnych placeholderów {{...}})
```

---

## 15. PIERWSZY KROK

Przeczytaj cały brief. Następnie:
1. Wypisz **wszystkie** miejsca, w których brief jest niejednoznaczny lub w których widzisz problem techniczny.
2. Przedstaw plan Fazy 0 (lista plików + konfiguracja) **oraz** plan designu z sekcji 10 (paleta, kroje, wireframe'y, element sygnaturowy).
3. Zatrzymaj się i poczekaj na moją akceptację. Nie generuj kodu w tej turze.
