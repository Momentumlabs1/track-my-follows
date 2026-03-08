

## Plan: Feed-Rows komplett überarbeiten — klar, lesbar, sofort verständlich

### Problem
Die aktuellen Feed-Rows sind verwirrend: zwei Avatare, Text dazwischen, keine klare visuelle Hierarchie. Man versteht nicht auf einen Blick was passiert ist.

### Neues Design — Notification-Style (wie Instagram)

Jede Row wird ein kompakter, sofort lesbarer Satz mit klarem Layout:

```text
┌─────────────────────────────────────────────────┐
│ [Avatar 44px]  @saif_nassiri folgt jetzt    8h  │
│  (pink ring)   @stephan.nq        [Avatar 32px] │
│                                    (klein, grau) │
├─────────────────────────────────────────────────┤
│ [Avatar 44px]  @339jaann neuer         9h   ●   │
│  (normal)      Follower von                      │
│                @saif_nassiri       [Avatar 32px] │
│                                    (pink ring)   │
└─────────────────────────────────────────────────┘
```

### Konkrete Änderungen

#### 1. `src/components/EventFeedItem.tsx` — Komplett neu

- **Einzeiliger Satz** statt zwei getrennte Textblöcke: `@actor verbt @target`
- **Linker Avatar = Actor** (44px), mit pink `avatar-ring` wenn es unser getrackter Account ist
- **Rechter Avatar = Target** (32px), kleiner und dezenter, mit pink ring wenn es unser getrackter Account ist
- **Verb farbig inline**: grün "folgt jetzt", rot "hat entfolgt", grün "neuer Follower von", rot "Follower verloren"
- **Farbiger Punkt-Indikator** links am Avatar-Rand: grüner Dot für positive Events, roter Dot für negative — sofort erkennbar
- **Zeit rechts oben**, unread-Dot darunter — wie jetzt aber kompakter
- Text als ein zusammenhängender Satz: `@saif_nassiri folgt jetzt @stephan.nq`

#### 2. `src/index.css` — Feed-Row Padding anpassen

- Padding leicht reduzieren: `0.75rem 1.25rem` statt `0.875rem`
- Avatar-Ring dünner: 1.5px statt 2px padding

### Betroffene Dateien
| Datei | Was |
|---|---|
| `EventFeedItem.tsx` | Neues Layout: Actor links groß, Verb+Target als Satz, Target-Avatar rechts klein |
| `index.css` | Feed-row padding optimieren |

