import { describe, expect, it } from "vitest";
import { sanitizeLogText } from "@/nextsignal/services/application-logs";

describe("application log sanitization", () => {
  it("redacts extension and bearer tokens", () => {
    const value = sanitizeLogText(
      "Bearer abc.def_123, mind_ext_abcdefghijklmnopqrstuvwxyz123456, and " +
      "mind_capture_abcdefghijklmnopqrstuvwxyz12345678901234567"
    );

    expect(value).not.toContain("abc.def_123");
    expect(value).not.toContain("mind_ext_abcdefghijklmnopqrstuvwxyz123456");
    expect(value).not.toContain("mind_capture_abcdefghijklmnopqrstuvwxyz12345678901234567");
    expect(value).toContain("Bearer [redacted]");
    expect(value).toContain("[redacted-extension-token]");
    expect(value).toContain("[redacted-capture-receipt]");
  });

  it("redacts passwords embedded in Postgres URLs", () => {
    const value = sanitizeLogText("postgresql://user:super-secret@db.example.com/mind");
    expect(value).toBe("postgresql://user:[redacted]@db.example.com/mind");
  });

  it("limits persisted text", () => {
    expect(sanitizeLogText("a".repeat(20), 10)).toBe("aaaaaaaaa…");
  });
});
