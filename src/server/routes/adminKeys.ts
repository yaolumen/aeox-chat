import { Hono } from "hono";
import { allRows, db, getRow, thisMonth, type EventRow, type KeyRow } from "../db.ts";
import { encryptSecret, decryptSecret } from "../crypto.ts";
import { costUsd, keyLabel, monthUsage } from "../engine/pool.ts";

export const adminKeys = new Hono();

function rowOut(row: KeyRow) {
  const u = monthUsage(row.id);
  return {
    id: row.id,
    provider: row.provider,
    base_url: row.base_url,
    model: row.model,
    key_hint: row.key_hint,
    priority: row.priority,
    status: row.status,
    cooldown_until: row.cooldown_until,
    monthly_budget_usd: row.monthly_budget_usd,
    label: keyLabel(row),
    usage: {
      requests: u.requests,
      tokens_in: u.tokens_in,
      tokens_out: u.tokens_out,
      cost_usd: Number(costUsd(row.provider, u.tokens_in, u.tokens_out).toFixed(4))
    }
  };
}

adminKeys.get("/admin/api/keys", (c) => {
  const rows = allRows<KeyRow>("SELECT * FROM keys ORDER BY priority ASC, id ASC");
  return c.json({ keys: rows.map(rowOut) });
});

adminKeys.post("/admin/api/keys", async (c) => {
  const body = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const provider = typeof body?.provider === "string" && body.provider.trim() ? body.provider.trim().slice(0, 40) : "";
  const baseUrl = typeof body?.base_url === "string" && /^https?:\/\//.test(body.base_url.trim()) ? body.base_url.trim() : "";
  const model = typeof body?.model === "string" ? body.model.trim().slice(0, 100) : "";
  const key = typeof body?.key === "string" && body.key.trim().length >= 8 ? body.key.trim() : "";
  const priorityRaw = body?.priority;
  const priority = typeof priorityRaw === "number" && Number.isFinite(priorityRaw) ? Math.trunc(priorityRaw) : 100;
  const budgetRaw = body?.monthly_budget_usd;
  const budget = typeof budgetRaw === "number" && Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : 0;
  if (!provider || !baseUrl || !key) return c.json({ error: "invalid" }, 400);
  const info = db.prepare(
    "INSERT INTO keys(provider, base_url, model, key_enc, key_hint, priority, status, monthly_budget_usd, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
  ).run(provider, baseUrl, model, encryptSecret(key), key.slice(-4), priority, "active", budget, Date.now());
  const row = getRow<KeyRow>("SELECT * FROM keys WHERE id=?", Number(info.lastInsertRowid));
  if (!row) return c.json({ error: "invalid" }, 500);
  return c.json({ key: rowOut(row) }, 201);
});

adminKeys.patch("/admin/api/keys/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const row = getRow<KeyRow>("SELECT * FROM keys WHERE id=?", id);
  if (!row) return c.json({ error: "not_found" }, 404);
  const body = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.status === "active" || body?.status === "disabled") {
    db.prepare("UPDATE keys SET status=?, cooldown_until=0 WHERE id=?").run(body.status, id);
  }
  if (typeof body?.priority === "number" && Number.isFinite(body.priority)) {
    db.prepare("UPDATE keys SET priority=? WHERE id=?").run(Math.trunc(body.priority), id);
  }
  if (typeof body?.monthly_budget_usd === "number" && Number.isFinite(body.monthly_budget_usd) && body.monthly_budget_usd >= 0) {
    db.prepare("UPDATE keys SET monthly_budget_usd=? WHERE id=?").run(body.monthly_budget_usd, id);
  }
  const fresh = getRow<KeyRow>("SELECT * FROM keys WHERE id=?", id);
  if (!fresh) return c.json({ error: "not_found" }, 404);
  return c.json({ key: rowOut(fresh) });
});

adminKeys.delete("/admin/api/keys/:id", (c) => {
  const info = db.prepare("DELETE FROM keys WHERE id=?").run(Number(c.req.param("id")));
  if (info.changes === 0) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true });
});

adminKeys.post("/admin/api/keys/:id/test", async (c) => {
  const id = Number(c.req.param("id"));
  const row = getRow<KeyRow>("SELECT * FROM keys WHERE id=?", id);
  if (!row) return c.json({ error: "not_found" }, 404);
  const apiKey = decryptSecret(row.key_enc);
  if (apiKey === null) return c.json({ ok: false, message: "key corrupt (master key changed?)" });
  const started = Date.now();
  try {
    const res = await fetch(row.base_url.replace(/\/+$/, "") + "/models", {
      headers: { authorization: "Bearer " + apiKey },
      signal: AbortSignal.timeout(10_000)
    });
    const latency = Date.now() - started;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return c.json({ ok: false, status: res.status, latency_ms: latency, message: text.slice(0, 200) });
    }
    const data = await res.json().catch(() => null) as { data?: unknown[] } | null;
    const count = Array.isArray(data?.data) ? data.data.length : 0;
    return c.json({ ok: true, latency_ms: latency, models: count });
  } catch (e) {
    return c.json({ ok: false, latency_ms: Date.now() - started, message: e instanceof Error ? e.message : "network error" });
  }
});

adminKeys.get("/admin/api/events", (c) => {
  const rows = allRows<EventRow>("SELECT * FROM events ORDER BY id DESC LIMIT 100");
  const events = rows.map((r) => {
    let detail: Record<string, unknown> = {};
    try {
      detail = JSON.parse(r.detail) as Record<string, unknown>;
    } catch {
      detail = {};
    }
    return { id: r.id, ts: r.ts, type: r.type, key_id: r.key_id, detail };
  });
  return c.json({ events, month: thisMonth() });
});
