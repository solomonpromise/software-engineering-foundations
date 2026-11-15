import { describe, expect, it } from "vitest";
import { mergeProgress } from "../progress";

describe("merging browser and account progress", () => {
  it("keeps lessons finished on either side", () => {
    expect(mergeProgress({ done: ["a"] }, { done: ["b", "a"] }).done.sort()).toEqual(["a", "b"]);
  });
  it("keeps project steps ticked on either side", () => {
    expect(mergeProgress({ done: [], steps: { p: [0, 2] } }, { done: [], steps: { p: [1, 2] } }).steps).toEqual({ p: [0, 1, 2] });
  });
});
