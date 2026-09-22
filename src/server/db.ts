import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defaultAiTxt, defaultLlmsTxt, defaultMeta, defaultRobots, defaultSitemap, defaultSystemPrompt } from "./defaults.ts";

mkdirSync(resolve("data"), { recursive: true });

export const db = new DatabaseSync(resolve("data/aeox-chat.db"));
db.exec("PRAGMA journal_mode = WAL");

export interface KeyRow {
  id: number;
  provider: string;
  base_url: string;
  model: string;
  key_enc: string;
  key_hint: string;
  priority: number;
  status: string;
  monthly_budget_usd: number;
  cooldown_until: number;
  created_at: number;
}

export interface EventRow {
  id: number;
  ts: number;
  type: string;
  key_id: number | null;
  detail: string;
}

db.exec(`
CREATE TABLE IF NOT EXISTS keys(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  key_enc TEXT NOT NULL DEFAULT '',
  key_hint TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'nokey',
  monthly_budget_usd REAL NOT NULL DEFAULT 0,
  cooldown_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS usage_daily(
  key_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(key_id, day)
);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  key_id INTEGER,
  detail TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS quota_session(
  session_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(session_id, day)
);
CREATE TABLE IF NOT EXISTS quota_ip(
  ip TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(ip, day)
);
CREATE TABLE IF NOT EXISTS seo_files(
  name TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS site_meta(
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
`);

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export type BindVal = string | number | null;

export function allRows<T>(sql: string, ...args: BindVal[]): T[] {
  return db.prepare(sql).all(...args) as unknown as T[];
}

export function getRow<T>(sql: string, ...args: BindVal[]): T | undefined {
  return db.prepare(sql).get(...args) as unknown as T | undefined;
}

const now = Date.now();

const keyCount = getRow<{ c: number }>("SELECT COUNT(*) AS c FROM keys") ?? { c: 0 };
if (keyCount.c === 0) {
  const ins = db.prepare("INSERT INTO keys(provider, base_url, model, priority, status, created_at) VALUES(?,?,?,?,?,?)");
  ins.run("deepseek", "https://api.deepseek.com/v1", "deepseek-chat", 10, "nokey", now);
  ins.run("qwen", "https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus", 20, "nokey", now);
  ins.run("nvidia", "https://integrate.api.nvidia.com/v1", "meta/llama-3.3-70b-instruct", 30, "nokey", now);
  ins.run("groq", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", 40, "nokey", now);
  ins.run("openrouter", "https://openrouter.ai/api/v1", "", 50, "nokey", now);
}

const seedSeo = db.prepare("INSERT OR IGNORE INTO seo_files(name, content, updated_at) VALUES(?,?,?)");
seedSeo.run("robots.txt", defaultRobots(), now);
seedSeo.run("sitemap.xml", defaultSitemap(), now);
seedSeo.run("llms.txt", defaultLlmsTxt(), now);
seedSeo.run("ai.txt", defaultAiTxt(), now);

const seedMeta = db.prepare("INSERT OR IGNORE INTO site_meta(k, v) VALUES(?,?)");
for (const [k, v] of Object.entries(defaultMeta())) seedMeta.run(k, v);
seedMeta.run("system_prompt", defaultSystemPrompt());

export function pruneData(): void {
  const cutoffStats = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const cutoffQuota = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  db.prepare("DELETE FROM usage_daily WHERE day < ?").run(cutoffStats);
  db.prepare("DELETE FROM quota_session WHERE day < ?").run(cutoffQuota);
  db.prepare("DELETE FROM quota_ip WHERE day < ?").run(cutoffQuota);
}

pruneData();
