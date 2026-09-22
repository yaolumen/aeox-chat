import { applyStatic, initLangToggle, onLang, t } from "./i18n.ts";

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function mkBtn(cls: string, text: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = cls;
  b.type = "button";
  b.textContent = text;
  return b;
}

interface Usage {
  requests: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

interface KeyOut {
  id: number;
  provider: string;
  base_url: string;
  model: string;
  key_hint: string;
  priority: number;
  status: string;
  cooldown_until: number;
  monthly_budget_usd: number;
  label: string;
  usage: Usage;
}

interface AdminEvent {
  id: number;
  ts: number;
  type: string;
  key_id: number | null;
  detail: Record<string, unknown>;
}

interface SeoData {
  files: Record<string, string>;
  meta: Record<string, string>;
  system_prompt: string;
}

const PRESETS: Record<string, { base_url: string; model: string }> = {
  deepseek: { base_url: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  qwen: { base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  nvidia: { base_url: "https://integrate.api.nvidia.com/v1", model: "meta/llama-3.3-70b-instruct" },
  groq: { base_url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  openrouter: { base_url: "https://openrouter.ai/api/v1", model: "" },
  "agnes-ai.cn": { base_url: "", model: "" },
  "agnes-ai.com": { base_url: "", model: "" },
  "unorouter.com": { base_url: "", model: "" },
  amd: { base_url: "", model: "" }
};

let keys: KeyOut[] = [];
let events: AdminEvent[] = [];
let loggedIn = false;
let pollTimer: number | null = null;

function fmtTok(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function showLogin(msg?: string): void {
  loggedIn = false;
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  byId("loginView").style.display = "flex";
  byId("appView").style.display = "none";
  const err = byId("loginErr");
  err.textContent = msg ?? "";
  byId<HTMLInputElement>("loginPw").value = "";
  byId<HTMLInputElement>("loginPw").focus();
}

function showApp(): void {
  loggedIn = true;
  byId("loginView").style.display = "none";
  byId("appView").style.display = "block";
  if (pollTimer === null) {
    pollTimer = window.setInterval(() => {
      void refreshData();
    }, 4000);
  }
  void refreshData();
  void loadSeo();
}

async function refreshData(): Promise<void> {
  if (!loggedIn) return;
  try {
    const [kRes, eRes] = await Promise.all([fetch("/admin/api/keys"), fetch("/admin/api/events")]);
    if (kRes.status === 401 || eRes.status === 401) {
      showLogin(t("adm.noauth"));
      return;
    }
    if (kRes.ok) {
      const data = (await kRes.json()) as { keys: KeyOut[] };
      keys = data.keys;
      renderTable();
      renderStats();
    }
    if (eRes.ok) {
      const data = (await eRes.json()) as { events: AdminEvent[] };
      events = data.events;
      renderLog();
    }
  } catch {
    /* noop */
  }
}

function statusCell(k: KeyOut): string {
  if (k.status === "active") return '<span class="st active"><i></i>' + t("adm.st.active") + "</span>";
  if (k.status === "cooldown") {
    const s = Math.max(0, Math.ceil((k.cooldown_until - Date.now()) / 1000));
    return '<span class="st cooldown"><i></i>' + t("adm.st.cooldown") + " <small>" + s + "s</small></span>";
  }
  if (k.status === "budget") return '<span class="st cooldown"><i></i>' + t("adm.st.budget") + "</span>";
  if (k.status === "nokey") return '<span class="st nokey"><i></i>' + t("adm.st.nokey") + " <small>" + t("adm.nokeyHint") + "</small></span>";
  return '<span class="st disabled"><i></i>' + t("adm.st.disabled") + "</span>";
}

function renderTable(): void {
  const tb = byId("keyRows");
  tb.innerHTML = "";
  if (keys.length === 0) {
    tb.appendChild(el("tr", "", '<td colspan="9" class="empty-row">' + t("adm.nokeys") + "</td>"));
    return;
  }
  for (const k of keys) {
    const tr = document.createElement("tr");
    const budgetCell = k.monthly_budget_usd > 0
      ? '<span class="bar"><i style="width:' + Math.min(100, (k.usage.cost_usd / k.monthly_budget_usd) * 100) + '%"></i></span><span class="budg">$' + k.usage.cost_usd.toFixed(2) + "/$" + k.monthly_budget_usd + "</span>"
      : '<span class="budg">—</span>';
    tr.innerHTML =
      "<td><b>" + k.provider + "</b></td>" +
      '<td class="kkey">' + (k.key_hint ? "… " + k.key_hint : "—") + "</td>" +
      '<td class="kkey">' + (k.model || "—") + "</td>" +
      '<td class="mono">P' + k.priority + "</td>" +
      "<td>" + statusCell(k) + "</td>" +
      '<td class="mono">' + k.usage.requests.toLocaleString() + "</td>" +
      '<td class="hide-sm mono">' + fmtTok(k.usage.tokens_in + k.usage.tokens_out) + "</td>" +
      '<td class="hide-sm mono">$' + k.usage.cost_usd.toFixed(2) + "</td>" +
      "<td>" + budgetCell + "</td>" +
      '<td class="acts"></td>';
    const acts = tr.querySelector(".acts") as HTMLElement;
    const testBtn = mkBtn("abtn", t("adm.test"));
    testBtn.addEventListener("click", () => {
      void testKey(k.id, testBtn);
    });
    acts.appendChild(testBtn);
    if (k.status !== "nokey") {
      const toggleBtn = mkBtn("abtn", k.status === "disabled" || k.status === "budget" ? t("adm.enable") : t("adm.disable"));
      toggleBtn.addEventListener("click", () => {
        void toggleKey(k);
      });
      acts.appendChild(toggleBtn);
    }
    const rmBtn = mkBtn("abtn danger", t("adm.remove"));
    rmBtn.addEventListener("click", () => {
      void removeKey(k);
    });
    acts.appendChild(rmBtn);
    tb.appendChild(tr);
  }
}

function renderStats(): void {
  const active = keys.filter((k) => k.status === "active" || k.status === "cooldown").length;
  const req = keys.reduce((a, k) => a + k.usage.requests, 0);
  const tok = keys.reduce((a, k) => a + k.usage.tokens_in + k.usage.tokens_out, 0);
  const dayAgo = Date.now() - 86_400_000;
  const fov = events.filter((e) => e.type === "cooldown" && e.ts > dayAgo).length;
  byId("statKeys").innerHTML = active + "<small>/" + keys.length + "</small>";
  byId("statReq").textContent = req.toLocaleString();
  byId("statTok").textContent = fmtTok(tok);
  byId("statFov").textContent = String(fov);
  byId("sbPool").textContent = active + "/" + keys.length;
}

function eventText(e: AdminEvent): string {
  const d = e.detail;
  const label = typeof d.label === "string" ? d.label : "";
  if (e.type === "route") {
    return label + " · " + (typeof d.model === "string" ? d.model : "") + " · " + String(d.ttft_ms ?? "?") + "ms";
  }
  if (e.type === "cooldown") return label + " " + t("adm.st.cooldown") + " " + String(d.ms ?? 60000) + "ms · " + String(d.code ?? "");
  if (e.type === "disabled") return label + " " + t("adm.st.disabled") + " · " + String(d.code ?? "");
  if (e.type === "recovered") return label + " recovered";
  if (e.type === "budget") return label + " " + t("adm.st.budget");
  return e.type;
}

function renderLog(): void {
  const log = byId("log");
  log.innerHTML = "";
  for (const e of events.slice(0, 30)) {
    const time = new Date(e.ts).toTimeString().slice(0, 8);
    log.appendChild(
      el("div", "log-row", '<span class="log-t">' + time + '</span><span class="log-k ' + e.type + '">' + e.type.toUpperCase() + '</span><span class="log-m">' + eventText(e) + "</span>")
    );
  }
}

async function testKey(id: number, btn: HTMLButtonElement): Promise<void> {
  btn.textContent = t("adm.testing");
  btn.disabled = true;
  try {
    const res = await fetch("/admin/api/keys/" + id + "/test", { method: "POST" });
    const data: { ok?: boolean; latency_ms?: number; status?: number; models?: number } = await res.json();
    if (data.ok) {
      btn.textContent = data.latency_ms + "ms · " + String(data.models ?? "?") + " models";
    } else {
      btn.textContent = String(data.status ?? "err");
    }
  } catch {
    btn.textContent = "network err";
  }
  btn.disabled = false;
  window.setTimeout(() => {
    btn.textContent = t("adm.test");
  }, 2600);
}

async function toggleKey(k: KeyOut): Promise<void> {
  const next = k.status === "disabled" || k.status === "budget" ? "active" : "disabled";
  await fetch("/admin/api/keys/" + k.id, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: next })
  });
  await refreshData();
}

async function removeKey(k: KeyOut): Promise<void> {
  if (!window.confirm(t("adm.removeQ") + " (" + k.label + ")")) return;
  await fetch("/admin/api/keys/" + k.id, { method: "DELETE" });
  await refreshData();
}

function fillPreset(): void {
  const sel = byId<HTMLSelectElement>("fProvider");
  const preset = PRESETS[sel.value];
  byId<HTMLInputElement>("fBaseUrl").value = preset ? preset.base_url : "";
  byId<HTMLInputElement>("fModel").value = preset ? preset.model : "";
  const nameRow = byId("nameRow");
  nameRow.style.display = sel.value === "custom" ? "block" : "none";
}

async function addKey(): Promise<void> {
  const sel = byId<HTMLSelectElement>("fProvider");
  const provider = sel.value === "custom" ? byId<HTMLInputElement>("fName").value.trim() : sel.value;
  const base_url = byId<HTMLInputElement>("fBaseUrl").value.trim();
  const model = byId<HTMLInputElement>("fModel").value.trim();
  const key = byId<HTMLInputElement>("fKey").value.trim();
  const priority = Number(byId<HTMLInputElement>("fPrio").value) || 100;
  const budget = Number(byId<HTMLInputElement>("fBudget").value) || 0;
  if (!provider || !base_url || !key) {
    byId("addErr").textContent = provider ? (base_url ? "key" : "base url") : "provider";
    return;
  }
  byId("addErr").textContent = "";
  const res = await fetch("/admin/api/keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider, base_url, model, key, priority, monthly_budget_usd: budget })
  });
  if (res.ok) {
    byId<HTMLInputElement>("fKey").value = "";
    await refreshData();
  } else {
    byId("addErr").textContent = "invalid input";
  }
}

async function loadSeo(): Promise<void> {
  try {
    const res = await fetch("/admin/api/seo");
    if (!res.ok) return;
    const data = (await res.json()) as SeoData;
    byId<HTMLTextAreaElement>("seoRobots").value = data.files["robots.txt"] ?? "";
    byId<HTMLTextAreaElement>("seoSitemap").value = data.files["sitemap.xml"] ?? "";
    byId<HTMLTextAreaElement>("seoLlms").value = data.files["llms.txt"] ?? "";
    byId<HTMLTextAreaElement>("seoAi").value = data.files["ai.txt"] ?? "";
    byId<HTMLInputElement>("metaTitleEn").value = data.meta.title_en ?? "";
    byId<HTMLInputElement>("metaTitleZh").value = data.meta.title_zh ?? "";
    byId<HTMLInputElement>("metaDescEn").value = data.meta.desc_en ?? "";
    byId<HTMLInputElement>("metaDescZh").value = data.meta.desc_zh ?? "";
    byId<HTMLTextAreaElement>("kbText").value = data.system_prompt ?? "";
  } catch {
    /* noop */
  }
}

async function saveSeo(): Promise<void> {
  const res = await fetch("/admin/api/seo", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      robots: byId<HTMLTextAreaElement>("seoRobots").value,
      sitemap: byId<HTMLTextAreaElement>("seoSitemap").value,
      llms: byId<HTMLTextAreaElement>("seoLlms").value,
      ai: byId<HTMLTextAreaElement>("seoAi").value,
      meta: {
        title_en: byId<HTMLInputElement>("metaTitleEn").value,
        title_zh: byId<HTMLInputElement>("metaTitleZh").value,
        desc_en: byId<HTMLInputElement>("metaDescEn").value,
        desc_zh: byId<HTMLInputElement>("metaDescZh").value
      }
    })
  });
  if (res.ok) {
    const btn = byId("seoSave");
    btn.textContent = t("adm.saved");
    window.setTimeout(() => {
      btn.textContent = t("adm.save");
    }, 1800);
  }
}

