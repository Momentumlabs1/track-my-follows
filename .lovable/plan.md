

## UI-Polish: Spacing, Navigation und Gender-Sheet

### 1. BottomNav vergrößern und nach oben rücken
**Datei: `src/components/BottomNav.tsx`**
- Nav-Höhe von 60px auf 72px erhöhen
- Icons von h-7/w-7 (28px) auf h-8/w-8 (32px)
- SpyIcon size von 28 auf 32
- Label-Schrift von 0.6875rem auf 0.75rem
- Zusätzliches inneres Padding oben (pt-2) damit die Nav visuell "höher" sitzt
- `pb-[env(safe-area-inset-bottom)]` bleibt, damit auf echten iPhones der Home-Indicator-Bereich korrekt berücksichtigt wird

### 2. Content-Bereich: Mehr Abstand unten
**Dateien: `src/pages/Dashboard.tsx`, `src/pages/FeedPage.tsx`, `src/pages/Settings.tsx`**
- Bottom-Padding der Hauptcontainer erhöhen auf `pb-[calc(env(safe-area-inset-bottom)+100px)]` (statt ca. 80px), damit Content nicht hinter der jetzt größeren Nav verschwindet

### 3. Gender Bottom Sheet app-mäßiger gestalten
**Datei: `src/components/WeeklyGenderCards.tsx`**
- Feste Höhe statt `max-h-[70vh]`: Sheet auf `h-[60vh]` setzen, damit es immer gleich groß aufgeht
- Drag-Handle oben hinzufügen (kleiner grauer Balken, 36x4px, zentriert, typisches iOS-Pattern)
- Header-Bereich visuell stärker abgrenzen: dickerer Border, etwas mehr Padding
- Scrollbare Liste: subtilen Scroll-Indicator via CSS (`scrollbar-width: thin` mit sichtbarem Styling)
- Listeneinträge: etwas größere Avatare (44px statt 40px), mehr vertikales Padding (py-3.5 statt py-3)
- Safe-Area-Bottom-Padding beibehalten

### Technische Details
- Alle Spacing-Werte nutzen `env(safe-area-inset-*)` CSS-Funktionen, die auf echten iPhones den Home-Indicator-Bereich respektieren. Im Web-Preview ist dieser Wert 0, daher sieht man den Effekt erst auf dem echten Gerät.
- Die Nav nutzt bereits `pb-[env(safe-area-inset-bottom)]` — das ist korrekt. Der Body hat bereits `padding-top: env(safe-area-inset-top)` in index.css.
- Das Gender-Sheet bekommt eine feste Höhe damit es konsistent aufgeht, unabhängig von der Anzahl der Einträge.

