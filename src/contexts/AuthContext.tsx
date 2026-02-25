import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const gtag = (...args: unknown[]) => (window as any).gtag?.(...args);

  const setGAUser = async (u: User) => {
    gtag("set", { user_id: u.id });
    gtag("set", "user_properties", { logged_in: "true" });

    // Fetch subscription tier for segmentation
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, is_subscribed")
      .eq("user_id", u.id)
      .single();

    if (data) {
      gtag("set", "user_properties", {
        subscription_tier: data.subscription_tier,
        is_subscribed: String(data.is_subscribed),
      });
    }
  };

  const clearGAUser = () => {
    gtag("set", { user_id: undefined });
    gtag("set", "user_properties", {
      logged_in: "false",
      subscription_tier: undefined,
      is_subscribed: undefined,
    });
  };

  const syncSubscription = async () => {
    try {
      await supabase.functions.invoke("check-subscription");
    } catch (e) {
      console.error("Subscription sync failed:", e);
    }
  };

  const checkBlocked = async (u: User) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_blocked")
      .eq("user_id", u.id)
      .single();
    if (data?.is_blocked) {
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          const blocked = await checkBlocked(session.user);
          if (blocked) return;
          setTimeout(syncSubscription, 0);
          setGAUser(session.user);
        } else {
          clearGAUser();
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        const blocked = await checkBlocked(session.user);
        if (blocked) return;
        syncSubscription();
        setGAUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
