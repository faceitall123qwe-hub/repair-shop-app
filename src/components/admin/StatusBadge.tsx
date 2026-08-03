import { STATUS_META, type TicketStatus } from "@/lib/ticket-state";

const CLS: Record<string, string> = {
  steel: "border-steel/40 text-steel",
  pcb: "border-pcb/40 text-pcb",
  signal: "border-signal/50 bg-signal/10 text-ink",
  alert: "border-alert/40 text-alert",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 font-mono text-xs whitespace-nowrap ${CLS[m.colorToken]}`}
    >
      {m.label}
    </span>
  );
}
