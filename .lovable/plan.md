

## Admin-Panel Redesign: Cleaner, Interactive, Drilldowns

### Probleme aktuell
1. **Free Users = -1** → `freeUsers` wird als `totalUsers - proUsers` berechnet, aber `proUsers` zählt alle aktiven/trial Subscriptions (auch mehrere pro User möglich). Fix: deduplizierte User-IDs zählen.
2. **API-Kosten Monat** nicht klickbar, kein Drilldown
3. **Visuelle Struktur** flach, keine klaren Sektionen
4. **Keine Tages-Aufschlüsselung** im Monats-View

### Änderungen

#### 1. Backend: `admin-stats` Edge Function
- Fix `proUsers`: Dedupliziere nach `user_id` bei aktiven Subscriptions
- Neues Feld `dailyBreakdown`: Aggregation der API-Calls der letzten 30 Tage gruppiert nach Tag (Datum + Count + Cost)
- Neues Feld `monthlyCallsByUser`: API-Calls diesen Monat pro User (user_id → count), analog zu `apiCallsByProfile` aber für den ganzen Monat

#### 2. Frontend: `AdminPage.tsx` komplett überarbeitet

**Übersicht-Tab — Sektionen mit Headern:**

```text
┌─────────────────────────────────┐
│ 👥 NUTZER                       │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │ 32 │ │ 5  │ │ 27 │           │
│ │User│ │Pro │ │Free│           │
│ └────┘ └────┘ └────┘           │
├─────────────────────────────────┤
│ 📊 PROFILE                      │
│ ┌─────────┐ ┌─────────┐        │
│ │   15    │ │    5    │        │
│ │ Profile │ │  Spies  │        │
│ └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│ 💰 API-KOSTEN                   │
│                                 │
│ [Heute — klickbar]              │
│  210 Calls · $0.14              │
│  ████████░░░ 42% Budget         │
│  → Drilldown: Calls pro User    │
│                                 │
│ [Monat — klickbar]              │
│  866 Calls · $0.60              │
│  → Drilldown: Tages-Liste +     │
│    Calls pro User (Monat)       │
│                                 │
│ [Prognose]                      │
│  Ø 124/Tag → ~$2.57/Monat      │
├─────────────────────────────────┤
│ 📈 AKTIVITÄT                    │
│ [Calls/Stunde Chart]            │
│ [Calls nach Function]           │
└─────────────────────────────────┘
```

**API-Kosten Monat Drilldown (klickbar):**
- Zeigt Liste der letzten 30 Tage: Datum | Calls | Kosten
- Jeder Tag klickbar → zeigt User-Aufschlüsselung für diesen Tag
- Am Ende: Gesamtansicht Calls pro User im Monat (wie heute-Drilldown aber Monatsdaten)

**Visuelle Verbesserungen:**
- Sektions-Header mit Icons und Trennlinien
- Konsistentes Spacing (gap-4 zwischen Sektionen, gap-3 innerhalb)
- Chevron-Icon bei klickbaren Cards (auf/zu)
- Smooth expand/collapse Animation mit framer-motion

### Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/admin-stats/index.ts` | Fix proUsers-Berechnung, `dailyBreakdown` (30 Tage) + `monthlyCallsByUser` hinzufügen |
| `src/pages/AdminPage.tsx` | Sektions-Layout, Monat-Drilldown klickbar, Tages-Drilldown, cleaner Design |

