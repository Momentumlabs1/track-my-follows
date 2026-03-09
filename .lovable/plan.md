

## Problem

Aktuell bekommen beim **Initial-Scan** alle ~200 Accounts denselben Timestamp (`now`). Die UI sortiert nach `detected_at DESC` → zufällige Reihenfolge, weil alle identisch sind.

Beim **Folge-Scan** (Stunde 1+) bekommen neue Accounts einen `Math.random() * spanMs` Timestamp → ebenfalls keine garantierte Reihenfolge untereinander.

**Instagram liefert Page 1 in einer Relevanz-/Aktualitätsreihenfolge.** Account[0] ist der relevanteste/neueste. Wenn du jetzt jemandem folgst und dann scannst, steht dieser Account ganz oben in der API-Antwort.

## Lösung: Sequenzielle Timestamps bewahren die API-Reihenfolge

### `syncNewFollows` (Zeile 119-144)

**Initial-Scan**: Statt allen `now` zu geben → sequenzielle absteigende Timestamps:
```
Account[0] → now                  (neuester/relevantester)
Account[1] → now - 1 Sekunde
Account[2] → now - 2 Sekunden
...
Account[199] → now - 199 Sekunden
```

**Folge-Scan**: Statt `Math.random() * spanMs` → ebenfalls sequenziell absteigend innerhalb des Scan-Zeitfensters, damit die Reihenfolge erhalten bleibt.

### `syncNewFollowers` (Zeile 169-200)

Exakt gleiche Logik.

### Ergebnis

Wenn du jemandem folgst und dann einen Scan triggerst:
1. HikerAPI liefert den neuen Follow als ersten Account auf Page 1
2. Er ist nicht in der DB → wird als `newEntry[0]` erkannt
3. Bekommt den **neuesten Timestamp** (`now`)
4. UI sortiert nach `detected_at DESC` → zeigt ihn **ganz oben**

Das ist exakt was "The Ick" und andere Competitor-Apps machen.

### Betroffene Datei

**`supabase/functions/trigger-scan/index.ts`** — Zwei Stellen:
- `syncNewFollows`: Zeile 122-124 (Timestamp-Logik)
- `syncNewFollowers`: Zeile 171-173 (Timestamp-Logik)

Kein DB-Change nötig. Kein Frontend-Change nötig — die UI sortiert bereits nach `detected_at DESC`.

