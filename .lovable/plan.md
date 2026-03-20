
Ziel: Den Spy-Drag wirklich ohne Widerstand machen (kein „festkleben“ in der Bubble) und Start-Ladegefühl für kritische Bilder absichern.

1) Ursache im aktuellen Code beheben (Hauptgrund für das „Hängen“)
- In `src/components/SpyAgentCard.tsx` liegt die Idle-Wobble-Animation aktuell auf demselben `motion.div`, der auch `drag` macht.
- Zusätzlich ist `dragSnapToOrigin` aktiv.
- Diese Kombination erzeugt das „magnetische“ Gefühl (optisch + physikalisch), obwohl `dragElastic` schon angepasst wurde.

2) Drag-Mechanik umbauen auf direktes Finger-Tracking
- Draggable Wrapper und visuelle Animation trennen:
  - Äußerer Wrapper: nur Drag-Logik (keine Idle-Animation, kein Scale-Boost beim Ziehen).
  - Inneres Element: nur Idle-Animation, und die wird beim Drag sofort deaktiviert.
- `dragSnapToOrigin` entfernen.
- Stattdessen `x/y` MotionValues nutzen und nach `onDragEnd` manuell auf `0,0` zurückanimieren (kurz, linear/schnell), damit es beim Ziehen keinen Rückzug gibt.
- Optional für noch direkteres Pickup: `useDragControls` + `snapToCursor: true`.

3) Ruckler während Drag minimieren
- Während des Ziehens keine unnötigen großen Re-Renders vom Dashboard auslösen:
  - Hover-Updates nur bei tatsächlichem Zielwechsel (oder per `requestAnimationFrame`).
  - Drop-Ziel-Erkennung weiter über `elementFromPoint`, aber Drag-Element während Drag mit `pointer-events: none`, damit Treffer stabil bleiben.
- Dadurch kein „Mikro-Stottern“ mehr beim Überfahren der Karten.

4) „Sofort geladen“-Gefühl für Spy/Bilder absichern
- Kritische Above-the-fold Assets priorisieren:
  - `SpyIcon` mit `loading="eager"` + `fetchPriority="high"` (wo sinnvoll).
  - Erste sichtbare Avatare ebenfalls priorisieren (nicht global alles eager, um Netzwerk nicht zu überladen).
- Optional: kleines Preload der Spy-Icon-Asset beim App-Start.

5) Abnahme (E2E mobil)
- Test auf 391x844:
  - Spy greift sofort beim ersten Pixel Bewegung.
  - Kein wahrnehmbarer Zug zurück während Drag.
  - Drop auf Profil funktioniert weiterhin zuverlässig.
  - Nach Loslassen sauberer Return in die Bubble ohne „Gummiband“-Effekt.
  - Initiale Dashboard-Ansicht zeigt Spy/Icon/Avatare ohne spürbares Nachladen.

Technische Details (Dateien)
- `src/components/SpyAgentCard.tsx`
  - Drag/Animation entkoppeln
  - `dragSnapToOrigin` entfernen
  - MotionValues + manuelles Reset
  - optional `useDragControls` + `snapToCursor`
  - pointer-events Handling während Drag
- `src/pages/Dashboard.tsx`
  - Hover-State-Updates beim Drag entlasten (nur bei Wechsel/RAF)
- `src/components/SpyIcon.tsx` und ggf. `src/components/InstagramAvatar.tsx`
  - Priorisierte Ladeattribute für kritische sichtbare Bilder
