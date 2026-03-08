

## Plan: Dashboard komplett überarbeiten

### Problem
- Header zeigt nur den Namen — keine nützlichen Infos
- Spy-Karte sieht unfertig aus (Icon in weisser Bubble, schlechte Anordnung)
- Kein klarer visueller Break zwischen den drei Zonen

### Neue Struktur

#### 1. Header (`Dashboard.tsx`) — Kompakter, mehr Infos
- **Kleiner** machen: weniger vertikales Padding, `pb-24` statt `pb-40`
- Unter dem Greeting **eine Info-Zeile** hinzufügen: `"{profiles.length} Accounts · Letzter Scan: {time}"` in `white/70`, `0.8125rem`
- Optional: Kleines SpySecret-Logo links, Settings-Icon rechts im Header

#### 2. Spy-Karte (`SpyAgentCard.tsx`) — Komplett neu aufgebaut
**Wenn Spy zugewiesen:**
- **Horizontales Layout**: Linke Seite = Profil-Info (Avatar gross 56px + Username + Stats), Rechte Seite = SpyIcon (64px, ohne die hässliche weisse Bubble)
- SpyIcon direkt auf dem Gradient, **kein** extra `background`/`border` Container drum herum
- Oben: kleines Label "🕵️ DEIN SPION" + rechts daneben die Features als Chips/Tags
- Unten: Separator-Linie + "Stündlich · Push-Scans · Unfollow-Erkennung" als dezente Zeile
- Drag-Hint unter dem Icon: nur "↕ Ziehen" Text, kein Box

**Wenn kein Spy zugewiesen:** bleibt ähnlich, aber aufgeräumter

#### 3. Accounts-Section (`Dashboard.tsx`) — Mehr Abgrenzung
- **Horizontale Linie** oder `border-t border-border/50` vor dem "Deine Accounts" Bereich
- Section-Header bleibt wie aktuell (gut so)
- Etwas mehr Abstand zwischen Spy und Accounts: `pt-10`

### Betroffene Dateien
| Datei | Was |
|---|---|
| `Dashboard.tsx` | Header: Info-Zeile hinzufügen, weniger padding, Accounts-Section Abgrenzung |
| `SpyAgentCard.tsx` | Spy-Karte: weisse Bubble vom Icon entfernen, Layout horizontal, aufgeräumter |

