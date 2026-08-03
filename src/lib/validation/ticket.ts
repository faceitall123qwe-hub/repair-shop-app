import { z } from "zod";

export const DEVICE_TYPES = [
  "LAPTOP",
  "PC",
  "IPHONE",
  "ANDROID",
  "KONSOLA",
  "INNE",
] as const;

export const PICKUP_SLOTS = [
  "RANO_8_12",
  "POPOLUDNIE_12_17",
  "WIECZOR_17_21",
  "DOWOLNIE",
] as const;

const phoneRegex = /^(\+?48)?[\s-]?(\d[\s-]?){9}$/;
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const ticketFormSchema = z.object({
  // Krok 1 — co naprawiamy
  deviceType: z.enum(DEVICE_TYPES, { message: "Wybierz typ sprzętu." }),
  deviceBrand: optionalText(80),
  deviceModel: optionalText(120),
  problemDescription: z
    .string()
    .trim()
    .min(10, "Opisz problem w kilku słowach (min. 10 znaków).")
    .max(2000),
  serviceIds: z.array(z.string().uuid()).optional().default([]),

  // Krok 2 — gdzie i kiedy odbieramy
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, "Kod w formacie 00-000."),
  addressLine: z.string().trim().min(3, "Podaj ulicę i numer.").max(160),
  city: z.string().trim().min(2, "Podaj miejscowość.").max(80),
  preferredPickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data w formacie RRRR-MM-DD.")
    .optional()
    .or(z.literal("")),
  preferredPickupSlot: z.enum(PICKUP_SLOTS).optional(),
  pickupNote: optionalText(300),

  // Krok 3 — kontakt
  customerName: z.string().trim().min(2, "Podaj imię.").max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Podaj numer w formacie 123 456 789."),
  customerEmail: z.string().trim().email("Nieprawidłowy e-mail.").optional().or(z.literal("")),
  consentRodo: z.coerce.boolean().refine((v) => v, "Zgoda na przetwarzanie danych jest wymagana."),
  consentMarketing: z.coerce.boolean().optional().default(false),
});

export type TicketFormInput = z.infer<typeof ticketFormSchema>;

// Normalizacja telefonu do E.164 (+48XXXXXXXXX) przy zapisie.
export function normalizePhonePl(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("48") ? digits.slice(2) : digits;
  return `+48${local}`;
}
