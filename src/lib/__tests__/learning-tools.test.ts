import { describe, expect, it } from "vitest";
import { mergeProgress } from "../progress";

describe("learning tools survive account merging", () => {
  it("keeps bookmarks saved on either device", () => {
    expect(mergeProgress({ done: [], bookmarks: ["a"] }, { done: [], bookmarks: ["b"] }).bookmarks?.sort()).toEqual(["a", "b"]);
  });
  it("keeps a local non-empty note when the account has an older note", () => {
    expect(mergeProgress({ done: [], notes: { a: "local" } }, { done: [], notes: { a: "remote", b: "kept" } }).notes).toEqual({ a: "local", b: "kept" });
  });
  it("keeps project assessment ticks from either device", () => {
    expect(mergeProgress({ done: [], assessments: { p: [0, 2] } }, { done: [], assessments: { p: [1] } }).assessments).toEqual({ p: [0, 1, 2] });
  });
  it("keeps a practical answer and unions completed exercise tasks", () => {
    const merged = mergeProgress(
      { done: [], practice: { a: { answer: "my evidence", done: [0] } } },
      { done: [], practice: { a: { answer: "older", done: [1] } } },
    );
    expect(merged.practice?.["a"]).toEqual({ answer: "my evidence", done: [0, 1] });
  });
});
