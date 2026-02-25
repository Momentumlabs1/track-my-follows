
Ja — Ursache ist jetzt klar und reproduzierbar.

## Diagnose (harte Beweise)

1. Ich habe den Flow live getestet:
   - `POST /auth/v1/token?grant_type=password` → `400 invalid_credentials` (normal beim ersten Versuch)
   - direkt danach `POST /auth/v1/signup` → `429 over_email_send_rate_limit`
   - Response: `"email rate limit exceeded"`

2. Der `auth-email-hook` wird aktuell nicht produktiv von Auth-Events getroffen:
   - Edge-Logs zeigen nur Boot/Shutdown.
   - In `function_edge_logs` sind nur manuelle Testcalls mit `401 Missing webhook timestamp` sichtbar.

3. In `auth.users` gibt es `confirmation_sent_at` bei mehreren Nutzern (also Versandversuche gab es grundsätzlich), aber der aktuelle Flow läuft jetzt in Rate-Limit.

## Root Cause (kompakt)

Es sind zwei Probleme gleichzeitig:

- Primär: Der aktuelle „Smart Auth“ in `Login.tsx` macht bei `invalid_credentials` automatisch `signUp()`. Das kann bei normalen Login-Fehleingaben massenhaft Signup/Email-Requests erzeugen und den globalen Email-Limiter triggern.
- Sekundär/infra: Der Hook-Pfad ist nicht sauber verifizierbar (keine echten Auth-getriggerten Hook-Requests in Logs). Das müssen wir nach dem Rate-Limit-Fix eindeutig sichtbar machen.

## Umsetzungsplan (direkter Fix)

1. `src/pages/Login.tsx` hart entschärfen
   - Auto-`signUp()` bei `invalid_credentials` komplett entfernen.
   - Login und Registrierung explizit trennen:
     - `handleLogin` nur `signInWithPassword`
     - `handleSignUp` nur bei explizitem „Konto erstellen“
   - `429 over_email_send_rate_limit` gezielt abfangen und klare Message zeigen.

2. `src/pages/VerifyEmail.tsx` gegen Spam absichern
   - Resend-Cooldown (z. B. 60s) einbauen.
   - Cooldown-Status sichtbar machen („erneut senden in XXs“).
   - Button während Cooldown deaktivieren.

3. `src/i18n/locales/de.json`, `en.json`, `ar.json`
   - Neue Keys für:
     - falsche Login-Daten (ohne Auto-Signup)
     - explizite Registrierung
     - Rate-Limit-Hinweis mit klarer Warte-Info
     - Resend-Cooldown-Text

4. `supabase/config.toml`
   - `[functions.auth-email-hook] verify_jwt = false` ergänzen (Webhook-Functions müssen ohne User-JWT erreichbar sein).

5. `supabase/functions/auth-email-hook/index.ts`
   - Diagnostik verbessern (maskierte Email + actionType + runId vorhanden ja/nein loggen), damit wir bei einem einzigen Testversuch sofort sehen, ob Auth den Hook wirklich aufruft.

## Validierungsplan (End-to-End, nur 1 Versuch)

```text
Neuer Account (1x) 
 -> /auth/v1/signup darf NICHT 429 sein
 -> Hook-Logs müssen POST-Request zeigen
 -> Mail kommt von notify.spy-secret.com
 -> OTP-Verifizierung klappt
 -> Login danach klappt ohne neue Signup-Requests
```

## Technische Details (für Entwickler)

- Aktueller Fehler ist reproduzierbar auf API-Ebene: `x-sb-error-code: over_email_send_rate_limit`.
- Die vorherige Änderung (kein Auto-Resend im Login) war richtig, aber nicht ausreichend:
  - Auto-`signUp` bei `invalid_credentials` bleibt ein Multiplikator für Email-Limits.
- Ohne Trennung von Login/Signup bleibt das Problem wiederholbar, selbst wenn Domain/Hook korrekt sind.

## Reihenfolge für schnellsten Erfolg

1) Smart-Auth entkoppeln (Login != Signup)  
2) Cooldown auf Resend  
3) `verify_jwt = false` für `auth-email-hook`  
4) 1 kontrollierter End-to-End-Test mit frischer Email und sofortige Log-Prüfung
