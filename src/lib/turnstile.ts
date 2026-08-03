// Weryfikacja Cloudflare Turnstile po stronie serwera.
// Wołana tylko, gdy token jest obecny (ścieżka z JS); fallback bez JS opiera się
// na honeypocie, minimalnym czasie wypełnienia i rate-limicie.
export async function verifyTurnstile(
  token: string,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // brak konfiguracji — nie blokuj
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
