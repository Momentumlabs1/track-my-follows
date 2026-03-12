
Ziel: OAuth (Google + Apple) stabil machen, damit nie wieder auf `localhost` zurückgeleitet wird und Login auf Live/Preview/Native zuverlässig endet.

Do I know what the issue is? Ja.  
Beleg:
- Dein Screenshot zeigt `ERR_CONNECTION_REFUSED` auf `localhost`.
- Auth-Logs zeigen erfolgreiche `/authorize` + `/callback` + `login` Events (Google und Apple).  
=> Provider-Credentials sind grundsätzlich ok; der Bruch passiert beim finalen Redirect-Ziel.

Umsetzung (Code):
1) Zentrale OAuth-Redirect-Strategie einführen (`src/lib/oauth.ts`)
- Umgebung erkennen: `native` (despia), `localhost`, `preview`, `published`.
- Redirect-Base deterministisch setzen:
  - Native/localhost => immer `https://track-my-follows.lovable.app`
  - Web (Preview/Published) => `window.location.origin`
- Immer auf festen Callback-Pfad: `/auth/callback`
- Helper für sichere URL-Validierung (nur Supabase-Auth-Host erlauben), damit kein Open-Redirect möglich ist.

2) Neue öffentliche Callback-Seite bauen (`src/pages/AuthCallback.tsx`)
- `code` aus Query lesen und `exchangeCodeForSession(code)` ausführen.
- OAuth-Fehler (`error`, `error_description`) sauber anzeigen.
- Bei Erfolg: `navigate("/dashboard", { replace: true })`
- Bei Fehler: `navigate("/login", { replace: true })`
- Optional: wenn in Popup geöffnet, `postMessage` an Opener + close.

3) Router ergänzen (`src/App.tsx`)
- Neue Public Route: `/auth/callback`.

4) Login-Flow härten (`src/pages/Login.tsx`)
- `handleSocialLogin` auf neuen Helper umstellen.
- `redirectTo` immer aus zentralem Resolver.
- `skipBrowserRedirect: true` beibehalten.
- Bei Rückgabe von `data.url`: zuerst validieren, dann redirecten.
- Stabileres Loading/Error-Handling über `finally`, damit Buttons nie hängen.

5) Native-Fallback klar machen
- Wenn Runtime `localhost` ist (Native-WebView), OAuth wird bewusst auf Published-Domain beendet (statt localhost), damit kein `ERR_CONNECTION_REFUSED` mehr entsteht.

Supabase/Provider-Finalcheck (ohne DB-Schema-Änderung):
- Keine Migration, kein RLS, kein Schema-Fix nötig.
- Supabase URL Configuration:
  - Site URL: `https://track-my-follows.lovable.app`
  - Redirects inkl.:
    - `https://track-my-follows.lovable.app/auth/callback`
    - `https://id-preview--f7c24743-5f09-4c0a-a313-7f8913c78573.lovable.app/auth/callback`
    - `https://f7c24743-5f09-4c0a-a313-7f8913c78573.lovableproject.com/auth/callback`
- Google/Apple behalten Supabase Callback (`https://bqqmfajowxzkdcvmrtyd.supabase.co/auth/v1/callback`).

Abnahme (E2E):
1) Live: Google + Apple von `/login` -> Consent -> `/auth/callback` -> `/dashboard`.
2) Preview: gleicher Ablauf.
3) Native: kein localhost-Fehler mehr.
4) Logs prüfen: erfolgreiche login-events; finaler Browser-URL-Flow endet nicht auf localhost.
