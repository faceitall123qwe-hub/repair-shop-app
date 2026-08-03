import type { Metadata } from "next";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "Polityka prywatności | SerwisPod Ręką",
  description: "Jak przetwarzamy dane osobowe w zgłoszeniach serwisowych — cel, podstawa, podmioty przetwarzające i Twoje prawa.",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display mt-8 text-lg font-semibold">{children}</h2>;
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed">
      <h1 className="font-display text-3xl font-semibold">Polityka prywatności</h1>
      <p className="text-steel mt-2">
        Wzór roboczy — przed publikacją zweryfikuj u prawnika i uzupełnij dane firmy.
      </p>

      <H2>1. Administrator danych</H2>
      <p>
        Administratorem danych jest {company.name}, {"{{ADRES_FIRMY}}"}, NIP {"{{NIP}}"}. Kontakt:{" "}
        <a href={`mailto:${company.email}`} className="text-pcb">{company.email}</a>, tel.{" "}
        <a href={`tel:${company.phone}`} className="text-pcb font-mono">{company.phoneDisplay}</a>.
      </p>

      <H2>2. Jakie dane przetwarzamy</H2>
      <p>
        Imię, numer telefonu, opcjonalnie adres e-mail, adres odbioru sprzętu, opis usterki oraz dane
        sprzętu. Adresu IP nie zapisujemy w postaci surowej — przechowujemy wyłącznie jego
        nieodwracalny skrót (hash) na potrzeby ochrony przed nadużyciami.
      </p>

      <H2>3. Cel i podstawa prawna</H2>
      <p>
        Dane przetwarzamy w celu realizacji zgłoszenia serwisowego (art. 6 ust. 1 lit. b RODO — wykonanie
        umowy) oraz kontaktu w jego sprawie. Zgoda marketingowa (jeśli jej udzielisz) jest odrębna i
        dobrowolna (art. 6 ust. 1 lit. a RODO) — możesz ją wycofać w każdej chwili.
      </p>

      <H2>4. Podmioty przetwarzające</H2>
      <p>Korzystamy z zaufanych dostawców, którzy przetwarzają dane w naszym imieniu:</p>
      <ul className="mt-2 space-y-1">
        <li>Vercel — hosting strony i aplikacji</li>
        <li>Supabase — baza danych zgłoszeń</li>
        <li>Resend — wysyłka wiadomości e-mail</li>
        <li>Cloudflare — ochrona formularzy przed spamem</li>
        <li>Telegram — powiadomienia serwisowe do właściciela</li>
      </ul>

      <H2>5. Czas przechowywania</H2>
      <p>
        Dane zgłoszeń przechowujemy przez czas realizacji usługi i rozliczeń. Zamknięte zgłoszenia są
        anonimizowane po 24 miesiącach.
      </p>

      <H2>6. Twoje prawa</H2>
      <p>
        Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania,
        przenoszenia oraz wniesienia sprzeciwu i skargi do Prezesa UODO. W sprawach danych pisz na{" "}
        <a href={`mailto:${company.email}`} className="text-pcb">{company.email}</a>.
      </p>

      <p className="text-steel mt-8 font-mono text-xs">Ostatnia aktualizacja: {"{{DATA}}"}</p>
    </div>
  );
}
