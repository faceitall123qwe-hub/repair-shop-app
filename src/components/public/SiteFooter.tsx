import Link from "next/link";
import { company } from "@/config/company";

export function SiteFooter() {
  return (
    <footer className="border-line bg-surface mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">{company.name}</p>
          <p className="text-steel mt-2 text-sm">
            Mobilny serwis komputerowy. Odbiór i dowóz sprzętu gratis w promieniu{" "}
            {company.radiusKm} km od bazy.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-steel font-mono text-xs uppercase">Kontakt</p>
          <a href={`tel:${company.phone}`} className="mt-2 block py-1 font-mono">
            {company.phoneDisplay}
          </a>
          <a href={`mailto:${company.email}`} className="block py-1">
            {company.email}
          </a>
          <p className="text-steel mt-1">{company.hours}</p>
        </div>
        <nav className="text-sm">
          <p className="text-steel font-mono text-xs uppercase">Informacje</p>
          <Link href="/o-mnie" className="mt-2 block py-1">
            O mnie
          </Link>
          <Link href="/polityka-prywatnosci" className="block py-1">
            Polityka prywatności
          </Link>
          <Link href="/regulamin" className="block py-1">
            Regulamin
          </Link>
        </nav>
      </div>
      <div className="border-line text-steel border-t py-4 text-center text-xs">
        © {new Date().getFullYear()} {company.name}
      </div>
    </footer>
  );
}
