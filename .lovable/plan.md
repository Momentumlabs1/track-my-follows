

## Gesamtplan: Alle offenen Issues fixen

### 1. Tutorial bei OAuth-Registrierung triggern

**Problem:** `AppTutorial` prüft auf `showWelcome` Flag, aber OAuth-Flow setzt diesen nie.

**Fix in `src/pages/AuthCallback.tsx`:**
- Nach erfolgreichem `setSession()`: Prüfen ob der User neu ist (created_at < 60 Sekunden alt)
- Wenn ja: `sessionStorage.setItem('show_welcome_' + userId, '1')` setzen
- Dann zu `/dashboard` mit `state: { showWelcome: true }` navigieren

**Fix in `src/contexts/AuthContext.tsx`:**
- In `syncUserSettings`: Wenn kein `existing` Record gefunden wird (= neuer User), `sessionStorage.setItem('show_welcome_' + userId, '1')` setzen

### 2. Feed visuell aufwerten

**Datei: `src/components/EventFeedItem.tsx`**
- Farbige linke Border-Leiste je Event-Typ (rot = unfollow, grün = neuer follow, blau = neuer follower, orange = verloren)
- Emoji-Icons statt generischem Chevron (💔 Entfolgt, ✅ Neuer Follow, 👋 Neuer Follower, 😢 Verloren)
- Kompakteres Layout: eine Zeile mit Avatar, Username, Verb, tracked-Profile statt zwei Avatare nebeneinander
- Spy-Branding: SpyIcon im Header wenn Event von Spy-Profil kommt

**Datei: `src/pages/FeedPage.tsx`**
- Bessere Sektions-Header mit Spy-Thema
- Animierter leerer Zustand mit mehr Persönlichkeit

### 3. SpyFindings visuell aufwerten

**Datei: `src/components/SpyFindings.tsx`**
- Karten-basiertes Layout statt einfacher Auflistung
- Farbige Icons und Progress-Bars für Statistiken
- "Verdachtsmomente"-Score prominenter darstellen
- Spy-Agenten-Ton in den Texten

### 4. Supabase-Domain im OAuth-Dialog

**Keine Code-Änderung möglich.** Erfordert Supabase Custom Auth Domain (kostenpflichtig, manuell einzurichten). Alternativ: Akzeptieren dass die Supabase-URL gezeigt wird.

### 5. Apple OAuth Despia-Config

**Manuelle Aktion:** `appleid.apple.com` von "Never Open in Browser" nach "Open Always in Browser" verschieben.

---

### Dateien die geändert werden

| Datei | Änderung |
|---|---|
| `src/pages/AuthCallback.tsx` | Neuer-User-Check + showWelcome Flag setzen |
| `src/contexts/AuthContext.tsx` | showWelcome bei neuem User in syncUserSettings |
| `src/components/EventFeedItem.tsx` | Komplett überarbeiten: farbige Borders, Emojis, kompakteres Layout |
| `src/pages/FeedPage.tsx` | Spy-Branding, bessere leere Zustände |
| `src/components/SpyFindings.tsx` | Karten-Layout, Progress-Bars, Spy-Ton |

### Was du manuell machen musst
1. In Despia: `appleid.apple.com` → "Open Always in Browser"
2. Optional: Supabase Custom Auth Domain einrichten für Branding

