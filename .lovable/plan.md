

## Tutorial-Analyse: Warum es nach dem ersten Step abbricht

### Das Problem
Das Tutorial hat 7 Steps definiert, aber **bricht nach Step 0 ("+"-Button) effektiv ab**, weil:

1. **Step 0** (Spotlight auf `add-profile-btn`): Funktioniert — User sieht das Highlight und tippt drauf
2. **Step 1** (Action: `wait_for_add_profile`): Rendert `null` — User sieht nichts, wartet auf Navigation zu `/add-profile`
3. **Step 2** (Action: `wait_for_scan_complete`): Rendert `null` — wartet auf `/profile/*`, was einen echten Scan voraussetzt (dauert 30+ Sekunden)
4. **Steps 3-5** (Gender-Bar, Tabs, Locked-Analysis): Auf der ProfileDetail-Seite — aber `AppTutorial` ist **nur in Dashboard.tsx gemountet**. Wenn der User zu `/profile/*` navigiert, wird `AppTutorial` **unmounted** und alle Steps gehen verloren.
5. **Step 6** (Spy-Agent-Zone): Würde zurück zum Dashboard navigieren, wird aber nie erreicht

### Kernproblem
`<AppTutorial />` lebt nur in `Dashboard.tsx`. Sobald der User die Seite verlässt (was Step 0 ja explizit verlangt!), ist die Komponente weg. Der Tutorial-State ist weg. Game over.

### Fix-Plan

#### 1. AppTutorial global mounten
**Datei: `src/App.tsx`**
- `<AppTutorial />` aus Dashboard raus, in `AppContent` rein (neben `<BottomNav />`)
- Damit lebt das Tutorial über alle Routen hinweg

#### 2. Action-Steps mit visuellem Feedback versehen
**Datei: `src/components/AppTutorial.tsx`**
- Für `wait_for_add_profile` und `wait_for_scan_complete`: Statt `null` einen kleinen Spy-Agent-Bubble rendern ("Gib einen Benutzernamen ein..." / "Scan läuft... gleich geht's weiter!")
- Damit weiß der User, dass das Tutorial noch aktiv ist

#### 3. Element-Polling statt sofortigem Abbruch
**Datei: `src/components/AppTutorial.tsx`**
- Wenn `targetExists` false ist: Nicht sofort `null` returnen, sondern bis zu 5 Sekunden warten (Polling alle 500ms)
- Elemente auf ProfileDetail laden async — das Tutorial muss darauf warten können

#### 4. Abschluss-Step hinzufügen
**Datei: `src/components/AppTutorial.tsx`**
- Nach dem letzten Spotlight-Step: "Fertig!"-Bubble vom Spy-Agent mit Zusammenfassung und Konfetti/Animation
- Aktuell endet es einfach still

#### 5. Translation-Keys prüfen
Alle Tutorial-Keys sind bereits in DE/EN/AR vorhanden — hier ist alles korrekt.

### Zusammenfassung der Änderungen
| Datei | Änderung |
|---|---|
| `src/App.tsx` | AppTutorial global mounten |
| `src/pages/Dashboard.tsx` | AppTutorial-Import entfernen |
| `src/components/AppTutorial.tsx` | Polling, Waiting-Bubbles, Abschluss-Step |

