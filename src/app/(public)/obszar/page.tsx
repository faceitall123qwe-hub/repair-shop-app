import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Cta } from "@/components/public/Cta";
import { company } from "@/config/company";
import { db } from "@/db";
import { serviceAreas } from "@/db/schema";

export const metadata: Metadata = {
  title: "Obszar obsługi — gdzie dojeżdżam | SerwisPod Ręką",
  description:
    "Odbiór i dowóz sprzętu gratis w promieniu 50 km od Warszawy (Białołęka): Legionowo, Marki, Wołomin, Radzymin i okolice.",
};

export default async function Page() {
  const rows = await db
    .select({ slug: serviceAreas.slug, name: serviceAreas.name, distanceKm: serviceAreas.distanceKm })
    .from(serviceAreas)
    .where(eq(serviceAreas.isActive, true))
    .orderBy(asc(serviceAreas.distanceKm));

  const lat = process.env.BASE_LAT ?? "52.321";
  const lng = process.env.BASE_LNG ?? "20.9876";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-pcb font-mono text-xs">OBSZAR OBSŁUGI</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Gdzie dojeżdżam</h1>
      <p className="text-steel mt-3 max-w-xl">
        Baza w Warszawie (Białołęka). Odbiór i dowóz sprzętu <strong className="text-ink">gratis w
        promieniu {company.radiusKm} km</strong>. Nie ma Twojej miejscowości na liście? Zgłoś się i
        tak — sprawdzę dystans.
      </p>

      <div className="border-line mt-6 overflow-hidden rounded-sm border">
        <iframe
          title="Mapa obszaru obsługi"
          src={`https://www.google.com/maps?q=${lat},${lng}&z=9&output=embed`}
          loading="lazy"
          className="h-64 w-full"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/obszar/${r.slug}`}
              className="border-line bg-surface hover:border-steel flex items-center justify-between rounded-sm border px-3 py-2 text-sm"
            >
              <span>{r.name}</span>
              <span className="text-steel font-mono text-xs">{Number(r.distanceKm).toFixed(0)} km</span>
            </Link>
          </li>
        ))}
      </ul>

      <Cta />
    </div>
  );
}
