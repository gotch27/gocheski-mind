import { describe, expect, it } from "vitest";
import { createInspirationSchema, listInspirationsSchema } from "@/nextsignal/schemas";

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
