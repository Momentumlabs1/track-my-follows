

## Umfassendes Redesign: Was schiefgelaufen ist + Neuer Plan

### Analyse der aktuellen Probleme

1. **Bilder kaputt (Zuletzt gefolgt)**: Die `target_avatar_url` URLs von Instagram werden direkt geladen statt durch den `image-proxy`. Die `InstagramAvatar`-Komponente wurde in ProfileCard durch rohe `<img>` Tags ersetzt, die den Proxy nicht nutzen.

2. **Spy-Bereich existiert nicht mehr richtig**: Die SpyWidget-Karte ist winzig (56px Icon + Text), kein visueller Fokus auf den überwachten Account. Man erkennt nicht, dass der Spion aktiv einen Account überwacht.

3. **ProfileCards haben keinen eigenen Hintergrund**: Die Karten verschmelzen mit dem App-Hintergrund (beides `card-elevated` bzw. Background). Keine Abgrenzung.

4. **ProfileDetail-Seite (Analytics)**: Alle `native-card` Elemente sind `hsl(var(--card))` = #111 auf #000 Background (Dark Mode) oder #fff auf #f7f7f7 (Light Mode). Kaum sichtbarer Kontrast. Buttons, Tabs und Insight-Karten heben sich nicht ab.

5. **Gender-Analyse fehlt NICHT** im Code (sie ist in `ProfileDetail.tsx` Zeile 402 im Insights-Tab), aber sie könnte durch Tab-Lock (Spy required) unsichtbar sein oder visuell untergehen.

6. **Schriftart**: Die Font-Definitionen sind korrekt in `index.css` (SF Pro Display). Keine Änderung nötig.

### Design-Entscheidung: Hybrid + Kombiniert + Gro\u00dfe Spy-Karte

### Plan: 6 Dateien

---

#### 1. `src/components/ProfileCard.tsx` -- Bilder fixen + Pink-Karten

**Problem**: Raw `<img>` statt `InstagramAvatar` bei "Zuletzt gefolgt"-Thumbnails, kein pinker Hintergrund
**Fix**:
- Ersetze alle `<img src={event.target_avatar_url}>` im Zuletzt-gefolgt-Bereich durch `InstagramAvatar` (nutzt automatisch den Proxy)
- Karte bekommt `background: hsl(var(--primary) / 0.12)` + `border: 1px solid hsl(var(--primary) / 0.15)` als pinken Tint
- Behalte Rechteck-Format (3:4) f\u00fcr die Thumbnails, aber nutze `InstagramAvatar` innerhalb
- Keine Usernamen unter den Thumbnails (bleibt so)

#### 2. `src/pages/Dashboard.tsx` -- Gr\u00f6\u00dfere Spy-Karte, mehr Platz

**Problem**: Spy-Widget ist zu klein, keine klare Kommunikation was \u00fcberwacht wird
**Fix**:
- Pink Hero Header bleibt (Gradient), bekommt mehr Bottom-Padding (`pb-12`)
- SpyWidget bekommt eigene prominente Sektion: gr\u00f6\u00dferer Avatar (64px), Follower/Following-Stats des \u00fcberwachten Profils, klare "Dein Spion \u00fcberwacht @username" Message
- Mehr Abstand zwischen Spy-Sektion und "Deine Profile" (`pt-8`)

#### 3. `src/components/SpyAgentCard.tsx` -- Gro\u00dfe, informative Spy-Karte

**Problem**: Zu minimalistisch, man versteht nicht was der Spy macht
**Fix**:
- Karte wird gr\u00f6\u00dfer mit eigenem pinken Gradient-Hintergrund (abgemildert: `hsl(347 100% 59% / 0.15)`)
- Spy-Icon bleibt 56px, draggable
- Darunter: Avatar des \u00fcberwachten Profils gr\u00f6\u00dfer (64px) + Username + Follower/Following Count
- Subtitel: "Wird st\u00fcndlich \u00fcberwacht"
- Braucht `profile` Prop f\u00fcr Follower/Following-Daten

#### 4. `src/pages/ProfileDetail.tsx` -- Analytics-Karten visuell abheben + Gender sichtbar

**Problem**: native-card = #111 auf #000, Elemente verschmelzen. Gender nur im Insights-Tab versteckt.
**Fix**:
- Stats-Karten (Follower/Following): Pinker Tint `hsl(var(--primary) / 0.1)` statt `native-card`
- Tabs: Klare visuelle Unterscheidung, aktiver Tab bekommt stärkeren Kontrast
- **Gender-Mini-Preview** direkt nach den Stats-Karten zeigen (vor den Tabs), wenn Daten vorhanden -- als kompakte Bar (Pink/Blau) mit Prozentzahlen
- Insights-Tab behält volle Gender-Analyse
- InsightsBubbleGrid und alle Analytics-Karten bekommen `border border-border/30` f\u00fcr minimale Abgrenzung

#### 5. `src/index.css` -- Besserer Karten-Kontrast

**Problem**: `--card` und `--background` sind zu \u00e4hnlich im Light Mode (100% vs 97%)
**Fix**:
- Light Mode: `--card-elevated` auf `0 0% 93%` (etwas dunkler f\u00fcr sichtbaren Kontrast)
- Neuer Utility-Klasse `.card-pink` f\u00fcr pinke Karten: `background: hsl(var(--primary) / 0.1); border: 1px solid hsl(var(--primary) / 0.12);`
- `.native-card` bekommt im Light Mode einen subtilen Shadow: `box-shadow: 0 1px 3px hsl(0 0% 0% / 0.04)`

#### 6. `src/components/InstagramAvatar.tsx` -- Keine \u00c4nderung n\u00f6tig

Die Komponente funktioniert korrekt. Das Problem war nur, dass ProfileCard sie nicht benutzt hat f\u00fcr die "Zuletzt gefolgt"-Bilder.

### Zusammenfassung der \u00c4nderungen

| Datei | Was |
|---|---|
| `ProfileCard.tsx` | Bilder via InstagramAvatar fixen, pinker Karten-Hintergrund |
| `Dashboard.tsx` | Mehr Platz im Hero, gr\u00f6\u00dfere Spy-Sektion |
| `SpyAgentCard.tsx` | Gr\u00f6\u00dfere Spy-Karte mit Account-Stats |
| `ProfileDetail.tsx` | Gender-Preview vor Tabs, pinke Stats-Karten, Karten-Kontrast |
| `index.css` | Besserer Light Mode Kontrast, `.card-pink` Utility |

