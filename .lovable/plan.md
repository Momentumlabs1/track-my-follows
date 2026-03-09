

## Plan: Spy Command Center Split umbauen

### Änderungen

**Layout-Swap & Proportionen** (`src/pages/Dashboard.tsx`):
- **Links = Profil-Info** (bekommt ~60% Platz), **Rechts = Spy-Icon** (~40%)
- Diagonale clipPaths spiegeln: Profil-Seite (hell/weiß) links, dunkle Spy-Seite rechts
- Profil-Seite wird heller: `rgba(255,255,255,0.92)` statt dem aktuellen pink-tint
- Text auf der hellen Seite wird dunkel (`text-foreground`) statt weiß

**Follower/Following entfernen, Gender-Bar einbauen**:
- Follower/Following-Zeile komplett raus
- Neuer Hook-Call: `useProfileFollowings(spyProfile?.id)` um die Gender-Daten der Followings zu holen
- Unter dem `@username` kommt ein kompakter horizontaler Gender-Bar (gleiche Breite wie der Name):
  - Pink = female, Blau = male, Grau = unknown
  - Keine Labels, nur der farbige Balken (schlank, ~4px hoch, abgerundet)
  - Darunter optional ganz klein: `♀ 62% · ♂ 31%`

**SpyWidget-Position**:
- SpyWidget wandert in die rechte Spalte, Spy-Icon zeigt nach rechts (bereits der Fall, nur Position tauschen)

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Dashboard.tsx` | clipPaths spiegeln, Seiten tauschen, Follower-Counts entfernen, Gender-Bar einfügen mit `useProfileFollowings` |

