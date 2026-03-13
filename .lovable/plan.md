

## Plan: MoveSpySheet mit Swipe-Geste, Highlight & größerem Spy-Icon

### Änderungen an `src/components/MoveSpySheet.tsx`

**1. Swipe-Geste auf Profil-Einträgen**
- Framer Motion `motion.div` mit `drag="x"` auf jedem Profil-Eintrag (nicht dem aktuellen Spy-Profil).
- Wenn der User nach rechts swiped (`dragEnd` mit `offset.x > 80`), wird `onMove(profileId)` ausgelöst — gleicher Effekt wie Tap.
- Visueller Feedback: Beim Swipen wird der Hintergrund grün/primary getönt und ein Spy-Icon erscheint am rechten Rand.
- `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic={{ left: 0, right: 0.3 }}` damit man nur nach rechts swipen kann.

**2. Profil-Highlight (aktuell angesehenes Profil)**
- Neue Prop `viewingProfileId` an `MoveSpySheet` übergeben (das Profil auf dessen Detail-Seite man gerade ist).
- Dieses Profil bekommt einen auffälligen Rahmen (`border-2 border-primary ring-2 ring-primary/20`) und ein Label wie "Hierhin verschieben" statt "Tap to assign".
- So sieht man sofort, welches Profil man gerade anschaut und wohin der Spy soll.

**3. Spy-Icon größer**
- Header-SpyIcon: `size={36}` → `size={48}`
- SpyIcon beim aktuellen Spy-Profil: `size={22}` → `size={28}`

### Änderungen an `src/pages/ProfileDetail.tsx`
- `viewingProfileId={profileId}` als neue Prop an `MoveSpySheet` übergeben.

### Änderungen an `src/i18n/locales/de.json`, `en.json`, `ar.json`
- Neuer Key `spy.slide_to_assign`: "Slide zum Zuweisen" / "Slide to assign" / "اسحب للتعيين"
- Neuer Key `spy.move_here`: "Spion hierhin verschieben" / "Move spy here" / "انقل الجاسوس إلى هنا"

