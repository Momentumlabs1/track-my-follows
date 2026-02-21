

# UI-Redesign: "The Ick"-Style umsetzen

Das aktuelle Dashboard und die Profil-Ansichten werden komplett ueberarbeitet, um dem Look aus den Screenshots zu entsprechen. Der Fokus liegt auf einem cleanen, hellen iOS-Design mit Pink-Akzenten.

## Schritt 1: Farbschema auf Hell umstellen

Die aktuelle dunkle Farbpalette wird durch ein helles, iOS-artiges Design ersetzt:
- Hintergrund: Helles Grau/Weiss (wie in den Screenshots)
- Cards: Weiss mit leichten Schatten
- Akzentfarben: Pink, Lavendel, Mint-Gruen bleiben als Highlights
- Text: Dunkelgrau/Schwarz

## Schritt 2: Dashboard komplett neu aufbauen

Das Dashboard bekommt zwei Tabs wie in den Screenshots:

**Tab "What's new?"** (Event-Feed):
- Jedes Event zeigt: Profil-Avatar + Username, Zeitstempel, Event-Text ("Got followed by..."), Target-User mit grossem Avatar und "NEW"-Badge
- Kein Bento-Grid, sondern einfache Card-Liste

**Tab "Profiles"** (Profil-Uebersicht):
- Profil-Cards mit: Avatar, Username, "Updated X ago", "View"-Button (pink pill), Followers/Following Stats in farbigen Boxen (blau/lila), "Recently Following"-Section mit Thumbnail-Bildern
- FAB-Button (+) unten rechts statt Header-Button

## Schritt 3: "Profil hinzufuegen"-Flow als Fullscreen-Seite

Statt eines Modals wird eine eigene Seite erstellt:
- Grosser Titel "Who do you want to track?"
- Untertitel "Enter the Instagram username"
- Input-Feld mit @-Prefix in pinkem Rahmen
- "Secure & Anonymous"-Info-Block mit Schloss-Icon
- "Start The Search"-Button am unteren Rand
- Plan-Zaehler oben rechts (z.B. "1/5")
- Zurueck-Pfeil oben links

## Schritt 4: Analyse-Screen mit Fortschrittsanzeige

Nach dem Klick auf "Start The Search" kommt ein Lade-Screen:
- "Analyzing Follows" als Titel
- @username darunter
- Grosses Profilbild mit pinkem Ring
- Fortschrittsbalken mit Prozentanzeige
- 5 Schritte als Cards die nacheinander gruen werden:
  1. Connecting to Instagram servers...
  2. Searching user profile...
  3. Fetching profile data anonymously...
  4. Analyzing recent follows...
  5. Finalizing & securing data...
- Jeder Schritt bekommt ein Haekchen wenn fertig

## Schritt 5: Profil-Detail-Seite ueberarbeiten

Die Profil-Detail-Seite wird angepasst:
- Header: Zurueck-Pfeil, "TrackIQ" Titel (pink), Muelleimer-Icon rechts
- Profil-Banner: Avatar + Username + "Tracking since..." + "Updated..."
- Statistics: Followers/Following in farbigen Boxen
- "Suspicion Level"-Gauge (berechnet aus Follow-Aktivitaet):
  - 0-20%: Gruen "Very Safe"
  - 21-50%: Gelb "Getting Suspicious"
  - 51-100%: Rot "Very Suspicious"
- 3 Tabs: "Last follows" / "Last followers" / "Activity"
- Liste der gefolgten/entfolgten User mit Avatar + @username

## Schritt 6: Bottom-Navigation anpassen

Die Navigation bleibt, aber mit angepasstem Styling fuer das helle Theme.

---

## Technische Details

### Betroffene Dateien:

1. **src/index.css** - Farbvariablen auf helles Theme umstellen
2. **src/pages/Dashboard.tsx** - Komplett neu: Tab-basiert (What's new / Profiles), FAB-Button
3. **src/components/ProfileCard.tsx** - Neues Card-Design mit View-Button, Stats-Boxen, Recently Following
4. **src/components/EventFeedItem.tsx** - Neues Design: groessere Target-Avatare, "NEW"-Badge
5. **src/components/AddProfileModal.tsx** - Wird zu einer Fullscreen-Seite/Route umgebaut
6. **src/pages/AddProfile.tsx** (neu) - Fullscreen "Who do you want to track?" Seite
7. **src/pages/AnalyzingProfile.tsx** (neu) - Fortschritts-Screen mit den 5 Schritten
8. **src/pages/ProfileDetail.tsx** - Suspicion Level, Tabs, Follower-Liste
9. **src/App.tsx** - Neue Routes fuer /add-profile und /analyzing/:username
10. **src/components/BottomNav.tsx** - Styling-Anpassungen fuer helles Theme

### Suspicion-Level Berechnung:
- Basiert auf Anzahl neuer Follows relativ zur Following-Gesamtzahl
- Beispiel: 10 neue Follows bei 100 Following = 10% = "Very Safe"
- Formel: `(neue_follows_letzte_7_tage / following_count) * 100`

### Analyse-Screen Logik:
- Die 5 Schritte sind rein visuell/animiert (der eigentliche API-Call passiert im Hintergrund)
- Schritt 1-2: Sofort starten, simulierte Verzoegerung
- Schritt 3: Tatsaechlicher scan-profiles API-Call
- Schritt 4-5: Nach API-Antwort abschliessen
- Nach Fertigstellung: Weiterleitung zur Profil-Detail-Seite

