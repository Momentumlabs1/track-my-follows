

## Plan: Dashboard Header — Spy-Nummer Greeting & Card Layout Improvements

### 1. Greeting ändern

**Aktuell:** `Hey {displayName}` mit dem E-Mail-Namen oder display_name.

**Neu:** `Willkommen zurück` als Haupttext, darunter `Spy-{4-stellige Zahl}` als Agenten-Kennung. Die 4-stellige Zahl wird deterministisch aus der User-ID generiert (z.B. Hash der ersten 8 Zeichen → Modulo 10000), sodass sie für jeden User stabil bleibt.

```
Willkommen zurück
Spy-4827
```

Subtitle bleibt: "Dein Spion ist aktiv – hier ist dein Überblick."

### 2. Spy-Kachel verbessern

- **"SPION ANGESETZT AUF"** Label nach ganz oben in die Kachel verschieben (aktuell sitzt es innerhalb des linken Profilbereichs mit kleiner Schrift).
- Label als eigene Zeile über der gesamten Kartenbreite, nicht nur über dem linken 65%-Bereich. Etwas größere Schrift, stärkerer Kontrast (text-primary-foreground/70 statt foreground/60).
- Die helle Profilseite (links) bekommt etwas mehr Padding oben, damit die Trennung klarer wird.
- Optional: Eine subtile Trennlinie oder einen leichten Divider zwischen Label und Profilinhalt.

### Dateien
- `src/pages/Dashboard.tsx` — Greeting Text + Spy-Nummer Logik + Kachel-Layout

### Technisch
```typescript
// Deterministische 4-stellige Spy-Nummer aus User-ID
const spyNumber = useMemo(() => {
  if (!user?.id) return "0000";
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) {
    hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 10000).padStart(4, "0");
}, [user?.id]);
```

