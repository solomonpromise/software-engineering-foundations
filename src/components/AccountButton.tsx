import { Link } from "@tanstack/react-router";
import { UserRound, LogOut, Award, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/account";

export function AccountButton() {
  const { user, ready } = useUser();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(false);
    if (!user) return;
    void supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle().then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);
  if (!ready) return <span className="size-9" />;
  if (!user) return <Link to="/auth" className="whitespace-nowrap rounded-full border border-header-accent/45 px-3 py-1.5 text-sm text-header-foreground hover:bg-header-accent/15">Sign in</Link>;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Your account" className="flex size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15"><UserRound className="size-4" /></button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
          <p className="truncate px-2 py-1 text-xs text-muted-foreground">{user.email}</p>
          <p className="px-2 pb-2 text-xs text-muted-foreground">Your progress is saved to your account.</p>
          <Link to="/certificate" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary"><Award className="size-4" /> Certificate</Link>
          {isAdmin && <Link to="/feedback" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary"><MessageSquareText className="size-4" /> Learner feedback</Link>}
          <button onClick={async () => { setOpen(false); await supabase.auth.signOut(); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-secondary"><LogOut className="size-4" /> Sign out</button>
        </div>
      )}
    </div>
  );
}
