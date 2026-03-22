import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NATIVE_DEEPLINK_SCHEME } from "@/lib/native";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW1mYWpvd3h6a2Rjdm1ydHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjIyNjcsImV4cCI6MjA4NzE5ODI2N30.3pTcOnNOFKCrv9VfzT5wTcUrMwuE2gPfGLG_jOQZwJ0";

/**
 * /native-callback — Runs in ASWebAuthenticationSession (system browser).
 * 
 * Flow per Despia docs:
 * 1. Supabase redirects here after OAuth with tokens in URL hash
 * 2. We extract access_token + refresh_token
 * 3. We redirect to deeplink: spysecret://oauth/auth?access_token=xxx&refresh_token=yyy
 * 4. The "oauth/" prefix tells Despia to close the browser session
 * 5. Despia navigates the WebView to /auth?access_token=xxx&refresh_token=yyy
 * 6. AuthCallback picks up tokens and calls setSession()
 */
const NativeCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [deeplinkUrl, setDeeplinkUrl] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      try {
        const deeplinkScheme = searchParams.get("deeplink_scheme") ||
                               new URLSearchParams(window.location.search).get("deeplink_scheme") ||
                               NATIVE_DEEPLINK_SCHEME;

        // Parse tokens from URL hash (Supabase implicit flow)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);

        let accessToken = hashParams.get("access_token");
        let refreshToken = hashParams.get("refresh_token");

        // If we got a code instead of tokens (PKCE flow), exchange it
        if (!accessToken) {
          const code = searchParams.get("code") ||
                       new URLSearchParams(window.location.search).get("code");

          if (code) {
            const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error: exchangeError } =
              await tempClient.auth.exchangeCodeForSession(code);

            if (exchangeError || !data.session) {
              setError(exchangeError?.message || "Code exchange failed");
              return;
            }

            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
          }
        }

        if (!accessToken) {
          const oauthError = hashParams.get("error") || searchParams.get("error");
          const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");

          if (oauthError) {
            const errorUrl = `${deeplinkScheme}://oauth/auth?error=${encodeURIComponent(oauthError)}&error_description=${encodeURIComponent(errorDesc || '')}`;
            window.location.replace(errorUrl);
            return;
          }

          setError("No tokens found in callback URL");
          return;
        }

        // Build deeplink: spysecret://oauth/auth?access_token=xxx&refresh_token=yyy
        const params = new URLSearchParams();
        params.set("access_token", accessToken);
        if (refreshToken) {
          params.set("refresh_token", refreshToken);
        }

        const url = `${deeplinkScheme}://oauth/auth?${params.toString()}`;
        console.log("[native-callback] Redirecting to deeplink:", url);
        setDeeplinkUrl(url);

        // Use replace for more reliable redirect
        window.location.replace(url);

        // Show fallback button after 3 seconds if redirect didn't work
        setTimeout(() => setShowFallback(true), 3000);
      } catch (err) {
        setError(String(err));
      }
    };

    run();
  }, [searchParams]);

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">{t('auth.login_failed')}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('auth.redirecting')}</p>
          {showFallback && deeplinkUrl && (
            <a
              href={deeplinkUrl}
              className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
            >
              {t('auth.open_app')}
            </a>
          )}
        </>
      )}
    </div>
  );
};

export default NativeCallback;
