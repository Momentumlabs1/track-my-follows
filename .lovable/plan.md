

## Analyse & Plan

### Problem 1: "Zuletzt gefolgt" zeigt keine Daten

Die ProfileCard filtert Events mit `event_type === "new_follow"` (Zeile 46), aber die Edge Functions (`smart-scan`, `trigger-scan`, `unfollow-check`) speichern Events mit `event_type: "follow"` — nicht `"new_follow"`. Deshalb matcht der Filter nie und der Bereich ist immer leer.

**Fix:** In `ProfileCard.tsx` den Filter von `"new_follow"` auf `"follow"` ändern.

### Problem 2: Gender Bar entfernen

Der User will die Gender Bar komplett von den Profilkarten löschen (Zeilen 189-211 + den zugehörigen `genderBar` useMemo).

### Änderungen

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileCard.tsx` | Filter `"new_follow"` → `"follow"` fixen; Gender Bar komplett entfernen (useMemo + JSX) |

