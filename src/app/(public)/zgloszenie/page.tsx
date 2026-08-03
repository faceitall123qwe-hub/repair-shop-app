import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { TicketForm } from "@/components/forms/TicketForm";
import { db } from "@/db";
import { services } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zgłoś sprzęt — SerwisPod Ręką",
  description:
    "Zgłoś laptop, komputer lub telefon do naprawy. Przyjadę po sprzęt — odbiór i dowóz gratis w promieniu 50 km.",
};

export default async function Page() {
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      category: services.category,
      priceFromGrosze: services.priceFromGrosze,
      deviceTypes: services.deviceTypes,
    })
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.sortOrder));

  const base = { lat: Number(process.env.BASE_LAT), lng: Number(process.env.BASE_LNG) };
  const radiusKm = Number(process.env.SERVICE_RADIUS_KM ?? 50);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-pcb font-mono text-xs">FORMULARZ ZGŁOSZENIA</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Zgłoś sprzęt do naprawy
        </h1>
        <p className="text-steel mt-3">
          Wypełnij formularz — przyjadę po sprzęt w umówionym oknie. Odbiór i dowóz gratis w
          promieniu {radiusKm} km od bazy.
        </p>
      </div>
      <TicketForm
        services={rows}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        base={base}
        radiusKm={radiusKm}
      />
    </div>
  );
}
