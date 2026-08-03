import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { formatGrosze } from "@/lib/format";
import { DEVICE_TYPE_LABELS } from "@/lib/labels";
import { STATUS_META, TICKET_STATUSES } from "@/lib/ticket-state";

const DOT: Record<string, string> = {
  steel: "bg-steel",
  pcb: "bg-pcb",
  signal: "bg-signal",
  alert: "bg-alert",
};

export default async function Dashboard() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.toISOString().slice(0, 10);

  const [counts, needsAction, revenueRow, pickupsToday, returnsPlanned] =
    await Promise.all([
      db
        .select({ status: tickets.status, n: count() })
        .from(tickets)
        .groupBy(tickets.status),
      db
        .select({
          id: tickets.id,
          code: tickets.code,
          city: tickets.city,
          deviceType: tickets.deviceType,
          createdAt: tickets.createdAt,
          phone: tickets.customerPhone,
        })
        .from(tickets)
        .where(and(eq(tickets.status, "NOWE"), lt(tickets.createdAt, twoHoursAgo))),
      db
        .select({ sum: sql<number>`coalesce(sum(${tickets.finalPrice}),0)::int` })
        .from(tickets)
        .where(and(eq(tickets.status, "ZAKONCZONE"), gte(tickets.closedAt, monthStart))),
      db.$count(tickets, eq(tickets.preferredPickupDate, today)),
      db.$count(tickets, eq(tickets.status, "ZWROT_ZAPLANOWANY")),
    ]);

  const countMap = new Map(counts.map((c) => [c.status, c.n]));
  const revenue = revenueRow[0]?.sum ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-pcb font-mono text-xs">PULPIT</p>
          <h1 className="font-display text-2xl font-semibold">Przegląd</h1>
        </div>
        <div className="text-right">
          <p className="text-steel font-mono text-xs uppercase">Przychód ({monthStart.toLocaleDateString("pl-PL", { month: "long" })})</p>
          <p className="font-mono text-xl">{formatGrosze(revenue) || "0 zł"}</p>
        </div>
      </div>

      {needsAction.length > 0 && (
        <section className="border-alert/40 bg-alert/5 rounded-sm border p-4">
          <h2 className="text-alert mb-3 font-mono text-xs uppercase">
            Wymaga reakcji — NOWE ponad 2 h ({needsAction.length})
          </h2>
          <ul className="divide-line/60 divide-y">
            {needsAction.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/panel/zgloszenia/${t.id}`} className="font-mono text-sm">
                  {t.code}
                </Link>
                <span className="text-steel text-sm">
                  {DEVICE_TYPE_LABELS[t.deviceType] ?? t.deviceType} · {t.city}
                </span>
                <a href={`tel:${t.phone}`} className="text-pcb font-mono text-sm">
                  {t.phone}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-steel mb-3 font-mono text-xs uppercase">Statusy</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TICKET_STATUSES.map((s) => {
            const meta = STATUS_META[s];
            const n = countMap.get(s) ?? 0;
            return (
              <Link
                key={s}
                href={`/panel/zgloszenia?status=${s}`}
                className="border-line bg-surface hover:border-steel flex items-center justify-between rounded-sm border px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${DOT[meta.colorToken]}`} />
                  {meta.label}
                </span>
                <span className="font-mono text-sm">{n}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/panel/dzien"
          className="border-line bg-surface rounded-sm border p-4"
        >
          <p className="text-steel font-mono text-xs uppercase">Odbiory dziś</p>
          <p className="mt-1 font-mono text-2xl">{pickupsToday}</p>
        </Link>
        <Link
          href="/panel/zgloszenia?status=ZWROT_ZAPLANOWANY"
          className="border-line bg-surface rounded-sm border p-4"
        >
          <p className="text-steel font-mono text-xs uppercase">Zwroty zaplanowane</p>
          <p className="mt-1 font-mono text-2xl">{returnsPlanned}</p>
        </Link>
      </section>
    </div>
  );
}
