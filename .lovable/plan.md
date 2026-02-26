
Kurzdiagnose
- Nein: der 6-stellige Code wird von Supabase Auth generiert, nicht vom Frontend.
- Wahrscheinliche Fehlerquellen im aktuellen Code: falsches Routing in den Verify-Flow bei „already registered“, veralteter Code ohne automatisches Fresh-Resend, fehlende E-Mail-Normalisierung/robuste Fehlerbehandlung.

Umsetzungsplan
1) Login-Flow absichern (`src/pages/Login.tsx`)
- E-Mail vor jedem Auth-Call normalisieren (`trim().toLowerCase()`).
- „already registered“-Branch umbauen: nicht blind auf `/verify-email` leiten.
- Stattdessen gezielt `auth.resend({ type: "signup" })` testen:
  - wenn erfolgreich → `/verify-email` mit frischem Code
  - wenn nicht erfolgreich → als normales Login-Problem behandeln (falsches Passwort/Account-Zustand).
- In allen frühen Returns `setLoading(false)` konsistent setzen.

2) Verify-Flow robuster machen (`src/pages/VerifyEmail.tsx`)
- E-Mail nicht nur aus `location.state`, zusätzlich aus Query-Param (`?email=`) lesen.
- OTP-Eingabe härten: nur Ziffern akzeptieren/säubern, vor Verify trimmen.
- Doppelte Verify-Requests verhindern (Auto-Submit entschärfen oder entfernen; eindeutiger Submit-Trigger).
- Fehlercodes gezielt behandeln (`otp_expired`, `invalid token`): klare UX + optional automatisches Resend.
- Bei erfolgreichem Resend deutlicher Hinweis: nur der neueste Code ist gültig.

3) Navigation stabilisieren (`src/pages/Login.tsx`, `src/pages/VerifyEmail.tsx`)
- Beim Redirect immer auch Query-Param setzen (`/verify-email?email=...`) als Fallback gegen State-Verlust (Reload/Neustart/App-Wechsel).

4) Texte ergänzen (`src/i18n/locales/de.json`, `src/i18n/locales/en.json`)
- Neue Auth-Messages für:
  - „nur letzter Code gültig“
  - „Code abgelaufen, neuer Code gesendet“
  - „Account existiert, bitte Passwort prüfen oder Reset nutzen“

5) Reproduzierbares Debugging einbauen (temporär)
- In Login/Verify strukturierte `console.info` mit anonymisierten Daten (kein Token im Log): auth-step, normalized email hash, error code/message.
- Danach End-to-End prüfen: neuer Account, bestehender unbestätigter Account, bestehender bestätigter Account.

Technische Details
- Betroffene Dateien:
  - `src/pages/Login.tsx`
  - `src/pages/VerifyEmail.tsx`
  - `src/i18n/locales/de.json`
  - `src/i18n/locales/en.json`
- Keine DB-Migration erforderlich.
- Keine Änderung an Supabase-Tabellen/RLS erforderlich.
- Dashboard-Check bleibt: `Authentication -> Providers -> Email -> Email OTP Expiration = 600`.
