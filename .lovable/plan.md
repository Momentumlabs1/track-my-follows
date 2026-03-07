

## Analyse

Der Private-Account-Check ist in allen 3 Edge Functions (`trigger-scan`, `smart-scan`, `create-baseline`) **bereits korrekt eingebaut** (Zeilen 288-306 in trigger-scan, 338-348 + 434-444 in smart-scan). Der Code prüft `userInfo.is_private` von HikerAPI und setzt `is_private = true` in der DB + überspringt den Scan.

**Das Problem:** Der `smart-scan` Cron-Job läuft zwar stündlich (Cron existiert in `cron.job`), aber es gibt **keine Edge Function Logs** — weder für `smart-scan` noch für `trigger-scan`. Das bedeutet die Functions werden entweder nicht erreicht oder sind nicht korrekt deployed.

**Warum `diego_gut1` nicht als privat angezeigt wird:** Er wurde vor 8 Tagen zuletzt gescannt. Seitdem hat kein Scan mehr stattgefunden (weder Cron noch manuell), also wurde `is_private` nie auf `true` gesetzt.

## Plan

### 1) Edge Functions neu deployen
Alle 3 Functions (`trigger-scan`, `smart-scan`, `create-baseline`) müssen neu deployed werden damit die Private-Check Logik aktiv wird. Lovable deployed automatisch bei Code-Änderungen — ich mache einen kleinen Touch (z.B. Kommentar-Update) in jeder Function um den Deploy zu triggern.

### 2) Manuellen Scan auslösen um `diego_gut1` zu updaten
Nach dem Deploy einen manuellen Scan des Profils auslösen — dann greift der Private-Check und setzt `is_private = true`. Alternativ: direkt in der DB `is_private = true` setzen für sofortiges Ergebnis.

### 3) Frontend zeigt dann automatisch das 🔒 Banner
Der UI-Code in `ProfileDetail.tsx` und `ProfileCard.tsx` prüft bereits `profile.is_private` und zeigt Banner + deaktiviert Scan-Button. Sobald die DB aktualisiert ist, funktioniert alles.

### Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/trigger-scan/index.ts` | Touch für Redeploy |
| `supabase/functions/smart-scan/index.ts` | Touch für Redeploy |
| `supabase/functions/create-baseline/index.ts` | Touch für Redeploy |

