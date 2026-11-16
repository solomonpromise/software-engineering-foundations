import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { findChapter } from "@/content/lessons";
import { getGrokKey } from "@/lib/tutorKey";

const XAI_BASE_URL = "https://api.x.ai/v1";
const MODEL = "grok-4-fast-non-reasoning";

function lessonContext(slug: string) {
  const r = findChapter(slug);
  if (!r) return null;
  const c = r.chapter;
  const body = c.sections
    .map(
      (s) =>
        `## ${s.heading}\n${s.paragraphs.join("\n\n")}${s.bullets?.length ? "\n- " + s.bullets.join("\n- ") : ""}`,
    )
    .join("\n\n");
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

function instructions(lesson: string) {
  return `You are a patient tutor for "Software Engineering Foundations", a free, open learning resource for people who build apps with AI but have no software engineering background.
Answer questions about the lesson below. Rules:
- Ground every explanation in this lesson's ideas and vocabulary; refer to its sections by name when useful.
- Explain in plain language first, then give at least one concrete example — prefer the Taskboard example app, or an everyday analogy.
- Keep code samples tiny and explain each line. Define any jargon you use.
- If a question goes beyond this lesson, answer briefly and say which part of the course is the better fit; if you're unsure, say so.
- Be concise: short paragraphs, bullets where they help. Use markdown.

LESSON CONTENT:
${lesson}`;
}

function friendlyError(e: unknown) {
  const x = e as { message?: string; statusCode?: number; responseBody?: string };
  const m = `${x?.statusCode ?? ""} ${x?.message ?? String(e)} ${x?.responseBody ?? ""}`;
  if (/401|403|invalid|incorrect|api key/i.test(m))
    return "Your Grok key was rejected. Check it in tutor settings.";
  if (/429|rate|credit|quota/i.test(m))
    return "Your Grok key has hit its limit. Wait a bit or check your xAI credits.";
  if (/failed to fetch|network/i.test(m))
    return "Couldn't reach Grok. Check your internet connection and try again.";
  return "Grok couldn't answer just now. Please try again.";
}

/**
 * Talks to xAI straight from the learner's browser with their own key. The site has no server, so
 * the key goes only to api.x.ai and never to us.
 */
export class GrokTutorTransport implements ChatTransport<UIMessage> {
  constructor(private readonly slug: string) {}

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    const apiKey = getGrokKey();
    if (!apiKey)
      throw new Error("Add your free Grok API key in tutor settings to use the lesson helper.");
    if (apiKey.length < 20 || apiKey.length > 300)
      throw new Error("That Grok key doesn't look right. Check it in tutor settings.");
    const lesson = lessonContext(this.slug);
    if (!lesson) throw new Error("This lesson couldn't be found.");
    const xai = createOpenAI({ baseURL: XAI_BASE_URL, apiKey });
    const result = streamText({
      model: xai.chat(MODEL),
      system: instructions(lesson),
      messages: await convertToModelMessages(messages),
      ...(abortSignal ? { abortSignal } : {}),
    });
    return result.toUIMessageStream({ onError: friendlyError });
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
