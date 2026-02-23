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

  // Try to load existing settings
  const { data: existing } = await supabase
    .from("user_settings")
    .select("language, timezone")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Restore saved language
    if (existing.language && supportedLangs.includes(existing.language)) {
      i18n.changeLanguage(existing.language);
    }
    // Update timezone silently
    if (existing.timezone !== timezone) {
      await supabase.from("user_settings").update({ timezone }).eq("user_id", userId);
    }
  } else {
    // First login: detect language and save
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);

        if (session?.user) {
          // Defer to avoid deadlocks with Supabase auth
          setTimeout(() => syncUserSettings(session.user.id), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
