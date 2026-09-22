import { db, getRow, allRows, thisMonth, today, type KeyRow } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openUpstream, type UpstreamEvent, type UpstreamMessage } from "./upstream.ts";

const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 3;
const EVENTS_KEEP = 500;

const PRICES: Record<string, { in: number; out: number }> = {
  deepseek: { in: 0.27, out: 1.1 },
  qwen: { in: 0.4, out: 1.2 },
  nvidia: { in: 0, out: 0 },
  groq: { in: 0, out: 0 },
  openrouter: { in: 0, out: 0 }
};

export function costUsd(provider: string, tokensIn: number, tokensOut: number): number {
  const p = PRICES[provider.toLowerCase()];
  if (!p) return 0;
  return (tokensIn / 1e6) * p.in + (tokensOut / 1e6) * p.out;
}

export function logEvent(type: string, keyId: number | null, detail: Record<string, string | number | null>): void {
  db.prepare("INSERT INTO events(ts, type, key_id, detail) VALUES(?,?,?,?)").run(Date.now(), type, keyId, JSON.stringify(detail));
  db.prepare("DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY id DESC LIMIT ?)").run(EVENTS_KEEP);
}

export function keyOrdinal(row: KeyRow): number {
  const r = getRow<{ c: number }>("SELECT COUNT(*) AS c FROM keys WHERE provider = ? AND id <= ?", row.provider, row.id) ?? { c: 0 };
  return r.c;
}

export function keyLabel(row: KeyRow): string {
  return row.provider + " #" + String(keyOrdinal(row)).padStart(2, "0");
}

export function monthUsage(keyId: number): { requests: number; tokens_in: number; tokens_out: number } {
  return getRow<{ requests: number; tokens_in: number; tokens_out: number }>(
    "SELECT COALESCE(SUM(requests),0) requests, COALESCE(SUM(tokens_in),0) tokens_in, COALESCE(SUM(tokens_out),0) tokens_out FROM usage_daily WHERE key_id = ? AND day LIKE ?",
    keyId, thisMonth() + "-%"
  ) ?? { requests: 0, tokens_in: 0, tokens_out: 0 };
}

function pickCandidates(): KeyRow[] {
  const nowMs = Date.now();
  const rows = allRows<KeyRow>(
    "SELECT * FROM keys WHERE key_enc != '' AND status IN ('active','cooldown') ORDER BY priority ASC, id ASC"
  );
  const out: KeyRow[] = [];
  for (const row of rows) {
    if (row.status === "cooldown" && row.cooldown_until > nowMs) continue;
    if (row.monthly_budget_usd > 0) {
      const u = monthUsage(row.id);
      if (costUsd(row.provider, u.tokens_in, u.tokens_out) >= row.monthly_budget_usd) {
        db.prepare("UPDATE keys SET status='budget' WHERE id=?").run(row.id);
        logEvent("budget", row.id, { label: keyLabel(row), budget: row.monthly_budget_usd });
        continue;
      }
    }
    out.push(row);
  }
  return out;
}

export interface RouteOk {
  ok: true;
  key: KeyRow;
  stream: AsyncGenerator<UpstreamEvent>;
  failover: { from: string; code: number | string } | null;
}

export interface RouteErr {
  ok: false;
  error: "no_keys";
}

export type RouteResult = RouteOk | RouteErr;

export async function routeChat(messages: UpstreamMessage[], signal?: AbortSignal): Promise<RouteResult> {
  const candidates = pickCandidates().slice(0, MAX_ATTEMPTS);
  let failover: { from: string; code: number | string } | null = null;
  for (const row of candidates) {
    const apiKey = decryptSecret(row.key_enc);
    if (apiKey === null) {
      db.prepare("UPDATE keys SET status='disabled' WHERE id=?").run(row.id);
      logEvent("disabled", row.id, { label: keyLabel(row), code: "corrupt" });
      failover = failover ?? { from: keyLabel(row), code: "corrupt" };
      continue;
    }
    if (!row.model) {
      failover = failover ?? { from: keyLabel(row), code: "no-model" };
      continue;
    }
    const opened = await openUpstream({ baseUrl: row.base_url, apiKey, model: row.model, messages, signal });
    if (!opened.ok) {
      if (opened.kind === "auth") {
        db.prepare("UPDATE keys SET status='disabled' WHERE id=?").run(row.id);
        logEvent("disabled", row.id, { label: keyLabel(row), code: opened.status });
      } else {
        db.prepare("UPDATE keys SET status='cooldown', cooldown_until=? WHERE id=?").run(Date.now() + COOLDOWN_MS, row.id);
        logEvent("cooldown", row.id, { label: keyLabel(row), code: opened.status, ms: COOLDOWN_MS });
      }
      failover = failover ?? { from: keyLabel(row), code: opened.status };
      continue;
    }
    if (row.status === "cooldown") {
      db.prepare("UPDATE keys SET status='active', cooldown_until=0 WHERE id=?").run(row.id);
      logEvent("recovered", row.id, { label: keyLabel(row) });
    }
    return { ok: true, key: row, stream: opened.stream, failover };
  }
  return { ok: false, error: "no_keys" };
}

export function recordUsage(keyId: number, tokensIn: number, tokensOut: number, requests: number): void {
  db.prepare(
    "INSERT INTO usage_daily(key_id, day, requests, tokens_in, tokens_out) VALUES(?,?,?,?,?) " +
      "ON CONFLICT(key_id, day) DO UPDATE SET requests = requests + excluded.requests, tokens_in = tokens_in + excluded.tokens_in, tokens_out = tokens_out + excluded.tokens_out"
  ).run(keyId, today(), requests, tokensIn, tokensOut);
}
