

## Problem

Nach dem ersten Scan zeigen "Folgt neu" und "Neue Follower" einen leeren Zustand ("Noch keine neuen Follows erkannt"), obwohl die gescannten Accounts unten als "Beim ersten Scan vorhanden" separat aufgelistet werden. Der User will, dass die Liste direkt die Accounts in der Reihenfolge zeigt, wie Instagram/HikerAPI sie zurückgibt — auch beim ersten Scan.

## Lösung

**`src/pages/ProfileDetail.tsx`** — Wenn es keine "echten neuen" Events gibt (nur Initial-Scan), zeige die Initial-Events direkt als Hauptliste an (chronologisch sortiert per sequentiellen Timestamps). Kein leerer Zustand + separate Sektion, sondern eine einzige Liste.

Konkret:
- **"Folgt neu" Tab**: Wenn `newFollowEvents` leer ist aber `initialFollowEvents` existieren → zeige `initialFollowEvents` als Hauptliste (ohne "Bestehend"-Label, mit normalem Zeitformat)
- **"Neue Follower" Tab**: Gleiche Logik für `initialFollowerEventsList`
- Wenn es sowohl neue als auch initiale Events gibt → behalte die aktuelle Trennung bei (neue oben, initiale unten als "Beim ersten Scan vorhanden")
- Tab-Counter zeigt die Gesamtanzahl (neue + initiale) wenn nur initiale vorhanden

