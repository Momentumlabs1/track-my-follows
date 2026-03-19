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

    // 2) Init: let Supabase SDK handle OAuth params via getSession, then finalize
    const init = async () => {
      const isOAuthReturn = hasOAuthParams();
      console.info("[auth/init] starting", { isOAuthReturn, url: window.location.href });

      if (isOAuthReturn) {
        // For PKCE, exchange the returned code immediately to avoid long polling
        // windows in native/webview contexts.
        const oauthCode = getOAuthCode();
        if (oauthCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(oauthCode);
          if (exchangeError) {
            console.warn("[auth/init] code exchange failed", { message: exchangeError.message });
          }
        }

        let resolved = false;

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          if (mounted) setSession(initialSession);
          resolved = true;
        }

        if (!resolved) {
          for (let attempt = 0; attempt < 4; attempt++) {
            await new Promise(r => setTimeout(r, 250));
            const { data: { session: s } } = await supabase.auth.getSession();
            console.info(`[auth/init] OAuth retry ${attempt + 1}/4`, { hasSession: !!s });
            if (s) {
              if (mounted) setSession(s);
              resolved = true;
              break;
            }
          }
        }

        cleanOAuthParams();

        if (!resolved) {
          console.warn("[auth/init] OAuth return but no session after retries");
        }
      } else {
        // Normal app load — single getSession check
        const { data: { session: s } } = await supabase.auth.getSession();
        console.info("[auth/init] normal load", { hasSession: !!s });
        if (mounted && s) {
          setSession(s);
        }
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
