import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for OAuth error params
      const oauthError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (oauthError) {
        console.error("[auth/callback] OAuth error:", oauthError, errorDescription);
        setError(errorDescription || oauthError);
        setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      // Check for code in URL (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[auth/callback] Code exchange failed:", exchangeError.message);
          setError(exchangeError.message);
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check hash fragment (implicit flow fallback)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase client auto-detects hash tokens via onAuthStateChange
        // Just wait briefly for session to be set
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      // No code, no hash, no error → redirect to login
      console.warn("[auth/callback] No auth params found, redirecting to login");
      navigate("/login", { replace: true });
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">Login fehlgeschlagen</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">Weiterleitung zum Login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallback;
