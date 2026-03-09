

## Plan: Feed-Seite Überarbeitung

### Probleme
1. **Spy des Tages Bild lädt nicht** — verwendet raw `<img>` statt `InstagramAvatar` mit Proxy (Zeile 160 in FeedPage). Instagram-URLs brauchen den Image-Proxy.
2. **"Alle" / "Follows" Buttons** sind überflüssig — soll weg, stattdessen einfach ein Titel wie "Dein Feed"
3. **Feed-Rows zu klein** — Avatare (42/46px) und Schriften könnten größer, klarer
4. **Wer folgt wen** nicht sofort klar genug

### Änderungen

#### 1. Spy des Tages — Avatar-Fix (`FeedPage.tsx`, Zeile 159-165)
- Raw `<img>` durch `InstagramAvatar` ersetzen → nutzt automatisch den Image-Proxy für Instagram-URLs
- Size auf 56px erhöhen

#### 2. Filter-Buttons entfernen (`FeedPage.tsx`, Zeile 211-222)
- Kompletten Filter-Block entfernen
- `filter` State und `filteredEvents` Logik entfernen — immer alle Events zeigen
- Stattdessen ein Section-Title: **"Dein Feed"** als `text-muted-foreground uppercase tracking-wider text-xs` (wie DaySeparator-Stil)

#### 3. Feed-Rows größer & klarer (`EventFeedItem.tsx`)
- Actor-Avatar: 42px → **50px** (rund)
- Tracked-Avatar: 46px → **52px** (eckig mit Pink-Border)
- Actor-Username Font: `0.875rem` → **`0.9375rem`** (15px), `font-extrabold`
- Verb: `0.8125rem` → **`0.875rem`** (14px)
- Target-Username: `0.8125rem` → **`0.875rem`** (14px)
- Time: `0.6875rem` → **`0.75rem`** (12px)
- Feed-Row gap: `gap-3` → `gap-3.5`
- Feed-Row vertical padding: `0.875rem` → `1rem`

#### 4. Feed-Row Padding (`index.css`)
- `padding: 0.875rem 1.25rem` → `1rem 1.25rem`

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `FeedPage.tsx` | InstagramAvatar für Spy-Card, Filter-Buttons → Section-Title, filter State entfernen |
| `EventFeedItem.tsx` | Avatar-Sizes und Font-Sizes erhöhen |
| `index.css` | feed-row padding erhöhen |

