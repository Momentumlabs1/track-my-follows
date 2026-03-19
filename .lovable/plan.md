
Zuerst klar und direkt:

**Do I know what the issue is? → Ja.**

- Deine OAuth-Authentifizierung bei Supabase **funktioniert** (Auth-Logs zeigen erfolgreiche Apple/Google Logins mit `/callback` 302 + `Login` Event).
- Der Crash passiert **danach im Frontend-Routing**: Die App landet auf einer nicht registrierten Route (sehr wahrscheinlich `/oauth/auth?...`) und fällt auf `NotFound` zurück.
- Genau deshalb siehst du den 404-Screen mit BottomNav.

## Was ich baue (ohne Apple kaputtzumachen)

1. **Apple-Flow wieder separat behandeln (wie gewünscht)**
   - Datei: `src/pages/Login.tsx`
   - Native:
     - `google` bleibt auf `skipBrowserRedirect + openOAuth(...)` (wegen WebView/Google-Thematik)
     - `apple` geht wieder über normalen OAuth-Redirect (kein erzwungener NativeCallback-Zwischenschritt)
   - Ergebnis: Apple bleibt nah am alten, funktionierenden Verhalten.

2. **Fehlende Rückkehr-Route für Deep Link ergänzen**
   - Datei: `src/App.tsx`
   - Zusätzliche öffentliche Route(s): `/oauth/auth` (optional auch `/oauth/*` als Fallback)
   - Diese Route zeigt nicht 404, sondern verarbeitet den Rücksprung und leitet sauber weiter.

3. **Session-Rückkehr robust machen statt auf 404 stehenzubleiben**
   - Datei: `src/contexts/AuthContext.tsx`
   - Wenn `access_token` + `refresh_token` im Query erkannt und Session gesetzt wurde:
     - URL bereinigen
     - anschließend auf stabile Zielroute umschreiben (z. B. `/auth/callback` oder `/dashboard`), damit kein Dead-End auf `/oauth/auth` bleibt.

4. **BottomNav auf Callback-/Fallback-Routen ausblenden**
   - Datei: `src/components/BottomNav.tsx`
   - Callback-/OAuth-Routen in `isHidden` aufnehmen, damit bei Übergangsseiten kein irritierender Nav+404-Mix sichtbar ist.

## Warum genau das dein Problem löst

```text
Aktuell:
Login -> Provider -> Supabase ok -> DeepLink zurück -> /oauth/auth (keine Route) -> 404

Nach Fix:
Login -> Provider -> Supabase ok -> DeepLink zurück -> OAuth-Return-Route -> Session setzen -> Dashboard
```

## Technische Details (kurz)

- Betroffene Dateien:
  - `src/pages/Login.tsx`
  - `src/App.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/components/BottomNav.tsx`
- Kein Provider-Secret/Apple-Portal-Change nötig.
- Fokus ist rein auf Frontend-Routing + Return-Handling.

## Testplan (end-to-end, Pflicht)

1. Native Apple Login → kein 404, landet auf Dashboard.
2. Native Google Login → kein 404, landet auf Dashboard.
3. Web Apple/Google Login (`/auth/callback`) bleibt intakt.
4. Rücksprung mit abgelaufenem/fehlerhaftem Token zeigt verständlichen Fehler statt NotFound.
