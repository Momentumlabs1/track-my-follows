

## Plan: Spy-Analyse nach unten verschieben + Hinweistext hinzufügen

### Aktuelle Reihenfolge (in `src/pages/ProfileDetail.tsx`, Zeilen 378-394):
1. SpyStatusCard ("Dein Spy ist: Gelassen")
2. Separator
3. WeeklyGenderCards ("Diese Woche neu gefolgt")

### Neue Reihenfolge:
1. WeeklyGenderCards ("Diese Woche neu gefolgt")
2. Separator
3. SpyStatusCard ("Dein Spy ist: Gelassen") — mit neuem Hinweistext

### Änderungen

**`src/pages/ProfileDetail.tsx` (Zeilen 378-394)**
- WeeklyGenderCards nach oben, SpyStatusCard nach unten verschieben

**`src/components/SpyStatusCard.tsx`**
- Unter der Level-Beschreibung einen kleinen Hinweistext hinzufügen, z.B.:
  - `"Tippe für detaillierte Analyse →"` (dezent, muted, kleiner Font)
  - Oder im Chevron-Bereich: `"Spy-Analyse anzeigen"` neben dem Pfeil
- So wird klar, dass es ein aufklappbarer Analysebereich ist

**Translations (`de.json`, `en.json`)**
- `spy_status.tap_for_analysis`: "Tippe für detaillierte Analyse" / "Tap for detailed analysis"

