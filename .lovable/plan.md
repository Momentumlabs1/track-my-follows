

## Spy-Karte: Pink Redesign

Die Spy-Bubble (rechte Seite mit dem Spy-Icon) und die Profil-Bubble (links) sollen farblich ueberarbeitet werden, damit die Karte femininer und einheitlicher wirkt.

### Aenderungen in `src/pages/Dashboard.tsx`

**Aeusserer Container (Zeile 140)**
- Bleibt als Grundrahmen, aber der Gradient wird waermer/pinker: `hsl(340 50% 20%)` statt `hsl(340 30% 12%)`

**Profil-Bubble links (Zeile 220)**
- Dark Mode: von `bg-white/[0.04]` zu einem sanften Pink-Tint `bg-pink-500/[0.08]` oder `bg-primary/[0.08]`
- Light Mode: von `rgba(255,240,245,0.95)` zu einem kraeftigeren Pink `bg-pink-50` oder `bg-primary/[0.12]`

**Spy-Bubble rechts (Zeile 272)**
- Dark Mode: von `bg-white/[0.06]` zu `bg-pink-500/[0.12]` — pinker Tint statt grau
- Light Mode: von `bg-transparent` zu `bg-primary/[0.10]` — leicht pinker Hintergrund
- Abgerundeter Rahmen bleibt gleich

**"SPY ASSIGNED TO" Label (Zeile 214)**
- Textfarbe von `text-white/80` zu `text-pink-200` oder `text-primary-foreground/80` fuer mehr Pink-Kohaerenz

### Ergebnis

Beide Bubbles innerhalb der Spy-Karte bekommen einen einheitlichen Pink-Tint statt der aktuellen schwarz/grauen Flaechen. Im Light Mode sind sie hell-pink, im Dark Mode semi-transparent pink. Die Karte wirkt dadurch weiblicher und hebt sich farblich besser vom Rest ab.

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/Dashboard.tsx` | Zeilen 140, 220, 272: Background-Farben der Spy-Card Bubbles auf Pink-Toene umstellen (Dark + Light Mode) |

