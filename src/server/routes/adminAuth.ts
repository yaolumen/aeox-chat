import { Hono } from "hono";
import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verifyPassword, verifySigned } from "../crypto.ts";
import { clientIp } from "../middleware/quota.ts";

const LOGIN_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const COOKIE = "aeox_admin";
const MAX_AGE_S = 12 * 60 * 60;

const attempts = new Map<string, { start: number; count: number }>();

export const adminAuth = new Hono();

adminAuth.post("/admin/api/login", async (c) => {
  const ip = clientIp(c);
  const nowMs = Date.now();
  const rec = attempts.get(ip);
  if (rec && nowMs - rec.start < WINDOW_MS && rec.count >= LOGIN_LIMIT) {
    return c.json({ error: "rate_limited" }, 429);
  }
  const body = await c.req.json().catch(() => null) as { password?: unknown } | null;
  const pw = typeof body?.password === "string" ? body.password : "";
  if (!pw || !verifyPassword(pw)) {
    if (!rec || nowMs - rec.start >= WINDOW_MS) attempts.set(ip, { start: nowMs, count: 1 });
    else rec.count += 1;
    return c.json({ error: "bad_password" }, 401);
  }
  attempts.delete(ip);
  const exp = Date.now() + MAX_AGE_S * 1000;
  const proto = c.req.header("x-forwarded-proto") ?? "http";
  setCookie(c, COOKIE, "admin." + exp + "." + sign("admin:" + exp), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: MAX_AGE_S,
    secure: proto === "https"
  });
  return c.json({ ok: true });
});

adminAuth.post("/admin/api/logout", (c) => {
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
});

export async function requireAdmin(c: Context, next: Next) {
  const raw = getCookie(c, COOKIE);
  const parts = raw ? raw.split(".") : [];
  const exp = parts.length === 3 ? Number(parts[1]) : 0;
  const val = parts.length === 3 && Number.isFinite(exp) && exp > Date.now()
    ? verifySigned("admin:" + parts[1], parts[2])
    : null;
  if (val !== "admin:" + parts[1]) return c.json({ error: "unauthorized" }, 401);
  await next();
}
