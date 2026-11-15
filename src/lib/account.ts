import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getProgress, mergeProgress, replaceProgress, subscribeProgress, type Progress } from "@/lib/progress";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    void supabase.auth.getSession().then(({ data: d }) => { setUser(d.session?.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

/** Keeps the signed-in learner's progress in their account, merged with this browser's. */
export function useProgressSync() {
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    let alive = true; let timer: ReturnType<typeof setTimeout> | undefined; let unsub = () => {};
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void supabase.from("learner_progress").upsert({ user_id: user.id, data: getProgress() as never, updated_at: new Date().toISOString() });
      }, 600);
    };
    void (async () => {
      const { data, error } = await supabase.from("learner_progress").select("data").eq("user_id", user.id).maybeSingle();
      if (!alive || error) return;
      const remote = (data?.data ?? { done: [] }) as Progress;
      replaceProgress(mergeProgress(getProgress(), { done: [], ...remote }));
      save();
      unsub = subscribeProgress(save);
    })();
    return () => { alive = false; clearTimeout(timer); unsub(); };
  }, [user]);
}
