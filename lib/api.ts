import type { ApiResult } from "@/lib/inspirations";

export function readApiError(result: ApiResult<unknown>) {
  return result.errors[0]?.publicMessage ?? result.errors[0]?.message ?? "Something went wrong.";
}
