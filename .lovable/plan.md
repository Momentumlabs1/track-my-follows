

# Fix: Instagram-Profilbilder ueber Image-Proxy laden

## Problem
Instagram CDN blockiert Bildrequests aus fremden Domains - auch mit `referrerPolicy="no-referrer"`. Die Bilder laden einfach nicht im Browser.

## Loesung
Eine Edge Function als Bild-Proxy: Das Frontend ruft nicht mehr direkt die Instagram-URL auf, sondern unsere eigene Edge Function. Diese laedt das Bild serverseitig (wo es keine Browser-Einschraenkungen gibt) und gibt es an den Browser weiter.

```text
Browser  -->  Edge Function (image-proxy)  -->  Instagram CDN
Browser  <--  Bild-Daten zurueck           <--  Instagram CDN
```

## Schritte

### 1. Neue Edge Function `image-proxy` erstellen
- Nimmt eine Instagram-Bild-URL als Query-Parameter entgegen
- Laedt das Bild serverseitig per `fetch`
- Gibt die Bild-Bytes mit dem richtigen Content-Type zurueck
- Caching-Header fuer Performance (1 Stunde)
- Validierung: Nur URLs von `cdninstagram.com` oder `fbcdn.net` erlaubt

### 2. `InstagramAvatar` Komponente updaten
- Statt die Instagram-URL direkt im `<img>` Tag zu nutzen, wird die URL durch die Proxy-Edge-Function geleitet
- Format: `{supabaseUrl}/functions/v1/image-proxy?url={encodedInstagramUrl}`
- `referrerPolicy` wird nicht mehr benoetigt
- Der `onError` Fallback auf Initialen bleibt als Backup

### 3. Edge Function deployen und config.toml updaten
- `verify_jwt = false` setzen damit die Bilder ohne Auth laden
- Deployen der neuen Function

## Technische Details

**Edge Function (`supabase/functions/image-proxy/index.ts`)**:
- GET Request mit `?url=...` Parameter
- Whitelist-Check auf Instagram-CDN-Domains
- Bild per `fetch()` serverseitig laden
- Response mit `Content-Type` vom Original und `Cache-Control: public, max-age=3600`

**Frontend (`src/components/InstagramAvatar.tsx`)**:
- Baut die Proxy-URL zusammen: `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`
- Nutzt diese URL direkt im `<img>` Tag
- Kein `useEffect`, kein `blob`, kein State - einfach eine URL-Transformation

**Dateien die geaendert werden**:
- `supabase/functions/image-proxy/index.ts` (neu)
- `supabase/config.toml` (verify_jwt = false fuer image-proxy)
- `src/components/InstagramAvatar.tsx` (Proxy-URL statt direkte URL)
