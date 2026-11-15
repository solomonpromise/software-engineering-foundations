import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { findChapter } from "@/content/lessons";

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
  let payload: { messages?: UIMessage[]; slug?: string; grokKey?: unknown };
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const { messages, slug } = payload;
  if (!Array.isArray(messages) || typeof slug !== "string") return Response.json({ error: "Invalid request" }, { status: 400 });
  const lesson = lessonContext(slug);
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  const grokKey = typeof payload.grokKey === "string" ? payload.grokKey.trim() : "";
  if (!grokKey) return Response.json({ error: "Add your free Grok API key in tutor settings to use the lesson helper." }, { status: 401 });
  if ((grokKey.length < 20 || grokKey.length > 300)) return Response.json({ error: "That Grok key doesn't look right." }, { status: 400 });

  const instructions = `You are a patient tutor for "Software Foundations", a free course for people who build apps with AI but have no software engineering background.
Answer questions about the lesson below. Rules:
- Ground every explanation in this lesson's ideas and vocabulary; refer to its sections by name when useful.
- Explain in plain language first, then give at least one concrete example — prefer the Taskboard example app, or an everyday analogy.
- Keep code samples tiny and explain each line. Define any jargon you use.
- If a question goes beyond this lesson, answer briefly and say which part of the course is the better fit; if you're unsure, say so.
- Be concise: short paragraphs, bullets where they help. Use markdown.

LESSON CONTENT:
${lesson}`;

  const modelMessages = await convertToModelMessages(messages);
  if (grokKey) {
    // Learner's own xAI key: used for this request only, never stored or logged.
    const xai = createOpenAI({ baseURL: "https://api.x.ai/v1", apiKey: grokKey });
    const result = streamText({ model: xai.chat("grok-4-fast-non-reasoning"), system: instructions, messages: modelMessages, abortSignal: request.signal });
    return result.toUIMessageStreamResponse({
      onError: (e) => {
        const x = e as { message?: string; statusCode?: number; responseBody?: string };
        const m = `${x?.statusCode ?? ""} ${x?.message ?? String(e)} ${x?.responseBody ?? ""}`;
        if (/401|403|invalid|incorrect|api key/i.test(m)) return "Your Grok key was rejected. Check it in tutor settings.";
        if (/429|rate|credit|quota/i.test(m)) return "Your Grok key has hit its limit — wait a bit or check your xAI credits.";
        return "Grok couldn't answer just now. Please try again.";
      },
    });
  }
  return Response.json({ error: "Add your free Grok API key in tutor settings to use the lesson helper." }, { status: 401 });
}
