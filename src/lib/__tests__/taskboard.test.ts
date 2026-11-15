import { describe, it, expect } from "vitest";
import { isOverdue, validateTitle } from "@/routes/taskboard";

describe("Taskboard rules", () => {
  it("a task due yesterday and not done is overdue", () => {
    expect(isOverdue({ due: "2026-11-14", done: false }, "2026-11-15")).toBe(true);
  });
  it("a task due today is not overdue", () => {
    expect(isOverdue({ due: "2026-11-15", done: false }, "2026-11-15")).toBe(false);
  });
  it("a finished task is never overdue", () => {
    expect(isOverdue({ due: "2026-11-01", done: true }, "2026-11-15")).toBe(false);
  });
  it("a blank title is rejected", () => {
    expect(validateTitle("   ")).not.toBeNull();
  });
  it("a title over 200 characters is rejected", () => {
    expect(validateTitle("a".repeat(201))).not.toBeNull();
  });
});
