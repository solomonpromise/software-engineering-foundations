import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Printer } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { LogoMark } from "@/components/CertLogo";
import { chapters, parts } from "@/content/lessons";
import { projectSlug } from "./projects.$slug";
import { setCertificateName, useProgress } from "@/lib/progress";
import { certificateStatus } from "@/lib/certificate";

export const Route = createFileRoute("/certificate")({
  head: () => ({ meta: [
    { title: "Certificate of completion — Software Engineering Foundations" },
    { name: "description", content: "Finish all 34 lessons and six projects to earn your Software Engineering Foundations certificate." },
    { property: "og:title", content: "Certificate of completion — Software Engineering Foundations" },
    { property: "og:description", content: "Finish all 34 lessons and six projects to earn your Software Engineering Foundations certificate." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CertificatePage,
});

const projects = parts.map((p) => ({ slug: projectSlug(p.number), steps: p.project.steps.length }));

function CertificatePage() {
  const progress = useProgress();
  const st = certificateStatus(progress, chapters.map((c) => c.slug), projects);
  const name = progress.certificateName ?? "";
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden"><SiteHeader /></div>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="print:hidden">
          <h1 className="font-serif text-4xl">Certificate of completion</h1>
          <p className="mt-2 text-muted-foreground">Finish every lesson and every project to earn it.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Lessons finished" value={`${st.lessonsDone} of ${st.lessonsTotal}`} pct={st.lessonsDone / st.lessonsTotal} />
            <Stat label="Projects completed" value={`${st.projectsDone} of ${st.projectsTotal}`} pct={st.projectsDone / st.projectsTotal} />
          </div>
        </div>
        {!st.complete ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center print:hidden">
            <Award className="mx-auto size-10 text-accent" />
            <p className="mt-3 font-serif text-2xl">Not unlocked yet</p>
            <p className="mt-1 text-muted-foreground">Keep going — your certificate appears here once everything is done.</p>
            <Link to="/curriculum" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Go to the curriculum</Link>
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap items-end gap-3 print:hidden">
              <label className="flex-1 text-sm">Name on certificate <span className="text-muted-foreground">(saved in this browser only)</span>
                <input value={name} onChange={(e) => setCertificateName(e.target.value)} maxLength={80} autoComplete="name" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              </label>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Printer className="size-4" /> Download / print</button>
            </div>
            <section className="mt-8 aspect-[1.414] w-full rounded-lg border-[6px] border-double border-brass bg-card p-10 text-center shadow-lg print:mt-0 print:shadow-none">
              <div className="flex h-full flex-col items-center justify-center">
                <LogoMark />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-accent">Certificate of completion</p>
                <p className="mt-6 text-muted-foreground">This certifies that</p>
                <p className="mt-2 font-serif text-4xl sm:text-5xl">{name || "Your name"}</p>
                <p className="mx-auto mt-4 max-w-lg text-muted-foreground">has completed all 34 lessons and six projects of <span className="font-semibold text-foreground">Software Engineering Foundations</span>, an open learning resource founded by Solomon Promise.</p>
                <p className="mt-8 text-sm text-muted-foreground">{date}</p>
              </div>
            </section>
          </>
        )}
      </main>
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}

function Stat({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="text-muted-foreground">{value}</span></div>
      <div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-brass" style={{ width: `${Math.round(pct * 100)}%` }} /></div>
    </div>
  );
}
