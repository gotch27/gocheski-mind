import type { LogEntry, LoggerAdapter } from "@gotch/nextsignal";
import { applicationLogService, type ApplicationLogLevel } from "@/nextsignal/services/application-logs";

export const loggerAdapter: LoggerAdapter = {
  info: (entry) => persist("info", entry),
  warn: (entry) => persist("warn", entry),
  error: (entry) => persist("error", entry)
};

async function persist(level: ApplicationLogLevel, entry: LogEntry) {
  const data = isRecord(entry.data) ? entry.data : { value: entry.data };
  const ownerId = typeof data.ownerId === "string" ? data.ownerId : undefined;

  try {
    await applicationLogService.record({
      level,
      source: typeof data.source === "string" ? data.source : "nextsignal",
      message: entry.message,
      process: entry.process,
      correlationId: entry.correlationId,
      ownerId,
      error: entry.error,
      context: data
    });
  } catch (loggingError) {
    const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    method("Application log could not be persisted.", { entry, loggingError });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
