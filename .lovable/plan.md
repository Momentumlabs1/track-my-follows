

## Plan: SpyAgentCard aufräumen und aufwerten

### Probleme
- Das animierte GIF (`spyAnimated`) soll raus — wirkt billig
- Der überwachte Account wirkt wie eine "durchsichtige Bubble" — nicht klar genug eingebunden
- Der Spy-Bereich ist insgesamt nicht markant genug als eigenständiger Bereich erkennbar

### Änderungen in `src/components/SpyAgentCard.tsx`

1. **GIF entfernen** — `spyAnimated` Import und `<img src={spyAnimated}>` raus, stattdessen `<SpyIcon size={80} glow />` als statisches, sauberes Icon verwenden

2. **Profil-Info direkt integrieren** statt als separater Button-Block:
   - Avatar (44px) + Username + Stats bleiben links, aber ohne eigenen Hintergrund/Bubble — direkt auf dem Gradient-Hintergrund platziert mit weißer Schrift
   - Kein extra `background` oder `border-radius` um den Profil-Bereich

3. **Spy-Bereich visuell stärker branden**:
   - "🕵️ DEIN SPION" Label oben links im Card als kleine Überschrift
   - Stärkerer Border: `2px solid hsl(347 100% 59% / 0.4)` statt 1px
   - Hintergrund-Gradient etwas heller/kräftiger: mehr Pink, weniger Schwarz
   - SpyIcon rechts mit stärkerem Glow (größerer Blur-Radius, höhere Opacity)

4. **Drag-Hinweis beibehalten** — "↕ Ziehe mich" unter dem SpyIcon

### Betroffene Datei
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | GIF raus → SpyIcon 80px, Profil-Bubble entfernen, stärkeres Branding |

