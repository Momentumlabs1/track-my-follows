

## SpyStatusCard als eigenstandiger Bereich mit besserer Interaktions-Affordance

### Problem
Die SpyStatusCard sieht aktuell wie ein flaches UI-Element aus -- man erkennt nicht intuitiv, dass man drauftippen kann um die detaillierte Analyse zu sehen. Es fehlt ein klarer visueller "Bereich"-Charakter.

### Plan

**Datei: `src/components/SpyStatusCard.tsx`**

1. **Sektions-Header hinzufuegen** -- Ueber der Karte einen kleinen Titel-Bereich mit SpyIcon + "Spy-Analyse" Label, aehnlich wie andere Sektionen auf der Seite. Kurzer Beschreibungstext darunter, z.B. "Dein Spion analysiert das Follow-Verhalten" oder bei `realEventCount === 0`: "Dein Spion sammelt gerade erste Daten..."

2. **Karte interaktiver gestalten**:
   - Dezenten Chevron-Pfeil rechts oder einen subtilen "Tap-Ripple"-Effekt hinzufuegen
   - Den unteren "TIPPE FUER DETAILLIERTE ANALYSE"-Bereich prominenter machen: groessere Schrift, weniger transparent, evtl. als Pill-Button-Style statt nur Text
   - Leichter Schatten/Elevation auf die Karte um sie als eigenen klickbaren Bereich abzuheben

3. **Info-Text zum Spy integrieren**: Unter dem Level-Indikator (vor dem Chevron) eine einzeilige Beschreibung des aktuellen Status einblenden (aus `descMap`), z.B. "Alles sieht normal aus" bei Gelassen. Das gibt dem Bereich mehr Inhalt und Kontext.

4. **Visueller Container**: Die gesamte Sektion (Header + Karte) in einen eigenen `native-card`-artigen Container wrappen mit etwas mehr Padding, damit es sich klar von den anderen Bereichen absetzt.

### Betroffene Dateien
- `src/components/SpyStatusCard.tsx` -- Haupt-Aenderungen
- `src/i18n/locales/de.json` + `en.json` -- Neue Keys fuer Sektions-Header/Beschreibung

