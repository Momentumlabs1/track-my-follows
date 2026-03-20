

# "Spy des Tages" — Intelligente Auswahl statt letztes Event

## Problem
Aktuell: `allEvents[0]` = einfach das neueste Event. Das kann von **jedem** getrackten Profil sein und hat keinen Bezug zum Spy.

## Lösung

### Schritt 1: Spy-Events filtern
Nur Events vom Profil mit `has_spy = true` berücksichtigen.

### Schritt 2: Priorisierungs-Logik
Aus den Spy-Events der letzten 24h das "interessanteste" wählen:

1. **Höchste Prio:** Neue weibliche Follows (Diego folgt einer Frau) — `source: "follow"`, `gender_tag: "female"`
2. **Hohe Prio:** Neue weibliche Follower (Frau folgt Diego) — `source: "follower"`, `gender_tag: "female"`
3. **Mittlere Prio:** Unfollow-Events (Drama!)
4. **Niedrige Prio:** Sonstige neue Follows/Follower
5. **Fallback:** Neuestes Spy-Event überhaupt

### Schritt 3: Anpassung in `FeedPage.tsx`
- Spy-Profil aus `profiles` ermitteln (`profiles.find(p => p.has_spy)`)
- `allEvents` nach `tracked_profile_id === spyProfile.id` filtern
- Priorisierungsfunktion anwenden
- Falls kein Spy-Event existiert: Fallback auf neuestes Event wie bisher

### Betroffene Datei
- `src/pages/FeedPage.tsx` — Zeilen 86–93 (Spy of the Day Selektion)

