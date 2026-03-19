
Ziel: Exakt einordnen, **ab wann** du den Fehler klar benannt hast und welcher OAuth-Codezustand dabei aktiv war.

1) Festgestellter Startpunkt deiner Fehlermeldung  
- Der Fehler wurde von dir erstmals eindeutig in der Nachricht mit Zeitmarker **23:03** benannt.  
- Inhaltlich hast du dort schon exakt die heutigen Symptome beschrieben:  
  - Google/Apple vorher ok, nach Updates kaputt  
  - statt nativer Auswahl eine externe/komische Web-Seite  
  - kein Zugriff auf gespeicherte Konten/Passwörter  
  - Flow wirkt langsam/hängt

2) Abgleich mit aktuellem Codezustand  
- `src/lib/oauth.ts`: `shouldSkipBrowserRedirect()` steht aktuell auf `false`.  
- `src/pages/Login.tsx`: kein manueller `window.location.assign(data.url)`-Redirect-Block mehr.  
- Das entspricht dem von dir geforderten Rückbau auf den Stand vor den problematischen iframe/WebView-OAuth-Fixes.

3) Einordnung „ab wann“  
- Aus Chat-Timeline ist der **erste klar dokumentierte Bug-Call von dir: 23:03**.  
- Technisch passt das zeitlich zu der Phase, in der die iframe/WebView-Änderungen den Standard-Supabase-Redirect umgangen hatten.

4) Nächster präziser Analyse-Schritt (ohne Codeänderung)  
- Ich erstelle als Nächstes eine forensische Mini-Timeline:  
  - Nachricht/Zeitpunkt  
  - aktiver OAuth-Pfad  
  - beobachtetes Verhalten  
- Ergebnis: eindeutige Markierung „first bad state“ (ab welchem konkreten Änderungsstand der Flow gekippt ist).

Technische Details  
- In der aktuellen Snapshot-Prüfung gibt es keine verwertbaren Console-/Network-Logs zum OAuth-Fehler (keine `auth` Requests/Logs im Snapshot).  
- Deshalb basiert der Startpunkt aktuell auf der Chat-Timeline plus Codezustands-Abgleich.
