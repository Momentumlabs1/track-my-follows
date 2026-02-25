
Zustand jetzt (warum du weiter Supabase-Links bekommst)
- Das Setup ist aktuell noch nicht aktiv für dieses Projekt.
- Belege aus den Logs:
  - Auth-Log zeigt weiterhin `mail_from: noreply@mail.app.supabase.io` bei Signup.
  - Es gibt keine erfolgreichen (`200`) Aufrufe auf `auth-email-hook` für echte Sendeszenarien.
- Belege aus Domain-Status:
  - Domain ist verifiziert.
  - Aber: Für dieses Projekt ist noch **keine Custom Email Domain aktiv gesetzt** (`get_project_custom_domain` = none).

Das bedeutet: Supabase nutzt weiter den Default-Mailer + Default-Template (mit Link), statt eurer gebrandeten Hook-Templates.

Umsetzungsplan (konkret)
1) Projekt-Domain für Auth-Mails aktivieren
- In Cloud/Email die verifizierte Domain diesem Projekt als Sender-Domain zuweisen.
- Ohne diesen Schritt bleibt Supabase beim Standardversand.

2) Sender-Adresse mit aktiver Domain abgleichen
- Prüfen, welche Domain in Email-Settings wirklich aktiv ist.
- Falls aktiv `spy-secret.com` (nicht `notify.spy-secret.com`), dann `from` im Hook auf die aktive Domain angleichen (z. B. `noreply@spy-secret.com`), damit keine Domain-Mismatch-Probleme auftreten.

3) Auth-Email-Hook Setup einmal sauber reconciliieren
- Sicherstellen, dass `auth-email-hook` als Auth-Mail-Flow verwendet wird (nicht nur als deployte Funktion vorhanden).
- Danach Hook erneut testen.

4) E2E-Verifikation (entscheidend)
- Neues Konto mit frischer E-Mail anlegen.
- Erwartung:
  - Absender = eure Domain
  - Inhalt = euer Template
  - Signup-Mail enthält den 6-stelligen Code (kein Supabase-Standardlink-Layout).
- Parallel in Logs prüfen:
  - Auth-Log darf nicht mehr `mail.app.supabase.io` als Sender zeigen.
  - Edge-Function-Log muss erfolgreiche Verarbeitungen zeigen.

Technische Details (für dich transparent)
```text
Aktueller Flow:
Signup -> Supabase Default mailer -> Default template (Link)

Ziel-Flow:
Signup -> auth-email-hook -> custom template -> send via Lovable Email API -> branded sender domain
```

Warum es trotz Code noch nicht wirkt:
- Die Dateien/Funktion existieren zwar, aber der aktive Projekt-Email-Setup-Status ist der Gatekeeper.
- Solange keine Projekt-Domain aktiv ist, bleibt Supabase beim Default-Mailer.

Akzeptanzkriterien (Done)
- 1) Signup-Mail kommt von eurer Domain
- 2) Mail-Body ist euer Spy-Secret-Template
- 3) Code-basiertes Signup (6-stellig) funktioniert im Verify-Screen
- 4) Kein `mail.app.supabase.io` mehr in neuen Auth-Logs
