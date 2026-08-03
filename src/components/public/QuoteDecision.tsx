"use client";

import { useActionState } from "react";
import { decideQuoteAction } from "@/app/(public)/status/actions";

export function QuoteDecision({ token }: { token: string }) {
  const [state, action, pending] = useActionState(decideQuoteAction, { error: "" });
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="token" value={token} />
      <button
        name="decision"
        value="accept"
        disabled={pending}
        className="bg-pcb text-paper hover:bg-pcb-700 rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        Akceptuję wycenę
      </button>
      <button
        name="decision"
        value="reject"
        disabled={pending}
        className="border-line hover:border-steel rounded-sm border px-4 py-2 text-sm disabled:opacity-60"
      >
        Rezygnuję
      </button>
      {state.error && (
        <p role="alert" className="text-alert w-full text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
