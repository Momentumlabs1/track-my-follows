# Plan: Profile Page Complete Visual + Structural Rebuild

## Problem Summary

Die aktuelle Profilseite wirkt visuell zu schwer und zu roh:

- überall harte `#1C1C1E` / `#2C2C2E` Flächen
- große dunkle Blöcke statt hochwertiger Card-Hierarchie
- billige runde Emoji-Bubbles
- keine klare Priorisierung der Inhalte
- Analyse-Bereiche oberhalb der Tabs sind in ihrer aktuellen Form weder logisch noch visuell stark genug

Ziel ist eine **komplett neu gewichtete, modernere, greifbarere Profilseite** mit besserem App-Feeling, klarer Informationsarchitektur und konsistentem Spy-Branding.

---

## Ziel-Architektur

```
1. Profile Head (avatar + spy + username + stats)
2. Gender Bar (DB aggregates — NOT frontend array)
3. "Das hat der Spy gefunden" — 4 insight tiles
4. "In der letzten Woche" — 2 gender follow cards
5. "Dein Spy ist..." — branded 4-level status
6. Banners + 3 Tabs
```

---

## 1) Key Data Fix: Gender Bar

### Current bug

Aktuell wird die Geschlechterverteilung aus dem `followings`-Array gerechnet. Das ist fachlich falsch, weil:

- viele `gender_tag` dort `null` sind
- nur ein Teil der Datensätze überhaupt im Frontend geladen ist
- dadurch oben falsche oder unvollständige Werte stehen

### Fix

Die Gender-Bar muss ausschließlich auf den aggregierten Profilfeldern basieren:

- `profile.gender_female_count`
- `profile.gender_male_count`
- `profile.gender_unknown_count`

Diese Werte kommen aus `tracked_profiles` und werden serverseitig durch den Baseline-Scan gepflegt.

### Important semantic rule

Die obere Gender-Bar zeigt **Gesamtverteilung über analysierte Accounts**, nicht Wochen-Events.

### Display rules

- Bar nur rendern, wenn `female + male > 0`
- `unknown` nur als Text darunter, nicht als Bar-Segment
- Subtitle ehrlich formulieren:  
  
**„Geschlechterverteilung · Schätzung basierend auf analysierten Accounts“**

---

## 2) Visual Direction: Theme-Aware, Not Hardcoded

### Hard rule

Alle harten Background-Werte wie:

- `#1C1C1E`
- `#2C2C2E`

müssen raus.

### Use existing theme surfaces

Stattdessen bestehende Klassen nutzen:

- `native-card`
- `native-card-elevated`

Keine Inline-Backgrounds mehr auf Hauptcontainern.

### Intent

Die Seite soll:

- leichter
- hochwertiger
- mehr nach echter Mobile-App
- weniger nach dunklem Dashboard  
  
wirken.

### Visual principles

- theme-aware card surfaces
- subtile border + shadow statt schwerer schwarzer Slabs
- mehr Luft und klarere Card-Hierarchie
- keine riesigen dunklen Vollflächen
- keine Emoji-Optik
- kein Tortendiagramm
- keine billigen Analytics-Komponenten

---

## 3) File Changes

## A. `src/pages/ProfileDetail.tsx`

### Gender bar data source

Ersetze die bestehende Frontend-Zählung durch:

```
const femaleCount = profile?.gender_female_count ?? 0;
const maleCount = profile?.gender_male_count ?? 0;
const unknownGenderCount = profile?.gender_unknown_count ?? 0;
const showGender = (femaleCount + maleCount) > 0;
```

### Spy circle

- kein harter dunkler Kreis mehr
- stattdessen `hsl(var(--card-elevated))`
- plus `1px solid hsl(var(--border))`

### Stat cards

- keine Inline-Schwarzflächen mehr
- auf `native-card` umstellen
- Border-Radius beibehalten, aber visuell leichter machen

### Gender bar track

- ebenfalls theme-aware statt hartes Dunkelgrau

### Analysis section

Ersetze die bisherigen Komponenten durch drei neue Bereiche:

- `<SpyFindings />`
- `<WeeklyGenderCards />`
- `<SpyStatusCard />`

---

## B. `src/components/SpyFindings.tsx` (NEW)

## "Das hat der Spy gefunden"

Dieser Bereich ist **kein Raw-Counter-Block**, sondern ein qualitativer Snapshot.

### Layout

- 2x2 Grid
- 4 kompakte rechteckige Cards
- nicht tappable
- theme-aware
- keine schwarzen Monsterflächen
- keine Emojis

### Final 4 tiles

Die Tiles sollen qualitative, verständliche Signale zeigen:


