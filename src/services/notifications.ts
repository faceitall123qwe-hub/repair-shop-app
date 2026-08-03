import { eq } from "drizzle-orm";
import { db } from "../db";
import { notificationLog, tickets } from "../db/schema";
import { buildConfirmation, buildStatusEmail } from "../lib/notifications/email/build";
import { sendEmail } from "../lib/notifications/email/send";
import {
  type InlineKeyboard,
  escapeHtml,
  tgSendMessage,
} from "../lib/notifications/telegram/client";
import { DEVICE_TYPE_LABELS } from "../lib/labels";
import { STATUS_META, type TicketStatus } from "../lib/ticket-state";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function log(
  channel: "EMAIL" | "TELEGRAM",
  ticketId: string,
  template: string,
  recipient: string,
  ok: boolean,
  error?: string,
): Promise<void> {
  try {
    await db.insert(notificationLog).values({
      channel,
      ticketId,
      template,
      recipient,
      status: ok ? "SENT" : "FAILED",
      error: error ?? null,
      sentAt: ok ? new Date() : null,
    });
  } catch {
    // log powiadomienia nie może wywalić operacji biznesowej
  }
}

export async function notifyNewTicket(ticketId: string): Promise<void> {
  const [t] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!t) return;

  const chat = process.env.TELEGRAM_CHAT_ID;
  if (chat) {
    const dist = t.distanceKm ? ` (${Number(t.distanceKm).toFixed(0)} km)` : "";
    const text =
      `<b>Nowe zgłoszenie ${t.code}</b>\n` +
      `${escapeHtml(DEVICE_TYPE_LABELS[t.deviceType] ?? t.deviceType)} · ${escapeHtml(t.city)}${dist}\n` +
      `Objaw: ${escapeHtml(t.problemDescription.slice(0, 120))}\n` +
      `Tel: ${escapeHtml(t.customerPhone)}\n` +
      `Odbiór: ${escapeHtml(t.preferredPickupDate ?? "dowolnie")}`;
    const markup: InlineKeyboard = {
      inline_keyboard: [
        [{ text: "Potwierdź", callback_data: `confirm:${t.id}` }],
        [{ text: "Zaplanuj odbiór", callback_data: `pickup:${t.id}` }],
        [{ text: "Otwórz w panelu", url: `${siteUrl()}/panel/zgloszenia/${t.id}` }],
      ],
    };
    const ok = await tgSendMessage(chat, text, markup);
    await log("TELEGRAM", t.id, "new_ticket", chat, ok, ok ? undefined : "sendMessage=false");
  }

  if (t.customerEmail) {
    const built = buildConfirmation(t);
    const r = await sendEmail(t.customerEmail, built.subject, built.element);
    await log("EMAIL", t.id, "confirmation", t.customerEmail, r.ok, r.error);
  }
}

export async function notifyStatusChange(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  if (!STATUS_META[status].notifyCustomer) return;
  const [t] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!t || !t.customerEmail) return;
  const built = buildStatusEmail(t, status);
  if (!built) return;
  const r = await sendEmail(t.customerEmail, built.subject, built.element);
  await log("EMAIL", t.id, `status_${status}`, t.customerEmail, r.ok, r.error);
}

export async function notifyQuoteDecision(ticketId: string, accepted: boolean): Promise<void> {
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!chat) return;
  const [t] = await db
    .select({ code: tickets.code })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!t) return;
  const ok = await tgSendMessage(
    chat,
    `Klient ${accepted ? "zaakceptował" : "odrzucił"} wycenę <b>${t.code}</b>`,
  );
  await log(
    "TELEGRAM",
    ticketId,
    accepted ? "quote_accepted" : "quote_rejected",
    chat,
    ok,
    ok ? undefined : "sendMessage=false",
  );
}
