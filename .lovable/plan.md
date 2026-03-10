

## Plan: Initial-Events direkt als Hauptliste anzeigen

### Was sich ändert

**Datei: `src/pages/ProfileDetail.tsx`** — nur diese Datei wird geändert.

### Änderungen

1. **Initial-Events Sortierung**: Statt `detected_at` DESC wird die DB-Insert-Reihenfolge beibehalten. Da die Events mit sequenziellen Timestamps (`now - i*1s`) eingefügt werden, bleibt die Sortierung nach `detected_at` DESC korrekt — sie entspricht der API-Reihenfolge. Keine Änderung nötig.

2. **Hauptliste bei nur Initial-Events**: Bereits implementiert (Zeilen 158-161, `displayFollowEvents` / `displayFollowerEvents`). Das funktioniert schon.

3. **Zeitanzeige bei Initial-Events**: Wenn `onlyInitialFollows` oder `onlyInitialFollowers`, wird `timeAgo` durch eine Funktion ersetzt die "Beim Start erkannt" zurückgibt statt "vor X Minuten". Aktuell wird `timeAgo` (echte Zeitdifferenz) auch für Initial-Events verwendet — das erzeugt die Fake-Chronologie.

4. **Gemischte Liste (echte + initial)**: Echte Events oben, darunter Initial-Events als "Beim Start erkannt" Sektion — das ist bereits so implementiert (Zeilen 424-429, 438-443).

5. **Tab Counter**: Bereits korrekt — `displayFollowEvents.length` wird verwendet (Zeile 164-165).

### Konkrete Code-Änderungen

**Zeilen 421-422** — "Folgt neu" Tab: Bei `onlyInitialFollows` eine andere `timeAgo`-Funktion übergeben die `"Beim Start erkannt"` zurückgibt:
```tsx
<EventList 
  events={displayFollowEvents.map(mapFollowEvent)} 
  shouldBlur={false} 
  showPaywall={showPaywall} 
  timeAgo={onlyInitialFollows ? () => t("initial_scan_label", "Beim Start erkannt") : timeAgo}
  ...
```

**Zeilen 435-436** — "Neue Follower" Tab: Gleiches Prinzip:
```tsx
<EventList 
  events={displayFollowerEvents.map(mapFollowerEvent)} 
  shouldBlur={false} 
  showPaywall={showPaywall} 
  timeAgo={onlyInitialFollowers ? () => t("initial_scan_label", "Beim Start erkannt") : timeAgo}
  ...
```

Das ist alles. Die restliche Logik (Counter, gemischte Listen, Sektionen) funktioniert bereits korrekt.

