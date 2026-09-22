import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(): void {
  const p = resolve(".env");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadDotEnv();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  baseUrl: (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  masterKey: process.env.MASTER_KEY ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? ""
};
