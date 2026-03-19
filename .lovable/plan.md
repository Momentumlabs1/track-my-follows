

## Despia Native OAuth — Richtiger Flow mit `oauth://` Protokoll

### Warum es früher ging und jetzt nicht

Die Despia-Doku zeigt klar: Für nativen OAuth (ASWebAuthenticationSession auf iOS, Chrome Custom Tabs auf Android) muss die OAuth-URL über das **`oauth://`-Protokoll** von Despia geöffnet werden — nicht als normale Navigation im WebView. Der aktuelle Code macht einfach `signInWithOAuth()` ohne `skipBrowserRedirect`, was die URL direkt im WebView öffnet → Google-Webseite statt nativer Picker.

### Der Despia OAuth-Flow (laut Doku)

```text
1. User tippt "Sign in with Google"
2. App ruft signInWithOAuth({ skipBrowserRedirect: true }) auf
   → bekommt die OAuth-URL zurück, navigiert NICHT
3. App ruft despia('oauth://?url={encodedOAuthUrl}') auf
   → Despia öffnet ASWebAuthenticationSession (nativer Picker)
4. User authentifiziert sich nativ
5. Google redirected zu /native-callback auf deiner Domain
6. /native-callback Seite extrahiert Tokens/Code aus URL
7. /native-callback redirected zu deeplink: {scheme}://oauth/auth?tokens
   → Das "oauth/" Prefix sagt Despia: Browser schließen!
8. App empfängt Tokens über die WebView-URL, setzt Session
```

### Konkrete Änderungen (4 Dateien + 1 neue)

**1. `src/pages/Login.tsx` — Zwei Pfade: Native vs. Web**
- Wenn `isNativeApp()`: `signInWithOAuth({ skipBrowserRedirect: true })` aufrufen, OAuth-URL holen, dann `despia('oauth://?url=...')` aufrufen
- Wenn Web: normaler `signInWithOAuth()` wie jetzt (funktioniert im Browser)

**2. `src/lib/native.ts` — `openOAuth()` Funktion hinzufügen**
- Neue Exportfunktion: `openOAuth(url: string)` die `despia('oauth://?url=...')` aufruft
- Kapselt den Despia-Aufruf sauber

**3. Neue Seite: `src/pages/NativeCallback.tsx` — Token-Handoff**
- Route: `/native-callback`
- Läuft im **Browser** (nicht im WebView), nach Google/Apple Redirect
- Extrahiert `code` oder `access_token` aus URL
- Tauscht Code gegen Session (via Supabase) falls nötig
- Redirected zu Deeplink: `{scheme}://oauth/auth?access_token=...&refresh_token=...`
- Das `oauth/` Prefix schließt automatisch den Browser

**4. `src/App.tsx` — Route `/native-callback` hinzufügen**

**5. `src/contexts/AuthContext.tsx` — Token-Empfang**
- Prüft beim Init ob URL Tokens aus dem Deeplink-Return enthält (z.B. `/auth?access_token=...`)
- Wenn ja: `supabase.auth.setSession()` mit den Tokens aufrufen

### Was dafür in Despia konfiguriert sein muss

- **App Link Scheme** muss gesetzt sein (z.B. `spysecret://`) — das ist die Deeplink-Scheme
- **Redirect URL in Supabase**: `https://track-my-follows.lovable.app/native-callback` muss in der Allowlist stehen
- **Google OAuth Console**: `https://track-my-follows.lovable.app/native-callback` als Redirect URI hinzufügen

### Frage vor Implementierung

Ich muss wissen welche **Deeplink-Scheme** in Despia konfiguriert ist (z.B. `spysecret://`, `spysecretapp://`, etc.). Das findest du in Despia unter "Web App Synchronization" → "App Link Scheme". Ohne das kann der Browser nach dem Login nicht zurück zur App redirecten.

