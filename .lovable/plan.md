

# Tutorial-Komplett-Überarbeitung

## Probleme (aktuell)

1. **Doppelter Step auf /add-profile**: Step 0 spotlighted `add-profile-btn`. Wenn der User drauf tippt, wird `advanceStep()` aufgerufen UND navigiert zu `/add-profile`. Aber Step 1 (`wait_for_add_profile`) wird sofort durch die Route-Erkennung advanced → Step 2 (`wait_for_scan_complete`) wird aktiv. Problem: Der `add-profile-btn` existiert noch kurz im DOM (weil Navigation async ist), und das Polling findet ihn nochmal → zeigt den gleichen Spotlight nochmal.

2. **Kein Auto-Scroll**: Wenn ein neuer Step ein Element weiter unten auf der Seite highlighted, scrollt die Seite nicht automatisch dorthin.

3. **Kein Pro-Upsell am Ende**: Tutorial endet abrupt ohne Pro-Erklärung.

4. **Kein Zurück zum Dashboard am Ende**: Nach Completion bleibt der User auf der Profilseite.

5. **Profil-Steps brauchen bessere Erklärung**: "Hier ist die Detailansicht deines getrackten Profils" fehlt als Einstiegs-Step.

---

## Neuer Step-Flow

```text
0. Intro-Bubble (zentriert, "Willkommen bei Spy Secret")
1. Spotlight: "add-profile-btn" → hideButton, User muss tippen
2. Action: wait_for_add_profile (User gibt Username ein)
   → Kein Spotlight auf /add-profile Seite!
3. Action: wait_for_scan_complete (Scan läuft)
4. NEW - Profil-Intro: Willkommens-Bubble auf Profilseite
   "Das ist die Detailansicht deines getrackten Profils"
   (kein Spotlight, einfach Info-Bubble mit "Weiter")
5. Spotlight: "gender-bar" + Auto-Scroll
6. Spotlight: "tabs-section" + Auto-Scroll
7. Spotlight: "locked-analysis" + Auto-Scroll
8. NEW - Pro-Upsell Step (kein Spotlight, zentrierte Bubble)
   Erklärt was Pro bietet: Spy Agent, Unfollow-Tracking, etc.
   → navigateTo: "/dashboard"
9. Completion auf Dashboard
```

---

## Änderungen

### 1. `src/components/AppTutorial.tsx`

**Step-Definitionen erweitern:**
- Neuen Typ `info` für Bubbles ohne Spotlight (Profil-Intro + Pro-Upsell)
- Steps neu ordnen wie oben beschrieben

**Auto-Scroll bei Spotlight-Steps:**
- Wenn `targetReady` wird und Step ein Spotlight ist: `document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })` aufrufen

**Doppel-Step Bug fixen:**
- In Step 0 (Spotlight auf `add-profile-btn`): Wenn `advanceStep()` durch Click-Handler aufgerufen wird, direkt auf Step 2 springen (den `wait_for_add_profile` Step überspringen, da der Click bereits die Navigation auslöst)
- ODER: Einfacher — Step 1 (`wait_for_add_profile`) prüft ob wir bereits auf `/add-profile` sind UND verhindert dass Step 0 nochmal angezeigt wird indem wir den Spotlight sofort auf `visible: false` setzen beim Advance

**Pro-Upsell Bubble:**
- Neue `ProUpsellBubble` Komponente: Spy-Icon, "Schalte Pro frei", 3-4 Bullet-Points (Spy Agent 24/7, Unfollow-Tracking, Geschlechteranalyse, Verdachts-Score), CTA "Mit Pro freischalten" → öffnet Paywall, "Später" → schließt Tutorial

**Completion → Dashboard:**
- Bei `handleClose` und nach Completion: `navigate("/dashboard")` aufrufen

### 2. `src/components/SpotlightOverlay.tsx`

- Keine strukturellen Änderungen nötig, Auto-Scroll wird im AppTutorial gehandelt

### 3. `src/i18n/locales/de.json` + `en.json` + `ar.json`

Neue Keys:
- `tutorial.profile_intro_title`: "Profilansicht"
- `tutorial.profile_intro_text`: "Hier siehst du alle Details zu deinem getrackten Profil."
- `tutorial.pro_upsell_title`: "Werde Pro-Agent"
- `tutorial.pro_upsell_text`: "Schalte alle Features frei"
- `tutorial.pro_feature_1`: "Spy-Agent: Automatische Scans rund um die Uhr"
- `tutorial.pro_feature_2`: "Unfollow-Tracking in Echtzeit"
- `tutorial.pro_feature_3`: "Geschlechteranalyse & Verdachts-Score"
- `tutorial.pro_cta`: "Pro freischalten"
- `tutorial.pro_later`: "Später"

