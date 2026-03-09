

## Plan: Mehr Abgrenzung zwischen den drei Dashboard-Zonen

### Problem
Die drei Bereiche (Header, Spy-Karte, Accounts) fliessen visuell ineinander — es fehlt klare Trennung.

### Änderungen

**`src/pages/Dashboard.tsx`**:
- **Zwischen Spy-Karte und Accounts**: Stärkerer visueller Break — Section-Header "Deine Accounts" bekommt einen kleinen Icon (z.B. `Users` aus lucide) und mehr `pt-12` statt `pt-10`
- **Separator** dicker machen: `border-t border-border/60` statt `/40`, und zusätzlich `mt-6` Abstand nach der Spy-Karte
- **Spy-Bereich**: Eigenen Section-Header "🕵️ Dein Spion" **über** der Spy-Karte hinzufügen (als kleines Label ausserhalb der pinken Karte), damit klar ist dass das ein eigener Bereich ist

**`src/components/SpyAgentCard.tsx`**:
- Keine strukturellen Änderungen nötig — die Abgrenzung kommt durch das Dashboard-Layout

### Konkret

```
[Pink Header - Hey User]
          ↓ 16px overlap
[── 🕵️ SPION ──────────]  ← neues Section-Label
[  Pink Spy-Karte       ]
          ↓ 32px gap
[────── Trennlinie ─────]  ← border-t border-border/60
[── 👤 DEINE ACCOUNTS ─]  ← Section-Label mit Icon
[  ProfileCard 1        ]
[  ProfileCard 2        ]
[  + Hinzufügen         ]
```

### Dateien
| Datei | Was |
|---|---|
| `Dashboard.tsx` | Section-Labels, stärkere Separator, mehr Spacing |

