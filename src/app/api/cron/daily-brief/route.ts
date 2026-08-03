import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { escapeHtml, tgSendMessage } from "@/lib/notifications/telegram/client";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!chat) return NextResponse.json({ ok: true, skipped: "brak TELEGRAM_CHAT_ID" });

  const today = new Date().toISOString().slice(0, 10);
  const [pickups, nowe, zwroty] = await Promise.all([
    db
      .select({ code: tickets.code, city: tickets.city, phone: tickets.customerPhone })
      .from(tickets)
      .where(
        and(
          eq(tickets.preferredPickupDate, today),
          inArray(tickets.status, ["NOWE", "POTWIERDZONE", "ODBIOR_ZAPLANOWANY"]),
        ),
      ),
    db.$count(tickets, eq(tickets.status, "NOWE")),
    db.$count(tickets, eq(tickets.status, "ZWROT_ZAPLANOWANY")),
  ]);

  const text =
    `<b>Brief na dziś</b>\n` +
    `Nowe: ${nowe} · Do zwrotu: ${zwroty}\n` +
    `Odbiory dziś (${pickups.length}):\n` +
    (pickups
      .map((p) => `${p.code} · ${escapeHtml(p.city)} · ${escapeHtml(p.phone)}`)
      .join("\n") || "—");

  const ok = await tgSendMessage(chat, text);
  return NextResponse.json({ ok });
}
