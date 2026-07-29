import { describe, expect, it } from "vitest";
import { createInspirationSchema, extensionCaptureSchema, listInspirationsSchema } from "@/nextsignal/schemas";

describe("extensionCaptureSchema", () => {
  it.each(["page", "link", "selection", "image"] as const)("accepts a valid %s capture", (type) => {
    const input = {
      type,
      pageUrl: "https://example.com/article",
      targetUrl: type === "link" || type === "image" ? "https://cdn.example.com/target.png" : undefined,
      text: type === "selection" ? "A thought worth keeping" : undefined,
      tags: ["browser"]
    };
    expect(extensionCaptureSchema.safeParse(input).success).toBe(true);
  });

  it("rejects image captures without a target URL", () => {
    expect(extensionCaptureSchema.safeParse({ type: "image", pageUrl: "https://example.com" }).success).toBe(false);
  });

  it("rejects non-web page URLs", () => {
    expect(extensionCaptureSchema.safeParse({ type: "page", pageUrl: "chrome://extensions" }).success).toBe(false);
  });
});

describe("createInspirationSchema", () => {
  it("accepts a link with a valid URL", () => {
    expect(createInspirationSchema.safeParse({ kind: "link", sourceUrl: "https://example.com" }).success).toBe(true);
  });

  it("requires an uploaded URL for image inspirations", () => {
    const result = createInspirationSchema.safeParse({ kind: "image", title: "Color study" });
    expect(result.success).toBe(false);
  });

  it("requires content or a title for notes", () => {
    expect(createInspirationSchema.safeParse({ kind: "note" }).success).toBe(false);
    expect(createInspirationSchema.safeParse({ kind: "note", content: "Remember this" }).success).toBe(true);
  });
});

describe("listInspirationsSchema", () => {
  it("accepts query-string values from a Next.js route", () => {
    expect(listInspirationsSchema.safeParse({ favorite: "true", limit: "40" }).success).toBe(true);
  });

  it("accepts normalized values during mediator dispatch", () => {
    expect(listInspirationsSchema.safeParse({ favorite: true, limit: 40 }).success).toBe(true);
  });
});
