

## Dark Mode Spy-Karte: Alles schwarz + neues Layout

### Was sich ändert

**1. Spy-Bereich (rechts) – kein Weiß mehr, stattdessen leicht helleres Schwarz**
- `dark:bg-white/90` wird ersetzt durch `dark:bg-white/[0.08]` — ein subtil helleres Schwarz, das sich vom Profil-Bereich abhebt ohne weiß zu sein.

**2. Profil-Bereich (links) – Layout-Umstrukturierung**
- "Spion angesetzt auf" wird aus dem Account-Rechteck herausgenommen und darüber platziert, direkt im dunklen Spy-Bereich.
- Das Account-Rechteck wird nach unten bündig ausgerichtet (`self-end` / `mt-auto`), sodass es am unteren Rand des Gesamtrechtecks sitzt.
- Oben entsteht Freiraum für den Label-Text.

### Konkreter Umbau (Dashboard.tsx, Zeilen 187-262)

**Content-Layer** wird von `flex items-center` zu `flex items-stretch` geändert, damit beide Seiten die volle Höhe nutzen.

**Linke Seite (Profile):** Wird zu einer Flex-Column mit:
- Label "Spion angesetzt auf" oben, **außerhalb** des Account-Rechtecks, im dunklen Bereich
- Account-Rechteck unten bündig (`mt-auto`), mit `dark:bg-white/[0.06]` statt `dark:bg-black/80`

**Rechte Seite (Spy):** `dark:bg-white/90` → `dark:bg-white/[0.08]` — subtiler Kontrast zum linken Bereich.

### Datei
- `src/pages/Dashboard.tsx` — einzige Änderung

