import { applyStatic, initLangToggle, onLang, t } from "./i18n.ts";
import { initAdminDoor } from "./door.ts";

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
  totals: { active: number; cooldown: number; standby: number; requests_today: number; events_24h: number };
  ts: number;
}

interface EngineEvent {
  ts: number;
  type: string;
  text: string;
}

let status: EngineStatus | null = null;
let events: EngineEvent[] = [];
let firstLoad = true;

function syncTitle(): void {
  document.title = t("eng.pagetitle");
}

function statusText(k: EngineKey): { dot: string; text: string; off: boolean } {
  if (k.status === "active") return { dot: "up", text: "ok", off: false };
  if (k.status === "cooldown") return { dot: "warn", text: k.cooldown_s + "s", off: false };
  if (k.status === "standby") return { dot: "down", text: t("eng.standby"), off: true };
  return { dot: "down", text: k.status, off: true };
}

function renderRack(): void {
  const box = byId("rack");
  box.innerHTML = "";
  if (!status) return;
  const nextLabel = status.keys.find((k) => k.status === "active")?.label ?? "";
  for (const k of status.keys) {
    const s = statusText(k);
    const isNext = k.label === nextLabel;
    const d = el("div", "kcard" + (isNext ? " next" : "") + (s.off ? " off" : ""));
    const meta = k.status === "cooldown"
      ? '<span class="cd">' + t("adm.st.cooldown") + " " + k.cooldown_s + "s</span>"
      : s.off
        ? "<span>" + s.text + "</span>"
        : "<span>ok</span>";
    d.innerHTML =
      (isNext ? '<div class="next-tag mono">NEXT</div>' : "") +
      '<div class="prov"><i class="kdot ' + s.dot + '"></i>' + k.label + "</div>" +
      '<div class="kk">' + (k.model ? k.model : "—") + "</div>" +
      '<div class="meta mono">' + meta + "<span>" + t("eng.model") + "</span></div>";
    box.appendChild(d);
  }
}

function renderStats(): void {
  if (!status) return;
  byId("sbPool").textContent = status.totals.active + "/" + status.keys.length;
  byId("sbRouted").textContent = status.totals.requests_today.toLocaleString();
  byId("sbEvents").textContent = status.totals.events_24h.toLocaleString();
  byId("stRouted").textContent = status.totals.requests_today.toLocaleString();
  byId("stEvents").textContent = status.totals.events_24h.toLocaleString();
  byId("stPool").innerHTML = status.totals.active + "<small>/" + status.keys.length + "</small>";
  byId("stCool").textContent = String(status.totals.cooldown);
  byId("stStandby").textContent = String(status.totals.standby);
}

function renderFeed(): void {
  const feed = byId("feed");
  feed.innerHTML = "";
  if (events.length === 0) {
    if (firstLoad) feed.appendChild(el("div", "frow", '<span class="fm">' + t("eng.wait") + "</span>"));
    return;
  }
  const shown = events.slice(0, 30);
  for (const ev of shown) {
    const time = new Date(ev.ts).toTimeString().slice(0, 8);
    feed.appendChild(
      el("div", "frow", '<span class="ft">' + time + '</span><span class="fk ' + ev.type + '">' + ev.type.toUpperCase() + '</span><span class="fm">' + ev.text + "</span>")
    );
  }
}

async function poll(): Promise<void> {
  try {
    const [sRes, eRes] = await Promise.all([fetch("/api/engine/status"), fetch("/api/engine/events")]);
    if (sRes.ok) {
      status = (await sRes.json()) as EngineStatus;
      renderStats();
      renderRack();
    }
    if (eRes.ok) {
      const data = (await eRes.json()) as { events: EngineEvent[] };
      events = data.events;
      firstLoad = false;
      renderFeed();
    }
  } catch {
    /* noop */
  }
}

applyStatic();
initLangToggle("langBtn");
initAdminDoor();
onLang(() => {
  syncTitle();
  renderRack();
  renderFeed();
});
syncTitle();
void poll();
setInterval(() => {
  void poll();
}, 2000);
