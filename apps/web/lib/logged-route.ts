import { createNextRoute } from "@gotch/nextsignal/next";
import type { NextSignalApp } from "@gotch/nextsignal";
import { loggerAdapter } from "@/nextsignal/adapters/logger";

type RouteHandler<TContext> = (request: Request, context: TContext) => Promise<Response> | Response;

export function createLoggedNextRoute(app: NextSignalApp, processName: string) {
  return withRouteLogging(processName, createNextRoute(app, processName), { systemErrorsLoggedInside: true });
}

export function withRouteLogging<TContext>(
  source: string,
  handler: RouteHandler<TContext>,
  options: { systemErrorsLoggedInside?: boolean } = {}
): RouteHandler<TContext> {
  return async (request, context) => {
    try {
      const response = await handler(request, context);
      if (response.status >= 400 && !(options.systemErrorsLoggedInside && response.status >= 500)) {
        await logFailedResponse(source, request, response);
      }
      return response;
    } catch (error) {
      await loggerAdapter.error({
        message: "Route handler threw before producing a response.",
        process: source,
        error,
        data: requestContext(request, responseStatus(error))
      });
      throw error;
    }
  };
}

async function logFailedResponse(source: string, request: Request, response: Response) {
  const result = await readResult(response);
  const correlationId = stringValue(result?.meta, "correlationId");
  const kind = stringValue(result?.meta, "kind");
  const message = firstErrorMessage(result) ?? `Request returned HTTP ${response.status}.`;
  const entry = {
    message: `Request failed: ${message}`,
    process: source,
    correlationId,
    data: { ...requestContext(request, response.status), kind, source: "http" }
  };
  if (response.status >= 500) await loggerAdapter.error(entry);
  else await loggerAdapter.warn(entry);
}

async function readResult(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = await response.clone().json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function firstErrorMessage(result: Record<string, unknown> | undefined) {
  const errors = result?.errors;
  if (!Array.isArray(errors) || !errors.length) return undefined;
  return stringValue(errors[0], "publicMessage") ?? stringValue(errors[0], "message");
}

function stringValue(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result = (value as Record<string, unknown>)[key];
  return typeof result === "string" ? result : undefined;
}

function requestContext(request: Request, status?: number) {
  const url = new URL(request.url);
  return { source: "http", method: request.method, path: url.pathname, status };
}

function responseStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error && typeof error.status === "number"
    ? error.status
    : undefined;
}
