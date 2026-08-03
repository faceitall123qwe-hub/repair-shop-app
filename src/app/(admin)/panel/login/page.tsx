"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb focus:ring-2 focus:ring-pcb/25";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-16">
      <p className="text-pcb font-mono text-xs">PANEL SERWISU</p>
      <h1 className="font-display mt-2 text-2xl font-semibold">Logowanie</h1>
      <form action={action} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            Hasło
          </label>
          <input
            id="password"
            name="password"
            type="password"
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
          {pending ? "Loguję…" : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}
