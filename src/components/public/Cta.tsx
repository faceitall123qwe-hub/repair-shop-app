import Link from "next/link";
import { company } from "@/config/company";

export function Cta({ title }: { title?: string }) {
  return (
    <section className="bg-pcb text-paper mt-16 rounded-sm p-8 text-center">
      <h2 className="font-display text-2xl font-semibold">
        {title ?? "Nie działa? Zgłoś — przyjadę po sprzęt."}
      </h2>
      <p className="text-paper/90 mx-auto mt-2 max-w-md text-sm">
        Odbiór i dowóz gratis w promieniu {company.radiusKm} km. Płacisz przy odbiorze — gotówka,
        BLIK, przelew.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/zgloszenie"
          className="bg-signal text-ink rounded-sm px-5 py-2.5 font-medium"
        >
          Zgłoś sprzęt
        </Link>
        <a
          href={`tel:${company.phone}`}
          className="border-paper/30 hover:border-paper rounded-sm border px-5 py-2.5 font-mono"
        >
          {company.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
