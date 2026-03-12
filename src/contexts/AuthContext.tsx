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
 * Check if the current URL contains OAuth return parameters.
 */
function hasOAuthParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);

  return !!(
    params.get("code") ||
    params.get("error") ||
    hashParams.get("access_token") ||
    hashParams.get("error")
  );
}

function cleanOAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const oauthKeys = ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "type", "provider_token", "provider_refresh_token", "error", "error_description", "error_code"];
    let hadOAuthKey = false;
    for (const key of oauthKeys) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        hadOAuthKey = true;
      }
    }
    if (hadOAuthKey) {
      const remaining = hashParams.toString();
      url.hash = remaining ? `#${remaining}` : "";
    }
  }
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
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
        // On OAuth return the SDK's getSession() + onAuthStateChange will
        // automatically pick up ?code= or #access_token= and exchange them.
        // We just need to wait for that to complete with retries.
        let resolved = false;

        for (let attempt = 0; attempt < 8; attempt++) {
          const { data: { session: s } } = await supabase.auth.getSession();
          console.info(`[auth/init] OAuth retry ${attempt + 1}/8`, { hasSession: !!s });
          if (s) {
            if (mounted) setSession(s);
            resolved = true;
            break;
          }
          await new Promise(r => setTimeout(r, 500));
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
