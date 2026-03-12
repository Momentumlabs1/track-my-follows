

## Plan: Erweiterte SpyStatusCard mit Scan-Aktionen und Info-Hinweisen

### Was sich ändert

Wenn man die SpyStatusCard aufklappt, erscheint **vor** den SpyFindings (Ghost-Follows, Private Accounts, etc.) ein neuer Bereich mit:

1. **Info-Banner** (kurzer Hinweis-Text):
   - "Dein Spy scannt automatisch jede Stunde. Du kannst zusätzlich manuelle Scans auslösen."
   - "Unfollow-Scans funktionieren erst nach dem ersten vollständigen Scan."

2. **Push Scan + Unfollow Scan Buttons** (2-Spalten-Grid, gleicher Stil wie auf `/spy`-Seite):
   - Push Scan: 4/Tag, mit Progress-Bar und Beschreibung
   - Unfollow Scan: **1/Tag** (runter von 2), mit Progress-Bar und Beschreibung
   - Buttons lösen direkt die Scan-Funktionen aus (gleiche Logik wie SpyDetail)
   - Nach Scan: Redirect zur Profilseite mit invalidiertem Cache

3. **SpyFindings** bleiben darunter wie bisher

### Dateien

**`src/components/SpyStatusCard.tsx`**:
- Props erweitern: `profileId`, `unfollowScansToday` hinzufügen
- Im aufgeklappten Bereich: Info-Text + 2-Spalten Scan-Buttons + SpyFindings
- Scan-Logik (handlePushScan, handleUnfollowScan) aus SpyDetail übernehmen
- Unfollow-Budget: 1 statt 2

**`src/pages/ProfileDetail.tsx`**:
- `profileId` an SpyStatusCard durchreichen
- `unfollowScansToday` aus Profil-Daten übergeben

**`src/pages/SpyDetail.tsx`**:
- Unfollow-Budget von 1 anpassen (UI: "0 von 1 übrig")

### Design
- Info-Banner: Dezent mit `Info`-Icon, `text-muted-foreground`, abgerundete Card mit `bg-secondary/30`
- Scan-Buttons: Identisches Design wie SpyDetail (Gradient-Border, Progress-Bars), aber etwas kompakter
- Reihenfolge im Collapsible: Info-Banner → Scan-Buttons → SpyFindings

