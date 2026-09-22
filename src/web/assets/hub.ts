import { applyStatic, initLangToggle, t } from "./i18n.ts";
import { initAdminDoor } from "./door.ts";

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function el(tag: string, cls?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
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

let status: EngineStatus | null = null;
const spark: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let lastRouted = -1;

function dotColor(k: EngineKey): string {
  if (k.status === "active") return "var(--up)";
  if (k.status === "cooldown") return "var(--warn)";
  return "var(--down)";
}

function renderKeys(): void {
  const box = byId("wKeys");
  box.innerHTML = "";
  if (!status) return;
  for (const k of status.keys) {
    const row = el("div", "w-key" + (k.status === "active" || k.status === "cooldown" ? "" : " off"));
    const dot = el("i");
    dot.style.background = dotColor(k);
    row.appendChild(dot);
    const name = el("span");
    name.textContent = k.label;
    row.appendChild(name);
    if (k.status === "cooldown") {
      const em = el("em");
      em.textContent = k.cooldown_s + "s";
      row.appendChild(em);
    } else if (k.status !== "active") {
      const em = el("em");
      em.textContent = t("eng.standby");
      row.appendChild(em);
    }
    box.appendChild(row);
  }
}

function renderSpark(): void {
  const box = byId("wSpark");
  box.innerHTML = "";
  for (const v of spark) {
    const bar = el("i");
    bar.style.height = Math.max(6, Math.min(100, v)) + "%";
    box.appendChild(bar);
  }
}

function render(): void {
  if (!status) return;
  byId("sbPool").textContent = status.totals.active + "/" + status.keys.length;
  byId("sbRouted").textContent = status.totals.requests_today.toLocaleString();
  byId("wRouted").textContent = status.totals.requests_today.toLocaleString();
  renderKeys();
  renderSpark();
}

async function poll(): Promise<void> {
  try {
    const res = await fetch("/api/engine/status");
    if (res.ok) {
      status = (await res.json()) as EngineStatus;
      const routed = status.totals.requests_today;
      if (lastRouted >= 0) {
        spark.push(Math.min(100, (routed - lastRouted) * 25));
        spark.shift();
      }
      lastRouted = routed;
      render();
    }
  } catch {
    /* noop */
  }
}

applyStatic();
initLangToggle("langBtn");
initAdminDoor();
byId("sbPool").textContent = "—";
void poll();
window.setInterval(() => {
  void poll();
}, 2000);
