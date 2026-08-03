import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { ticketEvents, tickets } from "../db/schema";

// Tylko pola bezpieczne dla klienta — bez internalNote, partsCost, ipHash, userAgent.
const publicCols = {
  id: tickets.id,
  code: tickets.code,
  status: tickets.status,
  customerName: tickets.customerName,
  deviceType: tickets.deviceType,
  deviceBrand: tickets.deviceBrand,
  deviceModel: tickets.deviceModel,
  problemDescription: tickets.problemDescription,
  city: tickets.city,
  distanceKm: tickets.distanceKm,
  preferredPickupDate: tickets.preferredPickupDate,
  preferredPickupSlot: tickets.preferredPickupSlot,
  publicNote: tickets.publicNote,
  estimatedPriceMin: tickets.estimatedPriceMin,
  estimatedPriceMax: tickets.estimatedPriceMax,
  finalPrice: tickets.finalPrice,
  createdAt: tickets.createdAt,
};

export async function getTrackingByToken(token: string) {
  const [ticket] = await db
    .select(publicCols)
    .from(tickets)
    .where(eq(tickets.trackingToken, token))
    .limit(1);
  if (!ticket) return null;
  const events = await db
    .select({
      toStatus: ticketEvents.toStatus,
      createdAt: ticketEvents.createdAt,
    })
    .from(ticketEvents)
    .where(and(eq(ticketEvents.ticketId, ticket.id), eq(ticketEvents.type, "STATUS_CHANGE")))
    .orderBy(asc(ticketEvents.createdAt));
  return { ticket, events };
}

export async function verifyCodePhone(code: string, phone4: string): Promise<string | null> {
  const [t] = await db
    .select({ token: tickets.trackingToken, phone: tickets.customerPhone })
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);
  if (!t) return null;
  const last4 = t.phone.replace(/\D/g, "").slice(-4);
  return last4 === phone4 ? t.token : null;
}
