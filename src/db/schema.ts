import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "../lib/ids";

// ── Enums ──
export const ticketStatusEnum = pgEnum("ticket_status", [
  "NOWE",
  "POTWIERDZONE",
  "ODBIOR_ZAPLANOWANY",
  "ODEBRANE",
  "W_DIAGNOZIE",
  "WYCENA_WYSLANA",
  "W_NAPRAWIE",
  "GOTOWE",
  "ODRZUCONA_WYCENA",
  "ZWROT_ZAPLANOWANY",
  "ZAKONCZONE",
  "ANULOWANE",
]);
export const priorityEnum = pgEnum("priority", ["NISKI", "NORMALNY", "PILNY"]);
export const sourceEnum = pgEnum("ticket_source", [
  "FORMULARZ",
  "TELEFON",
  "TELEGRAM",
  "POLECENIE",
  "INNE",
]);
export const deviceTypeEnum = pgEnum("device_type", [
  "LAPTOP",
  "PC",
  "IPHONE",
  "ANDROID",
  "KONSOLA",
  "INNE",
]);
export const pickupSlotEnum = pgEnum("pickup_slot", [
  "RANO_8_12",
  "POPOLUDNIE_12_17",
  "WIECZOR_17_21",
  "DOWOLNIE",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "STATUS_CHANGE",
  "NOTE",
  "EMAIL_SENT",
  "TELEGRAM_SENT",
  "PRICE_SET",
  "ATTACHMENT_ADDED",
]);
export const attachmentKindEnum = pgEnum("attachment_kind", [
  "ZDJECIE_PRZED",
  "ZDJECIE_PO",
  "PROTOKOL",
  "INNE",
]);
export const serviceCategoryEnum = pgEnum("service_category", [
  "DIAGNOSTYKA",
  "NAPRAWA",
  "SERWIS_OKRESOWY",
  "SOFTWARE",
  "SKLADANIE",
  "TELEFONY",
]);
export const adminRoleEnum = pgEnum("admin_role", ["OWNER", "STAFF"]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "TELEGRAM",
]);

// ── Wspólne kolumny (fabryki — świeży builder na tabelę) ──
const pk = () => uuid().primaryKey().$defaultFn(uuidv7);
const created = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updated = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ── tickets — rdzeń systemu ──
export const tickets = pgTable("tickets", {
  id: pk(),
  code: text().notNull().unique(),
  status: ticketStatusEnum().notNull().default("NOWE"),
  priority: priorityEnum().notNull().default("NORMALNY"),
  source: sourceEnum().notNull().default("FORMULARZ"),

  customerName: text().notNull(),
  customerPhone: text().notNull(),
  customerEmail: text(),
  addressLine: text().notNull(),
  city: text().notNull(),
  postalCode: text().notNull(),
  lat: numeric(),
  lng: numeric(),
  distanceKm: numeric(),
  inServiceArea: boolean(),

  deviceType: deviceTypeEnum().notNull(),
  deviceBrand: text(),
  deviceModel: text(),
  problemDescription: text().notNull(),
  serviceIds: uuid().array(),

  preferredPickupDate: date(),
  preferredPickupSlot: pickupSlotEnum(),
  pickupNote: text(),

  estimatedPriceMin: integer(),
  estimatedPriceMax: integer(),
  finalPrice: integer(),
  partsCost: integer(),
  publicNote: text(),
  internalNote: text(),

  consentRodo: boolean().notNull(),
  consentMarketing: boolean().notNull().default(false),
  ipHash: text(),
  userAgent: text(),
  trackingToken: text().notNull().unique(),
  closedAt: timestamp({ withTimezone: true }),

  createdAt: created(),
  updatedAt: updated(),
}).enableRLS();

// ── ticket_events — oś czasu, append-only ──
export const ticketEvents = pgTable("ticket_events", {
  id: pk(),
  ticketId: uuid()
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  type: eventTypeEnum().notNull(),
  fromStatus: ticketStatusEnum(),
  toStatus: ticketStatusEnum(),
  payload: jsonb(),
  actor: text(),
  createdAt: created(),
}).enableRLS();

// ── attachments ──
export const attachments = pgTable("attachments", {
  id: pk(),
  ticketId: uuid()
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  url: text().notNull(),
  kind: attachmentKindEnum().notNull(),
  mimeType: text().notNull(),
  sizeBytes: integer().notNull(),
  uploadedBy: text(),
  createdAt: created(),
}).enableRLS();

// ── services — katalog usług ──
export const services = pgTable("services", {
  id: pk(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  category: serviceCategoryEnum().notNull(),
  shortDesc: text().notNull(),
  longDesc: text(), // markdown
  priceFromGrosze: integer(),
  priceToGrosze: integer(),
  priceNote: text(), // "od", "wycena po diagnozie"
  turnaround: text(), // "24–48 h"
  deviceTypes: deviceTypeEnum().array(),
  isActive: boolean().notNull().default(true),
  isPopular: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  seoTitle: text(),
  seoDescription: text(),
  faq: jsonb().$type<{ q: string; a: string }[]>(),
  createdAt: created(),
  updatedAt: updated(),
}).enableRLS();

// ── service_areas — miejscowości pod SEO lokalne ──
export const serviceAreas = pgTable("service_areas", {
  id: pk(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  distanceKm: numeric().notNull(),
  isActive: boolean().notNull().default(true),
  customIntro: text(),
  createdAt: created(),
  updatedAt: updated(),
}).enableRLS();

// ── admin_users ──
export const adminUsers = pgTable("admin_users", {
  id: pk(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  role: adminRoleEnum().notNull().default("STAFF"),
  lastLoginAt: timestamp({ withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
}).enableRLS();

// ── sessions — własny system sesji admina ──
export const sessions = pgTable("sessions", {
  id: pk(),
  token: text().notNull().unique(),
  userId: uuid()
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: created(),
}).enableRLS();

// ── notification_log — append-only ──
export const notificationLog = pgTable("notification_log", {
  id: pk(),
  channel: notificationChannelEnum().notNull(),
  ticketId: uuid().references(() => tickets.id, { onDelete: "set null" }),
  template: text().notNull(),
  recipient: text().notNull(),
  status: text().notNull(),
  error: text(),
  sentAt: timestamp({ withTimezone: true }),
  createdAt: created(),
}).enableRLS();

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type ServiceArea = typeof serviceAreas.$inferSelect;
