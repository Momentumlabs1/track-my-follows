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

/**
 * Global OAuth code exchange: if the current URL contains ?code=…,
 * exchange it for a session before anything else happens.
 * This prevents race conditions where Splash/Onboarding redirect
 * before the session is established.
 */
async function handleOAuthReturnIfNeeded(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");

  if (!code && !error) return false; // nothing to do

  if (error) {
    console.error("[auth/global] OAuth error in URL:", error, params.get("error_description"));
    // Clean URL and let the app continue (user will land on login/onboarding)
    cleanOAuthParams();
    return false;
  }

  // Exchange the code
  console.info("[auth/global] Exchanging OAuth code from URL");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/global] Code exchange failed:", exchangeError.message);
  }

  // Always clean the URL regardless of success/failure
  cleanOAuthParams();
  return !exchangeError;
}

function cleanOAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", url.pathname + url.hash);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        // Don't setLoading(false) here — we do it after the init sequence below

        if (session?.user) {
          setTimeout(() => syncUserSettings(session.user.id), 0);
        }
      }
    );

    // 2) Init sequence: exchange OAuth code if present, then get session
    const init = async () => {
      // If there's a ?code= in the URL, exchange it first
      await handleOAuthReturnIfNeeded();

      // Now get the (possibly just-created) session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
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
