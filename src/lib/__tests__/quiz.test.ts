import { describe, expect, it } from "vitest";
import { canFinish } from "../quiz";

describe("lesson quiz gate", () => {
  it("blocks finishing until every question is marked got it", () => {
    expect(canFinish({ 0: "got", 1: "not" }, 2)).toBe(false);
    expect(canFinish({ 0: "got" }, 2)).toBe(false);
  });
  it("allows finishing when all questions are got it", () => {
    expect(canFinish({ 0: "got", 1: "got" }, 2)).toBe(true);
  });
  it("allows finishing a lesson with no questions", () => {
    expect(canFinish({}, 0)).toBe(true);
  });
});
