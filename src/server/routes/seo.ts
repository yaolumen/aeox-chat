import { Hono } from "hono";
import { getRow } from "../db.ts";
import { defaultAiTxt, defaultLlmsTxt, defaultRobots, defaultSitemap } from "../defaults.ts";

export const seo = new Hono();

function seoFile(name: string, fallback: string): string {
  const row = getRow<{ content: string }>("SELECT content FROM seo_files WHERE name=?", name);
  return row?.content ?? fallback;
}

seo.get("/robots.txt", (c) => c.body(seoFile("robots.txt", defaultRobots()), 200, { "content-type": "text/plain; charset=utf-8" }));
seo.get("/sitemap.xml", (c) => c.body(seoFile("sitemap.xml", defaultSitemap()), 200, { "content-type": "application/xml; charset=utf-8" }));
seo.get("/llms.txt", (c) => c.body(seoFile("llms.txt", defaultLlmsTxt()), 200, { "content-type": "text/markdown; charset=utf-8" }));
seo.get("/ai.txt", (c) => c.body(seoFile("ai.txt", defaultAiTxt()), 200, { "content-type": "text/plain; charset=utf-8" }));
