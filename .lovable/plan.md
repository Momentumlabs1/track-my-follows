

## Analyse: Spy-Drop Animation aufräumen

### Aktueller Zustand
Wenn man den Spy auf ein Profil dropt, passiert:
1. `dropSuccess` → kleiner Scale+Rotate-Bounce auf dem SpyIcon (Zeile 211)
2. `onDragMoveSpy(profileId)` → ruft `moveSpy.mutate()` auf → Query wird invalidiert
3. Die SpyAgentCard hat `AnimatePresence mode="wait"` auf dem Profil-Info-Block (Zeile 114-141), getriggert durch `key={spyProfile.id}`
4. Die ProfileCard zeigt nur einen statischen grünen/grauen Dot-Wechsel — kein Übergangseffekt

**Probleme:**
- Der Drop-Erfolg ist nur ein kurzer Scale-Bounce auf dem Spy — kein richtiges visuelles Feedback
- Wenn `spyProfile` wechselt, springt die Card einfach auf den neuen Account — kein "hochfliegen" oder sanfter Übergang
- Die alte Spy-ProfileCard verliert einfach ihren grünen Dot, die neue bekommt ihn — kein Übergangseffekt

### Plan

**Datei: `src/components/SpyAgentCard.tsx`**

1. **Drop-Animation cleanen**: Beim erfolgreichen Drop den Spy-Icon nach oben "wegfliegen" lassen (scale down + translateY nach oben + fade out), statt nur wackeln. Dafür `dropSuccess`-State nutzen um eine `motion.div`-Animation auszulösen: `{ scale: 0, y: -60, opacity: 0 }` über ~400ms, danach zurück-animieren.

2. **Profil-Übergang verbessern**: Die bestehende `AnimatePresence` (Zeile 114) hat schon `mode="wait"` und exit/enter-Animationen. Diese verfeinern:
   - **Exit** (altes Profil): Nach oben sliden + fade out (`y: -20, opacity: 0`)
   - **Enter** (neues Profil): Von unten reinsliden (`y: 20 → 0, opacity: 0 → 1`)
   - Etwas längere Duration (~0.4s) für einen smootheren Übergang

3. **Spy-Icon Reset**: Nach dem "Wegfliegen" den Spy smooth zurück-einblenden mit einer kurzen Verzögerung (~500ms), damit es so wirkt als würde er sich zum neuen Profil "teleportieren"

**Datei: `src/components/ProfileCard.tsx`**

4. **Spy-Status Übergang**: Wenn `hasSpy` wechselt, den grünen Dot und Text mit einem kurzen Fade animieren statt hart zu switchen. `AnimatePresence` um den Spy-Status-Block (Zeile 106-118) wrappen.

### Technische Details

```text
Timeline nach Drop:
  0ms    → Spy-Icon fliegt weg (scale 0, y -60, opacity 0)
  200ms  → Altes Profil in Card slidet nach oben raus  
  400ms  → Neues Profil slidet von unten rein
  500ms  → Spy-Icon blendet zurück ein (scale 1, opacity 1)
```

Alle Animationen über Framer Motion `animate`-Prop gesteuert, keine CSS keyframes nötig. `dropSuccess`-State wird auf einen erweiterten State umgebaut (`"idle" | "flying" | "returning"`) um die Phasen zu steuern.

