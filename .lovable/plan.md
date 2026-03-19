

## Gesamtplan: 8 Punkte auf einmal

### Status-Check: Was ist DONE vs OFFEN

| # | Thema | Status |
|---|---|---|
| 1 | Gender-Bar Gating (Pro) | ✅ DONE |
| 2 | Übersetzungen EN/AR | ✅ DONE |
| 3 | Tutorial komplett machen | ❌ OFFEN |
| 4 | Instagram-Links extern öffnen | ❌ OFFEN |
| 5 | Onboarding-Page Redesign | ❌ OFFEN |
| 6 | Spy-Analyse überarbeiten | ❌ OFFEN |
| 7 | Padding/Navigation/Safe-Area | ❌ OFFEN |
| 8 | Gender-Sheet verbessern | ❌ OFFEN |
| 9 | Feed überarbeiten | ❌ OFFEN |

---

### 1. Tutorial komplett machen
**Problem:** Tutorial hat nur 2 Popups (Intro + "Drück den + Button"), danach passiert nichts mehr weil die Action-Steps (`wait_for_add_profile`, `wait_for_scan_complete`) den Nutzer verlieren und die Spotlight-Steps (`gender-bar`, `tabs-section`, `locked-analysis`, `spy-agent-zone`) nie angezeigt werden weil die Element-IDs nicht gefunden werden oder der Nutzer nie zur richtigen Seite navigiert wird.

**Fix:**
- Tutorial-Flow robuster machen: nach dem Scan automatisch zum Profil navigieren
- Sicherstellen dass alle `targetId`s (`gender-bar`, `tabs-section`, `locked-analysis`, `spy-agent-zone`) tatsächlich im DOM existieren
- Längeres Polling (10s statt 5s) für async geladene Elemente
- Step-Indicator hinzufügen (z.B. "3/7") damit der User weiß wo er ist
- Tutorial-Bubble zentrierter und größer machen (nicht nur rechts unten in der Ecke)

**Dateien:** `src/components/AppTutorial.tsx`, `src/components/SpotlightOverlay.tsx`

---

### 2. Instagram-Links extern öffnen
**Problem:** Links öffnen aktuell mit `target="_blank"` und `href="https://instagram.com/..."` – im WebView (Despia) öffnet das den In-App-Browser statt die Instagram-App.

