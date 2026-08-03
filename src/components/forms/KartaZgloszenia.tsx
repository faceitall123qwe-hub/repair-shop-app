import { DEVICE_TYPE_LABELS, PICKUP_SLOT_LABELS } from "@/lib/labels";

export type KartaData = {
  code?: string | null;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  problem?: string;
  city?: string;
  distanceKm?: number | null;
  pickupDate?: string;
  pickupSlot?: string;
  statusLabel?: string;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-line/60 flex gap-3 border-b py-1.5 text-sm">
      <span className="text-steel w-24 shrink-0 font-mono text-xs uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words">
        {value ? value : <span className="text-steel">—</span>}
      </span>
    </div>
  );
}

export function KartaZgloszenia(props: KartaData) {
  const device = [
    props.deviceType
      ? (DEVICE_TYPE_LABELS[props.deviceType] ?? props.deviceType)
      : "",
    props.deviceBrand,
    props.deviceModel,
  ]
    .filter(Boolean)
    .join(" · ");
  const dist =
    props.distanceKm != null ? `${props.distanceKm.toFixed(1)} km` : "";
  const pickup = [
    props.pickupDate,
    props.pickupSlot ? PICKUP_SLOT_LABELS[props.pickupSlot] : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border-line bg-surface rounded-sm border p-4 shadow-sm">
      <div className="border-line mb-3 flex items-center justify-between border-b pb-2">
        <span className="text-steel font-mono text-xs tracking-wide uppercase">
          Protokół przyjęcia
        </span>
        <span className="text-pcb font-mono text-xs">
          {props.code ?? "SRV-2026-░░░░"}
        </span>
      </div>
      <Row label="Sprzęt" value={device} />
      <Row label="Objaw" value={props.problem} />
      <Row label="Miasto" value={[props.city, dist].filter(Boolean).join(" · ")} />
      <Row label="Odbiór" value={pickup} />
      <div className="mt-4 flex justify-end">
        <span className="border-signal/50 bg-signal/10 text-ink inline-block rounded-sm border px-3 py-1 font-mono text-xs tracking-wide uppercase">
          ● {props.statusLabel ?? "Nowe"}
        </span>
      </div>
    </div>
  );
}
