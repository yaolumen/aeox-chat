import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { db, getRow, today } from "../db.ts";
import { newId, sign, verifySigned } from "../crypto.ts";

const SESSION_LIMIT = 30;
const IP_LIMIT = 60;

interface NodeEnv {
  incoming: {
    socket?: { remoteAddress?: string };
  };
}

export function clientIp(c: Context): string {
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const env = c.env as NodeEnv;
  return env.incoming?.socket?.remoteAddress ?? "unknown";
}

export function ensureSession(c: Context): string {
  const raw = getCookie(c, "aeox_sid");
  const dot = raw?.indexOf(".") ?? -1;
  if (raw && dot > 0) {
    const sid = verifySigned(raw.slice(0, dot), raw.slice(dot + 1));
    if (sid) return sid;
  }
  const fresh = newId();
  const proto = c.req.header("x-forwarded-proto") ?? "http";
  setCookie(c, "aeox_sid", fresh + "." + sign(fresh), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 365,
    secure: proto === "https"
  });
  return fresh;
}

export interface QuotaResult {
  ok: boolean;
  sessionUsed: number;
  sessionLimit: number;
}

export function consumeQuota(sid: string, ip: string): QuotaResult {
  const day = today();
  const s = getRow<{ count: number }>("SELECT count FROM quota_session WHERE session_id=? AND day=?", sid, day);
  const i = getRow<{ count: number }>("SELECT count FROM quota_ip WHERE ip=? AND day=?", ip, day);
  const sCount = s?.count ?? 0;
  const iCount = i?.count ?? 0;
  if (sCount >= SESSION_LIMIT || iCount >= IP_LIMIT) {
    return { ok: false, sessionUsed: sCount, sessionLimit: SESSION_LIMIT };
  }
  db.prepare(
    "INSERT INTO quota_session(session_id, day, count) VALUES(?,?,1) ON CONFLICT(session_id, day) DO UPDATE SET count=count+1"
  ).run(sid, day);
  db.prepare(
    "INSERT INTO quota_ip(ip, day, count) VALUES(?,?,1) ON CONFLICT(ip, day) DO UPDATE SET count=count+1"
  ).run(ip, day);
  return { ok: true, sessionUsed: sCount + 1, sessionLimit: SESSION_LIMIT };
}
