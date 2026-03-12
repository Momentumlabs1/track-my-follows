
Ziel: OAuth (Apple/Google) so stabil machen, dass nach Consent immer eine Session entsteht und nie mehr der Fallback auf `/onboarding` passiert.

Do I know what the issue is? Ja. Sehr wahrscheinlich ist es ein Flow-Mismatch + Redirect-Race:
- Client ist auf Standard-Flow (implicit möglich), aber die App behandelt primär `?code=...` (PKCE).
- Wenn Supabase auf Root (`/`) mit Hash-Tokens zurückkommt, kann der aktuelle Root-Redirect (`/` -> `/splash`) den Hash zu früh verlieren.
- Danach ist `session=null`, Splash leitet zu Onboarding.

Umsetzungsplan

1) Auth-Bootstrap in `AuthContext` robust machen (Single Source of Truth)
- `handleOAuthReturnIfNeeded()` erweitern auf beide Rückgabeformen:
  - PKCE: `?code=...` -> `exchangeCodeForSession`
  - Implicit: `#access_token=...&refresh_token=...` -> `setSession`
  - Fehlerfälle aus Query/Hash sauber behandeln (`error`, `error_description`)
- `loading=true` behalten, bis OAuth-Verarbeitung + `getSession()` abgeschlossen sind.
- Kurzen Retry auf `getSession()` (z. B. 3–5 Versuche mit kleinem Delay), um Timing-Rennen beim Session-Persistieren abzufangen.
- Auth-Parameter danach aus URL entfernen (Query + OAuth-Hash-Keys).

2) Root-Route so ändern, dass keine Tokens verloren gehen
- In `App.tsx` Route `"/"` nicht mehr sofort mit `<Navigate to="/splash" />` umbiegen.
- Stattdessen `"/"` direkt auf `<Splash />` zeigen (und `"/splash"` für Kompatibilität behalten).
- Dadurch bleibt ein möglicher OAuth-Hash bis zum Auth-Bootstrap erhalten.

3) Callback-Seite schlank lassen
- `AuthCallback.tsx` bleibt „warte auf `loading=false`, dann dashboard/login“.
- Keine zweite, konkurrierende Exchange-Logik dort einführen.

4) OAuth-Start konsistent halten
- `Login.tsx` weiterhin mit `redirectTo: <origin>/auth/callback` + manueller Redirect-Übergabe.
- Optional: präzise Debug-Logs im OAuth-Start und im Auth-Bootstrap ergänzen (provider, redirectTo, erkannter Rückgabe-Typ), damit wir bei Restproblemen exakt sehen, wo es bricht.

5) Supabase Redirect-URLs härten (Dashboard)
- Zusätzlich zu den bestehenden Einträgen auch `https://track-my-follows.lovable.app/**` aufnehmen.
- Preview-Wildcards beibehalten.
- Ziel: kein stiller Fallback auf Site URL wegen Redirect-Mismatch.

Technische Details (kompakt)

```text
Login -> signInWithOAuth
      -> Provider Consent
      -> Supabase /callback
      -> App return (either ?code=... OR #access_token=...)
      -> AuthContext bootstrap handles both variants
      -> session persisted
      -> Splash/AuthCallback redirects to /dashboard
```

Dateien für Implementierung
- `src/contexts/AuthContext.tsx` (Hauptfix)
- `src/App.tsx` (Root-Route-Änderung)
- `src/pages/AuthCallback.tsx` (nur konsistente Wait/Redirect-Logik prüfen)
- optional `src/lib/oauth.ts` (nur falls Redirect-Ziel vereinheitlicht werden muss)

Abnahme (E2E, Pflicht)
1. Published URL: Apple Login + Signup -> immer `/dashboard`.
2. Published URL: Google Login + Signup -> immer `/dashboard`.
3. Preview URL: beide Provider, beide Flows -> gleiches Ergebnis.
4. Negativtest (Consent abbrechen): verständliche Fehlermeldung, kein „stilles“ Onboarding.
5. Nach erfolgreichem OAuth: Session vorhanden, Reload bleibt eingeloggt.
