import type { Metadata } from "next";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "Regulamin usług | SerwisPod Ręką",
  description: "Zasady świadczenia usług serwisowych: zgłoszenie, odbiór, wycena, płatność, odpowiedzialność i reklamacje.",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display mt-8 text-lg font-semibold">{children}</h2>;
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed">
      <h1 className="font-display text-3xl font-semibold">Regulamin usług</h1>
      <p className="text-steel mt-2">
        Wzór roboczy — przed publikacją zweryfikuj u prawnika i uzupełnij dane firmy.
      </p>

      <H2>1. Postanowienia ogólne</H2>
      <p>
        Usługi świadczy {company.name}, {"{{ADRES_FIRMY}}"}, NIP {"{{NIP}}"}. Regulamin określa zasady
        przyjmowania sprzętu do naprawy, wyceny, płatności i odpowiedzialności.
      </p>

      <H2>2. Zakres usług</H2>
      <p>
        Wykonujemy diagnostykę, naprawy oraz serwis okresowy laptopów, komputerów stacjonarnych i
        telefonów. Nie wykonujemy napraw układowych/BGA, odzysku danych z fizycznie uszkodzonych
        nośników ani serwisu sprzętu na gwarancji producenta.
      </p>

      <H2>3. Zgłoszenie i odbiór</H2>
      <p>
        Zgłoszenie składasz przez formularz lub telefonicznie. Odbiór i dowóz sprzętu w promieniu{" "}
        {company.radiusKm} km od bazy jest bezpłatny; poza tą strefą dojazd ustalamy indywidualnie.
        Przy odbiorze i zwrocie sporządzamy protokół przekazania.
      </p>

      <H2>4. Wycena i akceptacja</H2>
      <p>
        Po diagnozie przedstawiamy wycenę. Naprawę wykonujemy wyłącznie po jej akceptacji. Podane ceny
        są cenami „od” i mogą się zmienić po diagnozie — o każdej zmianie informujemy przed naprawą.
      </p>

      <H2>5. Płatność</H2>
      <p>Płatność następuje przy odbiorze naprawionego sprzętu: gotówką, BLIK-iem lub przelewem.</p>

      <H2>6. Dane i kopie zapasowe</H2>
      <p>
        Przed przekazaniem sprzętu klient we własnym zakresie wykonuje kopię zapasową ważnych danych.
        Dokładamy staranności, ale nie odpowiadamy za utratę danych wynikającą z awarii nośnika lub
        czynności naprawczych, o ile nie nastąpiła z naszej winy.
      </p>

      <H2>7. Odpowiedzialność i reklamacje</H2>
      <p>
        Na wykonaną usługę udzielamy gwarancji {"{{OKRES_GWARANCJI}}"}. Reklamacje zgłaszasz telefonicznie
        lub mailowo na{" "}
        <a href={`mailto:${company.email}`} className="text-pcb">{company.email}</a>; rozpatrujemy je w
        terminie 14 dni.
      </p>

      <H2>8. Postanowienia końcowe</H2>
      <p>
        W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego i ustawy o prawach
        konsumenta.
      </p>

      <p className="text-steel mt-8 font-mono text-xs">Ostatnia aktualizacja: {"{{DATA}}"}</p>
    </div>
  );
}
