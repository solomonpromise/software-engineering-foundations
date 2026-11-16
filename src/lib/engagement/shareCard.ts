import { chapters } from "@/content/lessons";

/**
 * Milestone share cards: a 1200×630 image (the size social sites use for link previews) drawn in
 * the browser, so nothing is uploaded anywhere until the learner chooses to share it.
 */

export type Milestone =
  | { kind: "lesson"; number: number; title: string }
  | { kind: "part"; number: number; title: string }
  | { kind: "course" };

export type CardInput = {
  milestone: Milestone;
  done: Set<string>;
  readerNumber?: number | undefined;
  season?: string | undefined;
  siteLabel: string;
};

const C = {
  bg: "#18291f",
  bg2: "#22382b",
  ink: "#f4f1e8",
  muted: "#b9bfa8",
  brass: "#e1b85c",
  path: "#5d7563",
};
const SERIF = '"EB Garamond", Garamond, Georgia, serif';

export function headline(m: Milestone) {
  if (m.kind === "course")
    return { lead: "I completed the course", sub: "All 34 lessons and six projects" };
  if (m.kind === "part") return { lead: `I just finished Part ${m.number}`, sub: m.title };
  return { lead: `I just finished Lesson ${m.number}`, sub: m.title };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/\s+\S*$/, "")}…`;
    return kept;
  }
  return lines;
}

export async function drawShareCard(canvas: HTMLCanvasElement, input: CardInput) {
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  try {
    await Promise.all([
      document.fonts.load(`500 64px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
    ]);
  } catch {
    /* fall back to Georgia */
  }

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, C.bg2);
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(1050, 80, 10, 1050, 80, 520);
  glow.addColorStop(0, "rgba(225,184,92,0.22)");
  glow.addColorStop(1, "rgba(225,184,92,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // A scatter of faint stars
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.15 + rnd() * 0.45;
    ctx.fillStyle = C.brass;
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * 300, 0.6 + rnd() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const pad = 80;
  ctx.fillStyle = C.brass;
  ctx.font = `600 22px ${SERIF}`;
  ctx.letterSpacing = "5px";
  ctx.fillText("SOFTWARE ENGINEERING FOUNDATIONS", pad, 104);
  ctx.letterSpacing = "0px";

  const { lead, sub } = headline(input.milestone);
  ctx.fillStyle = C.ink;
  ctx.font = `500 76px ${SERIF}`;
  ctx.fillText(lead, pad, 210);
  ctx.fillStyle = C.brass;
  ctx.font = `italic 400 46px ${SERIF}`;
  wrap(ctx, sub, W - pad * 2, 2).forEach((l, i) => ctx.fillText(l, pad, 278 + i * 54));

  // Every lesson as a light along a path, finished ones lit.
  const y0 = 470;
  const x0 = pad + 10;
  const x1 = W - pad - 10;
  const pts = chapters.map((c, i) => {
    const t = i / (chapters.length - 1);
    return { x: x0 + t * (x1 - x0), y: y0 + Math.sin(t * Math.PI * 3) * 22, c };
  });
  ctx.strokeStyle = C.path;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 8]);
  ctx.lineCap = "round";
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
  for (const p of pts) {
    const lit = input.done.has(p.c.slug);
    if (lit) {
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
      halo.addColorStop(0, "rgba(225,184,92,0.45)");
      halo.addColorStop(1, "rgba(225,184,92,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, lit ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = lit ? C.brass : C.bg;
    ctx.fill();
    ctx.strokeStyle = C.brass;
    ctx.globalAlpha = lit ? 1 : 0.55;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.font = `400 26px ${SERIF}`;
  ctx.fillStyle = C.muted;
  const doneCount = chapters.filter((c) => input.done.has(c.slug)).length;
  const left = [
    `${doneCount} of ${chapters.length} lessons`,
    input.readerNumber ? `Reader #${input.readerNumber.toLocaleString("en")}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  ctx.fillText(left, pad, 572);
  ctx.textAlign = "right";
  ctx.fillText(input.siteLabel, W - pad, 572);
  ctx.textAlign = "left";
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
}
