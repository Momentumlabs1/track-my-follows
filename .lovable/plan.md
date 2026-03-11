

## Plan: Gender-Bar Überschrift und Spacing

### Änderung in `src/pages/ProfileDetail.tsx` (Zeilen 297-329)

1. **Mehr Abstand nach oben** — `mt-4` zum Gender-Block hinzufügen (ca. 16px Abstand zu den Follower/Folgt-Karten)

2. **Kleine Überschrift** — Über der Bar eine Zeile mit dem Text "Geschlechterverteilung" (als `section-header` oder kleiner muted Text), daneben direkt die Prozent-Verteilung

3. **Layout-Umbau**: Statt Disclaimer-Text darunter → kompaktere Zeile:
```
Geschlechterverteilung          ♀ 100%  ♂ 0%
[████████████████████████████████████████████]
```

Konkret:
- Zeile 297-329 ersetzen mit:
  - `mt-4` Container
  - Flex-Row: Links "Geschlechterverteilung" (0.6875rem, muted), Rechts die ♀/♂ Prozentwerte
  - Darunter die animierte Bar (ohne die Prozente nochmal darunter)
  - Disclaimer-Text entfernen oder optional ganz klein darunter lassen

Gleiches Muster für den "analysis running" Block (Zeilen 331-343): auch `mt-4` und gleiche Überschrift.

