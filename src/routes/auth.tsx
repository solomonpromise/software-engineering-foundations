import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(), data: { full_name: name } } });
      setMsg(error ? error.message : "Check your email and click the link to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  };
  const field = "w-full rounded-md border border-input bg-background px-3 py-2";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-4xl">{mode === "in" ? "Sign in" : "Create your free account"}</h1>
        <p className="mt-2 text-muted-foreground">Save your progress and pick up on any device. Anything you've already finished in this browser comes with you.</p>
        <div className="mt-8" />
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
