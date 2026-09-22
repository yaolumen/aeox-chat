import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.ts";
import { allRows, pruneData } from "./db.ts";
import { defaultMeta } from "./defaults.ts";
import { chat } from "./routes/chat.ts";
import { enginePublic } from "./routes/enginePublic.ts";
import { seo } from "./routes/seo.ts";
import { adminAuth, requireAdmin } from "./routes/adminAuth.ts";
import { adminKeys } from "./routes/adminKeys.ts";
import { adminSeo } from "./routes/adminSeo.ts";

const missing: string[] = [];
if (!config.adminPassword) missing.push("ADMIN_PASSWORD");
if (!config.masterKey) missing.push("MASTER_KEY");
if (!config.sessionSecret) missing.push("SESSION_SECRET");
if (missing.length > 0) {
  console.error("missing env: " + missing.join(", "));
  process.exit(1);
}

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.header("x-content-type-options", "nosniff");
  c.header("referrer-policy", "strict-origin-when-cross-origin");
});

app.route("/", chat);
app.route("/", enginePublic);
app.route("/", seo);
app.route("/", adminAuth);
app.use("/admin/api/*", requireAdmin);
app.route("/", adminKeys);
app.route("/", adminSeo);

function readHtml(name: string): string {
  for (const dir of ["public", "src/web"]) {
    try {
      return readFileSync(resolve(dir, name), "utf8");
    } catch {
      continue;
    }
  }
  throw new Error("missing html: " + name);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function siteMeta(): Record<string, string> {
  const meta: Record<string, string> = { ...defaultMeta() };
  const rows = allRows<{ k: string; v: string }>("SELECT k, v FROM site_meta");
  for (const r of rows) meta[r.k] = r.v;
  return meta;
}

function headTags(): string {
  const meta = siteMeta();
  return [
    '<meta name="description" content="' + esc(meta.desc_en) + '">',
    '<meta property="og:title" content="' + esc(meta.title_en) + '">',
    '<meta property="og:description" content="' + esc(meta.desc_en) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:url" content="' + esc(config.baseUrl) + '/">',
    "<title>" + esc(meta.title_en) + "</title>",
    '<script type="application/json" id="sitemeta">' + JSON.stringify(meta).replace(/</g, "\\u003c") + "</script>"
  ].join("\n    ");
}

app.get("/", (c) => {
  const html = readHtml("hub.html").replace("<!--META-->", () => headTags());
  return c.html(html);
});

app.get("/chat", (c) => {
  const html = readHtml("chat.html").replace("<!--META-->", () => headTags());
  return c.html(html);
});

app.get("/engine", (c) => c.body(readHtml("engine.html"), 200, { "content-type": "text/html; charset=utf-8" }));
app.get("/admin", (c) => c.body(readHtml("admin.html"), 200, { "content-type": "text/html; charset=utf-8" }));

app.use("/assets/*", serveStatic({ root: "./public" }));

const DEMO_PAGES = ["index.html", "chat.html", "engine.html", "admin.html"];
const DEMO_BANNER =
  '<div style="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;' +
  "background:rgba(245,158,11,.13);border:2px solid #f59e0b;border-radius:99px;padding:9px 12px 9px 16px;" +
  'box-shadow:0 0 24px rgba(245,158,11,.45),0 8px 32px rgba(0,0,0,.55);font-family:Geist Mono,Consolas,monospace;font-size:11.5px;white-space:nowrap;">' +
  '<span style="width:9px;height:9px;border-radius:50%;background:#f59e0b;display:inline-block;flex-shrink:0;animation:aeoxdemo 1.4s infinite;"></span>' +
  '<span style="color:#fbbf24;font-weight:600;letter-spacing:.8px;">CONCEPT DEMO · 概念演示 — simulated data</span>' +
  '<a href="/" style="color:#fff;text-decoration:none;background:#f59e0b;border-radius:99px;padding:4px 13px;font-weight:700;margin-left:2px;">live site / 返回线上 →</a>' +
  "</div>" +
  "<style>@keyframes aeoxdemo{0%,100%{opacity:1}50%{opacity:.25}}</style>";

app.get("/demo/*", (c) => {
  const name = c.req.path.slice("/demo/".length);
  if (!DEMO_PAGES.includes(name)) return c.notFound();
  const html = readFileSync(resolve("demo", name), "utf8");
  return c.html(html.replace("</body>", DEMO_BANNER + "</body>"));
});
app.get("/demo", (c) => c.redirect("/demo/index.html"));

app.notFound((c) => c.text("not found", 404));

serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log("aeox-chat listening on " + info.address + ":" + info.port);
});

setInterval(() => {
  pruneData();
}, 24 * 60 * 60 * 1000).unref();
