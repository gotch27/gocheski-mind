import { getDatabase } from "@/db";
import { applicationLogs } from "@/db/schema";

export type ApplicationLogLevel = "info" | "warn" | "error";

export type ApplicationLogInput = {
  level: ApplicationLogLevel;
  source: string;
  message: string;
  process?: string;
  correlationId?: string;
  ownerId?: string;
  error?: unknown;
  context?: unknown;
};

const sensitiveKey = /authorization|cookie|password|secret|token|credential|session|verifier/i;

export const applicationLogService = {
  async record(input: ApplicationLogInput) {
    const db = await getDatabase();
    const error = normalizeError(input.error);
    const [created] = await db
      .insert(applicationLogs)
      .values({
        level: input.level,
        source: truncate(input.source, 120),
        message: sanitizeLogText(input.message, 4_000),
        process: input.process ? truncate(input.process, 160) : undefined,
        correlationId: input.correlationId ? truncate(input.correlationId, 100) : undefined,
        ownerId: input.ownerId,
        errorName: error?.name ? truncate(error.name, 160) : undefined,
        errorMessage: error?.message ? sanitizeLogText(error.message, 4_000) : undefined,
        stack: error?.stack ? sanitizeLogText(error.stack, 16_000) : undefined,
        context: sanitize(input.context)
      })
      .returning({ id: applicationLogs.id });
    return created;
  }
};

function normalizeError(value: unknown) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value === "string") return { name: "Error", message: value };
  return undefined;
}

function sanitize(value: unknown, depth = 0): Record<string, unknown> {
  const sanitized = sanitizeValue(value, depth);
  return isRecord(sanitized) ? sanitized : sanitized === undefined ? {} : { value: sanitized };
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return sanitizeLogText(value, 2_000);
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (depth >= 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitizeValue(item, depth + 1));
  if (value instanceof Error) return normalizeError(value);
  if (!isRecord(value)) return truncate(String(value), 2_000);

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([key, item]) => [key, sensitiveKey.test(key) ? "[redacted]" : sanitizeValue(item, depth + 1)])
      .filter((entry) => entry[1] !== undefined)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function truncate(value: string, maximum: number) {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1)}…`;
}

export function sanitizeLogText(value: string, maximum = 2_000) {
  return truncate(
    value
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      .replace(/\bmind_ext_[A-Za-z0-9_-]{20,}/g, "[redacted-extension-token]")
      .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s/]+@/gi, "$1[redacted]@"),
    maximum
  );
}
