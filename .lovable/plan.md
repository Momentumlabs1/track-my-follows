

# WelcomeDialog → 5-Step Tutorial Funnel

## Ansatz
Gleiche Datei (`src/components/WelcomeDialog.tsx`), gleicher Trigger, gleicher localStorage-Key. Nur der INHALT wird durch einen 5-Step Swipe-Funnel ersetzt. Fullscreen-Dialog, Dot-Indikator, Framer Motion Slide-Uebergaenge.

## Aenderungen

### 1. `src/components/WelcomeDialog.tsx` – Kompletter Inhalt ersetzen

- `step` State (0-4) hinzufuegen
- Dialog auf Fullscreen aendern (`max-w-full h-full` statt `max-w-[340px]`)
- Kein X-Button, kein Dismiss durch Overlay-Klick (nur ueber Buttons navigierbar)
- 5 Steps als `AnimatePresence` mit Slide-Transition (`x: 100 → 0 → -100`)
- Dot-Indikator unten (5 Dots, aktiver Dot = primary, Rest = muted)
- "Weiter"/"Zurueck" Buttons, letzter Step hat "Mission starten" → `handleClose()`

**Step 1 – Willkommen, Agent!**
- SpyIcon Animation (scale spring)
- Titel: "Dein geheimer Agent wurde aktiviert"
- Text: "Finde heraus wem dein Crush heimlich folgt – komplett anonym."
- Button: "Erste Mission starten →"

**Step 2 – Profil tracken**
- Mockup: Stilisierter Input mit @-Icon + "Username eingeben"
- Text: "Gib einen Instagram-Usernamen ein – wir scannen das Profil anonym. Niemand erfaehrt davon."

**Step 3 – Was dein Agent findet**
- 3 Feature-Cards (#1C1C1E bg):
  - 👀 Neue Follows
  - 👥 Neue Follower
  - ♀♂ Geschlechterverteilung

**Step 4 – Pro Features**
- 4 Feature-Cards:
  - 🔄 Unfollow-Tracker
  - 🕵️ Spy-Agent (stuendliche Scans)
  - 🚩 Verdachts-Score (0-100)
  - 👻 Ghost-Follows

**Step 5 – Los geht's!**
- SpyIcon + Confetti-artige Animation
- "Du bist bereit, Agent! Dein erster Scan laeuft."
- Button: "Mission starten 🚀" → `handleClose()`

**Design-Specs:**
- Hintergrund: `bg-background` (kein Glassmorphism)
- Cards: `bg-[#1C1C1E]` mit Border
- Emojis: `text-2xl` (24px)
- Titel: `text-xl font-extrabold text-foreground`
- Body: `text-[15px] text-[#8E8E93]`
- Framer Motion: `slideVariants` mit `x` direction based on navigation

### 2. `src/i18n/locales/de.json` + `en.json` + `ar.json`
- `welcome.step1_title`, `welcome.step1_desc`, `welcome.step1_cta`
- `welcome.step2_title`, `welcome.step2_desc`
- `welcome.step3_title`, `welcome.step3_card_*`
- `welcome.step4_title`, `welcome.step4_card_*`
- `welcome.step5_title`, `welcome.step5_desc`, `welcome.step5_cta`

### 3. `src/components/ui/dialog.tsx`
- Kein Aenderung noetig – der X-Button wird via CSS (`[&>button]:hidden`) im WelcomeDialog versteckt

### Betroffene Dateien
- `src/components/WelcomeDialog.tsx` (Komplett-Rewrite des Inhalts)
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/ar.json`

