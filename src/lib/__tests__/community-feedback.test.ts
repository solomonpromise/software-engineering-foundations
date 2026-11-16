import { describe, expect, it } from "vitest";
import { feedbackSchema, fieldErrors, isFeedbackCategory } from "@/lib/community/feedback";
import { github, githubLinks } from "@/config/community";

describe("community feedback validation", () => {
  it("accepts a minimal anonymous message and turns blank optional fields into null", () => {
    const r = feedbackSchema.safeParse({
      category: "general",
      message: "The roadmap page is great.",
      name: " ",
      email: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBeNull();
      expect(r.data.email).toBeNull();
      expect(r.data.related).toBeNull();
    }
  });

  it("reports a field error for each invalid field", () => {
    const r = feedbackSchema.safeParse({
      category: "nope",
      message: "short",
      email: "not-an-email",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(Object.keys(e).sort()).toEqual(["category", "email", "message"]);
    }
  });

  it("rejects messages over 4,000 characters", () => {
    expect(
      feedbackSchema.safeParse({ category: "general", message: "x".repeat(4001) }).success,
    ).toBe(false);
  });

  it("recognises only known categories", () => {
    expect(isFeedbackCategory("resource")).toBe(true);
    expect(isFeedbackCategory("spam")).toBe(false);
  });
});

describe("GitHub links", () => {
  it("never point at a repository that isn't public yet", () => {
    if (github.repositoryIsPublic) {
      expect(githubLinks.repo).toBe(`https://github.com/${github.owner}/${github.repo}`);
      expect(githubLinks.newIssue("topic-suggestion", { topic: "Caching" })).toContain(
        "template=topic-suggestion.yml&topic=Caching",
      );
    } else {
      expect(githubLinks.repo).toBeNull();
      expect(githubLinks.contributing).toBeNull();
      expect(githubLinks.newIssue("bug-report")).toBeNull();
    }
  });
});
