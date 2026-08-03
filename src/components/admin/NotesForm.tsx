"use client";

import { useActionState } from "react";
import { updateNotesAction } from "@/app/(admin)/panel/(app)/zgloszenia/actions";

const cls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb";

export function NotesForm({
  ticketId,
  publicNote,
  internalNote,
}: {
  ticketId: string;
  publicNote: string | null;
  internalNote: string | null;
}) {
  const [, action, pending] = useActionState(updateNotesAction, { error: "" });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label className="block text-sm">
        Notatka publiczna (widzi klient w śledzeniu)
        <textarea name="publicNote" rows={2} defaultValue={publicNote ?? ""} className={cls} />
      </label>
      <label className="block text-sm">
        Notatka wewnętrzna (tylko panel)
        <textarea name="internalNote" rows={2} defaultValue={internalNote ?? ""} className={cls} />
      </label>
      <button
        disabled={pending}
        className="border-line hover:border-steel rounded-sm border px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Zapisuję…" : "Zapisz notatki"}
      </button>
    </form>
  );
}
