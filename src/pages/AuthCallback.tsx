import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * /auth and /auth/callback — handles OAuth token returns.
 * 
 * After Despia deeplink return, the WebView navigates to:
 *   /auth?access_token=xxx&refresh_token=yyy
 * 
 * This page:
 * 1. Checks URL query params AND hash for tokens
 * 2. Calls setSession() if tokens found
 * 3. Redirects to /dashboard on success, /login on failure
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      // Try to get tokens from query params (Despia deeplink return)
      const url = new URL(window.location.href);
      let accessToken = url.searchParams.get("access_token");
      let refreshToken = url.searchParams.get("refresh_token");

      // Also check hash (Supabase implicit flow)
      if (!accessToken) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        accessToken = hashParams.get("access_token");
        refreshToken = hashParams.get("refresh_token");
      }

      // Check for PKCE code
      if (!accessToken) {
        const code = url.searchParams.get("code");
        if (code) {
          console.info("[auth/callback] Exchanging code for session");
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          if (codeError || !data.session) {
            console.error("[auth/callback] Code exchange failed:", codeError?.message);
            setError(codeError?.message || "Code exchange failed");
            return;
          }
          // onAuthStateChange will pick up the session
          console.info("[auth/callback] Code exchange successful");
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      if (accessToken && refreshToken) {
        console.info("[auth/callback] Setting session from tokens");
        // Clean URL
        url.searchParams.delete("access_token");
        url.searchParams.delete("refresh_token");
        window.history.replaceState({}, "", url.pathname);

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("[auth/callback] setSession failed:", sessionError.message);
          setError(sessionError.message);
          return;
        }

        console.info("[auth/callback] Session set successfully");
        // Check if user is new (created < 60s ago) → trigger tutorial
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        if (sessionUser) {
          const createdAt = new Date(sessionUser.created_at).getTime();
          const isNew = Date.now() - createdAt < 60_000;
          if (isNew) {
            console.info("[auth/callback] New user detected, setting showWelcome");
            sessionStorage.setItem(`show_welcome_${sessionUser.id}`, "1");
            navigate("/dashboard", { replace: true, state: { showWelcome: true } });
            return;
          }
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      // No tokens found — wait for AuthContext to resolve
      console.info("[auth/callback] No tokens in URL, waiting for AuthContext");
    };

    run();
  }, [navigate]);

  // Fallback: if no tokens were processed, wait for AuthContext
  useEffect(() => {
    if (hasRun.current && !loading && !error) {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [user, loading, error, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Login fehlgeschlagen</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            Zurück zum Login
          </button>
        </div>
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      )}
    </div>
  );
};

export default AuthCallback;
