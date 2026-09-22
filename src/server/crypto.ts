import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "./config.ts";

const SALT = "aeox-chat-static-salt";
let master: Buffer | null = null;

function masterKey(): Buffer {
  if (!master) master = scryptSync(config.masterKey, SALT, 32);
  return master;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), data.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

export function decryptSecret(stored: string): string | null {
  try {
    const [iv, data, tag] = stored.split(".");
    const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function sign(value: string): string {
  return createHmac("sha256", config.sessionSecret).update(value).digest("base64url");
}

export function verifySigned(value: string | undefined, signature: string | undefined): string | null {
  if (!value || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(value));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function verifyPassword(pw: string): boolean {
  if (!config.adminPassword) return false;
  const a = Buffer.from(sign("admin:" + pw));
  const b = Buffer.from(sign("admin:" + config.adminPassword));
  return a.length === b.length && timingSafeEqual(a, b);
}
