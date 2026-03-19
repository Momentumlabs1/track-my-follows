import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function syncUserSettings(userId: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs = ['en', 'de', 'ar'];

  const { data: existing } = await supabase
    .from("user_settings")
    .select("language, timezone")
    .eq("user_id", userId)
    .single();

  if (existing) {
    if (existing.language && supportedLangs.includes(existing.language)) {
      i18n.changeLanguage(existing.language);
    }
    if (existing.timezone !== timezone) {
      await supabase.from("user_settings").update({ timezone }).eq("user_id", userId);
    }
  } else {
    const language = supportedLangs.includes(browserLang) ? browserLang : 'en';
    i18n.changeLanguage(language);
    await supabase.from("user_settings").upsert({
      user_id: userId,
      timezone,
      language,
    }, { onConflict: "user_id" });
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Auth state listener — this is the ONLY place that updates session after init
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        console.info("[auth] onAuthStateChange", { event: _event, hasSession: !!newSession });
        setSession(newSession);

        if (newSession?.user) {
          setTimeout(() => syncUserSettings(newSession.user.id), 0);
        }
      }
    );

    const init = async () => {
      // Check if we received tokens from Despia native OAuth deeplink return
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");

      if (accessToken && refreshToken) {
        console.info("[auth/init] Setting session from native OAuth tokens");
        // Clean URL
        url.searchParams.delete("access_token");
        url.searchParams.delete("refresh_token");
        window.history.replaceState({}, "", url.pathname + url.search);

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error("[auth/init] setSession failed", error.message);
        }
      }

      const { data: { session: s } } = await supabase.auth.getSession();
      console.info("[auth/init]", { hasSession: !!s });
      if (mounted && s) {
        setSession(s);
      }
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
