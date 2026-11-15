export type Verdict = "got" | "not";
/** A lesson can be marked finished only when every check question is self-marked "got it". */
export function canFinish(verdicts: Record<number, Verdict>, total: number) {
  if (total === 0) return true;
  for (let i = 0; i < total; i++) if (verdicts[i] !== "got") return false;
  return true;
}
export const gotCount = (v: Record<number, Verdict>) => Object.values(v).filter((x) => x === "got").length;
