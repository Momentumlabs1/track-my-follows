

## Masterplan: Pro-Tutorial Reboot + Free-User Kostensenkung

### Zwei grosse Aenderungen

**A) Free-User: Nur 1 Page Followings abrufen (Kostensenkung)**
**B) Pro-Tutorial komplett neu: Interaktiver Onboarding-Flow mit echtem Scan**

---

### Teil A: Free-User auf 1 Page limitieren

**Problem:** Aktuell ruft `create-baseline` fuer ALLE User die komplette Following-Liste ab (bis zu 100 API-Calls). Free-User brauchen das nicht — sie sehen eh nur geblurrte Insights.

**Aenderung in `supabase/functions/create-baseline/index.ts`:**
- Vor dem Paginierungs-Loop: Subscription-Status des Users pruefen
- Wenn Free-User: nur 1 Page (GQL, ~200 Followings) laden, `baseline_complete = true` setzen, fertig
- Wenn Pro-User: voller Baseline-Loop wie bisher
- Spart ca. 10-50 API-Calls pro Free-User-Profil

**Aenderung in `supabase/functions/trigger-scan/index.ts`:**
- Ist bereits auf 1 Page limitiert (fetchPage1) — keine Aenderung noetig
- Der bestehende `PAYWALL_REQUIRED` Guard (Zeile 368) blockt bereits Wiederholungs-Scans fuer Free-User

**Aenderung in `src/pages/AnalyzingProfile.tsx`:**
- Leichte UI-Anpassung: Da der erste Scan fuer Free-User viel schneller ist (~3-5s statt 15-30s), wird der Fortschrittsbalken schneller laufen
- Evtl. weniger Steps anzeigen (kein "Baseline laden" Step fuer Free)

---

### Teil B: Pro-Tutorial komplett neu

Aktuell: 3 Steps (Info → Spotlight auf Spy-Zone → Fertig). Langweilig.

**Neuer Flow (6-7 Steps):**

```text
Step 1: Welcome-Info
  "Du bist jetzt Pro! Dein Spion ist bereit."

Step 2: Navigate zu /spy → Spotlight auf Spy-Name-Feld
  "Gib deinem Spion einen Namen!"
  → User kann tatsaechlich den Namen editieren
  → "Weiter" erst aktiv nach Name-Eingabe oder Skip

Step 3: Spotlight auf "Aktueller Einsatz" Sektion
  "Dein Spion ueberwacht dieses Profil."
  → Zeigt das erste gescannte Profil

Step 4: Navigate zu /profile/:id → Pro-Scan Overlay
  "Jetzt scannen wir das komplette Profil!"
  → System loest einmalig trigger-scan + create-baseline aus
  → Immersives ScanOverlay (das neue) wird angezeigt
  → Im Hintergrund: Gender-Berechnung, Spy-Score Setup

Step 5: Ergebnis-Screen im Overlay
  → Zeigt: X Followings analysiert, Gender-Verteilung, Spy-Score
  → "Dein Spion ist einsatzbereit!"

Step 6: Completion
  → Kurze Zusammenfassung was Pro alles kann
  → Button "Los geht's!" → Navigate zu /dashboard
```

**Technische Umsetzung:**

| Datei | Aktion |
|-------|--------|
| `src/components/ProTutorial.tsx` | KOMPLETT NEU — Multi-Page Flow mit Navigation |
| `src/components/ProScanOverlay.tsx` | NEU — Spezieller Scan-Overlay fuer Tutorial (basiert auf ScanOverlay) |
| `supabase/functions/create-baseline/index.ts` | EDIT — Free-User 1-Page Limit |
| `src/pages/AnalyzingProfile.tsx` | EDIT — Schnellerer Flow fuer Free-User |
| `src/i18n/locales/de.json` | EDIT — Neue Tutorial-Texte |
| `src/i18n/locales/en.json` | EDIT — Neue Tutorial-Texte |
| `src/i18n/locales/ar.json` | EDIT — Neue Tutorial-Texte |

**ProTutorial.tsx — Architektur:**
- Eigener Router-State: Tutorial navigiert den User physisch zu /spy und /profile/:id
- Nutzt `useNavigate()` um zwischen Seiten zu wechseln
- Overlay bleibt persistent ueber Seitenwechsel (in App.tsx gemounted)
- Neuer Step-Typ: `{ type: "navigate"; route: string }` um Seitenwechsel zu triggern
- Neuer Step-Typ: `{ type: "scan"; profileId: string }` um den Pro-Scan auszuloesen
- Das Tutorial merkt sich den State in sessionStorage um Seitenwechsel zu ueberleben

**ProScanOverlay.tsx:**
- Basiert auf dem bestehenden ScanOverlay
- Ruft `trigger-scan` + `create-baseline` parallel auf
- Zeigt nach Abschluss: Anzahl Followings, Gender-Split, initialer Spy-Score
- Kein Auto-Close — wartet auf "Weiter" Button

**create-baseline Free-User Limit:**
```typescript
// Neu: User-ID aus Auth extrahieren, Subscription pruefen
const { data: sub } = await supabase
  .from("subscriptions")
  .select("plan_type, status")
  .eq("user_id", userId)
  .maybeSingle();
const isPro = sub?.plan_type === "pro" && ["active","in_trial"].includes(sub?.status || "");

if (!isPro) {
  // Free: nur 1 Page, dann baseline_complete
  // ... fetch 1 page, save, mark complete, return
}
// Pro: voller Loop wie bisher
```

### Zusammenfassung

- **7 Dateien** betroffen (2 neu, 5 editiert)
- **1 Edge Function** editiert (create-baseline)
- **Kostensenkung:** Free-User sparen 10-50 API-Calls pro Profil
- **UX-Upgrade:** Pro-Tutorial wird zu einem interaktiven Erlebnis mit echtem Scan

