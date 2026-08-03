import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Cta } from "@/components/public/Cta";
import { db } from "@/db";
import { services } from "@/db/schema";
import { formatPriceFrom } from "@/lib/format";
import { SERVICE_CATEGORY_LABELS, SERVICE_CATEGORY_ORDER } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Cennik — orientacyjne ceny napraw | SerwisPod Ręką",
  description: "Orientacyjne ceny diagnostyki, napraw i serwisu. Ceny „od”, wiążąca wycena po diagnozie. Odbiór i dowóz gratis w promieniu 50 km.",
};

export default async function Page() {
  const rows = await db
    .select({
      name: services.name,
      category: services.category,
      priceFromGrosze: services.priceFromGrosze,
      priceNote: services.priceNote,
      turnaround: services.turnaround,
    })
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.sortOrder));

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = grouped.get(r.category) ?? [];
    list.push(r);
    grouped.set(r.category, list);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-pcb font-mono text-xs">CENNIK</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Orientacyjne ceny</h1>
      <p className="text-steel mt-3 max-w-xl">
        Ceny „od” — ostateczna, wiążąca kwota po diagnozie i Twojej akceptacji. Odbiór i dowóz sprzętu
        w promieniu 50 km w cenie.
      </p>

      <div className="mt-8 space-y-8">
        {SERVICE_CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => (
          <section key={cat}>
            <h2 className="font-display text-lg font-semibold">{SERVICE_CATEGORY_LABELS[cat] ?? cat}</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {(grouped.get(cat) ?? []).map((s) => (
                  <tr key={s.name} className="border-line/60 border-b">
                    <td className="py-2 pr-4">{s.name}</td>
                    <td className="text-steel py-2 pr-4 font-mono whitespace-nowrap">
                      {formatPriceFrom(s.priceFromGrosze)}
                    </td>
                    <td className="text-steel hidden py-2 text-right whitespace-nowrap sm:table-cell">
                      {s.turnaround ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <p className="text-steel mt-8 text-xs">
        {"// TODO: zweryfikuj ceny — wartości startowe, nie ostateczny cennik."}
      </p>

      <Cta />
    </div>
  );
}
