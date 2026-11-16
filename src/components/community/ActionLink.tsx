import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

const styles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-background hover:border-primary hover:text-primary",
  text: "px-0 py-0 text-primary underline underline-offset-4 hover:text-foreground",
} as const;

/**
 * A link to an outside page (usually GitHub). When `href` is null the destination doesn't exist yet,
 * so it renders as plainly disabled text instead of a link that goes nowhere.
 */
export function ActionLink({
  href,
  children,
  variant = "outline",
  pendingNote = "Available when the public repository opens",
}: {
  href: string | null;
  children: ReactNode;
  variant?: keyof typeof styles;
  pendingNote?: string;
}) {
  const base =
    variant === "text"
      ? "inline-flex items-center gap-1.5 text-sm font-semibold"
      : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors";
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title={pendingNote}
        className={`${base} cursor-not-allowed ${variant === "text" ? "text-muted-foreground" : "border border-dashed border-border text-muted-foreground"}`}
      >
        {children}
        <span className="sr-only"> ({pendingNote})</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles[variant]}`}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