async function resetSeo(): Promise<void> {
  await fetch("/admin/api/seo/reset", { method: "POST" });
  await loadSeo();
}

async function saveKb(): Promise<void> {
  const res = await fetch("/admin/api/seo", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system_prompt: byId<HTMLTextAreaElement>("kbText").value })
  });
  if (res.ok) {
    const btn = byId("kbSave");
    btn.textContent = t("adm.saved");
    window.setTimeout(() => {
      btn.textContent = t("adm.save");
    }, 1800);
  }
}

async function resetKb(): Promise<void> {
  await fetch("/admin/api/kb/reset", { method: "POST" });
  await loadSeo();
}

async function login(): Promise<void> {
  const pw = byId<HTMLInputElement>("loginPw").value;
  if (!pw) return;
  const res = await fetch("/admin/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: pw })
  });
  if (res.ok) {
    showApp();
    return;
  }
  if (res.status === 429) {
    byId("loginErr").textContent = t("adm.rateLimited");
    return;
  }
  byId("loginErr").textContent = t("adm.badPw");
}

async function logout(): Promise<void> {
  await fetch("/admin/api/logout", { method: "POST" });
  showLogin();
}

async function checkAuth(): Promise<void> {
  try {
    const res = await fetch("/admin/api/keys");
    if (res.ok) showApp();
    else showLogin();
  } catch {
    showLogin();
  }
}

