import { and, arrayContains, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Cta } from "@/components/public/Cta";
import { db } from "@/db";
import { services } from "@/db/schema";
import { formatPriceFrom } from "@/lib/format";
import {
  DEVICE_TYPE_LABELS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_ORDER,
} from "@/lib/labels";
import { DEVICE_TYPES } from "@/lib/validation/ticket";

export const metadata: Metadata = {
  title: "Usługi — naprawa laptopów, komputerów i telefonów | SerwisPod Ręką",
  description:
    "Diagnostyka, naprawa, serwis okresowy, oprogramowanie i składanie PC. Odbiór sprzętu gratis w promieniu 50 km.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ typ?: string }>;
}) {
  const { typ } = await searchParams;
  const validTyp = typ && (DEVICE_TYPES as readonly string[]).includes(typ) ? typ : null;

  const rows = await db
    .select({
      slug: services.slug,
      name: services.name,
      category: services.category,
      shortDesc: services.shortDesc,
      priceFromGrosze: services.priceFromGrosze,
      turnaround: services.turnaround,
    })
    .from(services)
    .where(
      validTyp
        ? and(
            eq(services.isActive, true),
            arrayContains(services.deviceTypes, [validTyp as (typeof DEVICE_TYPES)[number]]),
          )
        : eq(services.isActive, true),
    )
    .orderBy(asc(services.sortOrder));

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = grouped.get(r.category) ?? [];
    list.push(r);
    grouped.set(r.category, list);
  }

  const filters = [{ key: "", label: "Wszystkie" }, ...DEVICE_TYPES.map((d) => ({ key: d, label: DEVICE_TYPE_LABELS[d] ?? d }))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-pcb font-mono text-xs">USŁUGI</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Co naprawiam</h1>
      <p className="text-steel mt-3 max-w-xl">
        Prace lekkie i średnie — bez lutowania płyt i odzysku danych z uszkodzonych dysków. Ceny „od”,
        wiążąca wycena po diagnozie.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (f.key || "") === (validTyp || "");
          return (
            <Link
              key={f.key || "all"}
              href={f.key ? `/uslugi?typ=${f.key}` : "/uslugi"}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                active ? "border-pcb bg-pcb/5 text-pcb" : "border-line text-steel hover:border-steel"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-10">
        {SERVICE_CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => (
          <section key={cat}>
            <h2 className="font-display border-line border-b pb-2 text-lg font-semibold">
              {SERVICE_CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <ul className="mt-3 divide-line/60 divide-y">
              {(grouped.get(cat) ?? []).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/uslugi/${s.slug}`}
                    className="hover:bg-surface -mx-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-sm px-2 py-3"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-steel font-mono text-sm">{formatPriceFrom(s.priceFromGrosze)}</span>
                    <span className="text-steel w-full text-sm">{s.shortDesc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Cta />
    </div>
  );
}
