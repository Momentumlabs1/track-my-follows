

# Redesign: Landing Page zu App-Onboarding-Flow

## Problem

Die aktuelle `/` Route zeigt eine klassische Website-Landing-Page mit Navbar, Hero, Features, Pricing-Sektionen und Footer. In einer nativen App (via Despia) macht das keinen Sinn. Apps haben:
- **Onboarding-Screens** (Carousel/Slides) beim ersten Oeffnen
- Danach direkt **Login/Signup**
- Kein Navbar, kein Footer, kein Scroll-Marketing

## Loesung: 3-Slide Onboarding + Auth

Die `/` Route wird zu einem fullscreen Onboarding-Carousel umgebaut. Kein Navbar, kein Footer. Nur 3 Slides die man swipen kann, dann ein CTA-Button der zu Signup fuehrt.

```text
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│                  │   │                  │   │                  │
│     [Logo]       │   │      🕵️          │   │      🔔          │
│                  │   │                  │   │                  │
│  Vertrauen ist   │   │  Kein Login      │   │  Echtzeit-       │
│  gut.            │   │  noetig          │   │  Benachrichti-   │
│  Spy-Secret ist  │   │                  │   │  gungen          │
│  besser.         │   │  Wir scannen     │   │                  │
│                  │   │  oeffentliche    │   │  Erfahre sofort   │
│  Finde heraus,   │   │  Profile –       │   │  wenn sich was   │
│  wem er wirklich │   │  anonym &        │   │  aendert.        │
│  folgt.          │   │  unsichtbar.     │   │                  │
│                  │   │                  │   │                  │
│     ● ○ ○        │   │     ○ ● ○        │   │     ○ ○ ●        │
│                  │   │                  │   │                  │
│  [Mission        │   │  [Weiter →]      │   │  [Los geht's →]  │
│   starten →]     │   │                  │   │  [Einloggen]     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## Aenderungen

### 1. `src/pages/Index.tsx` -- Komplett neu als Onboarding

- **Entferne**: Navbar, Footer, alle Sektionen (Hero, Features, Steps, Pricing, CTA)
- **Neu**: Fullscreen swipeable Carousel mit 3 Slides (via `embla-carousel-react`, bereits installiert)
- Slide 1: Logo + Tagline + Beschreibung
- Slide 2: Feature "Anonym & unsichtbar" mit Icon
- Slide 3: Feature "Echtzeit-Alerts" mit CTA-Buttons (Signup + Login)
- Dot-Indikator unten zeigt aktuelle Position
- Jeder Slide hat einen "Weiter"-Button, letzter Slide hat "Mission starten" + "Einloggen"
- Kein Navbar (`<Navbar />` Import entfernen)
- Kein Footer
- Alle Texte ueber i18n (neue Keys: `onboarding.slide1_title`, etc.)
- Fullscreen `min-h-screen` mit Aurora-Background
- Wenn User bereits eingeloggt ist: automatisch Redirect zu `/dashboard`

### 2. `src/components/Navbar.tsx` -- Anpassen

- Entferne die Landing-spezifische Logik (`isLanding` Check und Login/Signup Buttons)
- Navbar wird nur noch auf Dashboard/Settings/etc. gezeigt, nie auf `/`

### 3. i18n-Dateien -- Neue Onboarding-Keys

In `en.json`, `de.json`, `ar.json` neue Keys hinzufuegen:

```
"onboarding": {
  "slide1_title": "Vertrauen ist gut.",
  "slide1_highlight": "Spy-Secret ist besser.",
  "slide1_desc": "Finde heraus, wem er wirklich folgt...",
  "slide2_title": "Anonym & unsichtbar",
  "slide2_desc": "Kein Instagram-Login noetig...",
  "slide3_title": "Echtzeit-Alerts",
  "slide3_desc": "Erfahre sofort wenn...",
  "next": "Weiter",
  "get_started": "Mission starten",
  "login": "Einloggen"
}
```

### 4. Routing -- Bereits eingeloggte User

In `Index.tsx`: Wenn `useAuth()` einen User hat, automatisch `navigate('/dashboard')`. Der Onboarding-Flow ist nur fuer nicht-eingeloggte User.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/Index.tsx` | Komplett neu: Onboarding-Carousel statt Landing Page |
| `src/components/Navbar.tsx` | Landing-Logik entfernen |
| `src/i18n/locales/en.json` | Onboarding-Keys hinzufuegen |
| `src/i18n/locales/de.json` | Onboarding-Keys hinzufuegen |
| `src/i18n/locales/ar.json` | Onboarding-Keys hinzufuegen |

## Technische Details

- **Carousel**: `embla-carousel-react` (bereits in `package.json`) fuer native swipe-Gesten
- **Keine neuen Abhaengigkeiten** noetig
- Die alte Landing Page (`landing.*` i18n-Keys) kann bestehen bleiben fuer spaeter (Web-Version/App-Store-Listing), wird aber nicht mehr auf `/` gezeigt
- RTL funktioniert automatisch da Embla RTL unterstuetzt

