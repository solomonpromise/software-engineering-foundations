/**
 * Course mark: a rising caret over two stacked foundation bars —
 * building up from the foundations. Draws in `currentColor`, so the
 * surrounding element controls the colour (brass on the forest ribbon,
 * forest on a brass badge).
 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <path
        d="M8.5 14 16 6.5 23.5 14"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="8" y="17.5" width="16" height="3.4" rx="1.7" fill="currentColor" />
      <rect x="4.5" y="23.5" width="23" height="3.4" rx="1.7" fill="currentColor" />
    </svg>
  );
}

/** The same mark as a stand-alone file (browser tab, exports). */
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1F3B2D"/><path d="M8.5 14 16 6.5 23.5 14" fill="none" stroke="#B8893B" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="17.5" width="16" height="3.4" rx="1.7" fill="#B8893B"/><rect x="4.5" y="23.5" width="23" height="3.4" rx="1.7" fill="#B8893B"/></svg>`;
