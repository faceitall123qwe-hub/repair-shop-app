"use client";

import { useActionState } from "react";
import { updateStatusAction } from "@/app/(admin)/panel/(app)/zgloszenia/actions";
import { STATUS_META, allowedTransitions, type TicketStatus } from "@/lib/ticket-state";

export function StatusChanger({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const [state, action, pending] = useActionState(updateStatusAction, { error: "" });
  const options = allowedTransitions(current);

  if (options.length === 0) {
    return <p className="text-steel text-sm">Status końcowy — brak dalszych przejść.</p>;
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="toStatus"
        defaultValue=""
        className="border-line bg-surface focus:border-pcb rounded-sm border px-3 py-2 text-sm outline-none"
      >
        <option value="" disabled>
          Zmień status…
        </option>
        {options.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        className="bg-pcb text-paper hover:bg-pcb-700 rounded-sm px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "…" : "Zastosuj"}
      </button>
      {state.error && <p className="text-alert w-full text-sm">{state.error}</p>}
    </form>
  );
}
