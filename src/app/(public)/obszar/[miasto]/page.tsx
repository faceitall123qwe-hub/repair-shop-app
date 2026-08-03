import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Cta } from "@/components/public/Cta";
import { company } from "@/config/company";
import { db } from "@/db";
import { serviceAreas } from "@/db/schema";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: serviceAreas.slug })
    .from(serviceAreas)
    .where(eq(serviceAreas.isActive, true));
  return rows.map((r) => ({ miasto: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ miasto: string }>;
}): Promise<Metadata> {
  const { miasto } = await params;
  const [a] = await db
    .select({ name: serviceAreas.name })
    .from(serviceAreas)
    .where(eq(serviceAreas.slug, miasto))
    .limit(1);
  if (!a) return {};
  return {
    title: `Serwis komputerowy ${a.name} — odbiór sprzętu gratis | SerwisPod Ręką`,
    description: `Naprawa laptopów, komputerów i telefonów w ${a.name}. Przyjadę po sprzęt — odbiór i dowóz w cenie.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ miasto: string }>;
}) {
  const { miasto } = await params;
  const [a] = await db
    .select({
      name: serviceAreas.name,
      distanceKm: serviceAreas.distanceKm,
      customIntro: serviceAreas.customIntro,
    })
    .from(serviceAreas)
    .where(eq(serviceAreas.slug, miasto))
    .limit(1);
  if (!a) notFound();

  const km = Number(a.distanceKm);
  const driveMin = Math.max(10, Math.round((km / 40) * 60));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Strona główna", url: "/" },
          { name: "Obszar obsługi", url: "/obszar" },
          { name: a.name, url: `/obszar/${miasto}` },
        ])}
      />
      <Link href="/obszar" className="text-steel text-sm">
        ‹ Obszar obsługi
      </Link>
      <p className="text-pcb mt-4 font-mono text-xs">SERWIS KOMPUTEROWY</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">{a.name}</h1>

      <div className="border-line bg-surface mt-6 flex flex-wrap gap-x-8 gap-y-2 rounded-sm border p-4 text-sm">
        <div>
          <p className="text-steel font-mono text-xs uppercase">Dystans od bazy</p>
          <p className="mt-1 font-mono">{km.toFixed(0)} km</p>
        </div>
        <div>
          <p className="text-steel font-mono text-xs uppercase">Orientacyjny dojazd</p>
          <p className="mt-1 font-mono">~{driveMin} min</p>
        </div>
        <div>
          <p className="text-steel font-mono text-xs uppercase">Odbiór i dowóz</p>
          <p className="text-pcb mt-1">{km <= company.radiusKm ? "gratis" : "do ustalenia"}</p>
        </div>
      </div>

      {a.customIntro && <p className="mt-6 leading-relaxed">{a.customIntro}</p>}

      <p className="text-steel mt-4 text-sm">
        Naprawiam laptopy, komputery stacjonarne i telefony — z odbiorem sprzętu spod domu, pracy lub
        szkoły. Diagnoza, wymiana podzespołów, czyszczenie, instalacja systemu, wymiana szybki czy
        baterii. Wycenę wysyłam przed naprawą.
      </p>

      <Cta title={`Serwis w ${a.name} — zgłoś sprzęt`} />
    </div>
  );
}
