import { describe, expect, it } from "vitest";
import { maximumInspirationNoteLength } from "@/lib/inspirations";
import { appendCaptureNote } from "@/nextsignal/services/inspirations";

describe("capture note annotations", () => {
  it("uses the new note when the inspiration has no personal note", () => {
    expect(appendCaptureNote(null, "  A useful thought  ")).toEqual({
      ok: true,
      note: "A useful thought"
    });
  });

  it("appends to an existing note without overwriting it", () => {
    expect(appendCaptureNote("First thought", "Second thought")).toEqual({
      ok: true,
      note: "First thought\n\nSecond thought"
    });
  });

  it("is idempotent when the same annotation is retried", () => {
    expect(appendCaptureNote("First thought\n\nSecond thought", "Second thought")).toEqual({
      ok: true,
      note: "First thought\n\nSecond thought"
    });
  });

  it("refuses to exceed the personal note limit", () => {
    const result = appendCaptureNote("a".repeat(maximumInspirationNoteLength - 1), "more");
    expect(result).toEqual({ ok: false });
  });
});
