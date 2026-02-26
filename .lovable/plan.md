

## Plan: Welcome-Dialog komplett überarbeiten – mehrstufige Einführung mit Spy-Agent-Enthüllung

### Konzept
Statt eines einfachen Dialogs mit Bullet Points: ein **3-Schritt-Intro** (Slides im Dialog), bei dem der Spy-Agent dramatisch "zum Vorschein kommt" und der Nutzer verstehen lernt, was die App tut.

**Slide 1 – "Dein Agent wird aktiviert..."**
- Dunkler Hintergrund, pulsierender Glow
- SpyIcon startet klein/unsichtbar, wächst mit Glow-Animation ins Zentrum
- Text: "Wir haben einen geheimen Agenten für dich bereitgestellt"
- Untertitel: "Er überwacht Instagram-Profile – ohne dass jemand es merkt"

**Slide 2 – "So funktioniert's"**
- 3 animierte Schritte (nacheinander einfliegen):
  1. 🔍 "Wähle ein Instagram-Profil aus"
  2. 🕵️ "Dein Agent beobachtet jede Veränderung"
  3. 📲 "Du bekommst Updates über neue Follows & Unfollows"

**Slide 3 – "Dein Free-Plan"**
- Was du kostenlos bekommst: 1 Profil, tägliche Updates, neue Follower sehen
- Was Pro bringt: Stündliche Scans, Entfolgt-Erkennung, volle Insights
- CTA: "Agent aktivieren 🕵️"

### Umsetzung

1. **`src/components/WelcomeDialog.tsx`** komplett überarbeiten:
   - State `step` (0/1/2) mit Weiter-Button
   - Jede Slide als eigene AnimatePresence-Section
   - SpyIcon mit Spring-Animation auf Slide 1 (scale 0→1, rotate, glow pulse)
   - Fortschritts-Dots unten

2. **`src/i18n/locales/de.json`** – Welcome-Texte erweitern:
   - `welcome.slide1_title`, `slide1_subtitle`
   - `welcome.slide2_title`, `slide2_step_1/2/3`
   - `welcome.slide3_title`, `slide3_free`, `slide3_pro`
   - `welcome.next`, `welcome.cta`

3. **`src/i18n/locales/en.json`** – gleiche Keys auf Englisch

### Betroffene Dateien
- `src/components/WelcomeDialog.tsx`
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`

