

## Plan: Dashboard komplett überarbeiten — App-Look, grössere Texte, klare Trennung

### Probleme aktuell
- Spy-Bereich und Profilkarten sehen zu ähnlich aus (alles pink, alles in Bubbles)
- "Aktiv"-Badge ist unnötig klein und überflüssig
- Texte zu klein für eine mobile App
- "Zuletzt gefolgt" weisse Sub-Area kontrastiert viel zu hart
- Alles wirkt eingequetscht, nicht wie eine native App

### Änderungen

#### 1. `src/pages/Dashboard.tsx` — Mehr Platz, grössere Texte
- Header `pb-32` → `pb-40` (mehr Platz für den Spy-Bereich darunter)
- Greeting-Text von `1.875rem` → `2.25rem` (grösser, app-like)
- "SpySecret" Brand-Text von `0.8125rem` → `0.875rem`
- Spy-Bereich `-mt-24` → `-mt-28` (mehr Overlap, mehr Raum)
- Section-Header "Überwachte Accounts" grösser: von `0.75rem` → `0.8125rem`
- Profil-Liste `space-y-3` → `space-y-4` (mehr Luft zwischen Karten)

#### 2. `src/components/SpyAgentCard.tsx` — Aufgeräumt, grösser
- **"Aktiv"-Badge komplett entfernen** — überflüssig, der grüne Dot reicht
- Spy-Label "Dein Spion" von `0.625rem` → `0.75rem`
- "Überwachung aktiv" Text von `0.9375rem` → `1.125rem` (deutlich grösser)
- Username im Account-Button von `0.8125rem` → `0.9375rem`
- Stats-Text von `0.625rem` → `0.75rem`
- Avatar im Account-Button von `38px` → `44px`
- SpyIcon von `84px` → `72px` (etwas kleiner, damit es nicht drückt)
- Drag-Hint "Ziehen" von `0.5625rem` → `0.6875rem`
- Gesamtes Padding von `p-4` → `p-5`

#### 3. `src/components/ProfileCard.tsx` — Neutral, grösser, kein hartes Weiss
- **Hintergrund**: Pink-Gradient bleibt, aber die "Zuletzt gefolgt" Sub-Area ändert sich von `hsl(0 0% 100% / 0.95)` → `hsl(0 0% 100% / 0.15)` (halbtransparent, verschmilzt mit Pink statt hartem Weiss-Kontrast)
- Sub-Area Text von dark `text-muted-foreground` → `text-white/70`
- Username von `1rem` → `1.125rem`
- Stats von `0.75rem` → `0.8125rem`
- Avatar von `52px` → `56px`
- Padding von `p-4 pb-3` → `p-5 pb-4`
- Rect-Avatar Fallback-Farbe in Sub-Area anpassen (weiss/transparent statt gradient-pink)
- Clock/Time von `0.6875rem` → `0.75rem`
- ChevronRight von `h-4 w-4` → `h-5 w-5`

### Betroffene Dateien
| Datei | Was |
|---|---|
| `Dashboard.tsx` | Mehr Platz im Header, grössere Texte, mehr Spacing |
| `SpyAgentCard.tsx` | "Aktiv" Badge weg, alle Texte grösser, Avatar grösser |
| `ProfileCard.tsx` | Sub-Area halbtransparent statt weiss, alle Texte grösser |