| Tile          | Icon       | Value                                                           | Source                                                                                    |
| ------------- | ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Frauen-Anteil | Heart      | `72%` oder `–`                                                  | Anteil weiblich unter **7d neuen Follows**, nur wenn genug klassifizierte Daten vorhanden |
| Follow-Tempo  | TrendingUp | `Ruhig` / `Normal` / `Aktiv` / `Sehr aktiv`                     | 7d Follow-Count in qualitative Stufe gemappt                                              |
| Treue-Index   | Repeat     | `Stabil` / `Leicht wechselnd` / `Wechselhaft` / `–`             | Churn nur bei sinnvoller Sample-Größe                                                     |
| Netzwerk-Stil | Users      | `Selektiv` / `Ausgeglichen` / `Entdeckend` / `Sehr aktiv` / `–` | Following/Follower-Verhältnis, aber neutraler benannt                                     |


### Important corrections

- `Profil-Typ` wird ersetzt durch `Netzwerk-Stil`, weil das weniger pseudo-smart wirkt
- `Frauen-Anteil` darf **nur** die 7-Tage-Bedeutung haben, niemals still auf Gesamtwerte fallbacken
- wenn zu wenig klassifizierte 7d-Daten vorhanden sind: `–`
- `Treue-Index` braucht Mindest-Sample-Regel
- `Netzwerk-Stil` braucht Division-by-zero-Schutz und neutrale Fallbacks

### Visual style per tile

- `native-card`
- Lucide icon
- ruhige Brand-Akzente
- große Value-Zeile
- kleiner Label-Text
- 16px radius
- leichte Motion, aber nicht verspielt

### Minimum-sample rules

- Frauen-Anteil: nur wenn mindestens 3 klassifizierte neue Follows in 7d, sonst `–`
- Treue-Index: nur wenn mindestens 4 relevante Follow/Unfollow-Events in 7d, sonst `–`
- Netzwerk-Stil: nur wenn `follower_count > 0`, sonst `–`

---

## C. `src/components/WeeklyGenderCards.tsx` (NEW)

## "In der letzten Woche"

Dieser Bereich zeigt konkrete Event-Details, getrennt von den Insight-Tiles.

### Layout

- 2 rechteckige Cards nebeneinander
- links Frauen
- rechts Männer
- jeweils moderner, hochwertiger Card-Look
- keine Kreise
- keine Emoji-Faces

### Card content

- kleine Kontextzeile
- große Zahl
- gestyltes `♀` / `♂`
- darunter bis zu 3 Preview-Accounts
- `+X weitere`, wenn mehr vorhanden
- Tap öffnet Bottom Sheet mit kompletter Liste

### Visual style

- linke Card: leicht pink getönt
- rechte Card: leicht blau getönt
- nicht schrill, nicht billig
- saubere Preview-Avatare + Usernames

### Data source

`follow_events`, gefiltert auf:

- letzte 7 Tage
- `is_initial = false`
- `event_type = follow`

Gender-Fallback-Reihenfolge:

1. `profile_followings.gender_tag`
2. `follow_events.gender_tag`
3. `detectGender()`

### Important semantic rule

Wenn kein sauberes Gender ableitbar ist:

- nicht in Frauen/Männer-Cards anzeigen
- nicht künstlich erzwingen
- unknown bleibt außerhalb dieser beiden Cards

### Edge cases

- beide 0 → beide Cards sichtbar, aber gedimmt
- nur eine Seite Daten → andere Seite 0 und gedimmt
- < 3 Accounts → nur vorhandene zeigen
- kein Avatar → Initials-Fallback
- kein Display Name → nur `@username`

---

## D. `src/components/SpyStatusCard.tsx` (NEW)

## "Dein Spy ist..."

Dieser Bereich ersetzt den alten Suspicion-Block vollständig.

### Ziel

Kein technisches Score-Widget mehr, sondern eine branded, verständliche Statusdarstellung.

### Uses existing score logic

Der bestehende `overallScore` aus `analyzeSuspicion()` bleibt als Grundlage erhalten, aber wird anders dargestellt.

### 4 levels


| Range  | Label      | Color  | Description                       |
| ------ | ---------- | ------ | --------------------------------- |
| 0–15   | Gelassen   | Grün   | Noch keine klaren Auffälligkeiten |
| 16–40  | Aufmerksam | Gelb   | Leichte Auffälligkeiten erkannt   |
| 41–65  | Wachsam    | Orange | Mehrere Signale erkannt           |
| 66–100 | Alarmiert  | Rot    | Stark auffälliges Muster          |


### Important wording correction

