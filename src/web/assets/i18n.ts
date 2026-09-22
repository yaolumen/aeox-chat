export type Lang = "en" | "zh";

let lang: Lang = "en";
try {
  const saved = localStorage.getItem("aeox_lang");
  if (saved === "en" || saved === "zh") lang = saved;
  else if (navigator.language && navigator.language.toLowerCase().startsWith("zh")) lang = "zh";
} catch {
  lang = "en";
}

const DICT: Record<string, [string, string]> = {
  "sb.pool": ["pool", "池"],
  "sb.routed": ["routed today", "今日路由"],
  "sb.events": ["events 24h", "24h 事件"],

  "chat.pagetitle": ["aeox chat — one prompt, many engines", "aeox chat — 一次提问，多引擎响应"],
  "chat.newChat": ["new chat", "新对话"],
  "chat.sessions": ["sessions", "会话"],
  "chat.histSync": ["history sync — coming soon", "历史同步 — 即将上线"],
  "chat.quota": ["quota", "额度"],
  "chat.anon": ["anon session · no account", "匿名会话 · 无需账号"],
  "chat.welcome": ["How can I help?", "有什么可以帮你？"],
  "chat.wline": ["no account · local history · multi-engine routing", "免注册 · 本地历史 · 多引擎路由"],
  "chat.sugg1": ["what is the key engine?", "什么是 Key 引擎？"],
  "chat.sugg1s": ["routing, failover, cooldown", "路由 · 故障转移 · 冷却"],
  "chat.sugg2": ["write a hono sse endpoint", "写一个 Hono SSE 端点"],
  "chat.sugg2s": ["streaming proxy in a few lines", "几行代码的流式代理"],
  "chat.sugg3": ["deepseek vs qwen pricing", "DeepSeek 与 Qwen 定价对比"],
  "chat.sugg3s": ["rough cost per 1M tokens", "每百万 token 成本估算"],
  "chat.sugg4": ["explain sse like i'm five", "用最简单的话讲讲 SSE"],
  "chat.sugg4s": ["server-sent events, gently", "服务端推送事件入门"],
  "chat.ph": ["Ask anything — no account needed", "随便问 — 无需账号"],
  "chat.send": ["send", "发送"],
  "chat.line": ["line", "换行"],
  "chat.attach": ["attach · coming soon", "附件 · 即将上线"],
  "hub.tagNoRetain": ["NO DATA RETENTION", "数据不保存"],
  "hub.privacy": ["no accounts, no chat storage — server keeps only operational logs, auto-purged within 90 days (events last 500, quota 7d)", "无需账号、不存聊天内容 — 服务器仅保留运维日志，90 天内自动清理（事件留 500 条、配额 7 天）"],
  "chat.note": ["beta · tech demo — history stays in your browser, the server stores no chat content · 30 msgs/day · server logs auto-purge (events last 500, usage 90d, quota 7d)", "测试版 · 技术展示 — 历史仅存你的浏览器，服务器不保存任何聊天内容 · 每天 30 条 · 服务器日志自动清理（事件留 500 条、用量 90 天、配额 7 天）"],
  "chat.engine": ["Engine", "引擎"],
  "chat.keypool": ["key pool", "key 池"],
  "chat.ttft": ["ttft · this session", "ttft · 本次会话"],
  "chat.tps": ["tokens/s", "tokens/s"],
  "chat.avg": ["avg", "均值"],
  "chat.now": ["now", "当前"],
  "chat.console": ["engine console →", "引擎控制台 →"],
  "chat.failover": ["failover", "故障转移"],
  "chat.limit": ["daily limit reached — resets tomorrow", "已达每日上限 — 明天重置"],
  "chat.noKeys": ["engine has no available keys — try again later", "引擎暂无可用 Key — 稍后再试"],
  "chat.err": ["request failed — check connection and retry", "请求失败 — 请检查网络后重试"],
  "chat.empty": ["empty response from engine — resend", "引擎返回空响应 — 请重发"],
  "chat.st": ["status", "状态"],
  "chat.cd": ["cooldown", "冷却"],
  "chat.standby": ["standby", "待命"],
  "chat.trace": ["trace", "trace"],

  "eng.pagetitle": ["aeox chat — key engine", "aeox chat — Key 引擎"],
  "eng.title": ["Key engine — live routing", "Key 引擎 — 实时路由"],
  "eng.live": ["LIVE", "LIVE"],
  "eng.strategy": ["strategy: priority", "策略：priority"],
  "eng.stratDesc": ["always drain the highest-priority healthy key first; lower priorities only serve as failover", "永远先消耗优先级最高且健康的 Key；低优先级仅作故障转移"],
  "eng.routed": ["routed today", "今日路由"],
  "eng.events": ["events 24h", "24h 事件"],
  "eng.health": ["pool health", "池健康度"],
  "eng.cooldown": ["in cooldown", "冷却中"],
  "eng.standby": ["standby", "待命"],
  "eng.feed": ["Routing feed", "路由事件流"],
  "eng.autoscroll": ["auto-refresh · 2s", "自动刷新 · 2 秒"],
  "eng.rack": ["Key rack", "Key 机架"],
  "eng.next": ["highlighted = serves next", "高亮 = 下一个服务"],
  "eng.model": ["model", "模型"],
  "eng.step1n": ["01 / SELECT", "01 / 选择"],
  "eng.step1h": ["Pick by priority", "按优先级选取"],
  "eng.step1p": ["The engine always picks the highest-priority healthy key, skipping keys in cooldown or over budget.", "引擎总是选取优先级最高且健康的 Key，自动跳过冷却中或超预算的 Key。"],
  "eng.step2n": ["02 / DETECT", "02 / 识别"],
  "eng.step2h": ["Classify failure", "失败分类"],
  "eng.step2p": ["401/403 disables the key permanently. 429/5xx starts a 60s cooldown and the request retries on the next key before the first token.", "401/403 永久禁用该 Key；429/5xx 触发 60 秒冷却，并在首 token 前换下一个 Key 重试。"],
  "eng.step3n": ["03 / RECOVER", "03 / 自愈"],
  "eng.step3h": ["Self-heal", "自动恢复"],
  "eng.step3p": ["Expired cooldowns rejoin the pool automatically. Monthly budget caps are the final guard.", "冷却到期自动回归 Key 池；月预算是最后一道防线。"],
  "eng.foot": ["public view is masked — no key material is ever exposed", "公开视图已脱敏 — 绝不暴露任何 Key 材料"],
  "eng.cleanup": ["data hygiene: events auto-trimmed to the last 500, usage stats kept 90 days, quota counters kept 7 days — nothing else is stored", "数据治理：事件自动只留最近 500 条，用量统计保留 90 天，配额计数保留 7 天 — 除此之外不存储任何数据"],
  "eng.wait": ["waiting for engine…", "等待引擎数据…"],

  "hub.pagetitle": ["aeox chat — the engine is the interface", "aeox chat — 引擎即界面"],
  "hub.eyebrow": ["// multi-engine ai playground", "// 多引擎 AI 演练场"],
  "hub.h1a": ["The engine is", "引擎，即"],
  "hub.h1b": ["the interface.", "界面。"],
  "hub.sub": [
    "One minimal chat stream, served by a pool of AI keys that route, fail over and self-heal — in public view. No accounts, no tracking; every answer is signed with the engine that produced it.",
    "一条极简聊天流，背后是由多个 AI Key 组成的池：自动路由、故障转移、自我恢复 — 全程公开可见。无需注册，不做追踪；每条回答都带有产出它的引擎签名。"
  ],
  "hub.ctaChat": ["open chat →", "打开聊天 →"],
  "hub.ctaEngine": ["engine console", "引擎控制台"],
  "hub.sparkLabel": ["requests · last 24s", "请求 · 近 24 秒"],
  "hub.explore": ["explore — no account needed", "直接体验 — 无需账号"],
  "hub.open": ["open →", "打开 →"],
  "hub.card1h": ["Chat", "聊天"],
  "hub.card1p": [
    "The customer-facing stream: open layout, block-cursor streaming, inline failover events, badge rows with raw SSE traces — plus the live engine panel on the right.",
    "面向用户的聊天流：开放布局、方块光标流式输出、内联故障转移事件、带原始 SSE 追踪的徽标行 — 右侧还有实时引擎面板。"
  ],
  "hub.card2h": ["Engine console", "引擎控制台"],
  "hub.card2p": [
    "The machine room, full view: routing feed, key rack with cooldown countdowns and the priority strategy — masked for public eyes.",
    "机房全景：路由事件流、带冷却倒计时的 Key 机架与优先级策略 — 公开视图已脱敏。"
  ],
  "hub.how": ["how the engine works", "引擎如何工作"],
  "hub.step1p": [
    "The engine always picks the highest-priority healthy key via <code>priority</code>, skipping keys in cooldown or over budget.",
    "引擎通过 <code>priority</code> 策略永远先选优先级最高且健康的 Key，自动跳过冷却中或超预算的 Key。"
  ],
  "foot.mission": [
    "An independent lab building transparent, browser-native tools across SEO, AI, quant and eastern energy. No bloat, no tracking — view-source and verify.",
    "一个独立实验室，构建横跨 SEO、AI、量化与东方能量的透明浏览器端工具。不臃肿、不追踪 —— view-source 即可验证。"
  ],
  "foot.thisSite": ["This site", "本站"],
  "foot.siteHub": ["Hub", "主页"],
  "foot.siteChat": ["Chat", "聊天"],
  "foot.siteEngine": ["Engine console", "引擎控制台"],
  "foot.siteDemo": ["Concept demo", "概念演示"],
  "foot.netAeox": ["AEOX — AI Answer Engine Diagnostics", "AEOX —— AI 应答引擎诊断"],
  "foot.netAnchor": ["Anchor — Content Automation Engine", "Anchor —— 内容自动化引擎"],
  "foot.netCli": ["aeox-cli — AI Dev Toolbox", "aeox-cli —— AI 开发工具箱"],
  "foot.netChat": ["Chat — Multi-Engine AI Chat", "Chat —— 多引擎 AI 聊天"],
  "foot.netShui": ["Shui — Eastern Energy Reports", "Shui —— 东方能量报告"],
  "foot.resources": ["Resources", "资源"],
  "foot.hubGo": ["AEOX resource hub", "AEOX 资源中心"],
  "foot.premium": ["Premium suite — coming soon", "付费套件 — 即将开放"],
  "foot.bar": [
    "© 2026 AEOX · Chat — Part of the AEOX network · Engine: multi-provider key pool · Runtime: Node.js + Hono · More AEOX resources on <a href=\"https://go.aeox.uk/\" rel=\"noopener\" target=\"_blank\">go.aeox.uk</a> · Premium: coming soon",
    "© 2026 AEOX · Chat — AEOX 网络成员 · 引擎：多 Provider Key 池 · 运行时：Node.js + Hono · 更多资源见 <a href=\"https://go.aeox.uk/\" rel=\"noopener\" target=\"_blank\">go.aeox.uk</a> · 付费套件：即将开放"
  ],

  "adm.pagetitle": ["aeox chat — admin", "aeox chat — 后台"],
  "adm.loginTitle": ["Admin — sign in", "后台 — 登录"],
  "adm.loginHint": ["password only · session lasts 12h", "仅需密码 · 会话保持 12 小时"],
  "adm.password": ["password", "密码"],
  "adm.enter": ["enter", "进入"],
  "adm.badPw": ["wrong password", "密码错误"],
  "adm.rateLimited": ["too many attempts — wait 10 min", "尝试过多 — 请等 10 分钟"],
  "adm.title": ["Key management", "Key 管理"],
  "adm.desc": ["Bind multiple provider keys — the engine routes, fails over and cools down automatically. Keys are encrypted at rest (AES-256-GCM) and never leave the server.", "绑定多家 Provider 的 Key — 引擎自动路由、故障转移与冷却。Key 以 AES-256-GCM 加密落盘，绝不离开服务器。"],
  "adm.statKeys": ["active keys", "可用 Key"],
  "adm.statReq": ["requests · month", "请求 · 本月"],
  "adm.statTok": ["tokens · month", "Token · 本月"],
  "adm.statFov": ["failovers 24h", "故障转移 · 24h"],
  "adm.keys": ["API keys", "API Key"],
  "adm.keysHint": ["priority asc = first choice · budgets are monthly (USD)", "priority 越小越优先 · 预算按月（美元）"],
  "adm.provider": ["provider", "Provider"],
  "adm.keyCol": ["key", "Key"],
  "adm.model": ["model", "模型"],
  "adm.prio": ["prio", "优先级"],
  "adm.status": ["status", "状态"],
  "adm.req": ["req · mo", "请求 · 月"],
  "adm.tok": ["tokens · mo", "Token · 月"],
  "adm.cost": ["cost · mo", "成本 · 月"],
  "adm.budget": ["budget", "预算"],
  "adm.addTitle": ["Add key", "添加 Key"],
  "adm.custom": ["custom…", "自定义…"],
  "adm.baseUrl": ["base url (openai-compatible)", "Base URL（OpenAI 兼容）"],
  "adm.apikey": ["api key", "API Key"],
  "adm.budgetLabel": ["monthly budget · usd (0 = off)", "月预算 · 美元（0 = 关闭）"],
  "adm.add": ["add key", "添加 Key"],
  "adm.addHint": ["Encrypted with AES-256-GCM before it touches the disk. Only the last 4 chars are ever displayed.", "Key 在落盘前以 AES-256-GCM 加密，界面只显示末 4 位。"],
  "adm.test": ["test", "测试"],
  "adm.testing": ["testing…", "测试中…"],
  "adm.enable": ["enable", "启用"],
  "adm.disable": ["disable", "停用"],
  "adm.remove": ["remove", "删除"],
  "adm.removeQ": ["remove this key?", "删除该 Key？"],
  "adm.log": ["Engine log", "引擎日志"],
  "adm.live": ["live · 4s refresh", "实时 · 4 秒刷新"],
  "adm.seo": ["SEO files", "SEO 文件"],
  "adm.seoHint": ["served live at /robots.txt · /sitemap.xml · /llms.txt · /ai.txt · meta injected into the public pages", "实时输出到 /robots.txt · /sitemap.xml · /llms.txt · /ai.txt · meta 注入公开页面"],
  "adm.kb": ["Knowledge base", "知识库"],
  "adm.kbHint": ["injected as the system prompt of every chat request", "作为 system prompt 注入每一次聊天请求"],
  "adm.kbLabel": ["what the assistant knows about aeox — edit freely, save and it takes effect immediately", "助手所掌握的 AEOX 知识 — 自由编辑，保存后立即生效"],
  "adm.kbNote": ["keep it under ~4000 chars · the assistant still answers general questions beyond this", "建议控制在 4000 字内 · 之外的问题助手仍作为通用助手回答"],
  "adm.robots": ["robots.txt", "robots.txt"],
  "adm.sitemap": ["sitemap.xml", "sitemap.xml"],
  "adm.llms": ["llms.txt — LLM site brief (markdown)", "llms.txt — LLM 站点说明（markdown）"],
  "adm.ai": ["ai.txt — AI agent brief (plain text)", "ai.txt — AI 代理简报（纯文本）"],
  "adm.siteMeta": ["site meta", "站点 meta"],
  "adm.titleEn": ["title · en", "标题 · 英文"],
  "adm.titleZh": ["title · zh", "标题 · 中文"],
  "adm.descEn": ["description · en", "描述 · 英文"],
  "adm.descZh": ["description · zh", "描述 · 中文"],
  "adm.save": ["save", "保存"],
  "adm.saved": ["saved", "已保存"],
  "adm.reset": ["reset to default", "恢复默认"],
  "adm.logout": ["logout", "登出"],
  "adm.st.active": ["active", "可用"],
  "adm.st.cooldown": ["cooldown", "冷却"],
  "adm.st.disabled": ["disabled", "已禁用"],
  "adm.st.budget": ["over budget", "超预算"],
  "adm.st.nokey": ["standby", "待命"],
  "adm.nokeyHint": ["add a key", "等待录入 Key"],
  "adm.noauth": ["session expired — sign in again", "会话过期 — 请重新登录"],
  "adm.nokeys": ["no keys yet — add one below", "还没有 Key — 在下方添加"]
};

export function t(key: string): string {
  const e = DICT[key];
  if (!e) return key;
  return lang === "zh" ? e[1] : e[0];
}

export function getLang(): Lang {
  return lang;
}

const listeners: Array<(l: Lang) => void> = [];

export function onLang(fn: (l: Lang) => void): void {
  listeners.push(fn);
  fn(lang);
}

export function applyStatic(): void {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n") ?? "");
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((node) => {
    (node as HTMLInputElement).placeholder = t(node.getAttribute("data-i18n-ph") ?? "");
  });
  document.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = t(node.getAttribute("data-i18n-html") ?? "");
  });
}

export function setLang(l: Lang): void {
  if (l === lang) return;
  lang = l;
  try {
    localStorage.setItem("aeox_lang", l);
  } catch {
    /* noop */
  }
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  applyStatic();
  for (const fn of listeners) fn(l);
}

export function initLangToggle(btnId: string): void {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const label = (): string => (lang === "zh" ? "EN" : "中文");
  btn.textContent = label();
  btn.addEventListener("click", () => {
    setLang(lang === "zh" ? "en" : "zh");
    btn.textContent = label();
  });
}
