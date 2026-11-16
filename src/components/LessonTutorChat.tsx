import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircleQuestion, RotateCcw } from "lucide-react";
import { getGrokKey } from "@/lib/tutorKey";
import { GrokTutorTransport } from "@/lib/ai/tutor";
import { trackEvent } from "@/lib/analytics";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

/** The tutor conversation. Loaded only when a learner opens the tutor, to keep lesson pages light. */
const key = (slug: string) => `tutor:${slug}`;

export default function TutorChat({ slug, title }: { slug: string; title: string }) {
  const transport = useMemo(() => new GrokTutorTransport(slug), [slug]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: slug,
    transport,
    onError: (e) => {
      const m = e.message || "";
      setError(
        /key|grok|lesson|connection/i.test(m) ? m : "Something went wrong. Please try again.",
      );
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key(slug));
      if (saved) setMessages(JSON.parse(saved) as UIMessage[]);
    } catch {
      /* ignore bad data */
    }
    setLoaded(true);
    inputRef.current?.focus();
  }, [slug, setMessages]);

  useEffect(() => {
    if (loaded && status === "ready") localStorage.setItem(key(slug), JSON.stringify(messages));
    if (status === "ready") inputRef.current?.focus();
  }, [messages, status, loaded, slug]);

  const busy = status === "submitted" || status === "streaming";
  const suggestions = [
    "Explain this lesson like I'm new to it",
    "Give me a real-world example",
    "How does this show up in Taskboard?",
  ];
  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    if (!getGrokKey()) {
      setError("Add your free Grok API key (gear icon above) to use the lesson helper.");
      return;
    }
    setError(null);
    trackEvent("tutor-question", "Lesson helper question");
    void sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Ask about this lesson"
              description={`Stuck on something in “${title}”? Ask, and get a plain explanation with examples.`}
            >
              <div className="mt-2 flex flex-col items-center gap-2">
                <MessageCircleQuestion className="size-8 text-accent" />
                <p className="font-serif text-xl">Ask about this lesson</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Stuck on something in “{title}”? Get a plain explanation with examples.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message from={m.role} key={m.id}>
                <MessageContent>
                  {m.parts.map((p, i) =>
                    p.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse key={i}>{p.text}</MessageResponse>
                      ) : (
                        <span key={i}>{p.text}</span>
                      )
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-sm">Thinking…</Shimmer>}
          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg) => ask(msg.text)}>
          <PromptInputBody>
            <PromptInputTextarea ref={inputRef} placeholder="Ask a question about this lesson…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-between">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                localStorage.removeItem(key(slug));
              }}
              className="flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" /> Clear chat
            </button>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
