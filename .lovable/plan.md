
Ziel: OAuth (Apple/Google) stabil machen, damit nach Consent immer eine Session im Client ankommt und nie mehr `/onboarding` als Fehl-Fallback passiert.

Befund (aus aktuellem Code + Logs + Screenshot):
- Supabase-Logs zeigen erfolgreiche OAuth-Logins (`/authorize` → `/callback` 302, `login_method=oauth`), aber der Client landet trotzdem unauthenticated auf Onboarding.
- In `AuthContext.tsx` wird am Ende der Init-Sequenz `setSession(finalSession)` immer gesetzt. Wenn `getSession()` im Timing-Fenster noch `null` liefert, überschreibt das eine ggf. bereits vorhandene Session (Race/Overwrite).
- Redirect-Allowlist ist uneinheitlich (Duplikate, kein Live-Wildcard-Eintrag sichtbar). Das erhöht Fallback-Risiko auf Site-URL.
- `shouldSkipBrowserRedirect()` ist aktuell immer `true`; das sollte domain-basiert sein (nur Custom-Domain-Bypass).

Umsetzungsplan:
1) Supabase URL-Konfiguration bereinigen (Pflicht)
- Site URL exakt: `https://track-my-follows.lovable.app` (ohne Pfad wie `/onboarding`).
- Redirect URLs auf klare Kanonik reduzieren:
  - `https://track-my-follows.lovable.app/**`
  - `https://id-preview--f7c24743-5f09-4c0a-a313-7f8913c78573.lovable.app/**`
  - `https://f7c24743-5f09-4c0a-a313-7f8913c78573.lovableproject.com/**`
- Doppelte `/auth/callback`-Einträge entfernen (funktional redundant, erschwert Debugging).

2) OAuth-Startlogik härten (`src/lib/oauth.ts`, `src/pages/Login.tsx`)
- `skipBrowserRedirect` nur für echte Custom-Domains aktivieren; auf `*.lovable.app`/`*.lovableproject.com` normalen Flow nutzen.
- `redirectTo` weiter strikt auf `${window.location.origin}/auth/callback`.
- Host-Validation für `data.url` beibehalten.

3) Auth-Bootstrap-Race fixen (`src/contexts/AuthContext.tsx`)
- Init so umbauen, dass `null` aus `getSession()` niemals eine bereits gesetzte Session überschreibt.
- `loading` erst beenden, wenn entweder:
  - Session vorhanden ist, oder
  - OAuth-Return verarbeitet + Retry-Fenster sauber abgeschlossen ist.
- Retry-Fenster verlängern (z. B. 5–8 Versuche), damit Session-Persistenz nicht zu früh als „nicht eingeloggt“ gewertet wird.
- OAuth-Parameter-Cleanup erst nach abgeschlossener Verarbeitung.

4) Redirect-Gates absichern (`src/pages/Splash.tsx`, optional `AuthCallback.tsx`)
- Splash darf nur redirecten, wenn Auth-Bootstrap final ist.
- `AuthCallback` bleibt reine Wait-and-Redirect-Seite auf Basis des zentralen Auth-States.

5) Kurzzeit-Diagnostik für harte Verifikation
- Präzise, temporäre Logs in AuthContext:
  - „OAuth params detected“
  - „exchange/setSession result“
  - „getSession attempt x result“
  - „final auth state before Splash redirect“
- Nach erfolgreicher Abnahme Logs wieder entfernen.

Abnahme (E2E):
1. Published: Google Login + Signup → immer `/dashboard`.
2. Published: Apple Login + Signup → immer `/dashboard`.
3. Preview-Domains: gleicher Ablauf.
4. Negativtest (Consent abgebrochen): verständlicher Fehler, kein stilles Onboarding.
5. Reload direkt nach OAuth: User bleibt eingeloggt.
