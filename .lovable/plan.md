

## Plan: SpyIcon ohne weissen Hintergrund + stärkere Abgrenzung + coolerer Spy-Bereich

### 3 Änderungen

#### 1. SpyIcon: Weissen Kreis-Hintergrund entfernen (`SpyAgentCard.tsx`)
- Zeile 83: `bg-background border border-primary/40` Wrapper **weg** — das PNG hat bereits transparenten Hintergrund
- SpyIcon direkt rendern ohne den `rounded-full p-1.5 bg-background` Container
- Glow-Effekt bleibt direkt auf dem Icon via `drop-shadow`

#### 2. Stärkere Abgrenzung Greeting → Spy-Zone (`Dashboard.tsx`)
- Statt der dünnen `h-px bg-primary-foreground/20` Linie eine **eigene kleine SVG-Welle** als interner Separator
- Kleine konkave Kurve (ähnlich der unteren, aber flacher ~20px) die den Greeting-Bereich visuell "abschliesst"
- Alternativ: Ein dickerer, leicht transparenter Balken mit Blur-Effekt als Trenner

#### 3. Spy-Bereich: Coolerer Container statt `rounded-3xl border` (`Dashboard.tsx`)
- Statt der generischen `rounded-3xl border border-primary-foreground/25 bg-primary-foreground/10` Box:
- **Gradient-Border-Effekt**: Äusserer Wrapper mit `background: linear-gradient(135deg, white/20, white/5)` + innerer Container mit `bg-primary-foreground/8` — erzeugt einen schimmernden Rand
- **Subtiler innerer Glow**: `shadow-[inset_0_1px_20px_rgba(255,255,255,0.08)]` für Tiefe
- **Leichte Ecken-Highlights**: Kleine radiale Gradient-Akzente in den oberen Ecken

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | `bg-background` Wrapper vom SpyIcon entfernen, Icon grösser & frei |
| `Dashboard.tsx` | Separator durch mini-SVG-Welle ersetzen, Spy-Container mit Gradient-Border + Glow |

