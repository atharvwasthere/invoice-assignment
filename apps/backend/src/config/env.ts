import "dotenv/config";

/**
 * Centralised, validated environment access.
 *
 * Reading process.env in one place means a missing var fails loudly at startup
 * with a clear message — not as a cryptic `undefined` deep inside a DB call.
 */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/invoice_platform"),
  port: Number(required("PORT", "4000")),
} as const;
