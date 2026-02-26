

## AnalyzingProfile Redesign

### Dateien

**1. `src/index.css`** — `.gradient-bg` Utility hinzufügen (1 Zeile)

**2. `src/i18n/locales/de.json`** — analyzing-Section erweitern:
- `step_1` / `step_1_desc`: "Sichere Verbindung" / "Anonymer Zugang über Proxy-Server"
- `step_2` / `step_2_desc`: "Profil wird gesucht" / "Instagram-Datenbank wird durchsucht"
- `step_3` / `step_3_desc`: "Profildaten abrufen" / "Follower, Following & Profilinfos"
- `step_baseline` / `step_baseline_desc`: "Baseline erstellen" / "Komplette Analyse aller Followings – nicht nur der letzten"
- `step_4` / `step_4_desc`: "Geschlechteranalyse" / "Spy analysiert ob mehr Frauen oder Männer gefolgt werden"
- `step_5` / `step_5_desc`: "Abschluss" / "Daten werden verschlüsselt gespeichert"
- `full_analysis_note`: "Dies ist eine Gesamtanalyse des Accounts und aller Follower – nicht nur der letzten Aktivitäten."

**3. `src/i18n/locales/en.json`** — Gleiche Keys auf Englisch

**4. `src/pages/AnalyzingProfile.tsx`** — Komplett überarbeitet:
- SpyIcon (32px) springt von Step zu Step (positioniert neben dem aktuellen Step via `layoutId` oder absolute Position mit framer-motion `animate`)
- Username groß mit `@` in Primary-Farbe
- Profilbild bleibt (wird nach Analyse vom echten Bild ersetzt) — mit gradient-ring
- Steps als `native-card` mit Primary-Border wenn aktiv, grün wenn done
- Jeder Step hat Titel + Beschreibung (desc in muted-foreground, kleiner)
- Progress-Bar mit `gradient-bg` Klasse
- Info-Hinweis unten als dezenter Text mit Shield-Icon

