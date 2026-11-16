import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useUser } from "@/lib/account";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Software Engineering Foundations" },
    { name: "description", content: "Sign in to save your course progress and pick up on any device." },
    { property: "og:title", content: "Sign in — Software Engineering Foundations" },
    { property: "og:description", content: "Sign in to save your course progress and pick up on any device." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) void navigate({ to: "/curriculum" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
      setMsg(error ? error.message : "Check your email and click the link to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed.");
  };
  const field = "w-full rounded-md border border-input bg-background px-3 py-2";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-4xl">{mode === "in" ? "Sign in" : "Create your free account"}</h1>
        <p className="mt-2 text-muted-foreground">Save your progress and pick up on any device. Anything you've already finished in this browser comes with you.</p>
        <button onClick={google} className="mt-8 flex w-full items-center justify-center gap-[10px] rounded-md border border-[#747775] bg-[#FFFFFF] px-3 py-2.5 text-sm font-medium text-[#1F1F1F]">
          <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input className={field} placeholder="Your name (for your certificate)" value={name} onChange={(e) => setName(e.target.value)} required />}
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={field} type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        {msg && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">{msg}</p>}
        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="mt-6 text-sm text-primary underline">{mode === "in" ? "New here? Create a free account" : "Already have an account? Sign in"}</button>
      </main>
      <SiteFooter />
    </div>
  );
}
