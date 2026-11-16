import { lazy, Suspense, useState } from "react";
import { MessageCircleQuestion, X, Settings } from "lucide-react";
import { useGrokKey } from "@/lib/tutorKey";
import { TutorSettings } from "@/components/TutorSettings";

const TutorChat = lazy(() => import("@/components/LessonTutorChat"));

export function LessonTutor({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const grokKey = useGrokKey();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask about this lesson"
        title="Ask about this lesson"
        className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:-translate-y-0.5"
      >
        <MessageCircleQuestion className="size-6" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-foreground/30"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Lesson helper
                </p>
                <p className="font-serif text-lg leading-tight">{title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSettings((v) => !v)}
                  aria-label="Tutor settings"
                  title="Tutor settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="size-5" />
                </button>
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X />
                </button>
              </div>
            </header>
            {(settings || !grokKey) && (
              <div className="border-b border-border bg-secondary/40 p-4">
                <TutorSettings onDone={() => setSettings(false)} />
              </div>
            )}
            <p className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
              {grokKey
                ? "Answering with your Grok key"
                : "Add your Grok key above to start asking questions"}
            </p>
            <div className="min-h-0 flex-1">
              <Suspense
                fallback={
                  <p className="p-4 text-sm text-muted-foreground" role="status">
                    Loading the lesson helper…
                  </p>
                }
              >
                <TutorChat key={slug} slug={slug} title={title} />
              </Suspense>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
