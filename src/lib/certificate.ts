import type { Progress } from "@/lib/progress";
export type ProjectReq = { slug: string; steps: number };
/** Certificate unlocks only when every lesson is finished and every project step is ticked. */
export function certificateStatus(p: Progress, lessonSlugs: string[], projects: ProjectReq[]) {
  const lessonsDone = lessonSlugs.filter((s) => p.done.includes(s)).length;
  const projectsDone = projects.filter((x) => (p.steps?.[x.slug]?.length ?? 0) >= x.steps).length;
  return { lessonsDone, lessonsTotal: lessonSlugs.length, projectsDone, projectsTotal: projects.length, complete: lessonsDone === lessonSlugs.length && projectsDone === projects.length };
}
