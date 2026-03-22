

## Profilbild sofort zeigen + flüssigerer Ladebalken

### Problem
1. **Avatar erst am Ende sichtbar**: Das Profilbild wird erst nach Abschluss des Scans aus der DB geladen. Dabei hat `check-username` (das VOR der Scan-Seite läuft) bereits die `avatar_url` zurückgegeben.
2. **Fortschrittsbalken unlogisch**: Springt von 30% direkt auf 85% — der Scan dauert 5-15 Sekunden, aber der Balken steht die ganze Zeit still bei 30%.

### Lösung

**1. Avatar sofort zeigen**

In `AddProfile.tsx`: Die `avatar_url` aus der `check-username`-Response an die Analyzing-Seite weitergeben (via Route-State oder URL-Param).

In `AnalyzingProfile.tsx`: Den übergebenen Avatar sofort als `avatarUrl` setzen, statt auf den Scan zu warten.

**2. Simulierter Fortschritt während des Scans**

Statt bei 30% stehen zu bleiben, einen `setInterval` starten der den Balken langsam von 30% auf ~80% hochzählt (z.B. +1% alle 300ms, verlangsamt sich gegen Ende). Wenn der Scan fertig ist, springt er auf 85% → 100%.

So sieht der User durchgehend Bewegung statt eines eingefrorenen Balkens.

### Änderungen

| Datei | Was |
|-------|-----|
| `src/pages/AddProfile.tsx` | `avatar_url` aus check-username Response speichern, via `navigate` state an Analyzing-Seite übergeben |
| `src/pages/AnalyzingProfile.tsx` | Avatar aus `location.state` sofort setzen; Intervall-basierter Fortschritt 30→80% während Scan läuft |

