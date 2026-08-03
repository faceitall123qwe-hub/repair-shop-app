"use client";

import { useActionState } from "react";
import { lookupAction } from "@/app/(public)/status/actions";

const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb focus:ring-2 focus:ring-pcb/25";

export function StatusLookupForm() {
  const [state, action, pending] = useActionState(lookupAction, { error: "" });
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="code">
          Numer zlecenia
        </label>
        <input id="code" name="code" placeholder="SRV-2026-0001" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="phone4">
          4 ostatnie cyfry telefonu
        </label>
        <input
          id="phone4"
          name="phone4"
          inputMode="numeric"
          maxLength={4}
          placeholder="1234"
          required
          className={inputCls}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-alert text-sm">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-pcb text-paper hover:bg-pcb-700 w-full rounded-sm px-4 py-2 font-medium disabled:opacity-60"
      >
        {pending ? "Sprawdzam…" : "Sprawdź status"}
      </button>
    </form>
  );
}
