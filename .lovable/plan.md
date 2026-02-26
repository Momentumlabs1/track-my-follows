

## Plan: Welcome-Popup, Free-User Dashboard wie Pro (aber gelockt), Spy Agent sichtbar aber gesperrt

### 1. Welcome-Popup nach Registrierung erstellen
- Neue Komponente `src/components/WelcomeDialog.tsx`: Modal/Sheet das nach erstem Login erscheint
  - Spy-Logo animiert, "Willkommen bei Spy-Secret!", Mini-Einleitung (3 Punkte: was die App kann, was Free beinhaltet, wie man upgradet)
  - "Los geht's"-Button schließt und setzt `localStorage`-Flag `welcome_shown`
- In `Dashboard.tsx`: beim Mount prüfen ob `welcome_shown` existiert, wenn nicht → Dialog zeigen

### 2. Dashboard für Free-User umbauen – Pro-Layout mit Blur/Lock
Aktuell sehen Free-User den Spy Agent Card gar nicht (`isPro &&`). Änderungen in `Dashboard.tsx`:

- **Spy Agent Card**: Immer anzeigen, aber für Free-User eine gelockte Version:
  - Card mit `opacity-40 grayscale blur-sm` + Lock-Overlay + "Pro freischalten"-Button → `showPaywall("spy_agent")`
  - Kein Drag, keine Interaktion
- **Event Feed**: Free-User sehen Follower-Events (1x täglich) aber Following- und Unfollow-Events werden ausgeblendet oder gelockt:
  - Follower-Events (`source === "follower"` + `event_type === "gained"`) → sichtbar (geblurred wie bisher)
  - Following-Events (`source === "follow"`) → nicht im Feed für Free (oder als gelockte Platzhalter)
  - Unfollow-Events → nicht im Feed für Free

### 3. EventFeedItem Filter-Logik
In `Dashboard.tsx` den `allEvents`-Filter anpassen:
- Free-User: nur `source === "follower"` Events durchlassen
- Pro-User: alles wie bisher

### 4. Spy Agent Card gelockte Variante
In `SpyAgentCard.tsx` oder direkt in `Dashboard.tsx`:
- Neue Bedingung: wenn `!isPro` → gelockte Fake-Version der SpyAgentCard rendern (gleicher Look, aber Blur + Lock-Icon + Paywall-Trigger)

### 5. Translations ergänzen
- `de.json` / `en.json`: Welcome-Texte, "Spy Agent gesperrt", Mini-Einleitung

### Betroffene Dateien
- `src/components/WelcomeDialog.tsx` (neu)
- `src/pages/Dashboard.tsx`
- `src/components/SpyAgentCard.tsx`
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`

