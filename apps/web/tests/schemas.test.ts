import { describe, expect, it } from "vitest";
import { maximumInspirationTitleLength, normalizeInspirationTitle } from "@/lib/inspirations";
import {
  createInspirationSchema,
  extensionCaptureAnnotationSchema,
  extensionCaptureSchema,
  listInspirationsSchema,
  setUserBlockedSchema
} from "@/nextsignal/schemas";

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

  it("accepts a long browser title so the capture process can normalize it", () => {
    const pageTitle = "A long social post ".repeat(30);
    expect(extensionCaptureSchema.safeParse({ type: "page", pageUrl: "https://x.com/post", pageTitle }).success)
      .toBe(true);

    const normalized = normalizeInspirationTitle(pageTitle);
    expect(normalized).toHaveLength(maximumInspirationTitleLength);
    expect(normalized?.endsWith("…")).toBe(true);
  });
});

describe("extensionCaptureAnnotationSchema", () => {
  const receipt = `mind_capture_${"a".repeat(43)}`;

  it("accepts an optional note, labels, or both for a recent capture", () => {
    expect(extensionCaptureAnnotationSchema.safeParse({ receipt, note: "Read this again" }).success).toBe(true);
    expect(extensionCaptureAnnotationSchema.safeParse({ receipt, tags: ["reading"] }).success).toBe(true);
    expect(extensionCaptureAnnotationSchema.safeParse({ receipt, note: "Useful", tags: ["design"] }).success)
      .toBe(true);
  });

  it("rejects empty annotations and malformed receipts", () => {
    expect(extensionCaptureAnnotationSchema.safeParse({ receipt }).success).toBe(false);
    expect(extensionCaptureAnnotationSchema.safeParse({ receipt: "not-a-receipt", note: "Useful" }).success)
      .toBe(false);
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
    expect(listInspirationsSchema.safeParse({ favorite: true, tag: "design", limit: 40 }).success).toBe(true);
  });
});

describe("setUserBlockedSchema", () => {
  it("accepts a user id and explicit block state", () => {
    expect(setUserBlockedSchema.safeParse({
      id: "52a8d9f2-ddc6-45cc-9992-0274714da142",
      blocked: true
    }).success).toBe(true);
  });

  it("rejects missing and non-boolean block states", () => {
    expect(setUserBlockedSchema.safeParse({ id: "52a8d9f2-ddc6-45cc-9992-0274714da142" }).success).toBe(false);
    expect(setUserBlockedSchema.safeParse({
      id: "52a8d9f2-ddc6-45cc-9992-0274714da142",
      blocked: "true"
    }).success).toBe(false);
  });
});
