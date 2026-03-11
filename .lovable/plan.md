

## Plan: SpyFindings als aufklappbarer Bereich in SpyStatusCard

### Idee
Die SpyFindings (Ghost-Follows, Private Accounts, Followback-Rate) werden standardmäßig ausgeblendet. Erst beim Klick auf die SpyStatusCard klappt der Bereich auf. Das macht die Seite cleaner.

### Änderungen

**`src/pages/ProfileDetail.tsx` (Zeilen 374-389)**
- SpyFindings und den Separator dazwischen entfernen
- SpyStatusCard bekommt die SpyFindings-Props zusätzlich übergeben

**`src/components/SpyStatusCard.tsx`**
- Neuen State `expanded` (default `false`) hinzufügen
- Der Klick auf die Card toggled `expanded` (statt das Info-Sheet zu öffnen)
- Info-Sheet bleibt erreichbar über das `(i)` Icon (stopPropagation)
- Unter der Card: `AnimatePresence` + `motion.div` für die SpyFindings, nur sichtbar wenn `expanded === true`
- SpyFindings-Props durchreichen (followEvents, followerEvents, profileFollowings, followerCount, followingCount)
- Kleiner Chevron-Indikator (▼/▲) am unteren Rand der Card als Aufklapp-Hinweis

### Resultat
- Card-Klick → SpyFindings klappt animiert auf/zu
- Info-Icon → Sheet mit Level-Erklärungen (wie bisher)
- Seite ist default deutlich kompakter

