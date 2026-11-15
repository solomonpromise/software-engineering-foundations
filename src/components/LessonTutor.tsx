import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircleQuestion, RotateCcw, X, Settings } from "lucide-react";
import { getGrokKey, useGrokKey } from "@/lib/tutorKey";
import { TutorSettings } from "@/components/TutorSettings";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const key = (slug: string) => `tutor:${slug}`;

function TutorChat({ slug, title }: { slug: string; title: string }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/tutor", body: () => ({ slug, grokKey: getGrokKey() || undefined }) }), [slug]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: slug,
    transport,
    onError: (e) => {
      const m = e.message || "";
      setError(/key/i.test(m) ? m : /429/.test(m) ? "Too many questions at once — wait a moment and try again." : /402/.test(m) ? "The assistant is out of AI credits right now." : "Something went wrong. Please try again.");
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key(slug));
      if (saved) setMessages(JSON.parse(saved) as UIMessage[]);
    } catch { /* ignore bad data */ }
    setLoaded(true);
    inputRef.current?.focus();
  }, [slug, setMessages]);

  useEffect(() => {
    if (loaded && status === "ready") localStorage.setItem(key(slug), JSON.stringify(messages));
    if (status === "ready") inputRef.current?.focus();
  }, [messages, status, loaded, slug]);

  const busy = status === "submitted" || status === "streaming";
  const suggestions = ["Explain this lesson like I'm new to it", "Give me a real-world example", "How does this show up in Taskboard?"];
  const ask = (text: string) => { if (!text.trim() || busy) return; if (!getGrokKey()) { setError("Add your free Grok API key (gear icon above) to use the lesson helper."); return; } setError(null); void sendMessage({ text }); };

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState title="Ask about this lesson" description={`Stuck on something in “${title}”? Ask, and get a plain explanation with examples.`}>
              <div className="mt-2 flex flex-col items-center gap-2">
                <MessageCircleQuestion className="size-8 text-accent" />
                <p className="font-serif text-xl">Ask about this lesson</p>
                <p className="max-w-xs text-sm text-muted-foreground">Stuck on something in “{title}”? Get a plain explanation with examples.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary">{s}</button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message from={m.role} key={m.id}>
                <MessageContent>
                  {m.parts.map((p, i) => p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>) : null)}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-sm">Thinking…</Shimmer>}
          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg) => ask(msg.text)}>
          <PromptInputBody>
            <PromptInputTextarea ref={inputRef} placeholder="Ask a question about this lesson…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-between">
            <button type="button" onClick={() => { setMessages([]); localStorage.removeItem(key(slug)); }} className="flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3" /> Clear chat
            </button>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function LessonTutor({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const grokKey = useGrokKey();
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ask about this lesson" title="Ask about this lesson" className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:-translate-y-0.5">
        <MessageCircleQuestion className="size-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-foreground/30" onClick={() => setOpen(false)}>
          <aside className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">Lesson helper</p>
                <p className="font-serif text-lg leading-tight">{title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSettings((v) => !v)} aria-label="Tutor settings" title="Tutor settings" className="text-muted-foreground hover:text-foreground"><Settings className="size-5" /></button>
                <button onClick={() => setOpen(false)} aria-label="Close"><X /></button>
              </div>
            </header>
            {(settings || !grokKey) && <div className="border-b border-border bg-secondary/40 p-4"><TutorSettings onDone={() => setSettings(false)} /></div>}
            <p className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">{grokKey ? "Answering with your Grok key" : "Add your Grok key above to start asking questions"}</p>
            <div className="min-h-0 flex-1"><TutorChat key={slug} slug={slug} title={title} /></div>
          </aside>
        </div>
      )}
    </>
  );
}
