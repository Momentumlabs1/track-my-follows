

## Apple Sign-In Fix: "Anmeldung nicht abgeschlossen" auf mehreren Geraeten

### Ursache

Der neue Apple JS SDK Flow (`AppleID.auth.signIn()` mit `usePopup: true`) schlaegt fehl, weil:

1. **In der Despia-App (WebView)**: Apple's Popup-Flow funktioniert nicht zuverlaessig in WebViews. Das Apple-SDK oeffnet ein Popup-Fenster, das im WebView-Kontext blockiert oder fehlerhaft ablaeuft.
2. **Redirect-URI Mismatch**: `window.location.origin` ist in der Preview/Despia ein anderer Origin als `https://track-my-follows.lovable.app`, aber nur diese Domain ist bei Apple registriert.
3. **Domain-Verifizierung**: Apple verlangt, dass die Domain, von der das JS SDK aufgerufen wird, im Apple Developer Portal unter der Service-ID verifiziert ist.

### Loesung: Hybrid-Strategie

**Native App (Despia)**: Apple bekommt denselben Flow wie Google -- ueber `auth-start` Edge Function + `oauth://` Deeplink. Das funktioniert zuverlaessig (Supabase.co bleibt sichtbar, aber Login funktioniert).

**Web Browser**: Apple JS SDK Popup-Flow bleibt erhalten, aber mit **hardcoded** redirectURI auf `https://track-my-follows.lovable.app/auth/callback` (nicht `window.location.origin`).

### Aenderungen

**`src/pages/Login.tsx`** (~25 Zeilen):
- `handleAppleLogin` pruefen: Wenn `isNativeApp()` → alten OAuth-Flow nutzen (wie `handleGoogleLogin` fuer native)
- Wenn NICHT native → Apple JS SDK Popup-Flow behalten, aber redirectURI hardcoden
- Error-Handling fuer beide Pfade

```text
handleAppleLogin:
  if (isNativeApp()):
    → supabase.functions.invoke("auth-start", { provider: "apple", deeplink_scheme })
    → despia("oauth://...")
    → ASWebAuthenticationSession oeffnet sich
    → NativeCallback → Deeplink → AuthCallback → Dashboard
  else:
    → AppleID.auth.init({ redirectURI: "https://track-my-follows.lovable.app/auth/callback" })
    → AppleID.auth.signIn() popup
    → signInWithIdToken()
    → Dashboard
```

### Ergebnis

| Kontext | Vorher | Nachher |
|---------|--------|---------|
| Native App | Apple JS SDK popup → Fehler | auth-start OAuth → funktioniert |
| Web Browser | window.location.origin → Fehler auf Preview | Hardcoded live-URL → funktioniert |

### Spaeter (Schritt 2 - Custom Domain)
Sobald eine Supabase Custom Auth Domain eingerichtet ist, verschwindet auch "supabase.co" aus dem nativen OAuth-Dialog. Das ist ein separater Schritt.

