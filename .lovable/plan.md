

## Apple Sign-In auf nativen Flow umbauen (kein Browser-Redirect)

### Problem

Beide OAuth-Provider (Apple + Google) leiten aktuell uber `bqqmfajowxzkdcvmrtyd.supabase.co/auth/v1/authorize` weiter. iOS zeigt diese Domain dem User in einem System-Dialog und auf der Consent-Seite. Das sieht unprofessionell aus.

### Losung: Apple bekommt nativen ID-Token-Flow

Statt den User uber Supabase OAuth zu leiten, nutzen wir **Apple JS SDK** direkt. Das zeigt auf iOS den **nativen Apple-Dialog** (kein Browser, kein supabase.co sichtbar). Auf Web zeigt es Apples eigenes Popup.

Google bleibt vorerst unverandert (Vanity/Custom Domain muss separat eingerichtet werden).

### Technische Anderungen

**1. `index.html`** -- Apple JS SDK laden
- Script-Tag hinzufugen: `<script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>`

**2. `src/vite-env.d.ts`** -- TypeScript-Deklaration
- `AppleID` global deklarieren damit TypeScript den Apple JS SDK kennt

**3. `src/pages/Login.tsx`** -- Apple-Flow umschreiben
- Bisheriger Apple-Flow: `auth-start` Edge Function -> `oauth://` -> ASWebAuthenticationSession -> supabase.co sichtbar
- Neuer Apple-Flow:
  1. `AppleID.auth.init()` mit clientId (`app.spysecretapple.web`), scope, redirectURI
  2. `AppleID.auth.signIn()` aufrufen -- zeigt nativen Apple-Dialog
  3. Response enthalt `id_token`
  4. `supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken })` aufrufen
  5. Session ist gesetzt, navigate zu `/dashboard`
- Kein `auth-start`, kein `oauth://`, kein Browser-Redirect mehr fur Apple
- Google-Flow bleibt komplett unverandert (Web: `signInWithOAuth`, Native: `auth-start` + `oauth://`)

### Was sich andert

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Apple Login | Browser offnet sich, supabase.co sichtbar | Nativer Apple-Dialog, kein Browser |
| Google Login | Keine Anderung | Keine Anderung (braucht Vanity Domain) |
| Edge Function auth-start | Wird von Apple + Google genutzt | Nur noch von Google genutzt |
| Neue Dependency | -- | Apple JS SDK (CDN Script) |

### Voraussetzung (bereits erfullt laut Memory)

- Apple Service ID `app.spysecretapple.web` ist konfiguriert
- Apple Provider ist in Supabase Auth aktiviert
- Return URL ist auf `bqqmfajowxzkdcvmrtyd.supabase.co/auth/v1/callback` gesetzt

### Dateien

- `index.html` (1 Zeile hinzufugen)
- `src/vite-env.d.ts` (Apple JS Typen)
- `src/pages/Login.tsx` (Apple-Handler umschreiben, ~20 Zeilen)

