

## Plan: Gender-Bar Redesign

### Änderungen in `src/pages/ProfileDetail.tsx` (Zeilen 297-340)

1. **Überschrift ändern** — "Geschlechterverteilung der gefolgten Accounts" statt nur "Geschlechterverteilung"

2. **Balken dicker machen** — von `h-2` (8px) auf `h-7` (28px), damit Text reinpasst

3. **Prozentzahlen IN den Balken** — Jede Hälfte bekommt ein Label direkt im farbigen Bereich:
   - Links im pinken Bereich: `♀ Frau 100%`
   - Rechts im blauen Bereich: `♂ Mann 0%`
   - Weißer Text, klein aber lesbar (0.625rem), font-semibold

4. **Header-Zeile vereinfachen** — Nur noch die Überschrift, keine separaten Prozentzahlen mehr rechts daneben (die stehen ja jetzt im Balken)

5. **Gleiche Anpassung für den "analysis running" Block** (Zeilen 328-340)

