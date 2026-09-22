import { applyStatic, initLangToggle, onLang, t } from "./i18n.ts";
import { initAdminDoor } from "./door.ts";
import { esc, md } from "./md.ts";

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

interface EngineKey {
  label: string;
  provider: string;
  status: string;
  cooldown_s: number;
  model: string | null;
}

interface EngineStatus {
  keys: EngineKey[];
  totals: { active: number; cooldown: number; requests_today: number; events_24h: number };
  ts: number;
}

interface Meta {
  provider: string;
  model: string;
  key: string;
  ttft_ms: number;
  tokens: { in: number; out: number } | null;
  failover: { from: string; code: number | string } | null;
  status: string;
}

interface Msg {
  role: "user" | "assistant";
  text: string;
  meta?: Meta;
  trace?: string[];
}

interface Conv {
  title: string;
  msgs: Msg[];
}

interface QuotaState {
  day: string;
  used: number;
  limit: number;
}

let convs: Conv[] = [];
let active = 0;
let sending = false;
let engStatus: EngineStatus | null = null;
let ttfts: number[] = [];
let tpss: number[] = [];
let quota: QuotaState = { day: "", used: 0, limit: 30 };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

try {
  const raw = localStorage.getItem("aeox_quota");
  if (raw) {
    const q = JSON.parse(raw) as QuotaState;
    if (q.day === todayStr()) quota = q;
  }
} catch {
  quota = { day: "", used: 0, limit: 30 };
}

try {
  const raw = localStorage.getItem("aeox_convs");
  if (raw) {
    const parsed = JSON.parse(raw) as Conv[];
    if (Array.isArray(parsed) && parsed.length > 0) convs = parsed.slice(0, 30);
  }
} catch {
  convs = [];
}

if (convs.length === 0) convs = [{ title: "", msgs: [] }];

function saveConvs(): void {
  try {
    localStorage.setItem("aeox_convs", JSON.stringify(convs));
  } catch {
    /* noop */
  }
}

function saveQuota(): void {
  try {
    localStorage.setItem("aeox_quota", JSON.stringify(quota));
  } catch {
    /* noop */
  }
}

const msgsEl = byId("msgs");
const colEl = byId("msgCol");

