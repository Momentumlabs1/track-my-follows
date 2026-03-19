import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { NATIVE_DEEPLINK_SCHEME } from "@/lib/native";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW1mYWpvd3h6a2Rjdm1ydHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjIyNjcsImV4cCI6MjA4NzE5ODI2N30.3pTcOnNOFKCrv9VfzT5wTcUrMwuE2gPfGLG_jOQZwJ0";

/**
 * /native-callback — Runs in the SYSTEM BROWSER after OAuth redirect.
 * Extracts tokens from the URL hash fragment, then redirects to a
 * deeplink that brings the user back into the native app.
 *
 * The "oauth/" path prefix tells Despia to close the browser automatically.
 */
const NativeCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        let accessToken = params.get("access_token");
        let refreshToken = params.get("refresh_token");

        // If we got a code instead of tokens, exchange it
        if (!accessToken) {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get("code");

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

        if (!accessToken || !refreshToken) {
          setError("No tokens found in callback URL");
          return;
        }

        // Redirect to native app via deeplink
        // The "oauth/" prefix tells Despia to close the system browser
        const deeplink = `${NATIVE_DEEPLINK_SCHEME}://oauth/auth?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
        window.location.href = deeplink;
      } catch (err) {
        setError(String(err));
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Login fehlgeschlagen</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Weiterleitung zu SpySecret…</p>
        </>
      )}
    </div>
  );
};

export default NativeCallback;
