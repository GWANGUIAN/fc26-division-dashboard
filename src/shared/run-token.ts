/**
 * Stateless run tokens: `${issuedAtMs}.${hmacHex}`, signed with a server
 * secret over game + playerKey + issue time. The server needs no storage to
 * check one, and a token is useless to any other player or game.
 */

const encoder = new TextEncoder();
const TOKEN_PATTERN = /^(\d{10,15})\.([0-9a-f]{64})$/u;

const importKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

const payload = (game: string, playerKey: string, issuedAt: number) => encoder.encode(`${game}|${playerKey}|${issuedAt}`);

const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

export async function signRunToken(secret: string, game: string, playerKey: string, issuedAt: number): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), payload(game, playerKey, issuedAt));
  return `${issuedAt}.${toHex(signature)}`;
}

export type RunTokenVerdict = { ok: true; elapsedMs: number } | { ok: false; reason: "invalid" | "expired" };

export async function verifyRunToken(
  secret: string,
  token: string,
  game: string,
  playerKey: string,
  now: number,
  ttlMs: number,
): Promise<RunTokenVerdict> {
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return { ok: false, reason: "invalid" };
  const issuedAt = Number(match[1]);
  const signature = Uint8Array.from(match[2].match(/../gu) ?? [], (pair) => Number.parseInt(pair, 16));
  // subtle.verify compares in constant time.
  const genuine = await crypto.subtle.verify("HMAC", await importKey(secret), signature, payload(game, playerKey, issuedAt));
  if (!genuine) return { ok: false, reason: "invalid" };
  const elapsedMs = now - issuedAt;
  if (elapsedMs < 0) return { ok: false, reason: "invalid" };
  if (elapsedMs > ttlMs) return { ok: false, reason: "expired" };
  return { ok: true, elapsedMs };
}
