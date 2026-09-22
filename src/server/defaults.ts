import { config } from "./config.ts";

export function defaultRobots(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /demo",
    "",
    "Sitemap: " + config.baseUrl + "/sitemap.xml",
    ""
  ].join("\n");
}

export function defaultSitemap(): string {
  const base = config.baseUrl;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "  <url><loc>" + base + '/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n' +
    "  <url><loc>" + base + '/chat</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n' +
    "  <url><loc>" + base + '/engine</loc><changefreq>daily</changefreq><priority>0.6</priority></url>\n' +
    "</urlset>\n"
  );
}

export function defaultLlmsTxt(): string {
  const base = config.baseUrl;
  return [
    "# " + config.baseUrl.replace(/^https?:\/\//, ""),
    "",
    "> Multi-engine AI chat by AEOX Lab: one prompt routed across DeepSeek, Qwen, NVIDIA, Groq and other OpenAI-compatible providers with automatic failover, cooldown and budget control. No account, no data retention. Beta tech demo.",
    "",
    "aeox chat aggregates multiple OpenAI-compatible AI providers behind a server-side key pool. Anonymous visitors get a daily quota; conversation history stays in the browser; the server stores no chat content and auto-purges operational logs (events last 500, usage 90 days, quota 7 days). Each answer is signed with the provider, model and key that produced it. The engine state is publicly visible in a masked console.",
    "",
    "## Pages",
    "",
    "- [Home](" + base + "/): landing page with live engine widget and how-it-works",
    "- [Chat](" + base + "/chat): the chat interface, bilingual (English / 中文)",
    "- [Engine console](" + base + "/engine): masked public view of key-pool routing and events",
    "",
    "## Files",
    "",
    "- [robots.txt](" + base + "/robots.txt): crawler directives",
    "- [sitemap.xml](" + base + "/sitemap.xml): site map",
    "- [ai.txt](" + base + "/ai.txt): plain-text site brief for AI agents",
    "",
    "## Policies",
    "",
    "- No accounts, no tracking, no server-side chat retention",
    "- /demo pages are static concept demos with simulated data, excluded from crawling",
    "- Part of the AEOX family: https://aeox.uk/",
    ""
  ].join("\n");
}

export function defaultAiTxt(): string {
  const base = config.baseUrl;
  return [
    "# aeox chat — site brief for AI agents",
    "",
    "Site: " + config.baseUrl,
    "Type: multi-engine AI chat (beta tech demo by AEOX Lab, https://aeox.uk/)",
    "",
    "What it is:",
    "An anonymous AI chat that routes one prompt across multiple OpenAI-compatible",
    "providers (DeepSeek, Qwen, NVIDIA NIM, Groq, OpenRouter and more) via a",
    "server-side key pool with automatic failover, 60s cooldowns and monthly budgets.",
    "Each answer is signed with provider, model, key ordinal and latency.",
    "",
    "Key pages:",
    "- " + base + "/ — landing page",
    "- " + base + "/chat — chat interface",
    "- " + base + "/engine — masked engine console (public)",
    "",
    "Data policy:",
    "- No account required; daily quota per session and per IP",
    "- Chat history stays in the visitor's browser; the server stores no chat content",
    "- Operational logs auto-purge: events keep last 500, usage 90 days, quota 7 days",
    "",
    "Machine files:",
    "- " + base + "/robots.txt",
    "- " + base + "/sitemap.xml",
    "- " + base + "/llms.txt",
    ""
  ].join("\n");
}

export function defaultMeta(): Record<string, string> {
  return {
    title_en: "aeox chat — one prompt, many engines",
    title_zh: "aeox chat — 一次提问，多引擎响应",
    desc_en: "A developer-first AI chat that routes your prompt across DeepSeek, Qwen, NVIDIA, Groq and more with automatic failover.",
    desc_zh: "开发者向 AI 聊天：一次提问，在 DeepSeek、Qwen、NVIDIA、Groq 等多引擎间自动路由与故障转移。"
  };
}

export function defaultSystemPrompt(): string {
  return [
    "You are the assistant of AEOX (https://aeox.uk/) — an independent lab building transparent, browser-native tools across SEO, AI, quant and eastern energy. No bloat, no tracking.",
    "This site is chat.aeox.uk — a multi-engine AI chat: it aggregates multiple OpenAI-compatible providers behind a server-side key pool with automatic routing, failover, cooldown and budget control. No account is needed; each answer is signed with the provider, model and key that produced it. The public engine console is at /engine; the admin back-office is not part of public knowledge.",
    "AEOX family sites:",
    "- aeox.uk — AI Answer Engine Diagnostics (flagship)",
    "- anchor.aeox.uk — Content Automation Engine",
    "- cli.aeox.uk — AI Dev Toolbox",
    "- chat.aeox.uk — Multi-Engine AI Chat (this site)",
    "- quant.aeox.uk — Crypto Indicator Dashboard",
    "- shui.aeox.uk — Eastern Energy Reports",
    "- go.aeox.uk — free resources hub",
    "When users ask about AEOX, its products or this site, answer based on the knowledge above (plus anything added by the site owner below). For anything else, answer as a capable general assistant. Always respond in the user's language."
  ].join("\n");
}
