import { Hono } from "hono";
import { allRows, getRow, today, type EventRow, type KeyRow } from "../db.ts";
import { keyLabel } from "../engine/pool.ts";

export const enginePublic = new Hono();

enginePublic.get("/api/engine/status", (c) => {
  const nowMs = Date.now();
  const rows = allRows<KeyRow>("SELECT * FROM keys ORDER BY priority ASC, id ASC");
  const keys = rows.map((row) => {
    let status = row.status;
    if (status === "cooldown" && row.cooldown_until <= nowMs) status = "active";
    let cooldownS = 0;
    if (status === "cooldown") cooldownS = Math.max(0, Math.ceil((row.cooldown_until - nowMs) / 1000));
    return {
      label: keyLabel(row),
      provider: row.provider,
      status: status === "nokey" ? "standby" : status,
      cooldown_s: cooldownS,
      model: row.model || null
    };
  });
  const usage = getRow<{ r: number }>("SELECT COALESCE(SUM(requests),0) r FROM usage_daily WHERE day=?", today()) ?? { r: 0 };
  const events24 = getRow<{ c: number }>("SELECT COUNT(*) c FROM events WHERE ts > ?", nowMs - 86_400_000) ?? { c: 0 };
  return c.json({
    keys,
    totals: {
      active: keys.filter((k) => k.status === "active").length,
      cooldown: keys.filter((k) => k.status === "cooldown").length,
      standby: keys.filter((k) => k.status === "standby").length,
      requests_today: usage.r,
      events_24h: events24.c
    },
    ts: nowMs
  });
});

enginePublic.get("/api/engine/events", (c) => {
  const rows = allRows<EventRow>("SELECT * FROM events ORDER BY id DESC LIMIT 60");
  const events = rows.map((row) => {
    let detail: Record<string, unknown> = {};
    try {
      detail = JSON.parse(row.detail) as Record<string, unknown>;
    } catch {
      detail = {};
    }
    const label = typeof detail.label === "string" ? detail.label : "";
    let text = row.type;
    if (row.type === "route") text = label ? "route → " + label : "route";
    else if (row.type === "cooldown") text = label + " cooldown " + String(detail.ms ?? 60000) + "ms · " + String(detail.code ?? "");
    else if (row.type === "disabled") text = label + " disabled · " + String(detail.code ?? "");
    else if (row.type === "recovered") text = label + " recovered";
    else if (row.type === "budget") text = label + " over budget";
    return { ts: row.ts, type: row.type, text };
  });
  return c.json({ events });
});
