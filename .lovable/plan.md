
Ziel: Apple Login jetzt zuverlässig live bekommen – ohne weiteres Schema-Gedöns.

Kurzdiagnose:
- Kein DB-/Schema-Problem.  
- Dein Setup ist fast fertig; Blocker ist sehr wahrscheinlich: **Settings nicht final gespeichert** und/oder **Redirect-URL-Domain-Mismatch** (Preview vs Published).
- In den Supabase Auth-Logs gibt es bereits Apple-Login-Events (`/authorize` → `/callback`), also grundsätzlich funktioniert die Provider-Kette.

Umsetzungsplan:

1) Sofort-Finalisierung (ohne Code, 5 Minuten)
- Supabase → Authentication → Providers → Apple:
  - `Client IDs`: `app.spysecretapple.web`
  - Secret Key drin lassen
  - **unten rechts Save klicken** (entscheidend)
- Apple Developer → Service ID `app.spysecretapple.web`:
  - Sign in with Apple aktiv
  - Domain: `bqqmfajowxzkdcvmrtyd.supabase.co`
  - Return URL: `https://bqqmfajowxzkdcvmrtyd.supabase.co/auth/v1/callback`
  - **Done → Continue → Save**
- Supabase → Authentication → URL Configuration:
  - Site URL: `https://track-my-follows.lovable.app`
  - Redirect URLs hinzufügen:
    - `https://track-my-follows.lovable.app/**`
    - `https://id-preview--f7c24743-5f09-4c0a-a313-7f8913c78573.lovable.app/**`
    - `https://f7c24743-5f09-4c0a-a313-7f8913c78573.lovableproject.com/**`

2) Code-Härtung (damit wir nicht wieder 2h daran hängen)
- Datei: `src/pages/Login.tsx` (`handleSocialLogin`)
- Verbesserung:
  - Für problematische Domains `skipBrowserRedirect: true`
  - `data.url` strikt validieren (nur erlaubte Hosts: dein Supabase-Host + Apple/Google OAuth Hosts)
  - dann manuell `window.location.href = data.url`
  - sauberes Loading/Error Handling, damit Button nicht hängenbleibt
- Ergebnis: stabiler OAuth-Flow auch bei Domain-/Bridge-Kantenfällen.

3) Abnahme (E2E)
- Published + Preview jeweils testen:
  - Apple Button → Apple Consent → zurück auf `/dashboard`
- Auth-Logs prüfen:
  - `/authorize` 302
  - `/callback` 302
  - Login Event mit `provider=apple`

Technische Details:
- Keine Migration, kein RLS, kein Schema-Change erforderlich.
- Problem liegt im OAuth Redirect-Flow, nicht in Supabase-Tabellen.