byId("loginBtn").addEventListener("click", () => {
  void login();
});
byId("loginPw").addEventListener("keydown", (e) => {
  if (e.key === "Enter") void login();
});
byId("logoutBtn").addEventListener("click", () => {
  void logout();
});
byId("fProvider").addEventListener("change", fillPreset);
byId("addBtn").addEventListener("click", () => {
  void addKey();
});
byId("seoSave").addEventListener("click", () => {
  void saveSeo();
});
byId("seoReset").addEventListener("click", () => {
  void resetSeo();
});
byId("kbSave").addEventListener("click", () => {
  void saveKb();
});
byId("kbReset").addEventListener("click", () => {
  void resetKb();
});

const providerSel = byId<HTMLSelectElement>("fProvider");
for (const name of Object.keys(PRESETS)) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  providerSel.appendChild(opt);
}
const customOpt = document.createElement("option");
customOpt.value = "custom";
customOpt.textContent = t("adm.custom");
providerSel.appendChild(customOpt);
fillPreset();

applyStatic();
initLangToggle("langBtn");
onLang(() => {
  document.title = t("adm.pagetitle");
  customOpt.textContent = t("adm.custom");
  renderTable();
  renderStats();
  renderLog();
});
document.title = t("adm.pagetitle");
void checkAuth();
