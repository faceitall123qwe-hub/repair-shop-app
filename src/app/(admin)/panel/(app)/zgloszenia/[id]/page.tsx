import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KartaZgloszenia } from "@/components/forms/KartaZgloszenia";
import { NotesForm } from "@/components/admin/NotesForm";
import { QuoteForm } from "@/components/admin/QuoteForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusChanger } from "@/components/admin/StatusChanger";
import { db } from "@/db";
import { services, ticketEvents, tickets } from "@/db/schema";
import { formatGrosze } from "@/lib/format";
import { DEVICE_TYPE_LABELS, PICKUP_SLOT_LABELS } from "@/lib/labels";
import { STATUS_META } from "@/lib/ticket-state";

const EVENT_LABELS: Record<string, string> = {
  STATUS_CHANGE: "Zmiana statusu",
  NOTE: "Notatka",
  EMAIL_SENT: "E-mail wysłany",
  TELEGRAM_SENT: "Telegram",
  PRICE_SET: "Wycena",
  ATTACHMENT_ADDED: "Załącznik",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line/60 flex gap-3 border-b py-1.5 text-sm">
      <span className="text-steel w-28 shrink-0 font-mono text-xs uppercase">{label}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </div>
  );
}

export default async function TicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!t) notFound();

  const events = await db
    .select()
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, id))
    .orderBy(desc(ticketEvents.createdAt));

  const selected =
    t.serviceIds && t.serviceIds.length
      ? await db
          .select({ id: services.id, name: services.name })
          .from(services)
          .where(inArray(services.id, t.serviceIds))
      : [];

  const margin =
    t.finalPrice != null && t.partsCost != null ? t.finalPrice - t.partsCost : null;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    `${t.addressLine}, ${t.postalCode} ${t.city}`,
  )}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/zgloszenia" className="text-steel text-sm">
          ‹ Lista
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl">{t.code}</h1>
          <StatusBadge status={t.status} />
          <span className="text-steel text-sm">
            {t.createdAt.toLocaleString("pl-PL")}
          </span>
        </div>
        <div className="mt-3">
          <StatusChanger ticketId={t.id} current={t.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Klient</h2>
            <Row label="Imię">{t.customerName}</Row>
            <Row label="Telefon">
              <a href={`tel:${t.customerPhone}`} className="text-pcb font-mono">
                {t.customerPhone}
              </a>
              {" · "}
              <a href={`sms:${t.customerPhone}`} className="text-pcb">
                SMS
              </a>
            </Row>
            <Row label="E-mail">
              {t.customerEmail ? (
                <a href={`mailto:${t.customerEmail}`} className="text-pcb">
                  {t.customerEmail}
                </a>
              ) : (
                <span className="text-steel">brak (klient bez linku do śledzenia)</span>
              )}
            </Row>
          </section>

          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Sprzęt</h2>
            <Row label="Typ">
              {DEVICE_TYPE_LABELS[t.deviceType] ?? t.deviceType}
              {t.deviceBrand ? ` · ${t.deviceBrand}` : ""}
              {t.deviceModel ? ` ${t.deviceModel}` : ""}
            </Row>
            <Row label="Objaw">{t.problemDescription}</Row>
            {selected.length > 0 && (
              <Row label="Usługi">{selected.map((s) => s.name).join(", ")}</Row>
            )}
          </section>

          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Odbiór</h2>
            <Row label="Adres">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-pcb">
                {t.addressLine}, {t.postalCode} {t.city}
              </a>
            </Row>
            <Row label="Dystans">
              {t.distanceKm ? `${Number(t.distanceKm).toFixed(1)} km` : "—"}
              {t.inServiceArea === true
                ? " · w strefie gratis"
                : t.inServiceArea === false
                  ? " · poza strefą gratis"
                  : " · do weryfikacji"}
            </Row>
            <Row label="Termin">
              {t.preferredPickupDate ?? "dowolnie"}
              {t.preferredPickupSlot
                ? ` · ${PICKUP_SLOT_LABELS[t.preferredPickupSlot] ?? t.preferredPickupSlot}`
                : ""}
            </Row>
            {t.pickupNote && <Row label="Notatka">{t.pickupNote}</Row>}
          </section>

          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Wycena</h2>
            <QuoteForm
              ticketId={t.id}
              min={t.estimatedPriceMin}
              max={t.estimatedPriceMax}
              final={t.finalPrice}
              parts={t.partsCost}
            />
            {margin != null && (
              <p className="text-steel mt-2 text-sm">
                Marża: <span className="text-ink font-mono">{formatGrosze(margin)}</span>{" "}
                (finalna {formatGrosze(t.finalPrice)} − części {formatGrosze(t.partsCost)})
              </p>
            )}
          </section>

          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Notatki</h2>
            <NotesForm ticketId={t.id} publicNote={t.publicNote} internalNote={t.internalNote} />
          </section>
        </div>

        <div className="space-y-6">
          <KartaZgloszenia
            code={t.code}
            deviceType={t.deviceType}
            deviceBrand={t.deviceBrand ?? undefined}
            deviceModel={t.deviceModel ?? undefined}
            problem={t.problemDescription}
            city={t.city}
            distanceKm={t.distanceKm ? Number(t.distanceKm) : null}
            pickupDate={t.preferredPickupDate ?? undefined}
            pickupSlot={t.preferredPickupSlot ?? undefined}
            statusLabel={STATUS_META[t.status].label}
          />

          <section>
            <h2 className="text-steel mb-2 font-mono text-xs uppercase">Oś czasu</h2>
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="border-line/60 border-l-2 pl-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{EVENT_LABELS[e.type] ?? e.type}</span>
                    <span className="text-steel font-mono text-xs">
                      {e.createdAt.toLocaleString("pl-PL")}
                    </span>
                  </div>
                  {e.type === "STATUS_CHANGE" && (
                    <p className="text-steel">
                      {e.fromStatus ? `${STATUS_META[e.fromStatus].label} → ` : ""}
                      {e.toStatus ? STATUS_META[e.toStatus].label : ""}
                    </p>
                  )}
                  {e.actor && <p className="text-steel text-xs">{e.actor}</p>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
