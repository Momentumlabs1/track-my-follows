

## Dashboard Redesign – Starker visueller Kontrast

### Problem
Alles sieht gleich aus: Der Spy-Bereich hat denselben dunklen Hintergrund und dieselbe Card-Optik wie die Profile darunter. Es fehlt visueller Kontrast und Hierarchie.

### Lösung: Drei klar unterschiedliche Zonen

**Zone 1 – Hero Header** (bleibt wie aktuell, `bg-card-elevated`, dunkelgrau)
- Logo + "Hey Name! ❤️" + Subtitel
- Keine Änderung nötig

**Zone 2 – Spy-Bereich: Komplett pink/primary Hintergrund**
- Statt dem subtilen `hsl(347 ... / 0.18)` Tint bekommt der gesamte Spy-Container einen **echten, kräftigen pink Hintergrund**: `hsl(347, 80%, 25%)` bis `hsl(347, 70%, 18%)` Gradient
- Das ist ein dunkles, sattes Pink/Magenta – nicht transparent über Schwarz, sondern eine eigenständige Farbe
- Der Text wird heller/weißer, der Username größer (1rem statt 0.9375rem)
- "SPY ÜBERWACHT" Label bekommt hellere Farbe (`text-white/70`)
- Der Spy-Icon bleibt 80px, der Avatar-Ring wird heller (`ring-white/30`)
- Unfollow-Hint passt sich an den pinken Hintergrund an

**Zone 3 – Profile Cards** (bleiben dunkel, `native-card` wie bisher)
- Keine Änderung – der Kontrast entsteht automatisch durch den pinken Spy-Bereich darüber
- Die Cards bleiben in ihrem dunklen `#111` Stil

### Visueller Kontrast

```text
┌──────────────── dunkelgrau (#111) ────────┐
│  Hey ewcwe! ❤️                            │
└───────────────────────────────────────────┘

┌────────────── KRÄFTIGES PINK ─────────────┐
│  SPY ÜBERWACHT                    ● Aktiv │
│  [Avatar]  @saif_nassiri    [🕵️ 80px]    │
│            Letzter Scan...                │
└───────────────────────────────────────────┘

  DEINE PROFILE

┌──────────── schwarz/dunkelgrau ───────────┐
│  [Avatar] @strichabi        Vor 2 Std. >  │
│  ┌── pink tint ──────────────────────────┐│
│  │ Zuletzt gefolgt  [👤][👤][👤]        ││
│  └───────────────────────────────────────┘│
└───────────────────────────────────────────┘
```

### Dateien

1. **`src/components/SpyAgentCard.tsx`** – Background-Gradient von transparent-pink zu echtem satten Pink-Gradient ändern. Text-Farben aufhellen. Beide States (mit/ohne Spy) anpassen.
2. **`src/pages/Dashboard.tsx`** – Keine Änderung nötig, der Kontrast kommt aus der SpyAgentCard.

