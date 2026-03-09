

## Plan: Spy-Drag Fix + Drop-Animation

### Problem 1: Spy verschwindet hinter dem Hintergrund
Die Spy-Card hat `overflow-hidden` (Zeile 101 in Dashboard.tsx) auf dem Container mit `rounded-[1.75rem]`. Wenn das Icon rausgezogen wird, schneidet der Container es ab. 

**Fix**: `overflow-hidden` nur auf die Hintergrund-Layer anwenden (clipPath reicht bereits), nicht auf den gesamten Container. Der Container bekommt `overflow-visible`, damit das Icon frei schweben kann. Die abgerundeten Ecken werden über die inneren clipPath-Divs beibehalten.

### Problem 2: Keine Drop-Animation
Aktuell passiert beim Loslassen auf einem Account nichts Visuelles — der Spy springt einfach zurück. 

**Fix — 3-phasige Drop-Animation**:
1. **Drop-Moment**: Wenn der Spy auf einen Account fallen gelassen wird, bekommt die ProfileCard einen kurzen "Verbindungs-Puls" — ein heller Pink-Glow der von der Karte ausgeht (scale 1.05 → 1.0 + border-glow), synchron mit Vibration
2. **Spy-Icon**: Statt sofort zurückzuspringen, kurz auf der Karte verweilen (200ms), dann mit einer schnellen `spring`-Animation zurück zum Dock gleiten
3. **Spy-Card oben**: Die Profil-Info auf der linken Seite wechselt mit einer slide-up/slide-in Animation zum neuen Account

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Dashboard.tsx` | `overflow-hidden` vom Spy-Card-Container entfernen; neuen State `droppedOnProfileId` für die Drop-Animation; ProfileCard bekommt `isDropped` prop |
| `SpyAgentCard.tsx` | `dragSnapToOrigin` beibehalten, aber `onDragEnd` um kurze Verzögerung erweitern bevor der Snap zurück passiert |
| `ProfileCard.tsx` | Neues `isDropped` prop: Wenn true, kurzer Pink-Glow-Puls + Scale-Bounce Animation (0.3s), dann reset |

### Animations-Ablauf beim Drop

```text
t=0ms    Spy losgelassen auf ProfileCard
         → ProfileCard: scale(1.05), pink border-glow erscheint
         → Vibration
t=200ms  → ProfileCard: scale zurück auf 1.0, glow faded
         → Spy-Icon: spring-Animation zurück zum Dock
t=400ms  → Spy-Card links: alter Account gleitet nach oben raus
t=600ms  → Spy-Card links: neuer Account gleitet von unten rein
```

