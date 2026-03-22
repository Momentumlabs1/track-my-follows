

## Pro-Upgrade Erfolgs-Animation

Nach erfolgreichem Kauf wird statt dem sofortigen Schließen der Paywall eine fullscreen Celebration-Animation gezeigt.

### Was passiert

1. Nach `purchase()` Success → statt `closePaywall()` wird ein `showSuccess`-State aktiviert
2. Die Paywall-Inhalte faden aus, eine Celebration-Sequenz startet:
   - **Dunkler Fullscreen-Overlay** mit radialem Pink-Glow-Pulse
   - **Spy-GIF** springt groß rein (scale 0→1.2→1) mit Glow-Effekt
   - **Konfetti-Partikel** (kleine pinke/weiße Punkte animiert)
   - **"Willkommen im Pro!" Headline** mit Fade-in
   - **3 kurze Bullet-Points** (Spy Agent freigeschaltet, Stündliche Scans, Alle Analysen) faden nacheinander ein
   - **"Los geht's" Button** nach ~2s → schließt alles und navigiert zum Dashboard

### Dateien

- **`src/components/PaywallSheet.tsx`**: `showSuccess` State hinzufügen, nach Purchase statt `closePaywall()` die Success-View zeigen. Celebration-UI inline als conditional render im gleichen Sheet-Container.
- **`src/i18n/locales/de.json`**, **`en.json`**, **`ar.json`**: Neue Keys: `paywall.success_title`, `paywall.success_subtitle`, `paywall.success_spy_unlocked`, `paywall.success_hourly_scans`, `paywall.success_all_analytics`, `paywall.success_cta`

### Technische Details

- Konfetti: 20-30 `motion.div` Kreise mit randomisierten Positionen, Delays und Rotationen (rein CSS/framer-motion, keine externe Library)
- Timing: Spy-Icon bei 0s, Titel bei 0.4s, Bullets bei 0.7/0.9/1.1s, Button bei 1.8s
- Der gleiche `motion.div` Container bleibt offen (kein re-mount), nur der Inhalt wechselt via AnimatePresence
- Haptic: `haptic.success()` beim Übergang + nochmal beim Button-Tap

