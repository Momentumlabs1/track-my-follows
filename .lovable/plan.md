

## Plan: Dashboard komplett visuell überarbeiten — klare Bereiche, starker Kontrast

### Kernprobleme
1. **Kein visueller Unterschied** zwischen Spy-Bereich und Profilkarten — alles sieht gleich aus
2. **ProfileCards haben keinen echten Hintergrund** — `card-pink` ist nur 10% Opacity, quasi unsichtbar
3. **"Deine Profile"** ist als Label verwirrend — besser: "Überwachte Accounts" oder "Deine Accounts"
4. **Kein klarer Sektions-Aufbau** — alles fließt ineinander ohne visuelle Trennung
5. **Zuletzt-gefolgt-Bilder** noch zu groß

### Änderungen

#### 1. `src/components/SpyAgentCard.tsx` — Spy-Bereich als eigener Hero-Block

**Visuell komplett anders als Profilkarten:**
- Größerer SpyIcon: **96px** statt 80px, zentrierter Fokus
- Karten-Höhe erhöhen: oben ein großes "DEIN SPION" Label mit SpyIcon zentriert darunter, dann darunter den überwachten Account als kompakte Zeile
- **Vertikales Layout statt horizontal** — damit der Spy-Bereich sich klar von den horizontalen Profilkarten unterscheidet:
  - Oben: "🕵️ DEIN SPION" Titel zentriert
  - Mitte: SpyIcon 96px zentriert mit intensivem Glow, "↕ Ziehe mich" darunter
  - Unten: Überwachter Account als schmale weiße/halbtransparente Zeile (Avatar + @username + Stats) — so ist klar was der Spy überwacht
- Stärkerer Box-Shadow und dickerer Border für mehr Tiefe

#### 2. `src/components/ProfileCard.tsx` — Echtes Pink

- **`card-pink` CSS-Klasse updaten** in `index.css`: Von `hsl(var(--primary) / 0.1)` auf einen echten soliden Pink-Gradient wie bei den inline-styles (die schon funktionieren)
- Aber: Die Karte nutzt bereits inline-styles mit `linear-gradient(145deg, hsl(347 100% 62%), hsl(347 90% 52%))` — das Problem ist vielleicht Dark Mode oder dass die Klasse die Inline-Styles überschreibt
- **Zuletzt-gefolgt-Bilder**: von 48px auf **36px** verkleinern

#### 3. `src/pages/Dashboard.tsx` — Klare Sektionen

- **Section-Label** ändern: "Deine Profile" → "Überwachte Accounts" (klarer was gemeint ist)
- **Visueller Separator** zwischen Spy-Bereich und Profil-Liste: Abstand vergrößern + dezente Trennlinie oder Section-Header mit Icon

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | Vertikales Layout, SpyIcon 96px zentriert, überwachter Account als Unter-Zeile |
| `ProfileCard.tsx` | Bilder 36px statt 48px |
| `Dashboard.tsx` | Section-Label umbenennen, bessere Abstände |
| `index.css` | `card-pink` Klasse updaten falls nötig |

