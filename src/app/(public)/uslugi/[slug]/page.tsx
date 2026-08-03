import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Cta } from "@/components/public/Cta";
import { db } from "@/db";
import { services } from "@/db/schema";
import { formatPriceFrom } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/jsonld";
import { DEVICE_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/labels";

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: services.slug })
    .from(services)
    .where(eq(services.isActive, true));
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [s] = await db
    .select({
      name: services.name,
      seoTitle: services.seoTitle,
      seoDescription: services.seoDescription,
      shortDesc: services.shortDesc,
    })
    .from(services)
    .where(eq(services.slug, slug))
    .limit(1);
  if (!s) return {};
  return {
    title: s.seoTitle ?? `${s.name} — SerwisPod Ręką`,
    description: s.seoDescription ?? s.shortDesc,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [s] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  if (!s || !s.isActive) notFound();

  const faq = s.faq ?? [];
  const devices = (s.deviceTypes ?? []).map((d) => DEVICE_TYPE_LABELS[d] ?? d);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={serviceJsonLd({
          name: s.name,
          shortDesc: s.shortDesc,
          slug: s.slug,
          priceFromGrosze: s.priceFromGrosze,
        })}
      />
      {faq.length > 0 && <JsonLd data={faqJsonLd(faq)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Strona główna", url: "/" },
          { name: "Usługi", url: "/uslugi" },
          { name: s.name, url: `/uslugi/${s.slug}` },
        ])}
      />
      <Link href="/uslugi" className="text-steel text-sm">
        ‹ Usługi
      </Link>
      <p className="text-pcb mt-4 font-mono text-xs">{SERVICE_CATEGORY_LABELS[s.category] ?? s.category}</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">{s.name}</h1>
      <p className="text-steel mt-3">{s.shortDesc}</p>

      <div className="border-line bg-surface mt-6 flex flex-wrap gap-x-8 gap-y-2 rounded-sm border p-4 text-sm">
        <div>
          <p className="text-steel font-mono text-xs uppercase">Cena</p>
          <p className="mt-1 font-mono">{formatPriceFrom(s.priceFromGrosze)}</p>
        </div>
        {s.turnaround && (
          <div>
            <p className="text-steel font-mono text-xs uppercase">Czas</p>
            <p className="mt-1">{s.turnaround}</p>
          </div>
        )}
        {devices.length > 0 && (
          <div>
            <p className="text-steel font-mono text-xs uppercase">Sprzęt</p>
            <p className="mt-1">{devices.join(", ")}</p>
          </div>
        )}
      </div>

      {s.longDesc && (
        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          {s.longDesc.split("\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {faq.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-xl font-semibold">Pytania</h2>
          <dl className="mt-4 divide-line/60 divide-y">
            {faq.map((f, i) => (
              <div key={i} className="py-3">
                <dt className="font-medium">{f.q}</dt>
                <dd className="text-steel mt-1 text-sm">{f.a}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <Cta title={`Potrzebujesz: ${s.name}?`} />
    </div>
  );
}
