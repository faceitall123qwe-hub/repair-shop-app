import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Cta } from "@/components/public/Cta";
import { company } from "@/config/company";
import { faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Jak to działa — odbiór i dowóz sprzętu | SerwisPod Ręką",
  description:
    "4 kroki: zgłaszasz, przyjeżdżam po sprzęt, naprawiam w warsztacie, odwożę. Odbiór i dowóz gratis w promieniu 50 km.",
};

const STEPS: [string, string, string][] = [
  ["01", "Zgłaszasz sprzęt", "Wypełniasz formularz albo dzwonisz. Opisujesz, co się dzieje, i podajesz gdzie odebrać sprzęt."],
  ["02", "Przyjeżdżam po sprzęt", "Odbieram go spod domu, pracy lub szkoły w umówionym oknie czasowym. Podpisujemy krótki protokół przekazania."],
  ["03", "Diagnoza i naprawa", "Diagnozuję w warsztacie i wysyłam wycenę do akceptacji. Naprawiam dopiero po Twojej zgodzie."],
  ["04", "Odwożę naprawiony", "Przywożę sprawny sprzęt pod wskazany adres. Płacisz przy odbiorze — gotówka, BLIK lub przelew."],
];

const FAQ: [string, string][] = [
  ["Ile kosztuje odbiór i dowóz?", `W promieniu ${company.radiusKm} km od bazy — 0 zł. Dalej ustalamy dojazd indywidualnie przy wycenie.`],
  ["W jakich godzinach przyjeżdżasz?", "W umówionym oknie: rano 8–12, popołudnie 12–17 lub wieczór 17–21. Działam całodobowo — w nocy obowiązuje dopłata."],
  ["Jak przygotować sprzęt?", "Zrób kopię ważnych plików, jeśli możesz. Przygotuj hasło do systemu, a z telefonu wyjmij kartę SIM."],
  ["Kiedy płacę?", "Przy odbiorze naprawionego sprzętu. Wycenę akceptujesz wcześniej, więc znasz koszt przed naprawą."],
  ["Co, jeśli naprawa się nie opłaca?", "Dostajesz wycenę do akceptacji. Jeśli zrezygnujesz, odwożę sprzęt — bez naprawy."],
];

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={faqJsonLd(FAQ.map(([q, a]) => ({ q, a })))} />
      <p className="text-pcb font-mono text-xs">JAK TO DZIAŁA</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Cztery kroki, zero dojazdów z Twojej strony</h1>
      <p className="text-steel mt-3">
        Cała przewaga polega na tym, że to ja przyjeżdżam — Ty nie tracisz czasu na dowóz sprzętu ani
        kolejkę w punkcie.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map(([n, t, d]) => (
          <li key={n} className="border-line bg-surface flex gap-4 rounded-sm border p-4">
            <span className="text-pcb font-mono text-lg">{n}</span>
            <div>
              <p className="font-medium">{t}</p>
              <p className="text-steel mt-1 text-sm">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="font-display mt-12 text-xl font-semibold">Najczęstsze pytania</h2>
      <dl className="mt-4 divide-line/60 divide-y">
        {FAQ.map(([q, a]) => (
          <div key={q} className="py-3">
            <dt className="font-medium">{q}</dt>
            <dd className="text-steel mt-1 text-sm">{a}</dd>
          </div>
        ))}
      </dl>

      <Cta />
    </div>
  );
}
