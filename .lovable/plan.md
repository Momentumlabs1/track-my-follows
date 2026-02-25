

## Plan: App radikal vereinfachen fuer "dumme Endkonsumenten"

### Problem
Die App zeigt zu viele technische Details (Gender-Ratio 0/40, Follow/Unfollow 5/15, Nachtaktivitaet 0/5). Niemand versteht auf den ersten Blick was "Following/Follower Ratio: 0.1x" bedeutet. Die App muss so simpel sein wie Tinder – ein Blick und man weiss Bescheid.

---

### Aenderungen

#### 1. ProfileDetail: Mini-Dashboard vereinfachen
**Aktuell**: "Agent Report" mit 3 Stat-Tiles + "Hottest Alert"
**Neu**: Grosse klare Headline + ein einziger auffaelliger Alert-Banner

```text
┌─────────────────────────────────┐
│  Hey Diego 👋                   │
│  Here's what @username did today│
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔥  3 neue Follows heute│    │
│  │     Meistens Frauen ♀   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

- Statt 3 separate Tiles → ein einziger zusammengefasster Satz
- Nur das Wichtigste: "3 neue Follows heute, meistens Frauen"
- Wenn nichts passiert: "😴 Alles ruhig heute"

#### 2. Suspicion-Score: Faktoren drastisch vereinfachen
**Aktuell**: 5 Balken mit Scores wie "0/40", "30/30", "5/15"
**Neu**: Einfache Aussagen mit Ampel-Emojis, KEINE Zahlen

```text
┌─────────────────────────────────┐
│  WHAT WE FOUND                  │
│                                 │
│  🟢 Follows mostly men          │
│  🔴 Very active – 642 new in    │
│     7 days!                     │
│  🟡 Some follow/unfollow        │
│  🟢 Normal follower ratio       │
│  🟢 No late-night activity      │
└─────────────────────────────────┘
```

- Keine Balken, keine Punkte-Scores
- Nur Ampel-Emoji (🟢🟡🔴) + ein kurzer Satz den JEDER versteht
- Die Gauge oben bleibt (grosser Score-Kreis ist gut visuell)

#### 3. Gender-Split: Groesser und klarer
**Aktuell**: Kleine Prozent-Zahlen + schmaler Balken
**Neu**: Riesige Emojis + fetter Balken + klarer Satz

```text
┌─────────────────────────────────┐
│  WHO THEY FOLLOW                │
│                                 │
│     ♀ 24%        ♂ 76%         │
│  ████████░░░░░░░░░░░░░░░░░░░░  │
│                                 │
│  👍 Mostly men – looks normal   │
│     OR                          │
│  ⚠️ Mostly women – suspicious!  │
└─────────────────────────────────┘
```

- Unter dem Balken: ein einziger Satz der sagt was das BEDEUTET
- Neue i18n Keys: "Mostly men – looks normal", "Mostly women – suspicious!", "Balanced mix"

#### 4. Dashboard: Klarere Begruessing + Alert
**Aktuell**: "Hello, diego 👋" + "🔥 Latest alert: @username"
**Neu**: Emotionalere, klarere Ansprache

```text
┌─────────────────────────────────┐
│  🕵️ Hey Diego!                  │
│  You're tracking 3 profiles     │
│                                 │
│  ┌──── HOT RIGHT NOW ────────┐  │
│  │ 🔥 @sxmxnxjxnx followed   │  │
│  │    3 new women today       │  │
│  └────────────────────────────┘  │
└─────────────────────────────────┘
```

- Zeige Anzahl getrackter Profile
- Hot Alert mit KONTEXT (nicht nur Username, sondern WAS passiert ist)

#### 5. Neue i18n Keys (EN, DE, AR)

```json
{
  "simple.mostly_men": "Mostly men – looks normal 👍",
  "simple.mostly_women": "Mostly women – suspicious! ⚠️",
  "simple.balanced": "Balanced mix – nothing unusual",
  "simple.who_they_follow": "Who they follow",
  "simple.what_we_found": "What we found",
  "simple.very_active": "Very active – {{count}} new follows in 7 days!",
  "simple.normal_activity": "Normal activity level",
  "simple.low_activity": "Barely active lately",
  "simple.some_churn": "Some follow/unfollow patterns",
  "simple.no_churn": "No follow/unfollow games",
  "simple.high_churn": "Lots of follow & unfollow – suspicious!",
  "simple.normal_ratio": "Normal follower ratio",
  "simple.high_ratio": "Follows way more than followers",
  "simple.no_night": "No late-night activity",
  "simple.some_night": "Some late-night follows 🌙",
  "simple.lots_night": "Lots of late-night follows! 🌙",
  "simple.new_follows_today": "{{count}} new follows today",
  "simple.no_activity_today": "All quiet today 😴",
  "simple.tracking_count": "You're tracking {{count}} profiles",
  "simple.hot_right_now": "Hot right now"
}
```

#### 6. Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/SuspicionMeter.tsx` | Faktoren-Section: Balken raus, einfache Emoji+Text-Liste. Gender-Section: Bewertungs-Satz darunter |
| `src/pages/ProfileDetail.tsx` | Mini-Dashboard vereinfachen: 3 Tiles → 1 zusammengefasster Banner |
| `src/pages/Dashboard.tsx` | Greeting + Hot Alert emotionaler, Tracking-Count anzeigen |
| `src/lib/suspicionAnalysis.ts` | Neue Felder pro Faktor: `simpleLabel` (der einfache Satz) und `level` ("safe"/"warning"/"danger") |
| `src/i18n/locales/en.json` | Neue simple.* Keys |
| `src/i18n/locales/de.json` | Deutsche Uebersetzungen |
| `src/i18n/locales/ar.json` | Arabische Uebersetzungen |

