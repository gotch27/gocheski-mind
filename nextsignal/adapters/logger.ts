import type { LoggerAdapter } from "@gotch/nextsignal";

// Starter logger: enough for local development and tests.
//
// Replace this with your real logging sink later:
// - pino
// - OpenTelemetry
// - Datadog
// - structured JSON logs
//
// The process code should not care where logs go.
export const loggerAdapter: LoggerAdapter = {
  debug(entry) {
    console.debug(entry.message, entry);
  },
  info(entry) {
    console.info(entry.message, entry);
  },
  warn(entry) {
    console.warn(entry.message, entry);
  },
  error(entry) {
    console.error(entry.message, entry);
  }
};
