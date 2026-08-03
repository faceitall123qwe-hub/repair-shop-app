"use client";

import Script from "next/script";
import { useActionState } from "react";
import { sendContactMessage } from "@/app/(public)/kontakt/actions";

const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb focus:ring-2 focus:ring-pcb/25";

export function ContactForm({ siteKey }: { siteKey: string }) {
  const [state, action, pending] = useActionState(sendContactMessage, { ok: false });

  if (state.ok) {
    return (
      <p className="border-pcb/40 bg-pcb/5 text-pcb rounded-sm border p-4 text-sm">
        Dziękuję — odezwę się najszybciej, jak mogę.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div aria-hidden className="absolute left-[-9999px]" hidden>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Imię
        </label>
        <input id="name" name="name" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="contact">
          Telefon lub e-mail
        </label>
        <input id="contact" name="contact" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="message">
          Wiadomość
        </label>
        <textarea id="message" name="message" rows={4} required className={inputCls} />
      </div>
      {siteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div className="cf-turnstile" data-sitekey={siteKey} />
        </>
      )}
      {state.error && (
        <p role="alert" className="text-alert text-sm">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-pcb text-paper hover:bg-pcb-700 rounded-sm px-5 py-2.5 font-medium disabled:opacity-60"
      >
        {pending ? "Wysyłam…" : "Wyślij wiadomość"}
      </button>
    </form>
  );
}