Bei 0 echten Events darf die Karte **nicht zu sicher** klingen.

Darum:

- bei `0 events`:  
  
**Gelassen**  
  
**„Noch keine klaren Auffälligkeiten — dein Spy sammelt erste Signale“**
- bei `1–4 events`:  
  
normaler Level + Hinweis  
  
**„Frühe Einschätzung · wenig Aktivität“**
- bei `5+ events`:  
  
voller Status ohne Disclaimer

### Visual

- `native-card`
- Top: `Dein Spy ist...`
- Mitte: farbiger Level-Name
- darunter kurze Beschreibung
- unten: 4-Segment-Indikator
- kein Tortendiagramm
- kein Fallback-Placeholder
- nie verstecken

---

## E. `src/lib/suspicionAnalysis.ts`

Return-Type erweitern:

```
export interface SuspicionBreakdown {
  // ...existing fields
  spyLevel: "gelassen" | "aufmerksam" | "wachsam" | "alarmiert";
  spyLevelDescription: string;
}
```

Diese beiden Felder am Ende aus `overallScore` ableiten.

### Important note

Die bestehende Score-Logik bleibt erhalten, aber:

- keine rohe Score-Anzeige mehr im UI
- nur Level + Beschreibung
- Score bleibt intern die technische Basis

---

## F. Delete old components

Erst wenn die neuen Komponenten vollständig integriert und getestet sind:

- `NewFollowsBubbles.tsx` entfernen
- `SuspicionScoreCard.tsx` entfernen

Nicht vorher.

---

## G. i18n keys

### Add to `de.json` / `en.json`

#### Spy findings

- `spy_findings.title`
- `spy_findings.female_ratio`
- `spy_findings.follow_tempo`
- `spy_findings.loyalty`
- `spy_findings.network_style`

#### Tempo labels

- `spy_findings.quiet`
- `spy_findings.normal`
- `spy_findings.active`
- `spy_findings.very_active`

#### Loyalty labels

- `spy_findings.stable`
- `spy_findings.lightly_changing`
- `spy_findings.changing`
- `spy_findings.unclear`

#### Network style labels

- `spy_findings.selective`
- `spy_findings.balanced`
- `spy_findings.exploratory`
- `spy_findings.very_active_network`
- `spy_findings.not_enough_data`

#### Weekly section

- `weekly.title`
- `weekly.women_followed`
- `weekly.men_followed`
- `weekly.more_count`

#### Spy status

- `spy_status.title`
- `spy_status.gelassen`
- `spy_status.aufmerksam`
- `spy_status.wachsam`
- `spy_status.alarmiert`
- `spy_status.early_estimate`
- `spy_status.no_clear_signals`

---

## 4) Interaction Summary


| Element            | Tap                                       |
| ------------------ | ----------------------------------------- |
| Spy circle         | Navigate to `/spy` or open `MoveSpySheet` |
| 4 finding tiles    | None                                      |
| Female weekly card | Bottom sheet with full female follow list |
| Male weekly card   | Bottom sheet with full male follow list   |
| Bottom sheet row   | Opens `instagram.com/username`            |
| Spy status         | None                                      |


---

## 5) Edge Cases


| Scenario                         | Behavior                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| 0 follows in 7d both genders     | Weekly cards show 0, are dimmed, no avatars                 |
| Only one gender present          | Other card shows 0 and is dimmed                            |
| < 3 preview accounts             | Show only what exists                                       |
| No avatar                        | `InstagramAvatar` fallback initials                         |
| No display name                  | Show only `@username`                                       |
| Gender bar all counts 0          | Hide gender bar completely                                  |
| < 3 classified new follows in 7d | Frauen-Anteil tile shows `–`                                |
| < 4 relevant churn events        | Treue-Index tile shows `–`                                  |
| `follower_count = 0`             | Netzwerk-Stil tile shows `–`                                |
| 0 score events                   | SpyStatusCard renders with cautious “first signals” wording |
| 1–4 score events                 | SpyStatusCard renders with early-estimate disclaimer        |
| 5+ score events                  | Full status render without disclaimer                       |


---

## 6) Final intent

Die neue Profilseite soll nicht mehr wie ein rohes Analytics-Dashboard wirken, sondern wie ein **hochwertiges Spy-Produkt in einer modernen Mobile-App**:

- weniger schwarz
- weniger blockig
- keine billigen Bubbles
- bessere Hierarchie
- stärkere Card-Identität
- logische Trennung zwischen Gesamtverteilung, Analyse-Snapshot, Wochen-Details und Gesamtstatus
- deutlich besseres Consumer-App-Feeling

---

&nbsp;