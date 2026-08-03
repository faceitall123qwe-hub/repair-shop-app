import Link from "next/link";
import { company } from "@/config/company";

const nav = [
  { href: "/uslugi", label: "Usługi" },
  { href: "/cennik", label: "Cennik" },
  { href: "/jak-to-dziala", label: "Jak to działa" },
  { href: "/obszar", label: "Obszar" },
];

export function SiteHeader() {
  return (
    <header className="border-line bg-paper/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-pcb font-mono text-xs">SRV</span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {company.name}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-steel hover:text-ink text-sm"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={`tel:${company.phone}`}
            className="text-ink hidden font-mono text-sm sm:inline"
          >
            {company.phoneDisplay}
          </a>
          <Link
            href="/zgloszenie"
            className="bg-pcb text-paper hover:bg-pcb-700 rounded-sm px-4 py-2 text-sm font-medium"
          >
            Zgłoś sprzęt
          </Link>
        </div>
      </div>
    </header>
  );
}
