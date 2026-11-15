import { describe, expect, it } from "vitest";
import { certificateStatus } from "../certificate";

const projects = [{ slug: "p1", steps: 2 }];
describe("certificate unlock", () => {
  it("stays locked while a project step is missing", () => {
    expect(certificateStatus({ done: ["a", "b"], steps: { p1: [0] } }, ["a", "b"], projects).complete).toBe(false);
  });
  it("stays locked while a lesson is unfinished", () => {
    expect(certificateStatus({ done: ["a"], steps: { p1: [0, 1] } }, ["a", "b"], projects).complete).toBe(false);
  });
  it("unlocks when all lessons and project steps are done", () => {
    expect(certificateStatus({ done: ["a", "b"], steps: { p1: [0, 1] } }, ["a", "b"], projects).complete).toBe(true);
  });
});
