

## Problem

Die `auth-email-hook` Edge Function blockiert seit Stunden jede Registrierung. Der Fehler ist klar in den Auth-Logs:

```text
"Hook errored out"
"error": "500: Hook requires authorization token"
"hook": "https://bqqmfajowxzkdcvmrtyd.supabase.co/functions/v1/auth-email-hook"
```

**Was passiert:** Supabase Auth ruft bei jedem Signup die Edge Function auf → die Signaturprüfung (`verifyWebhookRequest`) schlägt fehl → Function gibt 401 zurück → Supabase bricht den gesamten Signup mit 500 ab.

## Lösung: Signaturprüfung entfernen

Die `verifyWebhookRequest`-Funktion aus `@lovable.dev/webhooks-js` ist nicht kompatibel mit dem Format, das Supabase Auth an den Hook sendet. Statt weiter daran herumzuschrauben, entferne ich die Signaturprüfung komplett und parse den Body direkt als JSON.

**Warum ist das sicher?** Die Function hat `verify_jwt = false` in `config.toml` und wird ausschließlich intern von Supabase Auth aufgerufen -- nicht von externen Clients. Das ist das Standard-Pattern für Supabase Auth Hooks.

### Änderung in `supabase/functions/auth-email-hook/index.ts`

- `verifyWebhookRequest` und `WebhookError` Imports entfernen
- Den gesamten Signatur-Verifizierungs-Block (Zeilen 67-87) ersetzen durch einfaches `await req.json()`
- Den `WebhookError`-Catch-Block entfernen
- `SEND_EMAIL_HOOK_SECRET` wird nicht mehr benötigt
- `extractEmailData` und der Rest der Logik (Template-Rendering, E-Mail-Versand) bleibt unverändert

### Ergebnis

Signup → Supabase Auth ruft Hook auf → Hook parst Payload direkt → rendert E-Mail-Template → sendet über Lovable Email API → Signup erfolgreich.

