import type { Metadata } from "next";
import Link from "next/link";
import { KartaZgloszenia } from "@/components/forms/KartaZgloszenia";
import { Cta } from "@/components/public/Cta";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "SerwisPod Ręką — mobilny serwis komputerowy | odbiór gratis 50 km",
  description:
    "Naprawa laptopów, komputerów i telefonów. Przyjadę po sprzęt — odbiór i dowóz gratis w promieniu 50 km od Warszawy (Białołęka). Płatność przy odbiorze.",
};

const STEPS: [string, string, string][] = [
  ["01", "Zgłaszasz", "Formularz lub telefon — opisujesz sprzęt i usterkę."],
  ["02", "Przyjeżdżam", "Odbieram sprzęt spod domu, pracy lub szkoły w umówionym oknie."],
  ["03", "Naprawa", "Diagnoza i naprawa w warsztacie. Wycenę wysyłam do akceptacji."],
  ["04", "Odwożę", "Przywożę sprawny sprzęt. Płacisz dopiero przy odbiorze."],
];

const DO_WE = [
  "Diagnoza laptopa i PC, także po zalaniu",
  "Wymiana SSD, RAM, dysku, zasilacza, wentylatora, klawiatury, matrycy",
  "Czyszczenie z kurzu, wymiana pasty i padów termicznych",
  "Instalacja Windows/Linux, usuwanie wirusów, migracja HDD→SSD",
  "Składanie i upgrade PC z części",
  "Wymiana szybki, wyświetlacza i baterii w telefonach",
];

const DONT = [
  "Naprawy układowe / BGA i lutowanie płyt głównych",
  "Odzysk danych z fizycznie uszkodzonych nośników",
  "Sprzęt firmowy na gwarancji producenta (kieruję do ASO)",
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-10 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-pcb font-mono text-xs">MOBILNY SERWIS KOMPUTEROWY</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Przyjadę po Twój sprzęt. Naprawię. Odwiozę.
          </h1>
          <p className="text-steel mt-4 max-w-md">
            Odbiór i dowóz{" "}
            <strong className="text-ink">gratis w promieniu {company.radiusKm} km</strong> od bazy.
            Nie tracisz czasu na dojazd ani kolejkę. Płacisz przy odbiorze — gotówka, BLIK, przelew.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/zgloszenie"
              className="bg-pcb text-paper hover:bg-pcb-700 rounded-sm px-5 py-2.5 font-medium"
            >
              Zgłoś sprzęt
            </Link>
            <a
              href={`tel:${company.phone}`}
              className="border-line hover:border-steel rounded-sm border px-5 py-2.5 font-mono"
            >
              {company.phoneDisplay}
            </a>
          </div>
          <p className="text-steel mt-4 font-mono text-xs">Czynne {company.hours}</p>
        </div>
        <div className="lg:pl-8">
          <KartaZgloszenia
            code="SRV-2026-0128"
            deviceType="LAPTOP"
            deviceBrand="Lenovo"
            problem="nie włącza się"
            city="Radzymin"
            distanceKm={13}
            pickupDate="dziś"
            pickupSlot="WIECZOR_17_21"
            statusLabel="Odbiór zaplanowany"
          />
        </div>
      </section>

      <section className="border-line border-t py-12">
        <h2 className="font-display text-2xl font-semibold">Jak to działa</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="border-line bg-surface rounded-sm border p-4">
              <p className="text-pcb font-mono text-sm">{n}</p>
              <p className="mt-1 font-medium">{t}</p>
              <p className="text-steel mt-1 text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <Link href="/jak-to-dziala" className="text-pcb mt-4 inline-block text-sm">
          Więcej o odbiorze →
        </Link>
      </section>

      <section className="border-line grid gap-8 border-t py-12 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold">Co robię</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {DO_WE.map((x) => (
              <li key={x} className="border-line/60 border-b pb-2">
                {x}
              </li>
            ))}
          </ul>
          <Link href="/uslugi" className="text-pcb mt-4 inline-block text-sm">
            Pełny katalog usług →
          </Link>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Czego nie robię</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {DONT.map((x) => (
              <li key={x} className="text-steel border-line/60 border-b pb-2">
                {x}
              </li>
            ))}
          </ul>
          <p className="text-steel mt-4 text-sm">
            Uczciwie mówię, gdy się nie podejmuję — nie tracisz czasu ani pieniędzy.
          </p>
        </div>
      </section>

      <section className="border-line border-t py-12">
        <h2 className="font-display text-xl font-semibold">Gdzie dojeżdżam</h2>
        <p className="text-steel mt-2 max-w-lg text-sm">
          Baza w Warszawie (Białołęka). Odbiór i dowóz gratis w promieniu {company.radiusKm} km —
          Warszawa i okolice: Legionowo, Marki, Ząbki, Wołomin, Radzymin, Nowy Dwór Mazowiecki i
          dalej.
        </p>
        <Link href="/obszar" className="text-pcb mt-4 inline-block text-sm">
          Sprawdź swoją miejscowość →
        </Link>
      </section>

      <Cta />
      <div className="pb-12" />
    </div>
  );
}
