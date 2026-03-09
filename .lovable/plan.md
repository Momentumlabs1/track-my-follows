

## Plan: Feed-Seite Header & Layout auffrischen

### Aktuell
- Header zeigt "What's new?" — generisch, langweilig
- Filter-Buttons sind kleine Pills mit viel ungenutztem Platz
- Feed-Rows haben kleine Texte (0.8125rem / 0.6875rem)
- Spy des Tages hat keine Erklärung was passiert wenn man drauf tippt

### Änderungen

#### 1. Header-Text modernisieren (`FeedPage.tsx`, Zeile 110)
- "What's new?" ersetzen durch etwas wie **"Das macht gerade die Runde"** (de) / **"Trending now"** (en)
- Darunter ein kleiner Subtitle: "Dein persönlicher Activity-Feed" — eine Zeile, `text-muted-foreground`

#### 2. Spy des Tages — Tap-Hinweis hinzufügen
- Unter dem Avatar-Block im Spy-Card einen kleinen Hinweis: "Tippe für Details →" als dezenter weißer Text
- Macht klar, dass die Karte interaktiv ist

#### 3. Filter-Buttons als gleichgroße Bubbles
- Statt `gap-2` mit auto-Breite: **`flex gap-3`** mit beiden Buttons **`flex-1`** (gleiche Breite, 50/50)
- Höhe auf `min-h-[44px]`, Font auf `0.9375rem` (15px statt 13px)
- `rounded-2xl` statt `rounded-xl` — füllt die Breite besser aus, wirkt app-like

#### 4. Feed-Texte größer machen (`EventFeedItem.tsx`)
- Actor username: `0.8125rem` → `0.875rem` (14px)
- Verb text: `0.6875rem` → `0.8125rem` (13px)
- Target username: `0.75rem` → `0.8125rem` (13px)
- Time: `0.625rem` → `0.6875rem` (11px)
- Feed-Row padding etwas mehr Luft: `0.75rem 1.25rem` → `0.875rem 1.25rem`

#### 5. Translations
- `feed.whats_new` → de: "Das macht die Runde" / en: "Trending now"
- `feed.subtitle` → de: "Dein persönlicher Activity-Feed" / en: "Your personal activity feed"
- `feed.tap_for_details` → de: "Tippe für Details →" / en: "Tap for details →"

### Betroffene Dateien
| Datei | Änderung |
|---|---|
| `FeedPage.tsx` | Header-Text, Subtitle, Filter flex-1 + größer, Spy-Card Tap-Hinweis |
| `EventFeedItem.tsx` | Font-Größen erhöhen |
| `src/index.css` | feed-row padding anpassen |
| `de.json`, `en.json` | Neue Translations |

