import type { Metadata } from "next";
import { Cta } from "@/components/public/Cta";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "O mnie — kto naprawia Twój sprzęt | SerwisPod Ręką",
  description:
    "Jednoosobowy, mobilny serwis komputerowy z bazą w Warszawie (Białołęka). Naprawy laptopów, komputerów i telefonów z odbiorem sprzętu.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-pcb font-mono text-xs">O MNIE</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Jeden serwisant, konkretna robota</h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          {company.name} to jednoosobowy, mobilny serwis komputerowy z bazą w Warszawie na Białołęce.
          Naprawiam laptopy, komputery stacjonarne i telefony — z odbiorem sprzętu spod Twojego domu,
          pracy lub szkoły.
        </p>
        <p>
          Sprzęt naprawiam od {"{{ILE_LAT}}"}. {"{{KROTKO_O_DOSWIADCZENIU — np. wcześniejsza praca, specjalizacja}}"}.
          Nie jestem siecią ani punktem z kolejką — pracujesz bezpośrednio ze mną, więc wiesz z kim
          rozmawiasz i kto trzyma w rękach Twój sprzęt.
        </p>
        <p>
          Pracuję uczciwie: wycenę wysyłam przed naprawą, a jeśli usterka jest poza moim zakresem albo
          naprawa się nie opłaca — mówię to wprost.
        </p>
      </div>

      <h2 className="font-display mt-10 text-xl font-semibold">Czego nie robię</h2>
      <ul className="text-steel mt-4 space-y-2 text-sm">
        <li className="border-line/60 border-b pb-2">Napraw układowych / BGA i lutowania płyt głównych</li>
        <li className="border-line/60 border-b pb-2">Odzysku danych z fizycznie uszkodzonych nośników</li>
        <li className="border-line/60 border-b pb-2">Sprzętu firmowego na gwarancji producenta — kieruję wtedy do ASO</li>
      </ul>

      <h2 className="font-display mt-10 text-xl font-semibold">Kontakt</h2>
      <p className="text-steel mt-2 text-sm">
        Telefon:{" "}
        <a href={`tel:${company.phone}`} className="text-pcb font-mono">
          {company.phoneDisplay}
        </a>{" "}
        · E-mail:{" "}
        <a href={`mailto:${company.email}`} className="text-pcb">
          {company.email}
        </a>
        <br />
        Czynne {company.hours}.
      </p>

      <Cta />
    </div>
  );
}
