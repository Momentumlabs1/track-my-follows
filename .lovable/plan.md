

## OAuth Fix -- basierend auf offizieller Despia "Easy OAuth" Doku

Ich habe die komplette Despia Easy OAuth Dokumentation gelesen. Hier ist was kaputt ist und was gefixed werden muss:

### Was ist kaputt?

**3 Probleme, alle bestätigt durch die offizielle Despia Doku:**

1. **Deeplink-Scheme falsch** -- `src/lib/native.ts` Zeile 66 sagt `secretspy`, muss `spysecret` sein. Deshalb erkennt iOS den Deeplink nicht und das Browser-Sheet bleibt offen.

2. **`public/404.html` fehlt** -- Die Despia Doku listet diese Datei als PFLICHT. Ohne sie: Wenn Supabase nach OAuth zu `/native-callback#access_token=xxx` redirected, gibt der Static Host einen echten 404 zurück und der Hash mit den Tokens geht verloren. Das ist wahrscheinlich der Grund warum NativeCallback keine Tokens findet.

3. **`/auth`-Route verarbeitet keine Tokens** -- Nach dem Deeplink-Rücksprung navigiert Despia den WebView zu `/auth?access_token=xxx`. Aber `AuthCallback.tsx` macht nur "warten und redirecten" -- es ruft nie `setSession()` auf. Der `AuthContext` checkt zwar URL-Params beim Init, aber nur auf der Root-Route. Die `/auth`-Route muss selbst Tokens verarbeiten können.

### Despia-Config (du musst manuell machen)

- `appleid.apple.com` von **"Never Open in Browser"** nach **"Open Always in Browser"** verschieben (genau wie `accounts.google.com` schon korrekt ist)

---

### Code-Änderungen

**1. Scheme fixen -- `src/lib/native.ts`**
- Zeile 66: `'secretspy'` zu `'spysecret'`

**2. `public/404.html` erstellen (per Despia Doku)**
- SPA-Fallback Script das den Pfad + Hash preserviert und zur Root weiterleitet
- Format: `/?redirect=/native-callback&deeplink_scheme=spysecret` + Hash

**3. `public/_redirects` erstellen**
- `/* /index.html 200` -- damit Lovable/Netlify alle Routen an die SPA weiterleitet

**4. `SpaRedirector` Komponente erstellen -- `src/components/SpaRedirector.tsx`**
- Liest `?redirect=...` aus der URL und navigiert intern zur richtigen Route (mit Hash)
- Wird in `App.tsx` eingebunden

**5. `/auth`-Route token-fähig machen -- `src/pages/AuthCallback.tsx`**
- Tokens aus URL-Hash und Query-Params lesen (`access_token`, `refresh_token`)
- Bei vorhandenen Tokens: `supabase.auth.setSession()` aufrufen
- Dann zum Dashboard navigieren
- Fallback: wenn keine Tokens und kein User, zu `/login`

**6. `NativeCallback.tsx` robuster machen**
- `window.location.replace()` statt `.href`
- Fallback-Button "App öffnen" nach 3 Sekunden falls Deeplink nicht greift
- Alle `secretspy://` Referenzen zu `spysecret://`

**7. `App.tsx` updaten**
- `SpaRedirector` Komponente einbinden

---

### Dateien

| Datei | Aktion |
|---|---|
| `src/lib/native.ts` | Scheme `secretspy` zu `spysecret` |
| `public/404.html` | NEU -- SPA Hash-Fallback |
| `public/_redirects` | NEU -- Lovable SPA Routing |
| `src/components/SpaRedirector.tsx` | NEU -- 404-Redirect Handler |
| `src/pages/AuthCallback.tsx` | Token-Verarbeitung + `setSession()` |
| `src/pages/NativeCallback.tsx` | Robuster Redirect + Fallback-UI |
| `src/App.tsx` | SpaRedirector einbinden |

