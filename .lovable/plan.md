

## Plan: SpyAgentCard aufwerten + ProfileCards pink + Bilder quadratisch

### 3 Probleme aus dem Screenshot

1. **SpyAgentCard sieht aus wie eine normale Profilkarte** — gleiche Höhe, gleicher Stil, nur mit kleinem Spy-Icon. Kein eigener "Spion-Bereich"-Charakter. Agent ist zu klein (56px), man erkennt nicht dass er ziehbar ist.
2. **Profilkarten sind weiß (`native-card`)** — verschmelzen mit dem weißen Hintergrund, keine Abgrenzung.
3. **"Zuletzt gefolgt"-Bilder sind 3:4 Rechtecke** statt Quadrate.

### Änderungen

#### 1. `src/components/SpyAgentCard.tsx` — Spy-Bereich mit Charakter

Horizontales Layout bleibt (breiter als hoch), aber deutlich aufgewertet:

- **SpyIcon von 56px → 80px** mit stärkerem mehrstufigem Glow und pulsierender Scale-Animation
- **Hinweis unter dem Icon**: kleiner Text "Ziehe mich!" oder Pfeil-Indikator damit klar ist, dass der Agent ziehbar ist
- **Titel-Zeile oben** im Card: "🕵️ DEIN SPION" als dezenter Label damit sofort klar ist was der Bereich darstellt
- **Avatar bleibt 48px** — der Agent soll das dominante Element sein, nicht das Profil
- **"Überwachung aktiv"** Statuszeile bleibt pink (kein grün)
- Hintergrund bleibt der dunkle Burgunder-Gradient — hebt sich gut ab

Layout:
```text
┌─────────────────────────────────────────┐
│  🕵️ DEIN SPION                         │
│                                         │
│  [Avatar 48px]  · · ·  [SpyIcon 80px]  │
│  @username              ↕ Ziehe mich   │
│  7.7K · 1.1K            🔴 Aktiv       │
└─────────────────────────────────────────┘
```

#### 2. `src/components/ProfileCard.tsx` — Pink-Tint zurück

- Ersetze `native-card` → `card-pink` in der Button-Klasse (Zeile 91)
- So heben sich die Karten vom weißen Hintergrund ab

#### 3. `src/components/ProfileCard.tsx` — Quadratische Bilder

- Ändere `aspectRatio: '3/4'` → `aspectRatio: '1/1'` (Zeile 155)
- "Zuletzt gefolgt" Bilder werden quadratisch statt rechteckig

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | SpyIcon 80px, Titel-Label, Drag-Hinweis, stärkerer Glow |
| `ProfileCard.tsx` | `card-pink` statt `native-card`, Bilder 1:1 statt 3:4 |

