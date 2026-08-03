"use server";

import { headers } from "next/headers";
import { escapeHtml, tgSendMessage } from "@/lib/notifications/telegram/client";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export type ContactState = { ok: boolean; error?: string };

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  if (String(formData.get("website") ?? "").length > 0) return { ok: true }; // honeypot

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (name.length < 2 || contact.length < 3 || message.length < 5) {
    return { ok: false, error: "Uzupełnij imię, kontakt i treść wiadomości." };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  if (!(await checkRateLimit(`contact:${hashIp(ip)}`, 5, 60 * 60 * 1000))) {
    return { ok: false, error: "Za dużo wiadomości. Spróbuj później lub zadzwoń." };
  }

  const token = formData.get("cf-turnstile-response");
  if (typeof token === "string" && token.length > 0) {
    if (!(await verifyTurnstile(token, ip))) {
      return { ok: false, error: "Weryfikacja antybot nie powiodła się. Odśwież stronę." };
    }
  }

  const chat = process.env.TELEGRAM_CHAT_ID;
  if (chat) {
    await tgSendMessage(
      chat,
      `<b>Wiadomość z kontaktu</b>\nOd: ${escapeHtml(name)} (${escapeHtml(contact)})\n${escapeHtml(message).slice(0, 500)}`,
    );
  }
  return { ok: true };
}
