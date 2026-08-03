import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { DEVICE_TYPE_LABELS } from "@/lib/labels";
import { STATUS_META, TICKET_STATUSES, type TicketStatus } from "@/lib/ticket-state";
import { DEVICE_TYPES } from "@/lib/validation/ticket";

const PAGE_SIZE = 20;
const inputCls =
  "rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb";

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = first(sp.status);
  const typ = first(sp.typ);
  const q = first(sp.q).trim();
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const conds = [];
  if (TICKET_STATUSES.includes(status as TicketStatus)) {
    conds.push(eq(tickets.status, status as TicketStatus));
  }
  if ((DEVICE_TYPES as readonly string[]).includes(typ)) {
    conds.push(eq(tickets.deviceType, typ as (typeof DEVICE_TYPES)[number]));
  }
  if (q) {
    conds.push(
      or(
        ilike(tickets.code, `%${q}%`),
        ilike(tickets.customerName, `%${q}%`),
        ilike(tickets.customerPhone, `%${q}%`),
        ilike(tickets.deviceModel, `%${q}%`),
        ilike(tickets.city, `%${q}%`),
      ),
    );
  }
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: tickets.id,
        code: tickets.code,
        status: tickets.status,
        deviceType: tickets.deviceType,
        deviceBrand: tickets.deviceBrand,
        city: tickets.city,
        distanceKm: tickets.distanceKm,
        customerName: tickets.customerName,
        customerPhone: tickets.customerPhone,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .where(where)
      .orderBy(desc(tickets.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(tickets).where(where),
  ]);

  const total = totalRow[0]?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (typ) params.set("typ", typ);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/panel/zgloszenia?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-pcb font-mono text-xs">ZGŁOSZENIA</p>
        <h1 className="font-display text-2xl font-semibold">
          Lista <span className="text-steel font-mono text-base">({total})</span>
        </h1>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Szukaj: kod, nazwisko, telefon, model…"
          className={`${inputCls} min-w-52 flex-1`}
        />
        <select name="status" defaultValue={status} className={inputCls}>
          <option value="">Każdy status</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select name="typ" defaultValue={typ} className={inputCls}>
          <option value="">Każdy sprzęt</option>
          {DEVICE_TYPES.map((d) => (
            <option key={d} value={d}>
              {DEVICE_TYPE_LABELS[d] ?? d}
            </option>
          ))}
        </select>
        <button className="bg-ink text-paper rounded-sm px-4 py-2 text-sm">Filtruj</button>
      </form>

      {rows.length === 0 ? (
        <p className="text-steel text-sm">Brak zgłoszeń dla wybranych filtrów.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id}>
              <Link
                href={`/panel/zgloszenia/${t.id}`}
                className="border-line bg-surface hover:border-steel block rounded-sm border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm">{t.code}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="text-steel mt-1 flex flex-wrap gap-x-3 text-sm">
                  <span>
                    {DEVICE_TYPE_LABELS[t.deviceType] ?? t.deviceType}
                    {t.deviceBrand ? ` · ${t.deviceBrand}` : ""}
                  </span>
                  <span>
                    {t.city}
                    {t.distanceKm ? ` · ${Number(t.distanceKm).toFixed(0)} km` : ""}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-2 text-sm">
                  <span>{t.customerName}</span>
                  <span className="text-steel font-mono">
                    {t.createdAt.toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="text-pcb">
              ‹ Poprzednia
            </Link>
          ) : (
            <span />
          )}
          <span className="text-steel font-mono">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={pageUrl(page + 1)} className="text-pcb">
              Następna ›
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
