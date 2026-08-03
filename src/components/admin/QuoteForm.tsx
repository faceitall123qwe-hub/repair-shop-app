"use client";

import { useActionState } from "react";
import { setQuoteAction } from "@/app/(admin)/panel/(app)/zgloszenia/actions";

const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb";

function zl(g: number | null): string {
  return g == null ? "" : String(g / 100);
}

export function QuoteForm({
  ticketId,
  min,
  max,
  final,
  parts,
}: {
  ticketId: string;
  min: number | null;
  max: number | null;
  final: number | null;
  parts: number | null;
}) {
  const [, action, pending] = useActionState(setQuoteAction, { error: "" });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          Wycena od (zł)
          <input name="estimatedPriceMin" defaultValue={zl(min)} inputMode="decimal" className={inputCls} />
        </label>
        <label className="text-sm">
          Wycena do (zł)
          <input name="estimatedPriceMax" defaultValue={zl(max)} inputMode="decimal" className={inputCls} />
        </label>
        <label className="text-sm">
          Cena finalna (zł)
          <input name="finalPrice" defaultValue={zl(final)} inputMode="decimal" className={inputCls} />
        </label>
        <label className="text-sm">
          Koszt części (zł)
          <input name="partsCost" defaultValue={zl(parts)} inputMode="decimal" className={inputCls} />
        </label>
      </div>
      <button
        disabled={pending}
        className="border-line hover:border-steel rounded-sm border px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Zapisuję…" : "Zapisz wycenę"}
      </button>
    </form>
  );
}
