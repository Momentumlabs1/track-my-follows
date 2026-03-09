

## Plan: Dashboard komplett neu gestalten

### Grundproblem
Das Dashboard hat zu viele visuelle Elemente die konkurrieren — der pinke Header, die pinke Spy-Karte, die Section-Labels, die Separator-Linien — alles zusammen wirkt überladen und unharmonisch.

### Neues Konzept: Clean & Minimal

#### 1. Header (`Dashboard.tsx`) — Schlanker, informativer

Statt des grossen pinken Gradient-Blocks ein **kompakter Header** ohne runde Ecken:
- Logo + "SpySecret" oben links, Settings-Icon oben rechts
- Greeting "Hey {name}" als grosse Zeile
- Darunter eine Info-Zeile: "{n} Accounts · Letzter Scan: {time}"
- **Kein** `rounded-b-[2rem]`, einfach ein flacher pinker Bereich mit weniger padding (`pb-8` statt `pb-24`)
- Kein negativer Margin-Trick mehr (`-mt-16`) — alles fliesst natürlich

#### 2. Spy-Karte (`SpyAgentCard.tsx`) — Komplett neu

**Wenn Spy zugewiesen:**
- **Weisser Card-Background** (`bg-card`) statt Pink-Gradient — konsistent mit den Profilkarten
- Linker Rand: Dicker pinker Accent-Streifen (`border-l-4 border-primary`)
- Layout: Avatar (48px) links, Username + Stats Mitte, SpyIcon (40px) rechts
- Oben: Dezentes Badge "🕵️ SPY · Stündlich" in Primary-Farbe
- Kein "Stündlich · Push-Scans · Unfollow-Erkennung" Footer — die Tags oben reichen
- Drag-Hint nur als kleiner Text unter dem SpyIcon

**Wenn kein Spy:**
- Gleicher Card-Style, aber mit CTA-Text und SpyIcon zum Ziehen

#### 3. Accounts-Section — Nahtlos

- Kein `border-t-2` Separator mehr — stattdessen nur der Section-Header "Deine Accounts" mit etwas Abstand (`mt-8`)
- Die Profilkarten bleiben wie sie sind (weiss, `bg-card`)
- Der Spy-Profil bekommt in der Account-Liste weiterhin sein kleines SpyIcon-Badge

#### 4. Gesamtstruktur

```text
┌─────────────────────────┐
│ Pink Header (kompakt)   │
│ SpySecret               │
│ Hey Username             │
│ 2 Accounts · Scan 14:30 │
└─────────────────────────┘  ← flach, kein rounded-bottom
                              ← kein -mt overlap
🕵️ DEIN SPION
┌─────────────────────────┐
│▌ [Avatar] @user   [Spy] │  ← bg-card, border-l-4 primary
│▌ 1.2K Follower · 500 Fg │
└─────────────────────────┘

👤 DEINE ACCOUNTS  (mt-8)
┌─────────────────────────┐
│ [Avatar] @user1    [>]  │  ← bg-card normal
│ 500 Follower             │
└─────────────────────────┘
┌─────────────────────────┐
│ [Avatar] @user2    [>]  │
└─────────────────────────┘
[+ Hinzufügen]
```

### Betroffene Dateien
| Datei | Was |
|---|---|
| `Dashboard.tsx` | Header vereinfachen, negativen Margin entfernen, Separator entfernen |
| `SpyAgentCard.tsx` | Pink-Gradient → weisse Card mit pinkem Left-Border, kompakter |

