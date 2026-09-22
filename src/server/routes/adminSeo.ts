import { Hono } from "hono";
import { allRows, db } from "../db.ts";
import { defaultAiTxt, defaultLlmsTxt, defaultMeta, defaultRobots, defaultSitemap, defaultSystemPrompt } from "../defaults.ts";

export const adminSeo = new Hono();

const META_KEYS = ["title_en", "title_zh", "desc_en", "desc_zh"];

adminSeo.get("/admin/api/seo", (c) => {
  const rows = allRows<{ name: string; content: string }>("SELECT name, content FROM seo_files");
  const metaRows = allRows<{ k: string; v: string }>("SELECT k, v FROM site_meta");
  const files: Record<string, string> = {};
  for (const r of rows) files[r.name] = r.content;
  const meta: Record<string, string> = { ...defaultMeta() };
  for (const r of metaRows) meta[r.k] = r.v;
  return c.json({ files, meta, system_prompt: meta["system_prompt"] ?? "" });
});

adminSeo.put("/admin/api/seo", async (c) => {
  const body = await c.req.json().catch(() => null) as { robots?: unknown; sitemap?: unknown; ai?: unknown; llms?: unknown; meta?: unknown; system_prompt?: unknown } | null;
  const nowMs = Date.now();
  if (typeof body?.robots === "string") {
    db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
      .run("robots.txt", body.robots.slice(0, 20_000), nowMs);
  }
  if (typeof body?.sitemap === "string") {
    db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
      .run("sitemap.xml", body.sitemap.slice(0, 50_000), nowMs);
  }
  if (typeof body?.llms === "string") {
    db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
      .run("llms.txt", body.llms.slice(0, 20_000), nowMs);
  }
  if (typeof body?.ai === "string") {
    db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
      .run("ai.txt", body.ai.slice(0, 20_000), nowMs);
  }
  if (body?.meta && typeof body.meta === "object") {
    const m = body.meta as Record<string, unknown>;
    for (const k of META_KEYS) {
      if (typeof m[k] === "string") {
        db.prepare("INSERT INTO site_meta(k, v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, (m[k] as string).slice(0, 300));
      }
    }
  }
  if (typeof body?.system_prompt === "string") {
    db.prepare("INSERT INTO site_meta(k, v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run("system_prompt", body.system_prompt.slice(0, 8000));
  }
  return c.json({ ok: true });
});

adminSeo.post("/admin/api/seo/reset", (c) => {
  const nowMs = Date.now();
  db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
    .run("robots.txt", defaultRobots(), nowMs);
  db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
    .run("sitemap.xml", defaultSitemap(), nowMs);
  db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
    .run("llms.txt", defaultLlmsTxt(), nowMs);
  db.prepare("INSERT INTO seo_files(name, content, updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at")
    .run("ai.txt", defaultAiTxt(), nowMs);
  for (const [k, v] of Object.entries(defaultMeta())) {
    db.prepare("INSERT INTO site_meta(k, v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, v);
  }
  return c.json({ ok: true });
});

adminSeo.post("/admin/api/kb/reset", (c) => {
  db.prepare("INSERT INTO site_meta(k, v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run("system_prompt", defaultSystemPrompt());
  return c.json({ ok: true });
});
