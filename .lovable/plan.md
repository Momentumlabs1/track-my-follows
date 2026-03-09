

## Plan: Header-Text aufpeppen, "Spy Secret Pro"-Badge, Bottom-Nav größer

### 1. Header-Text verbessern (Dashboard.tsx, Zeilen 97-118)

**Oben links: "Spy Secret Pro" Badge statt "Spy-Secret"**
- Pro-Nutzer: "SPY SECRET PRO" mit leuchtendem Glow-Effekt (text-shadow, goldene/weiße Farbe, Crown-Icon)
- Free-Nutzer: "SPY SECRET" ohne Glow, gedämpfte Opacity, kein "Pro"-Suffix

**Greeting-Text aufpeppen:**
- Titel: `Willkommen zurück, Spy-{spyNumber}` (in einer Zeile)
- Subtitle konditionell:
  - Pro: "Dein Spion ist aktiv — hier ist dein Überblick."
  - Free: "Schalte deinen Spion frei für volle Kontrolle."

### 2. Free-Nutzer Spy-Karte (Dashboard.tsx, Zeilen 126 + bestehender Free-Block ~Zeile 275)

Die bestehende Free-Variante (Lock-Button) wird überarbeitet:
- Spy-Karte zeigt dasselbe Layout wie Pro, aber:
  - Profil-Bereich links ist leer mit Placeholder-Text ("Kein Profil überwacht")
  - SpyWidget rechts wird in Grayscale + reduzierter Opacity gerendert
  - Gesamte Karte hat einen `grayscale` + `opacity-60` Filter
- Tap auf die Karte öffnet ein Info-Sheet/Dialog das erklärt was der Spion kann, mit CTA zum Upgrade (ruft `showPaywall("spy_agent")` auf)

### 3. Bottom-Nav größer (BottomNav.tsx)

- Nav-Höhe von `50px` auf `60px` erhöhen
- Icon-Größe von `h-6 w-6` (24px) auf `h-7 w-7` (28px)
- Label-FontSize von `0.625rem` auf `0.6875rem`
- Gap zwischen Icon und Label von `gap-0.5` auf `gap-1`

### Dateien
- `src/pages/Dashboard.tsx` — Header-Text, Pro-Badge, Free-Spy-Karte
- `src/components/BottomNav.tsx` — größere Navigation

