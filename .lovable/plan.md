

## Fix: Redirect-Text in NativeCallback anpassen

**Problem**: Auf der `/native-callback` Seite steht "Weiterleitung zur App…" — der User sieht aber die Supabase-URL im Browser. Der Text soll klar "SpySecret" nennen.

**Änderung**: Eine Datei, eine Zeile.

**`src/pages/NativeCallback.tsx`** — Zeile 76:
- Alt: `Weiterleitung zur App…`
- Neu: `Weiterleitung zu SpySecret…`

