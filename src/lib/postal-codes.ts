import raw from "../../data/kody-pocztowe.json";

export type PostalEntry = { code: string; city: string; lat: number; lng: number };

const entries = raw as PostalEntry[];
const byCode = new Map(entries.map((e) => [e.code, e]));

export function normalizePostalCode(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return input.trim();
}

// Dataset lokalny (bez API na hot path). Nieznany kod → null (ręczna weryfikacja).
export function lookupPostalCode(input: string): PostalEntry | null {
  return byCode.get(normalizePostalCode(input)) ?? null;
}
