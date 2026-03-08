

## Plan: Spy-Bereich und Profil-Bereich visuell komplett trennen

### Kernproblem
Spy-Card und Profilkarten sind beides pink-gradient Rechtecke mit identischer Form — man versteht nicht, dass es zwei fundamental verschiedene Bereiche sind. Der Spy-Bereich muss ein eigener "Raum" sein, die Profilkarten brauchen einen komplett anderen Look.

### Änderungen

#### 1. `src/components/SpyAgentCard.tsx` — Neuer Text, kein "Überwachung aktiv"
- **"Überwachung aktiv" ersetzen** durch "Dauerüberwachung · Stündlich" — macht den Unterschied klar (stündlich vs. täglich bei normalen Accounts)
- Text grösser: `1.25rem`
- Subtitle darunter: "Push-Scans · Unfollow-Erkennung · Volle Insights" in `0.75rem` white/70

#### 2. `src/components/ProfileCard.tsx` — Komplett anderer Look
- **Kein Pink-Gradient mehr** — stattdessen `hsl(var(--card))` Hintergrund (weiss/dunkel je nach Theme)
- **Border**: `1px solid hsl(var(--border))`
- **Texte**: `text-foreground` und `text-muted-foreground` statt weiss
- **"Zuletzt gefolgt" Sub-Area**: `hsl(var(--muted))` Hintergrund, `text-muted-foreground`
- **Scan-Frequenz-Badge**: Kleines Tag "1x täglich" in `muted` neben der Zeit — erklärt den Unterschied zum Spy
- Stats: `text-foreground` statt weiss
- Drop-Target: Pink border-glow statt weiss

#### 3. `src/pages/Dashboard.tsx` — Section-Header aufwerten
- Statt nur "📡 Überwachte Accounts" als tiny Label:
  - Grösserer Titel: "Deine Accounts" in `1.125rem`, `font-bold`, `text-foreground`
  - Subtitle darunter: "Täglicher Basis-Scan" in `0.8125rem`, `text-muted-foreground`
  - Mehr Abstand oben: `pt-8` statt `pt-6`

### Ergebnis
- **Spy = Pink gradient, weisser Text, premium-feel** → "Hier passiert das Besondere"
- **Profile = Neutral card, normaler Text** → "Standard-Überwachung"
- **Section-Header** erklärt was der Bereich ist
- Visuell zwei komplett verschiedene Welten auf einer Seite

### Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | Text "Überwachung aktiv" → "Dauerüberwachung · Stündlich" + Subtitle |
| `ProfileCard.tsx` | Pink-Gradient → neutraler Card-Style, alle Farben anpassen |
| `Dashboard.tsx` | Section-Header grösser mit Subtitle |

