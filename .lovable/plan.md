

## Problem: Tutorial-Spotlight ist verschoben und fehl am Platz

Nach Code-Analyse gibt es **4 konkrete Bugs** im Tutorial-System:

### Bug 1: Tooltip ist NICHT am Element positioniert (Hauptproblem)

Die `SpotlightOverlay` positioniert das Tooltip-Fenster **immer horizontal zentriert** auf dem Bildschirm (`(window.innerWidth - tooltipWidth) / 2`). Der Spotlight-Ausschnitt (das "Loch") liegt aber auf dem tatsachlichen Element. Auf breiten Screens (du hast 1493px) sieht man:
- Loch links/rechts auf dem Element
- Tooltip in der Mitte
- Beides passt visuell nicht zusammen → "verschoben"

**Fix**: Tooltip horizontal am Element ausrichten, nicht am Bildschirm.

### Bug 2: Doppelte ID `add-profile-btn`

In `Dashboard.tsx` gibt es ZWEI Elemente mit `id="add-profile-btn"` (Zeile 381 + 397) — eins fur "Profile vorhanden", eins fur "keine Profile". `getElementById` findet das falsche Element → Spotlight zeigt auf unsichtbares Element.

**Fix**: Nur ein Element bekommt die ID, basierend auf dem aktuellen State.

### Bug 3: `gender-bar` ID existiert nur bedingt

`id={showGender ? "gender-bar" : undefined}` — beim ersten Scan hat das Profil moglicherweise noch keine Gender-Daten. Die ID existiert nicht, der Spotlight pollt 10 Sekunden und skippt dann. Aber die Positionierung ist trotzdem fehlerhaft.

**Fix**: ID immer setzen (unabhangig von `showGender`), damit der Spotlight-Step das Element findet.

### Bug 4: Rect-Messung nach Scroll veraltet

`scrollIntoView({ behavior: "smooth" })` braucht ~300-500ms. Die Rect-Messung in SpotlightOverlay passiert bei Mount + 100ms + 300ms. Wenn der Scroll langer dauert, ist die Position falsch.

**Fix**: In SpotlightOverlay kontinuierlich messen (requestAnimationFrame) solange sichtbar, statt nur 3x.

---

## Technische Anderungen

### 1. `src/components/SpotlightOverlay.tsx`
- Tooltip horizontal am Target-Element ausrichten (nicht Bildschirm-Mitte)
- Clamp damit Tooltip nicht aus dem Viewport ragt
- `requestAnimationFrame`-Loop fur kontinuierliche Rect-Messung statt statischer Timeouts

### 2. `src/pages/Dashboard.tsx`
- Zweites `id="add-profile-btn"` entfernen (nur das kontextuell richtige Element bekommt die ID)

### 3. `src/pages/ProfileDetail.tsx`
- `id="gender-bar"` immer setzen, nicht nur wenn `showGender` true ist

### Ergebnis
- Spotlight-Loch und Tooltip sind immer am gleichen Element
- Kein "Verschieben" mehr auf Desktop oder Mobile
- Tutorial-Steps finden ihre Elemente zuverlassig

