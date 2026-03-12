

## Plan: "Spy des Tages" Karte überarbeiten + Spy-Profil stärker highlighten

### 1. Spy des Tages Karte redesignen (`src/pages/Dashboard.tsx`, Zeilen 208-295)

**Probleme aktuell:**
- Pink-Gradient macht Text schwer lesbar
- Event-Typ (Follow/Unfollow/Follower verloren) ist nicht klar erkennbar
- Kein Avatar, keine visuelle Zuordnung zum Profil

**Neues Design:**
- **Hintergrund**: `native-card` mit subtiler Border statt knalligem Pink-Gradient
- **Event-Typ als farbiges Badge** oben links:
  - 🔴 "Entfolgt" (destructive) | 🟠 "Follower verloren" (orange) | 🟢 "Neuer Follow" (green) | 🔵 "Neuer Follower" (blue)
- **Avatar des betroffenen Users** links anzeigen
- **Zwei Zeilen**: "@username hat entfolgt" + darunter "bei @tracked_profile"
- **SpyIcon** klein (20px) neben dem "SPY DES TAGES" Header statt 📋-Emoji
- **Timestamp** als dezenter Text rechts oben
- Free-User Locked-Version: gleicher Style aber mit Blur+Lock

### 2. Spy-Profil stärker highlighten (`src/components/ProfileCard.tsx`)

**Aktuell:** Nur ein dünner `border-2 border-primary/50` Ring
**Neu:**
- **Glow-Shadow**: `shadow-[0_0_16px_-2px_hsl(var(--primary)/0.3)]` um die Karte
- **Gradient-Border** statt simple border: Primary-to-Accent
- **SpyIcon Badge** (16px) als kleines Overlay oben rechts am Avatar
- **Hintergrund**: Subtiler `bg-primary/5` Tint auf der gesamten Karte

### 3. Translations
- `simple.spy_of_the_day_subtitle`: "Letzte Aktivität deines Spys" (de) / "Latest spy activity" (en)

### Betroffene Dateien
- `src/pages/Dashboard.tsx` (Spy des Tages Karten-Bereich)
- `src/components/ProfileCard.tsx` (Spy-Highlight verstärken)
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`

