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
 * Detect OAuth return tokens in URL — supports both PKCE (?code=) and
 * implicit flow (#access_token=). Returns true if tokens were found and
 * processed (successfully or not).
 */
async function handleOAuthReturnIfNeeded(): Promise<boolean> {
  // 1) Check query params for PKCE code or error
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const queryError = params.get("error");

  // 2) Check hash fragment for implicit tokens or error
  const hash = window.location.hash.substring(1); // remove leading #
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const hashError = hashParams.get("error");

  const hasOAuthParams = !!(code || queryError || accessToken || hashError);

  if (!hasOAuthParams) return false;

  console.info("[auth/global] OAuth return detected", {
    hasPKCE: !!code,
    hasImplicit: !!accessToken,
    hasError: !!(queryError || hashError),
  });

  // Handle errors from either flow
  if (queryError || hashError) {
    const errorMsg = queryError || hashError;
    const errorDesc = params.get("error_description") || hashParams.get("error_description");
    console.error("[auth/global] OAuth error:", errorMsg, errorDesc);
    cleanOAuthParams();
    return false;
  }

  // PKCE flow: exchange code for session
  if (code) {
    console.info("[auth/global] Exchanging PKCE code");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/global] PKCE exchange failed:", error.message);
    }
    cleanOAuthParams();
    return !error;
  }

  // Implicit flow: setSession with the tokens from hash
  if (accessToken && refreshToken) {
    console.info("[auth/global] Setting session from implicit tokens");
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.error("[auth/global] setSession failed:", error.message);
    }
    cleanOAuthParams();
    return !error;
  }

  // access_token without refresh_token — unusual but clean up
  cleanOAuthParams();
  return false;
}

function cleanOAuthParams() {
  const url = new URL(window.location.href);
  // Clean query params
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  // Clean hash — remove only OAuth-related keys, preserve non-OAuth hash
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

    // 2) Init sequence: exchange OAuth tokens if present, then get session
    const init = async () => {
      // If there are OAuth params in the URL, handle them first
      await handleOAuthReturnIfNeeded();

      // Now get the (possibly just-created) session — with retry for persistence timing
      let finalSession: Session | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          finalSession = s;
          break;
        }
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (mounted) {
        setSession(finalSession);
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
