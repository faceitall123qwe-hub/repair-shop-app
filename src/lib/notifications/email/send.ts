import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type EmailResult = { ok: boolean; error?: string };

// Wysyłka z retry 1×. Zwraca wynik (nie rzuca) — niepowodzenie maila nie może
// wywalić transakcji biznesowej.
export async function sendEmail(
  to: string,
  subject: string,
  element: ReactElement,
): Promise<EmailResult> {
  if (!resend) return { ok: false, error: "Brak RESEND_API_KEY" };
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const html = await render(element);
  const text = await render(element, { plainText: true });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { error } = await resend.emails.send({ from, to, subject, html, text });
      if (!error) return { ok: true };
      if (attempt === 2) return { ok: false, error: error.message ?? String(error) };
    } catch (e) {
      if (attempt === 2) return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: false, error: "nieznany błąd" };
}
