
# Capacitor entfernen

## Was wird gemacht

Alle Capacitor-bezogenen Dateien und Pakete werden entfernt. Die mobile-optimierten CSS-Aenderungen (Safe Areas, Bottom Nav, etc.) bleiben erhalten.

## Aenderungen

### 1. `capacitor.config.ts` loeschen
Die gesamte Datei wird entfernt.

### 2. `package.json` -- Capacitor-Pakete entfernen
Folgende 5 Pakete werden aus den Dependencies geloescht:
- `@capacitor/android`
- `@capacitor/cli`
- `@capacitor/core`
- `@capacitor/ios`
- `@capacitor/status-bar`

### Was bleibt erhalten
- Bottom Navigation (`src/components/BottomNav.tsx`)
- Safe-Area CSS (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`)
- Mobile-optimierte Styles (kein Text-Select, kein Tap-Highlight, kein Overscroll)
- `viewport-fit=cover` in `index.html`
- Alle anderen UI-Komponenten und Supabase-Integration
