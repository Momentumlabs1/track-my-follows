

## Analyse: Was ist kaputt auf der Saif-Profilseite

### 3 separate Probleme identifiziert

---

### 1. Bilder/Avatare fehlen (zeigen nur pinke Initialen)

**Ursache:** Instagram CDN URLs laufen ab. Die gespeicherten URLs in `follow_events.target_avatar_url` und `profile_followings.following_avatar_url` enthalten Ablauf-Timestamps (`&oe=69C36CDE`). Wenn diese URLs alt sind (Tage/Wochen), gibt Instagram 403/404 zuruck. Der `image-proxy` leitet die Anfrage weiter, bekommt einen Fehler, und `InstagramAvatar` zeigt den Fallback.

**Fix:** Bei jedem Scan (`trigger-scan`, `smart-scan`) die Avatar-URLs in bestehenden `follow_events` und `profile_followings` aktualisieren, wenn der gleiche Username erneut gefunden wird. Zusatzlich: das Profil-Avatar (`tracked_profiles.avatar_url`) wird bereits bei jedem Scan aktualisiert -- die Events aber nicht.

**Anderungen:**
- `supabase/functions/trigger-scan/index.ts`: Nach dem Diffing auch bestehende `follow_events` mit frischen Avatar-URLs updaten (UPDATE WHERE target_username IN ...)
- `supabase/functions/smart-scan/index.ts`: Gleiche Logik
- `supabase/functions/create-baseline/index.ts`: Avatar-URLs in `profile_followings` bei Re-Runs auffrischen

---

### 2. Gender-Bubbles zeigen 0/0

**Ursache:** Kein Code-Bug. Die WeeklyGenderCards filtern korrekt: nur `is_initial: false`, `direction: "following"`, innerhalb der letzten 7 Tage. Saif hat in den letzten 7 Tagen nur 1 neuen Follow (xmaeyaxx) und dessen `gender_tag` ist "unknown". Daher 0 female, 0 male.

Die gerade per Push-Scan neu erkannten Follows (dlraysin, yourpropfirm) werden vermutlich auch als "unknown" getaggt, weil die Gender-Detection diese Usernames nicht zuordnen kann.

**Kein Code-Fix notig** -- das System funktioniert korrekt. Die Bubbles zeigen 0 weil es schlicht keine als weiblich/mannlich erkannten neuen Follows gibt.

---

### 3. "Muessten mehr Aktivitaten da sein" (tagl. Scans)

**Ursache:** Saif hatte bis gerade eben KEINEN Spy. Der Spy war auf `timwger`. Ohne Spy bekommt ein Profil nur 1x taglich einen Quick-Scan (nur Following-Liste, erste Seite). Wenn saif_nassiri in der letzten Woche kaum neue Accounts gefolgt ist, gibt es einfach wenig zu erkennen.

Jetzt wo der Spy auf Saif verschoben wurde, bekommt er stundliche Voll-Scans (Following + Follower). Mehr Aktivitat wird erst sichtbar wenn tatsachlich neue Follows passieren.

**Kein Code-Fix notig** -- erwartetes Verhalten.

---

### Zusammenfassung: Was zu tun ist

Nur Problem 1 (abgelaufene Avatar-URLs) ist ein echter Bug. Die anderen beiden Punkte funktionieren wie designed.

**Plan fur Avatar-URL Refresh:**

1. **`trigger-scan/index.ts`** (~15 Zeilen): Nach dem Erkennen neuer Follows, bestehende `profile_followings`-Rows mit frischen `following_avatar_url` updaten (batch UPDATE fur alle gescannten Usernames)

2. **`smart-scan/index.ts`** (~15 Zeilen): Gleiche Avatar-Refresh-Logik

3. **`follow_events` Avatar-Refresh**: Beim Scan alle gescannten Usernames sammeln und ein bulk UPDATE auf `follow_events.target_avatar_url` ausfuhren fur Events dieses Profils

Das stellt sicher, dass bei jedem Scan (stuendlich fur Spy-Profile, taglich fur andere) alle Avatar-URLs aufgefrischt werden.

