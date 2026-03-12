

## Plan: Feed-Item Design modernisieren

### Problem
Die Feed-Zeilen sehen generisch und "programmiert" aus: kleiner grüner Pfeil + Text in der Mitte, Avatare an die Seiten gedrückt, viel leerer Raum.

### Neues Design: Kompakte Card pro Event

Statt einer flachen Zeile wird jedes Event eine **kompakte Card** im `native-card` Style:

```text
┌─────────────────────────────────────────┐
│  [Avatar 44px]  →  [Avatar 44px]        │
│  @havvaal_     folgt    @timwger        │
└─────────────────────────────────────────┘
```

**Konkret:**
- **Card-Background**: `native-card` (subtile Border + Background) statt unsichtbarer feed-row
- **Horizontal zentriert**: Beide Avatare + Pfeil als kompakte Gruppe in der Mitte, nicht an die Ränder gedrückt
- **Avatare etwas kleiner** (48px statt 58px) für kompakteres Feeling
- **Pfeil**: Dünnere Linie statt fetter Pfeil-Icon, in `muted-foreground` statt grün — dezenter
- **"folgt" Label** unter dem Pfeil in `text-muted-foreground` statt knalligem Grün, klein und dezent
- **Usernames** direkt unter den Avataren statt darüber, in `text-xs text-muted-foreground`
- **Tracked-Profil**: Behält den pinken Gradient-Border (eckig), aber dezenter (1.5px)
- **Spacing**: Kleiner Gap zwischen den Cards (`gap-2`), leichtes `mx-5` Padding
- **Kein Separator-Line** zwischen Items, die Cards selbst schaffen die Abgrenzung

### Änderungen

#### `src/components/EventFeedItem.tsx`
- Layout von `feed-row` auf `native-card` mit `p-4` umstellen
- Avatare + Pfeil als `flex items-center justify-center gap-4` in der Mitte
- Pfeil: schlichte `→` Linie in muted statt grüner ArrowRight
- Usernames unter die Avatare verschieben
- Avatar-Size auf 48px reduzieren

#### `src/pages/FeedPage.tsx`
- Events in `div` mit `flex flex-col gap-2 px-5` wrappen statt direkt aneinander

#### `src/index.css`
- `.feed-row` Klasse kann entfernt werden (nicht mehr genutzt)