**Fix:** Instagram-Deep-Links nutzen: `instagram://user?username=xxx` mit Fallback auf `https://instagram.com/xxx`. Hilfsfunktion erstellen:
```
function openInstagram(username: string) {
  const nativeUrl = `instagram://user?username=${username}`;
  const webUrl = `https://instagram.com/${username}`;
  // Try native first, fallback to web
  window.location.href = nativeUrl;
  setTimeout(() => window.open(webUrl, '_blank'), 500);
}
```

**Dateien:** `src/lib/native.ts` (neue Funktion), `src/pages/ProfileDetail.tsx` (3 Stellen), `src/components/WeeklyGenderCards.tsx` (1 Stelle)

---

### 3. Onboarding-Page Redesign
**Problem:** Aktuell eine lange scrollbare Seite mit Feature-Pills, Feature-Cards und Notification-Preview. User erkennt nicht, dass man scrollen muss.

**Fix:** Single-Screen ohne Scroll:
- Alles auf eine Bildschirmhöhe (`h-[100dvh]`) packen
- Hero-Bereich kompakter: Logo + Headline + 3 Feature-Icons in einer Reihe
- CTA-Button prominent am unteren Rand (fixed)
- Kein Scrollen nötig — alles auf einen Blick sichtbar
- Smooth Transition zum Login (framer-motion page transition)

**Dateien:** `src/pages/Onboarding.tsx`

---

### 4. Spy-Analyse (SpyFindings) überarbeiten
**Problem:** Die Findings zeigen "Ghost-Follows", "Private Accounts %" und "Followback-Rate" – aber die Daten sind meist "—" (nicht genug Daten) und die Metriken sind verwirrend.

**Fix:**
- Klarere Labels und Beschreibungen für jede Metrik
- "Ghost-Follows" → "Follow & Unfollow" mit besserer Erklärung
- Wenn keine Daten: statt "—" einen motivierenden Hinweis ("Wird nach dem nächsten Scan sichtbar" — ist teilweise schon da, aber UI ist unklar)
- Karten visuell aufwerten: Icons statt Emojis, bessere Farbcodierung
- Progress-Bars für alle Metriken (nicht nur Followback-Rate)
- Hardcoded "Ghost-Follows" Label übersetzen

**Dateien:** `src/components/SpyFindings.tsx`, `src/i18n/locales/{de,en,ar}.json`

---

### 5. Padding, Navigation & Safe-Area
**Problem:** 
- BottomNav sitzt zu nah am unteren Bildschirmrand
- App-Content beginnt hinter dem iPhone Home-Indicator
- Zu wenig Padding oben und unten generell

**Fix:**
- **BottomNav:** Höhe von 72px auf 80px, extra `pb-2` innerhalb der Nav für Abstand zum Home-Indicator. Der `pb-[env(safe-area-inset-bottom)]` ist schon da, aber die Nav braucht mehr internen Abstand.
- **Body/HTML:** `padding-bottom: env(safe-area-inset-bottom)` ist bereits im body via `safe-area-inset-top`. Prüfen ob `viewport-fit=cover` im `<meta>` tag gesetzt ist.
- **Content-Padding:** Alle Hauptseiten (Dashboard, Feed, ProfileDetail, Settings) bekommen `pt-[calc(env(safe-area-inset-top)+20px)]` statt `+16px` und `pb-[calc(env(safe-area-inset-bottom)+120px)]` statt `+100px`.

**Dateien:** `src/components/BottomNav.tsx`, `src/pages/Dashboard.tsx`, `src/pages/FeedPage.tsx`, `src/pages/ProfileDetail.tsx`, `src/pages/Settings.tsx`, `index.html` (viewport meta)

---

### 6. Gender-Sheet (Bottom Sheet) verbessern
**Problem:** Sheet ist funktional aber "desktop-mäßig" — feste 60vh Höhe ist OK, aber Scrollbalken nicht sichtbar, Layout generisch.

**Fix:**
- Sichtbaren Scroll-Indicator erzwingen (custom scrollbar CSS für dieses Sheet)
- Größere Avatare (48px statt 44px)
- Mehr vertikales Padding pro Eintrag
- Section-Header mit Zähler prominenter
- Sheet-Backdrop dunkler für mehr Fokus

**Dateien:** `src/components/WeeklyGenderCards.tsx`, `src/index.css` (scrollbar override für Sheet)

---

### 7. Feed überarbeiten
**Problem:** Feed-Cards sind funktional aber basisch. Das Layout mit zwei Avataren + Pfeil + "folgt" Label ist OK, aber die Gesamtanmutung ist nicht poliert genug.

**Fix:**
- Kompaktere Cards mit mehr Informationsdichte
- Event-Type Badge (Follow/Unfollow/Neuer Follower) als farbiger Tag
- Zeitstempel pro Event hinzufügen
- Tracked-Profil-Name prominenter anzeigen
- Bei Klick auf einen Feed-Eintrag → zum Profil navigieren
- Empty State aufwerten

**Dateien:** `src/components/EventFeedItem.tsx`, `src/pages/FeedPage.tsx`

---

### Zusammenfassung: Dateien die geändert werden

| Datei | Änderungen |
|---|---|
| `src/components/AppTutorial.tsx` | Tutorial robuster, zentrierter, Step-Indicator |
| `src/components/SpotlightOverlay.tsx` | Besseres Positioning |
| `src/lib/native.ts` | `openInstagram()` Hilfsfunktion |
| `src/pages/ProfileDetail.tsx` | Instagram-Links extern, Padding |
| `src/components/WeeklyGenderCards.tsx` | Instagram-Links extern, Sheet-Verbesserung |
| `src/pages/Onboarding.tsx` | Single-Screen Redesign |
| `src/components/SpyFindings.tsx` | Analyse überarbeiten |
| `src/components/BottomNav.tsx` | Größer, mehr Abstand |
| `src/pages/FeedPage.tsx` | Feed überarbeiten, Padding |
| `src/components/EventFeedItem.tsx` | Feed-Cards aufwerten |
| `src/pages/Dashboard.tsx` | Padding |
| `src/pages/Settings.tsx` | Padding |
| `src/index.css` | Scrollbar-Override für Sheets |
| `index.html` | viewport-fit=cover prüfen |
| `src/i18n/locales/{de,en,ar}.json` | Neue Keys für SpyFindings |

