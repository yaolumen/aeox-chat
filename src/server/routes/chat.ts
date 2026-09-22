import { Hono } from "hono";
import type { UpstreamMessage } from "../engine/upstream.ts";
import { getRow } from "../db.ts";
import { keyLabel, logEvent, recordUsage, routeChat } from "../engine/pool.ts";
import { clientIp, consumeQuota, ensureSession } from "../middleware/quota.ts";

const MAX_MESSAGES = 20;
const MAX_CHARS = 8000;
const CHARS_PER_TOKEN = 4;

function systemPrompt(): string {
  const row = getRow<{ v: string }>("SELECT v FROM site_meta WHERE k='system_prompt'");
  return row && row.v ? row.v : "";
}

export const chat = new Hono();

chat.post("/api/chat", async (c) => {
  const body = await c.req.json().catch(() => null) as { messages?: unknown } | null;
  const raw = Array.isArray(body?.messages) ? body.messages : [];
  if (raw.length === 0) return c.json({ error: "empty" }, 400);
  const messages: UpstreamMessage[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    const m = item as { role?: unknown; content?: unknown };
    if (typeof m.role !== "string" || typeof m.content !== "string") continue;
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") continue;
    messages.push({ role: m.role, content: m.content.slice(0, MAX_CHARS) });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return c.json({ error: "invalid" }, 400);
  }
  const sys = systemPrompt();
  if (sys) messages.unshift({ role: "system", content: sys.slice(0, 4000) });
  const sid = ensureSession(c);
  const quota = consumeQuota(sid, clientIp(c));
  if (!quota.ok) {
    return c.json({ error: "quota", session_used: quota.sessionUsed, session_limit: quota.sessionLimit }, 429);
  }
  const started = Date.now();
  const routed = await routeChat(messages, c.req.raw.signal);
  if (!routed.ok) return c.json({ error: "no_keys" }, 503);
  const label = keyLabel(routed.key);
  const inChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const sendObj = (obj: unknown): void => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode("data: " + JSON.stringify(obj) + "\n\n"));
        } catch {
          closed = true;
        }
      };
      const sendDone = (): void => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          closed = true;
        }
        closed = true;
      };
      sendObj({ start: true, quota: { used: quota.sessionUsed, limit: quota.sessionLimit } });
      let ttft = 0;
      let tokensIn = 0;
      let tokensOut = 0;
      let gotUsage = false;
      let outChars = 0;
      try {
        for await (const ev of routed.stream) {
          if (closed) break;
          if (ev.type === "chunk") {
            if (ttft === 0) {
              ttft = Date.now() - started;
              logEvent("route", routed.key.id, { label, model: routed.key.model, ttft_ms: ttft });
            }
            outChars += ev.delta.length;
            sendObj({ d: ev.delta });
          } else if (ev.type === "usage") {
            tokensIn = ev.tokensIn;
            tokensOut = ev.tokensOut;
            gotUsage = true;
          }
        }
      } catch {
        sendObj({
          meta: {
            provider: routed.key.provider,
            model: routed.key.model,
            key: label,
            ttft_ms: ttft,
            tokens: null,
            failover: routed.failover,
            status: "upstream_error"
          }
        });
        sendDone();
        return;
      }
      if (!gotUsage) {
        tokensIn = Math.ceil(inChars / CHARS_PER_TOKEN);
        tokensOut = Math.ceil(outChars / CHARS_PER_TOKEN);
      }
      if (outChars > 0) recordUsage(routed.key.id, tokensIn, tokensOut, 1);
      sendObj({
        meta: {
          provider: routed.key.provider,
          model: routed.key.model,
          key: label,
          ttft_ms: ttft,
          tokens: { in: tokensIn, out: tokensOut },
          failover: routed.failover,
          status: outChars === 0 ? "empty" : "200"
        }
      });
      sendDone();
    }
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      "x-accel-buffering": "no"
    }
  });
});
