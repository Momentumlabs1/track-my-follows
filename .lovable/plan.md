

## Geschlechterverteilung: Gating + Übersetzungsfixes

### Problem 1: Gender-Bar ist für Free-User sichtbar
Die Gender-Bar (Zeilen 286-333 in ProfileDetail.tsx) sitzt im Header-Bereich, **außerhalb** des geblurrten Analysis-Bereichs (Zeilen 338-388). Free-User sehen die komplette Geschlechterverteilung ohne Einschränkung.

**Fix:** Die Gender-Bar aus dem Header raus und in den geblurrten `locked-analysis`-Block verschieben (vor `SpyStatusCard`). Damit wird sie automatisch vom bestehenden Blur-Overlay und Unlock-Button abgedeckt. Free-User sehen die Bar angeteasert (erkennbar aber unscharf), Pro-User ohne Spy ebenfalls.

### Problem 2: Hardcodierte deutsche Texte in der Gender-Bar
- `♀ Frau {femalePct}%` → `t("gender.female_short", "♀ Frau")` + `{femalePct}%`
- `♂ Mann {malePct}%` → `t("gender.male_short", "♂ Mann")` + `{malePct}%`

**Fix:** Neue Translation-Keys in DE/EN/AR:
- DE: `"♀ Frau"` / `"♂ Mann"`
- EN: `"♀ Women"` / `"♂ Men"`
- AR: `"♀ نساء"` / `"♂ رجال"`

### Änderungen
| Datei | Was |
|---|---|
| `src/pages/ProfileDetail.tsx` | Gender-Bar-Block (Zeilen 286-333) aus Header in den `locked-analysis` div verschieben; hardcodierte Strings durch `t()` ersetzen |
| `src/i18n/locales/de.json` | Keys `gender.female_short`, `gender.male_short` hinzufügen |
| `src/i18n/locales/en.json` | Gleiche Keys auf Englisch |
| `src/i18n/locales/ar.json` | Gleiche Keys auf Arabisch |