function scrollBottom(): void {
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function notice(text: string): void {
  colEl.appendChild(el("div", "notice mono", esc(text)));
  scrollBottom();
}

function failoverLine(from: string, code: number | string): HTMLElement {
  const codeStr = String(code);
  const m = engStatus;
  let to = "";
  if (m) {
    const nextKey = m.keys.find((k) => k.status === "active" && k.label !== from);
    if (nextKey) to = nextKey.label;
  }
  return el(
    "div",
    "fev mono",
    "⟲ " + esc(t("chat.failover")) + ": " + esc(from) + " " + esc(codeStr) + (to ? " → <b>" + esc(to) + "</b>" : "")
  );
}

function keyTip(label: string): string {
  const k = engStatus?.keys.find((x) => x.label === label);
  const st = k ? k.status : "masked";
  const cd = k ? String(k.cooldown_s) + "s" : "0s";
  return t("chat.st") + ": <b>" + esc(st) + "</b> · " + t("chat.cd") + ": <b>" + cd + "</b>";
}

function badgeRow(meta: Meta, trace?: string[]): HTMLElement {
  const row = el("div", "erow");
  row.appendChild(el("span", "eb", esc(meta.model || meta.provider)));
  row.appendChild(el("span", "eb key", esc(meta.key) + '<i class="tip mono">' + keyTip(meta.key) + "</i>"));
  if (meta.ttft_ms > 0) row.appendChild(el("span", "eb", "ttft " + meta.ttft_ms + "ms"));
  if (meta.tokens) row.appendChild(el("span", "eb", meta.tokens.in + "/" + meta.tokens.out + " tok"));
  const ok = meta.status === "200";
  row.appendChild(el("span", "eb " + (ok ? "ok" : ""), esc(meta.status === "200" ? "200 OK" : meta.status)));
  if (trace && trace.length > 0) {
    const chip = el("span", "eb trace", t("chat.trace"));
    row.appendChild(chip);
    const box = el("pre", "trace-box mono", esc(trace.join("\n")));
    let holder: HTMLElement | null = null;
    chip.addEventListener("click", () => {
      if (!holder) {
        holder = box;
        row.parentElement?.appendChild(box);
      }
      box.classList.toggle("open");
    });
  }
  return row;
}

function traceSample(lines: string[]): string[] {
  const out: string[] = [];
  const head = lines.slice(0, 4);
  const tail = lines.slice(-2);
  for (const l of head) out.push(l.length > 110 ? l.slice(0, 110) + "…" : l);
  if (lines.length > 6) out.push("… " + (lines.length - 6) + " more chunks");
  for (const l of tail) out.push(l.length > 110 ? l.slice(0, 110) + "…" : l);
  out.push("[DONE]");
  return out;
}

function aiShell(): { wrap: HTMLElement; body: HTMLElement } {
  const wrap = el("div", "m-ai");
  const head = el("div", "ai-head");
  head.appendChild(el("div", "ai-mark", "A"));
  head.appendChild(el("span", "ai-name mono", "aeox // ai"));
  wrap.appendChild(head);
  const body = el("div", "msg-text");
  wrap.appendChild(body);
  colEl.appendChild(wrap);
  return { wrap, body };
}

function appendMsg(m: Msg, scroll: boolean): void {
  if (m.role === "user") {
    colEl.appendChild(
      el("div", "m-user", '<span class="pfx mono">&gt;</span><span class="u-txt">' + esc(m.text) + "</span>")
    );
    if (scroll) scrollBottom();
    return;
  }
  const shell = aiShell();
  shell.body.innerHTML = md(m.text);
  if (m.meta) {
    if (m.meta.failover) {
      shell.wrap.insertBefore(failoverLine(m.meta.failover.from, m.meta.failover.code), shell.body);
    }
    shell.wrap.appendChild(badgeRow(m.meta, m.trace));
  }
  if (scroll) scrollBottom();
}

function renderWelcome(): void {
  colEl.innerHTML = "";
  const w = el("div", "welcome");
  w.appendChild(el("div", "ai-mark", "A"));
  w.appendChild(el("h2", "", esc(t("chat.welcome"))));
  w.appendChild(el("div", "wline mono", esc(t("chat.wline"))));
  const g = el("div", "sugg");
  const items: Array<[string, string]> = [
    [t("chat.sugg1"), t("chat.sugg1s")],
    [t("chat.sugg2"), t("chat.sugg2s")],
    [t("chat.sugg3"), t("chat.sugg3s")],
    [t("chat.sugg4"), t("chat.sugg4s")]
  ];
  for (const [title, sub] of items) {
    const b = el("button", "", esc(title) + "<small>" + esc(sub) + "</small>");
    b.addEventListener("click", () => {
      void send(title);
    });
    g.appendChild(b);
  }
  w.appendChild(g);
  colEl.appendChild(w);
}

function renderMsgs(): void {
  const conv = convs[active];
  colEl.innerHTML = "";
  if (conv.msgs.length === 0) {
    renderWelcome();
    return;
  }
  for (const m of conv.msgs) appendMsg(m, false);
  scrollBottom();
}

function renderConvs(): void {
  const list = byId("convList");
  list.innerHTML = "";
  convs.forEach((conv, i) => {
    const title = conv.title || t("chat.newChat");
    const d = el("div", "conv" + (i === active ? " active" : ""), esc(title));
    d.addEventListener("click", () => {
      active = i;
      renderConvs();
      renderMsgs();
    });
    list.appendChild(d);
  });
}

function updateQuota(): void {
  byId("quotaNum").textContent = quota.used + "/" + quota.limit;
  const bar = byId("quotaBar");
  const pct = quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0;
  bar.style.width = pct + "%";
  bar.className = quota.used >= quota.limit ? "full" : quota.used >= quota.limit - 2 ? "hot" : "";
}

function renderPoolPanel(): void {
  const box = byId("pool");
  box.innerHTML = "";
  if (!engStatus) return;
  for (const k of engStatus.keys) {
    const off = k.status === "disabled" || k.status === "budget" || k.status === "standby" ? " off" : "";
    let name = esc(k.label);
    let right = "";
    if (k.status === "cooldown") {
      name += " <em>" + k.cooldown_s + "s</em>";
      right = k.cooldown_s + "s";
    } else if (k.status === "standby") {
      right = t("chat.standby");
    } else if (k.status === "active") {
      right = "up";
    } else {
      right = "off";
    }
    const dot = k.status === "active" ? "up" : k.status === "cooldown" ? "warn" : "down";
    box.appendChild(el("div", "krow mono" + off, '<i class="dot ' + dot + '"></i><span class="kname">' + name + '</span><span class="kreq">' + esc(right) + "</span>"));
  }
}

function renderSpark(): void {
  const tBox = byId("sparkTtft");
  tBox.innerHTML = "";
  const tMax = Math.max(600, ...ttfts);
  for (const v of ttfts) {
    const i = el("i", "", " ");
    i.style.height = Math.max(8, (v / tMax) * 100) + "%";
    tBox.appendChild(i);
  }
  const bBox = byId("sparkBurn");
  bBox.innerHTML = "";
  const bMax = Math.max(20, ...tpss);
  for (const v of tpss) {
    const i = el("i", "", " ");
    i.style.height = Math.max(8, (v / bMax) * 100) + "%";
    bBox.appendChild(i);
  }
  const avgT = ttfts.length ? ttfts.reduce((a, b) => a + b, 0) / ttfts.length : 0;
  byId("ttftVal").textContent = avgT > 0 ? (avgT / 1000).toFixed(2) + "s" : "—";
  byId("burnVal").textContent = tpss.length ? tpss[tpss.length - 1] + " t/s" : "—";
}

function renderStatusbar(): void {
  if (!engStatus) return;
  byId("sbPool").textContent = engStatus.totals.active + "/" + engStatus.keys.length;
  byId("sbRouted").textContent = engStatus.totals.requests_today.toLocaleString();
  byId("sbEvents").textContent = engStatus.totals.events_24h.toLocaleString();
}

function syncTitle(): void {
  const tag = document.getElementById("sitemeta");
  let title = t("chat.pagetitle");
  let desc = "";
  if (tag) {
    try {
      const meta = JSON.parse(tag.textContent ?? "{}") as Record<string, string>;
      title = (getLangSafe() === "zh" ? meta.title_zh : meta.title_en) || title;
      desc = (getLangSafe() === "zh" ? meta.desc_zh : meta.desc_en) || "";
    } catch {
      /* noop */
    }
  }
  document.title = title;
  const md_ = document.querySelector('meta[name="description"]');
  if (md_ && desc) md_.setAttribute("content", desc);
}

function getLangSafe(): string {
  return document.documentElement.lang === "zh-CN" ? "zh" : "en";
}

async function pollStatus(): Promise<void> {
  try {
    const res = await fetch("/api/engine/status");
    if (res.ok) {
      engStatus = (await res.json()) as EngineStatus;
      renderPoolPanel();
      renderStatusbar();
    }
  } catch {
    /* noop */
  }
}

interface SseStart {
  start: boolean;
  quota: { used: number; limit: number };
}

interface SseDelta {
  d: string;
}

interface SseMeta {
  meta: Meta;
}

async function send(text?: string): Promise<void> {
  const input = byId<HTMLTextAreaElement>("input");
  const body = (text ?? input.value).trim();
  if (!body || sending) return;
  if (quota.limit > 0 && quota.used >= quota.limit) {
    notice(t("chat.limit"));
    return;
  }
  const conv = convs[active];
  if (conv.msgs.length === 0) colEl.innerHTML = "";
  conv.msgs.push({ role: "user", text: body });
  conv.title = body.slice(0, 26);
  appendMsg({ role: "user", text: body }, true);
  input.value = "";
  autoGrow();
  sending = true;
  renderConvs();
  const typing = el("div", "m-ai", '<div class="typing"><i></i><i></i><i></i></div>');
  colEl.appendChild(typing);
  scrollBottom();

  const payload = conv.msgs.map((m) => ({ role: m.role, content: m.text }));
  let shell: { wrap: HTMLElement; body: HTMLElement } | null = null;
  let node: Text | null = null;
  let acc = "";
  let meta: Meta | null = null;
  const rawLines: string[] = [];
  let firstAt = 0;
  let streamErr = false;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payload })
    });
    if (res.status === 429) {
      const data: { session_used?: number; session_limit?: number } = await res.json();
      if (typeof data.session_used === "number" && typeof data.session_limit === "number") {
        quota = { day: todayStr(), used: data.session_used, limit: data.session_limit };
        saveQuota();
        updateQuota();
      }
      typing.remove();
      notice(t("chat.limit"));
      return;
    }
    if (res.status === 503) {
      typing.remove();
      notice(t("chat.noKeys"));
      return;
    }
    if (!res.ok || !res.body) {
      typing.remove();
      notice(t("chat.err"));
      return;
    }
    typing.remove();
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          if (data.length > 240) {
            rawLines.push(data.slice(0, 240) + "…");
          } else {
            rawLines.push(data);
          }
          if (rawLines.length > 40) rawLines.shift();
          let parsed: SseStart | SseDelta | SseMeta;
          try {
            parsed = JSON.parse(data) as SseStart | SseDelta | SseMeta;
          } catch {
            continue;
          }
          if ("start" in parsed) {
            quota = { day: todayStr(), used: parsed.quota.used, limit: parsed.quota.limit };
            saveQuota();
            updateQuota();
          } else if ("d" in parsed) {
            if (!node) {
              shell = aiShell();
              node = document.createTextNode("");
              shell.body.appendChild(node);
              shell.body.appendChild(el("span", "cur"));
              firstAt = Date.now();
            }
            acc += parsed.d;
            node.data = acc;
            scrollBottom();
          } else if ("meta" in parsed) {
            meta = parsed.meta;
          }
        }
      }
    }
  } catch {
    streamErr = true;
  } finally {
    sending = false;
  }

  if (!shell) {
    if (streamErr) notice(t("chat.err"));
    return;
  }

  const dur = firstAt > 0 ? (Date.now() - firstAt) / 1000 : 0;
  if (meta?.failover) {
    shell.wrap.insertBefore(failoverLine(meta.failover.from, meta.failover.code), shell.body);
  }
  shell.body.innerHTML = md(acc);
  if (meta) {
    shell.wrap.appendChild(badgeRow(meta, traceSample(rawLines)));
    conv.msgs.push({ role: "assistant", text: acc, meta, trace: traceSample(rawLines) });
    if (meta.ttft_ms > 0) {
      ttfts.push(meta.ttft_ms);
      if (ttfts.length > 12) ttfts.shift();
    }
    if (meta.tokens && dur > 0) {
      tpss.push(Math.round(meta.tokens.out / dur));
      if (tpss.length > 12) tpss.shift();
    }
    if (meta.status === "upstream_error") notice(t("chat.err"));
    else if (meta.status === "empty") notice(t("chat.empty"));
  } else {
    conv.msgs.push({ role: "assistant", text: acc });
  }
  saveConvs();
  renderSpark();
  scrollBottom();
}

const input = byId<HTMLTextAreaElement>("input");

function autoGrow(): void {
  input.style.height = "22px";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
}

input.addEventListener("input", autoGrow);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    void send();
  }
});
byId("sendBtn").addEventListener("click", () => {
  void send();
});
byId("newChat").addEventListener("click", () => {
  if (convs[active].msgs.length === 0) {
    renderMsgs();
    return;
  }
  convs.unshift({ title: "", msgs: [] });
  if (convs.length > 30) convs.pop();
  active = 0;
  saveConvs();
  renderConvs();
  renderMsgs();
});

applyStatic();
initLangToggle("langBtn");
initAdminDoor();
onLang(() => {
  syncTitle();
  renderConvs();
  renderMsgs();
  updateQuota();
  renderPoolPanel();
  renderSpark();
});
syncTitle();
updateQuota();
renderConvs();
renderMsgs();
renderSpark();
void pollStatus();
setInterval(() => {
  void pollStatus();
}, 2000);
