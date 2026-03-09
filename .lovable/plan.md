

## Plan: Spy-Karte aufräumen — Header kompakter, Spy-Card schlanker mit exklusiven Spy-Daten

### Was stört aktuell
1. **Header**: "SpySecret", "Hey Name", Subtitle — drei zentrierte Texte übereinander, wirkt leer und nimmt viel Platz
2. **Spy-Card**: Gender-Bar soll weg, aber die Profil-Seite braucht stattdessen etwas Exklusives
3. **Gesamthöhe**: Die Karte ist zu hoch (`min-h-[140px]` + viel Padding)
4. **Farbübergang**: Schwarz/Weiß-Karte sitzt auf Pink-Hintergrund — passt nicht nahtlos

### Änderungen

#### 1. Header kompakter machen (`Dashboard.tsx`, Zeilen 83-96)
- **"SpySecret" + Greeting auf eine Zeile**: Links "SpySecret" als kleine Brand-Pill, rechts der Account-Count oder Scan-Zeit
- **"Hey Name"** bleibt als große Zeile, aber **ohne** den Subtitle darunter (der sagt eh nichts Neues)
- **Wave-Separator entfernen** (Zeilen 98-103) — spart 22px Höhe und der Übergang zur Spy-Card wird direkter
- Ergebnis: Statt 3 zentrierte Textblöcke + Wave → 1 top-bar + 1 Greeting, fertig

#### 2. Spy-Card: Gender-Bar raus, letzte Follower-Änderungen rein
- **Gender-Bar und `genderStats`/`useProfileFollowings` komplett entfernen**
- **Stattdessen**: Letzte 3-4 Follow-Events des Spy-Profils als kleine Avatar-Reihe anzeigen (ähnlich wie "Zuletzt gefolgt" auf den ProfileCards, aber hier zeigen wir **Follower-Events** — gained/lost — was man unten NICHT sieht)
- Dafür `useFollowEvents(spyProfile?.id)` nutzen, die letzten 4 non-initial Events nehmen
- Unter dem `@username`: Eine Zeile wie "3 neue Follows · 1 Unfollow" als kompakter Event-Counter
- Darunter die 4 kleinen runden Avatare der letzten Events

#### 3. Spy-Card Höhe reduzieren
- `min-h-[140px]` → `min-h-[120px]`
- Padding von `p-4` → `p-3`
- SpyIcon von 88px → 72px
- "Dein Spion" Label-Zeile darüber entfernen (ist durch die Karte selbst offensichtlich)

#### 4. Karte besser in den Pink-Header einbetten
- Statt harter Weiß/Schwarz-Karte: Die weiße Seite bekommt einen leichten Pink-Tint (`rgba(255,240,245,0.95)`) damit sie zum Hintergrund passt
- Karten-Border: `border border-white/20` statt keiner Border → weicher Übergang
- Shadow leicht reduzieren

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Dashboard.tsx` | Header kompakter (Wave + Subtitle weg), Gender-Bar entfernen, `useFollowEvents` statt `useProfileFollowings`, Spy-Card Höhe reduzieren, letzte Events als Avatare anzeigen |
| `SpyAgentCard.tsx` | SpyIcon Größe 88→72px |

