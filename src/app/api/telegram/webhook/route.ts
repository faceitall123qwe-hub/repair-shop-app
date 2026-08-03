import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { DEVICE_TYPE_LABELS } from "@/lib/labels";
import {
  escapeHtml,
  tgAnswerCallback,
  tgSendMessage,
} from "@/lib/notifications/telegram/client";
import { STATUS_META } from "@/lib/ticket-state";
import { TicketError, updateTicketStatus } from "@/services/tickets";

type CallbackQuery = {
  id: string;
  data?: string;
  message?: { chat?: { id?: number | string } };
};
type TgUpdate = {
  callback_query?: CallbackQuery;
  message?: { text?: string; chat?: { id?: number | string } };
};

const CALLBACK: Record<string, "POTWIERDZONE" | "ODBIOR_ZAPLANOWANY"> = {
  confirm: "POTWIERDZONE",
  pickup: "ODBIOR_ZAPLANOWANY",
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  if (update.callback_query) {
    await handleCallback(update.callback_query);
  } else if (
    typeof update.message?.text === "string" &&
    update.message.text.startsWith("/")
  ) {
    await handleCommand(String(update.message.chat?.id ?? ""), update.message.text);
  }
  return NextResponse.json({ ok: true });
}

async function handleCallback(cq: CallbackQuery) {
  const [action, id] = String(cq.data ?? "").split(":");
  const chat = String(cq.message?.chat?.id ?? process.env.TELEGRAM_CHAT_ID ?? "");
  const to = CALLBACK[action ?? ""];
  if (!to || !id) {
    await tgAnswerCallback(cq.id, "Nieznana akcja.");
    return;
  }
  try {
    await updateTicketStatus(id, to, "telegram");
    await tgAnswerCallback(cq.id, `Status: ${STATUS_META[to].label}`);
    if (chat) await tgSendMessage(chat, `Zlecenie → <b>${STATUS_META[to].label}</b>`);
  } catch (e) {
    await tgAnswerCallback(cq.id, e instanceof TicketError ? e.message : "Błąd.");
  }
}

async function handleCommand(chatId: string, text: string) {
  if (!chatId) return;
  const [cmd, ...rest] = text.trim().split(/\s+/);
  const arg = rest.join(" ");

  if (cmd === "/dzis") {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({ code: tickets.code, city: tickets.city, phone: tickets.customerPhone })
      .from(tickets)
      .where(
        and(
          eq(tickets.preferredPickupDate, today),
          inArray(tickets.status, ["NOWE", "POTWIERDZONE", "ODBIOR_ZAPLANOWANY"]),
        ),
      );
    await tgSendMessage(
      chatId,
      rows.length
        ? `<b>Dziś (${rows.length})</b>\n` +
            rows.map((r) => `${r.code} · ${escapeHtml(r.city)} · ${escapeHtml(r.phone)}`).join("\n")
        : "Nic na dziś.",
    );
  } else if (cmd === "/nowe") {
    const rows = await db
      .select({
        code: tickets.code,
        city: tickets.city,
        deviceType: tickets.deviceType,
        phone: tickets.customerPhone,
      })
      .from(tickets)
      .where(eq(tickets.status, "NOWE"))
      .orderBy(desc(tickets.createdAt))
      .limit(15);
    await tgSendMessage(
      chatId,
      rows.length
        ? `<b>Nowe (${rows.length})</b>\n` +
            rows
              .map(
                (r) =>
                  `${r.code} · ${escapeHtml(DEVICE_TYPE_LABELS[r.deviceType] ?? r.deviceType)} · ${escapeHtml(r.city)} · ${escapeHtml(r.phone)}`,
              )
              .join("\n")
        : "Brak nowych.",
    );
  } else if (cmd === "/szukaj") {
    if (!arg) {
      await tgSendMessage(chatId, "Użycie: /szukaj &lt;fraza&gt;");
      return;
    }
    const rows = await db
      .select({
        code: tickets.code,
        city: tickets.city,
        name: tickets.customerName,
        phone: tickets.customerPhone,
      })
      .from(tickets)
      .where(
        or(
          ilike(tickets.code, `%${arg}%`),
          ilike(tickets.customerName, `%${arg}%`),
          ilike(tickets.customerPhone, `%${arg}%`),
          ilike(tickets.deviceModel, `%${arg}%`),
        ),
      )
      .limit(15);
    await tgSendMessage(
      chatId,
      rows.length
        ? `<b>Wyniki (${rows.length})</b>\n` +
            rows
              .map((r) => `${r.code} · ${escapeHtml(r.name)} · ${escapeHtml(r.city)} · ${escapeHtml(r.phone)}`)
              .join("\n")
        : "Brak wyników.",
    );
  } else {
    await tgSendMessage(chatId, "Komendy: /dzis · /nowe · /szukaj &lt;fraza&gt;");
  }
}
