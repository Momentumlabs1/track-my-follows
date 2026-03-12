
Ziel: Google/Apple OAuth so stabil machen, dass der Nutzer nach Consent nie mehr auf `/onboarding` „verloren geht“.

Do I know what the issue is? Ja.  
Dein Signal „ich lande direkt auf /onboarding“ + erfolgreiche Supabase `/callback` Login-Logs bedeutet: Der OAuth-Rücksprung landet nicht immer sauber auf der erwarteten Callback-Verarbeitung, und die App-Startlogik (Splash) leitet zu früh weiter.

Was ich bauen werde

1) Globalen OAuth-Return-Handler einführen (nicht nur auf `/auth/callback`)
- In `AuthContext` (oder dediziertem Hook) beim App-Start auf **jeder** Route prüfen:
  - `?code=...` → `exchangeCodeForSession(code)`
  - `?error=...` → Fehlerzustand setzen
- Währenddessen Auth-Loading aktiv halten, damit keine frühe Navigation passiert.
- Nach erfolgreichem Exchange URL bereinigen (`history.replaceState`) und Session normal fortführen.

2) Redirect-Race bei Splash/Onboarding verhindern
- `Splash.tsx` darf erst redirecten, wenn OAuth-Processing + `getSession()` abgeschlossen sind.
- Dadurch kein „Fallback auf Onboarding“, während Session noch aufgebaut wird.

3) Callback-Seite als deterministischen Pfad behalten, aber robust machen
- `/auth/callback` bleibt aktiv.
- Nutzt denselben zentralen Handler statt eigener paralleler Logik (keine doppelte Exchange-Logik, keine Race-Conditions).

4) OAuth-Start in Login härten
- `signInWithOAuth` bleibt mit validierter URL und kontrollierter Weiterleitung.
- Redirect-Strategie wird so vereinheitlicht, dass Preview/Published/Native denselben sicheren Ablauf nutzen.

5) Supabase URL-Konfiguration sauberziehen
- Sicherstellen, dass auch `https://track-my-follows.lovable.app/**` erlaubt ist (nicht nur der exakte Callback-Pfad).
- Vorhandene Preview-URLs beibehalten.
- Keine Domain-Wildcards wie `https://*.xyz`.

Technische Details (kurz)

````text
Login -> signInWithOAuth
      -> Provider consent
      -> Supabase /callback
      -> App (any route: /auth/callback, /, /splash, /onboarding)
      -> Global handler exchanges code
      -> session ready
      -> /dashboard
````

Abnahme (E2E)
1) Published: Google + Apple → immer Dashboard.
2) Preview (`lovable.app` + `lovableproject.com`): gleicher Ablauf.
3) Native: kein Rückfall auf Onboarding nach Consent.
4) Negativtest: OAuth-Error zeigt verständliche Meldung + Rückkehr zu Login.
