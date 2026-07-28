import { describe, expect, it } from "vitest";
import { joinBasePath } from "@/lib/base-path";

describe("joinBasePath", () => {
  it("does not add a trailing slash to the hosted app root", () => {
    expect(joinBasePath("/mind", "/")).toBe("/mind");
  });

  it("keeps nested paths under the app base path", () => {
    expect(joinBasePath("/mind", "/api/auth/login")).toBe("/mind/api/auth/login");
  });

  it("keeps the local root slash when no base path is configured", () => {
    expect(joinBasePath("", "/")).toBe("/");
  });
});
