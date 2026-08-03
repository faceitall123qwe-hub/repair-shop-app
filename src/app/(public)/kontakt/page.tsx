import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/public/ContactForm";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "Kontakt | SerwisPod Ręką",
  description: "Zadzwoń lub napisz — mobilny serwis komputerowy z odbiorem sprzętu w promieniu 50 km od Warszawy.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-pcb font-mono text-xs">KONTAKT</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Napisz albo zadzwoń</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-steel font-mono text-xs uppercase">Telefon</p>
            <a href={`tel:${company.phone}`} className="text-pcb mt-1 block font-mono text-lg">
              {company.phoneDisplay}
            </a>
          </div>
          <div>
            <p className="text-steel font-mono text-xs uppercase">E-mail</p>
            <a href={`mailto:${company.email}`} className="text-pcb mt-1 block">
              {company.email}
            </a>
          </div>
          <div>
            <p className="text-steel font-mono text-xs uppercase">Godziny</p>
            <p className="mt-1">{company.hours}</p>
            <p className="text-steel mt-1 text-xs">Nocą obowiązuje dopłata.</p>
          </div>
          <div>
            <p className="text-steel font-mono text-xs uppercase">Obszar</p>
            <p className="mt-1">
              Baza: {company.baseCity}. Odbiór i dowóz gratis w promieniu {company.radiusKm} km.
            </p>
          </div>
          <p className="text-steel">
            Chcesz od razu zgłosić sprzęt do naprawy?{" "}
            <Link href="/zgloszenie" className="text-pcb">
              Wypełnij formularz zgłoszenia
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg font-semibold">Szybka wiadomość</h2>
          <ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} />
        </div>
      </div>
    </div>
  );
}
