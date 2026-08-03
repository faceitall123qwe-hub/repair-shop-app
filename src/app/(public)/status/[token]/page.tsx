import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KartaZgloszenia } from "@/components/forms/KartaZgloszenia";
import { QuoteDecision } from "@/components/public/QuoteDecision";
import { company } from "@/config/company";
import { formatGrosze } from "@/lib/format";
import { STATUS_META } from "@/lib/ticket-state";
import { getTrackingByToken } from "@/services/tracking";

export const metadata: Metadata = { robots: { index: false } };

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getTrackingByToken(token);
  if (!data) notFound();
  const { ticket: t, events } = data;
  const meta = STATUS_META[t.status];

  const quote =
    t.finalPrice != null
      ? formatGrosze(t.finalPrice)
      : t.estimatedPriceMin != null && t.estimatedPriceMax != null
        ? `${formatGrosze(t.estimatedPriceMin)} – ${formatGrosze(t.estimatedPriceMax)}`
        : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-pcb font-mono text-xs">ŚLEDZENIE ZLECENIA</p>
      <h1 className="mt-2 font-mono text-2xl">{t.code}</h1>
      <p className="text-steel mt-2">{meta.clientDescription}</p>

      <div className="mt-6">
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
          statusLabel={meta.label}
        />
      </div>

      {t.publicNote && (
        <div className="border-line bg-surface mt-6 rounded-sm border p-4">
          <p className="text-steel font-mono text-xs uppercase">Wiadomość od serwisu</p>
          <p className="mt-1 text-sm">{t.publicNote}</p>
        </div>
      )}

      {quote && (
        <div className="border-signal/50 bg-signal/5 mt-6 rounded-sm border p-4">
          <p className="text-steel font-mono text-xs uppercase">Wycena</p>
          <p className="mt-1 font-mono text-xl">{quote}</p>
          {t.status === "WYCENA_WYSLANA" && (
            <div className="mt-3">
              <QuoteDecision token={token} />
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-steel mb-3 font-mono text-xs uppercase">Historia</h2>
        <ol className="space-y-3">
          {events.map((e, i) => {
            if (!e.toStatus) return null;
            const m = STATUS_META[e.toStatus];
            return (
              <li key={`${e.toStatus}-${i}`} className="border-line/60 border-l-2 pl-3">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-steel text-sm">{m.clientDescription}</p>
                <p className="text-steel font-mono text-xs">
                  {e.createdAt.toLocaleString("pl-PL")}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-steel mt-8 text-sm">
        Pytania? Zadzwoń:{" "}
        <a href={`tel:${company.phone}`} className="text-pcb font-mono">
          {company.phoneDisplay}
        </a>
      </p>
    </div>
  );
}
