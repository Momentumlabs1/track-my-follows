
Ziel: Den banalen, aber kritischen Onboarding-Fehler sauber beheben, ohne bestehende App-Flows funktional zu verändern, und dabei die nächsten offensichtlichen Trigger-/Flow-Bugs mit absichern.

1. App-Tutorial-Trigger hart korrigieren
- `src/components/AppTutorial.tsx` umbauen, damit das Tutorial nur noch startet, wenn die Profil-Query wirklich erfolgreich geladen ist.
- Den 3-Sekunden-Fallback entfernen bzw. nicht mehr als “0 Profile” interpretieren.
- Startbedingung auf echte Fakten begrenzen:
  - User vorhanden
  - Route exakt `/dashboard`
  - Query erfolgreich
  - Profil-Liste wirklich leer
  - Tutorial-Key für diesen User noch nicht gesetzt
- Zusätzlichen Guard einbauen: Falls das Tutorial bereits offen ist und danach doch Profile > 0 geladen werden, sofort abbrechen.

2. Doppeltes Mounting vom Pro-Tutorial bereinigen
- `ProTutorial` ist aktuell doppelt eingebunden:
  - global in `src/App.tsx`
  - zusätzlich in `src/pages/Dashboard.tsx`
- Das auf genau eine Quelle reduzieren, damit keine doppelten Effekte, Re-Initialisierungen oder Session-Races mehr entstehen.
- Dasselbe Prinzip für Tutorial-/Overlay-Komponenten generell beibehalten: ein globaler Trigger, nicht doppelt in Page + App.

3. Onboarding-Signalquellen vereinheitlichen
- Aktuell setzen `AuthContext.tsx` und `AuthCallback.tsx` bereits `show_welcome_*`, aber `AppTutorial` startet faktisch über eine getrennte Logik.
- Die Trigger-Architektur vereinheitlichen:
  - “Neuer User” Signal sauber auswerten
  - “0 Profile” als zusätzliche Sicherheitsbedingung behalten
  - keine implizite Ableitung mehr nur aus Lade-Timeouts
- Damit wird verhindert, dass bestehende Accounts wegen langsamer Datenladung als “neu” behandelt werden.

4. Reset- und Persistenzlogik absichern
- Prüfen und korrigieren, dass der Restart in `Settings.tsx` genau die richtigen Keys zurücksetzt und nichts anderes.
- Sicherstellen, dass:
  - App-Tutorial nur durch den korrekten User-Key gesteuert wird
  - Pro-Tutorial nur durch Kauf-/Upgrade-Signale gesteuert wird
  - Skip/Close/Done immer deterministisch die passenden Keys setzen
- So vermeiden wir erneute “ploppt plötzlich auf”-Effekte.

5. Zusätzliche Bug-Suche direkt im selben Themenblock
- Rund um globale Trigger gezielt nach ähnlichen Fehlern suchen und mitfixen, ohne das UX-Verhalten neu zu erfinden:
  - weitere doppelt gemountete Overlay-/Tutorial-Komponenten
  - lose Trigger über `sessionStorage`/`localStorage`
  - Route-unabhängige Popups, die global leben
  - Effekte, die auf `undefined`/Timeout statt auf echten Ladezustand reagieren

6. Bereits identifizierter weiterer kritischer Bug für den nächsten Schritt vormerken
- `src/pages/AdminPage.tsx` prüft Admin-Rechte aktuell clientseitig über eine hartcodierte E-Mail, während die Route selbst nur mit normalem `ProtectedRoute` geschützt ist.
- Das ist ein echter Sicherheitsfehler und sollte als separater Fix direkt danach eingeplant werden, weil es nichts mit dem Tutorial zu tun hat, aber klar auffällig ist.

Betroffene Dateien
- `src/components/AppTutorial.tsx`
- `src/App.tsx`
- `src/pages/Dashboard.tsx`
- optional zur Vereinheitlichung: `src/contexts/AuthContext.tsx`, `src/pages/AuthCallback.tsx`, `src/pages/Settings.tsx`

Technische Leitlinie
```text
Falsch:
profiles === undefined
-> timeout
-> als [] behandeln
-> Tutorial startet bei Alt-Account

Richtig:
query success === true
AND profiles.length === 0
AND route === /dashboard
AND tutorial_shown_<userId> fehlt
-> Tutorial startet

Zusätzlich:
Wenn später profiles.length > 0
-> Tutorial sofort schließen
```

Erkannte Root Causes aus dem aktuellen Code
- `AppTutorial` nutzt einen Timeout-Fallback, der “noch nicht geladen” in “leer” verwandelt.
- `ProTutorial` ist doppelt gemountet.
- New-user-Signale (`show_welcome_*`) existieren, werden aber nicht sauber als zentrale Wahrheit benutzt.
- Trigger-Logik ist auf mehrere Dateien verteilt und dadurch fehleranfällig.

Umsetzungsergebnis
- Bestehende Accounts bekommen kein falsches Intro mehr.
- Neue Accounts mit wirklich 0 Profilen bekommen das Tutorial weiterhin.
- Pro-Tutorial läuft stabiler, weil es nicht doppelt initialisiert wird.
- Die Tutorial-Logik wird robuster, ohne das restliche Produktverhalten umzubauen.
