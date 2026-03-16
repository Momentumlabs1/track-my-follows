
Ziel: Den Signup stabil machen, damit nicht mehr bei jeder Eingabe sofort ein 429-Loop entsteht, und den „Neue E-Mail, gleicher Outcome“-Fall sauber abfangen.

Kurzdiagnose (aus Code + Logs):
- In `Login.tsx` wird bei `signInWithPassword`-Fehler `invalid credentials` automatisch `signUp()` ausgelöst.
- Dadurch erzeugt jeder falsche Login-Versuch direkt einen weiteren Signup-Mailversuch.
- `SIGNUP_COOLDOWN_SECONDS = 0` macht die Sperre wirkungslos (darum „warte 0 Sekunden“ im UI).
- Auth-Logs zeigen `over_email_send_rate_limit` / `429` für mehrere unterschiedliche E-Mails im selben Zeitfenster → aktuelles Limit ist nicht nur „diese eine E-Mail“, sondern effektiv projekt-/zeitfensterbasiert.

Implementierungsplan (gezielt, ohne weitere große Umbauten):
1) Login und Registrierung logisch trennen (weiterhin auf einer Seite)
- Datei: `src/pages/Login.tsx`
- Ein klarer Modus-Selector: „Anmelden“ | „Registrieren“.
- `handleSubmit`:
  - Login-Modus: nur `signInWithPassword`, niemals auto-`signUp`.
  - Register-Modus: nur `signUp`.
- Ergebnis: falsches Passwort erzeugt keine unnötigen Signup-Mails mehr.

2) Echte Cooldown-Logik statt 0 Sekunden
- Datei: `src/pages/Login.tsx`
- `SIGNUP_COOLDOWN_SECONDS` auf sinnvollen Wert (z. B. 60) setzen.
- Cooldown als „until timestamp“ in `localStorage` speichern (überlebt Reloads).
- Button im Register-Modus während Cooldown deaktivieren + sichtbarer Countdown.

3) Benutzerfreundliche Rate-Limit-Texte
- Dateien:  
  - `src/i18n/locales/de.json`  
  - `src/i18n/locales/en.json`  
  - `src/i18n/locales/ar.json`
- Neue klare Texte wie:
  - „Zu viele Bestätigungsmails gesendet. Bitte später erneut versuchen.“
  - Kein „0 Sekunden“-Wording mehr.
- Optional: kleine Inline-Info unter dem Button statt nur Toast.

4) Terms-Checkbox nur für Registrierung erzwingen
- Datei: `src/pages/Login.tsx`
- Login sollte nicht wegen Terms blockiert sein.
- Register bleibt mit Alters-/AGB-Häkchen abgesichert.

5) Supabase-Konfig-Hinweis (operativ, kein Code)
- Parallel im Supabase Dashboard Auth Rate Limits prüfen/anheben, weil derzeit echtes 429-Limit aktiv ist.
- Das ist nötig, damit neue Signups sofort wieder durchgehen, selbst nach Code-Fix.

Warum das den Fehler wirklich stoppt:
- Haupttreiber der 429-Spam-Schleife ist der implizite Signup-Fallback bei Login-Fehlern.
- Mit getrennten Flows + funktionierendem Cooldown werden unnötige Signup-Aufrufe verhindert.
- Dadurch sinkt die Mailfrequenz drastisch und neue E-Mails laufen nach Ablauf des Provider-Fensters wieder normal.

Abnahme-Checks (E2E):
1. Falsches Passwort im Login-Modus → nur Login-Request, kein `/signup`.
2. Register-Modus mit neuer E-Mail → genau ein Signup-Request, dann Verify-Seite.
3. Erzwungener 429-Fall → klare Meldung + echter Countdown > 0 + Button gesperrt.
4. Nach Cooldown/Freigabe → erneuter Register-Versuch möglich.
