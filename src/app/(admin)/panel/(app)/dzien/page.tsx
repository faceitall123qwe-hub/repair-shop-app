import { and, eq, inArray, type SQL } from "drizzle-orm";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { haversineKm, type Coord } from "@/lib/distance";
import { DEVICE_TYPE_LABELS, PICKUP_SLOT_LABELS } from "@/lib/labels";

const cols = {
  id: tickets.id,
  code: tickets.code,
  status: tickets.status,
  city: tickets.city,
  addressLine: tickets.addressLine,
  postalCode: tickets.postalCode,
  lat: tickets.lat,
  lng: tickets.lng,
  slot: tickets.preferredPickupSlot,
  name: tickets.customerName,
  phone: tickets.customerPhone,
  deviceType: tickets.deviceType,
};

function loadStops(where: SQL | undefined) {
  return db.select(cols).from(tickets).where(where);
}

type StopRow = Awaited<ReturnType<typeof loadStops>>[number];

// Greedy nearest-neighbour od bazy (bez API map). Punkty bez współrzędnych na końcu.
function greedyOrder(base: Coord, rows: StopRow[]): StopRow[] {
  const rem = rows.filter((r) => r.lat && r.lng);
  const without = rows.filter((r) => !(r.lat && r.lng));
  const ordered: StopRow[] = [];
  let cur = base;
  while (rem.length) {
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < rem.length; i++) {
      const r = rem[i]!;
      const d = haversineKm(cur, { lat: Number(r.lat), lng: Number(r.lng) });
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    const next = rem.splice(bi, 1)[0]!;
    ordered.push(next);
    cur = { lat: Number(next.lat), lng: Number(next.lng) };
  }
  return [...ordered, ...without];
}

function StopList({ rows }: { rows: StopRow[] }) {
  if (rows.length === 0) return <p className="text-steel text-sm">Nic na dziś.</p>;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => {
        const maps = `https://maps.google.com/?q=${encodeURIComponent(
          `${r.addressLine}, ${r.postalCode} ${r.city}`,
        )}`;
        return (
          <li
            key={r.id}
            className="border-line bg-surface flex flex-wrap items-center gap-3 rounded-sm border p-3"
          >
            <span className="bg-ink text-paper flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/panel/zgloszenia/${r.id}`} className="font-mono text-sm">
                  {r.code}
                </Link>
                <StatusBadge status={r.status} />
                {r.slot && (
                  <span className="text-steel text-xs">{PICKUP_SLOT_LABELS[r.slot]}</span>
                )}
              </div>
              <p className="text-steel text-sm">
                {DEVICE_TYPE_LABELS[r.deviceType] ?? r.deviceType} · {r.name}
              </p>
              <a href={maps} target="_blank" rel="noopener noreferrer" className="text-pcb text-sm">
                {r.addressLine}, {r.city}
              </a>
            </div>
            <a href={`tel:${r.phone}`} className="text-pcb font-mono text-sm">
              {r.phone}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default async function DzienPage() {
  const today = new Date().toISOString().slice(0, 10);
  const base: Coord = { lat: Number(process.env.BASE_LAT), lng: Number(process.env.BASE_LNG) };

  const [pickups, returns] = await Promise.all([
    loadStops(
      and(
        eq(tickets.preferredPickupDate, today),
        inArray(tickets.status, ["NOWE", "POTWIERDZONE", "ODBIOR_ZAPLANOWANY"]),
      ),
    ),
    loadStops(inArray(tickets.status, ["GOTOWE", "ZWROT_ZAPLANOWANY"])),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-pcb font-mono text-xs">WIDOK DNIA</p>
        <h1 className="font-display text-2xl font-semibold">
          {new Date().toLocaleDateString("pl-PL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h1>
        <p className="text-steel mt-1 text-sm">Kolejność wg dystansu od bazy (greedy).</p>
      </div>

      <section>
        <h2 className="text-steel mb-3 font-mono text-xs uppercase">
          Odbiory dziś ({pickups.length})
        </h2>
        <StopList rows={greedyOrder(base, pickups)} />
      </section>

      <section>
        <h2 className="text-steel mb-3 font-mono text-xs uppercase">
          Do zwrotu ({returns.length})
        </h2>
        <StopList rows={greedyOrder(base, returns)} />
      </section>
    </div>
  );
}
