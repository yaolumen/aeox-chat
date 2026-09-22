import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
rmSync("public", { recursive: true, force: true });
mkdirSync("public/assets", { recursive: true });

await build({
  entryPoints: ["src/server/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  sourcemap: false,
  logLevel: "info"
});

await build({
  entryPoints: ["src/web/assets/hub.ts", "src/web/assets/chat.ts", "src/web/assets/engine.ts", "src/web/assets/admin.ts"],
  outdir: "public/assets",
  bundle: true,
  format: "esm",
  target: "es2022",
  sourcemap: false,
  logLevel: "info"
});

cpSync("src/web/hub.html", "public/hub.html");
cpSync("src/web/chat.html", "public/chat.html");
cpSync("src/web/engine.html", "public/engine.html");
cpSync("src/web/admin.html", "public/admin.html");
console.log("build ok");
