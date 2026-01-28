import { createHash, randomBytes } from "crypto";

export function generateCode(length = 10) {
  const bytes = randomBytes(Math.ceil(length / 2));
  return bytes.toString("hex").slice(0, length);
}

export function hashIp(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}
