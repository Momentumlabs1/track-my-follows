import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const waitForSession = async (attempts = 12, delayMs = 250) => {
      for (let i = 0; i < attempts; i += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          return session;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return null;
    };

    const handleCallback = async () => {
      const oauthError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (oauthError) {
        console.error("[auth/callback] OAuth error:", oauthError, errorDescription);
        setError(errorDescription || oauthError);
        setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("[auth/callback] Code exchange failed:", exchangeError.message);
          setError(exchangeError.message);
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }
      }

      const session = await waitForSession();
      if (session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      console.warn("[auth/callback] No session found after OAuth callback");
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
