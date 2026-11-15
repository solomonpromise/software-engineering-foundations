import { convertToModelMessages, type UIMessage } from "ai";
import { findChapter } from "@/content/lessons";
import { createResponsesCall } from "./responses.server";

function lessonContext(slug: string) {
  const r = findChapter(slug);
  if (!r) return null;
  const c = r.chapter;
  const body = c.sections.map((s) => `## ${s.heading}\n${s.paragraphs.join("\n\n")}${s.bullets?.length ? "\n- " + s.bullets.join("\n- ") : ""}`).join("\n\n");
  return `# Lesson ${c.number}: ${c.title} (Part ${c.part.number}: ${c.part.title})
Opening question: ${c.question}
Summary: ${c.summary}

${body}

Key idea: ${c.keyIdea}
In Taskboard (the course's example task-tracker app): ${c.taskboard}
Walkthrough — ${c.walkthrough.title}: ${c.walkthrough.steps.join(" → ")}
Common mistakes: ${c.mistakes.join("; ")}
When AI gets it wrong: ${c.aiMistakes.join("; ")}`;
}

export async function handleTutor(request: Request) {
  let payload: { messages?: UIMessage[]; slug?: string };
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const { messages, slug } = payload;
  if (!Array.isArray(messages) || typeof slug !== "string") return Response.json({ error: "Invalid request" }, { status: 400 });
  const lesson = lessonContext(slug);
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ error: "The lesson assistant isn't configured yet." }, { status: 500 });

  const instructions = `You are a patient tutor for "Software Foundations", a free course for people who build apps with AI but have no software engineering background.
Answer questions about the lesson below. Rules:
- Ground every explanation in this lesson's ideas and vocabulary; refer to its sections by name when useful.
- Explain in plain language first, then give at least one concrete example — prefer the Taskboard example app, or an everyday analogy.
- Keep code samples tiny and explain each line. Define any jargon you use.
- If a question goes beyond this lesson, answer briefly and say which part of the course is the better fit; if you're unsure, say so.
- Be concise: short paragraphs, bullets where they help. Use markdown.

LESSON CONTENT:
${lesson}`;

  const call = createResponsesCall(request, { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" }, await convertToModelMessages(messages), instructions);
  return call.response();
}
