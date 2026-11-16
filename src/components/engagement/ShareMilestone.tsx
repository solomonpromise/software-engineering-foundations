import { Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { project } from "@/config/community";
import { trackEvent } from "@/lib/analytics";
import { useMe } from "@/lib/engagement/reader";
import { canvasBlob, drawShareCard, headline, type Milestone } from "@/lib/engagement/shareCard";
import { useProgress } from "@/lib/progress";

const siteLabel = project.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** A button that opens a beautiful, ready-to-post image of the learner's milestone. */
export function ShareMilestone({
  milestone,
  label = "Share this milestone",
  className,
}: {
  milestone: Milestone;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary"
        }
      >
        <Share2 className="size-4" /> {label}
      </button>
      {open && <ShareDialog milestone={milestone} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareDialog({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { done } = useProgress();
  const me = useMe();
  const { lead, sub } = headline(milestone);
  const text = `${lead}: ${sub}. Learning software engineering for the AI building era — free and open.`;

  useEffect(() => {
    let live = true;
    let objectUrl: string | null = null;
    void (async () => {
      // Drawn off-screen: the dialog's own elements may not exist yet when this runs.
      const canvas = document.createElement("canvas");
      await drawShareCard(canvas, {
        milestone,
        done: new Set(done),
        readerNumber: me.number,
        season: me.season,
        siteLabel,
      });
      const blob = await canvasBlob(canvas);
      if (!live || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      setFile(
        new File([blob], "software-engineering-foundations-milestone.png", { type: "image/png" }),
      );
    })();
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Drawn once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canShareFile =
    !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
  const shareNative = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], text, url: project.siteUrl });
      trackEvent(`milestone-shared/${milestone.kind}`, "Milestone shared");
    } catch {
      /* cancelled */
    }
  };
  const link = encodeURIComponent(project.siteUrl);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Share your milestone</DialogTitle>
          <DialogDescription>
            Your card is made in your browser. Download it and add it to your post, or share it
            directly.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {url ? (
            <img src={url} alt={`${lead}: ${sub}`} className="aspect-[1200/630] w-full" />
          ) : (
            <div className="aspect-[1200/630] w-full animate-pulse" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canShareFile && (
            <button
              type="button"
              onClick={shareNative}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Share2 className="size-4" /> Share
            </button>
          )}
          {url && (
            <a
              href={url}
              download="software-engineering-foundations-milestone.png"
              onClick={() =>
                trackEvent(`milestone-downloaded/${milestone.kind}`, "Milestone card downloaded")
              }
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${canShareFile ? "border border-border hover:border-primary" : "bg-primary text-primary-foreground"}`}
            >
              <Download className="size-4" /> Download image
            </a>
          )}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary"
          >
            Post on LinkedIn
          </a>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary"
          >
            Post on X
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: LinkedIn and X don&rsquo;t attach images from links — download the card and add it to
          your post.
        </p>
      </DialogContent>
    </Dialog>
  );
}
