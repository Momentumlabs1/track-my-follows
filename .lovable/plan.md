

# Follow-Events mit zufaellig verteilten Timestamps

## Was passiert
Beim Scan werden neue Follows nicht mehr alle mit dem gleichen Zeitstempel gespeichert, sondern zufaellig ueber die Zeit seit dem letzten Scan verteilt. So sieht es natuerlicher aus im Feed.

## Beispiel
- Letzter Scan: 12:00 Uhr
- Aktueller Scan: 15:00 Uhr
- 5 neue Follows erkannt
- Statt alle "vor 0m": zufaellig verteilt, z.B. 12:14, 12:47, 13:22, 14:05, 14:51
- Die Reihenfolge wird nach Generierung chronologisch sortiert

## Technische Umsetzung

### Datei: `supabase/functions/scan-profiles/index.ts`

1. Vor der Event-Schleife: Neue Follows erst sammeln statt sofort einfuegen
2. Zeitspanne berechnen: `lastScan` bis `now`
3. Fuer jeden neuen Follow einen zufaelligen Timestamp generieren: `lastScan + Math.random() * spanMs`
4. Die generierten Timestamps chronologisch sortieren
5. Dann Events mit den sortierten Timestamps einfuegen (`detected_at` und `first_seen_at`)
6. Unfollows behalten weiterhin den aktuellen Zeitpunkt

### Aenderungen im Detail
- Neue Follows werden in ein temporaeres Array gesammelt
- `Math.random()` erzeugt zufaellige Positionen innerhalb der Zeitspanne
- Array wird nach Timestamp sortiert damit die Reihenfolge im Feed Sinn ergibt
- Beim ersten Scan (kein `last_scanned_at`) wird eine Standard-Spanne von 24h verwendet

### Keine Aenderungen noetig an
- Datenbank-Schema
- Frontend-Komponenten (zeigen bereits `timeAgo(event.detected_at)` korrekt an)
- Andere Edge Functions

