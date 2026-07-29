import { describe, expect, it } from "vitest";
import { isPrivateAddress, normalizeUrl } from "@/nextsignal/services/link-metadata";

describe("normalizeUrl", () => {
  it("removes fragments and common tracking parameters", () => {
    expect(normalizeUrl("https://Example.com/story/?utm_source=newsletter&b=2&a=1#read")).toBe(
      "https://example.com/story?a=1&b=2"
    );
  });

  it("rejects non-web protocols", () => {
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow("Only HTTP and HTTPS");
  });

  it("rejects URLs containing credentials", () => {
    expect(() => normalizeUrl("https://user:secret@example.com/private")).toThrow("embedded credentials");
  });
});

describe("private network detection", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.4", "169.254.1.2", "::1", "fd00::1"])(
    "blocks %s",
    (address) => {
      expect(isPrivateAddress(address)).toBe(true);
    }
  );

  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])("allows %s", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});
