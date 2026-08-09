import { describe, expect, it } from "vitest";
import { isMindAdminEmail, MIND_ADMIN_EMAIL } from "@/lib/admin-users";

describe("Mind administrator", () => {
  it("recognizes the configured owner email case-insensitively", () => {
    expect(MIND_ADMIN_EMAIL).toBe("gorazdfilipovski@gmail.com");
    expect(isMindAdminEmail(" GORAZDFILIPOVSKI@GMAIL.COM ")).toBe(true);
  });

  it("does not grant admin access to other users", () => {
    expect(isMindAdminEmail("someone@example.com")).toBe(false);
  });
});
