import { randomBytes } from "node:crypto";

// UUIDv7 — czasowo-sortowalny, dobra lokalność indeksu w Postgresie.
// Generujemy po stronie aplikacji zamiast gen_random_uuid() (v4).
export function uuidv7(): string {
  const buf = randomBytes(16);
  const ts = Date.now();
  buf.writeUIntBE(ts, 0, 6); // 48-bitowy timestamp (ms) na bajtach 0..5
  buf.writeUInt8((buf.readUInt8(6) & 0x0f) | 0x70, 6); // wersja 7
  buf.writeUInt8((buf.readUInt8(8) & 0x3f) | 0x80, 8); // wariant RFC 4122
  const h = buf.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Kod zlecenia widoczny dla klienta, np. SRV-2026-0417.
export function formatTicketCode(year: number, seq: number): string {
  return `SRV-${year}-${String(seq).padStart(4, "0")}`;
}

// Token do linku statusu w mailu (bez podawania danych).
export function generateTrackingToken(): string {
  return randomBytes(24).toString("base64url");
}
