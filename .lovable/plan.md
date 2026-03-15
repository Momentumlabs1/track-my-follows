
1. Aktueller Stand & was konkret kaputt ist

- Backend:
  - In `supabase/functions/trigger-scan/index.ts` ist `syncNewFollowers` bereits so implementiert, dass:
    - Bei leerer `profile_followers`-Tabelle ein Baseline-Snapshot angelegt wird:
      - 100 Einträge in `profile_followers`
      - 100 `follower_events` mit `event_type = 'gained'` und `is_initial = true`
    - Erst wenn bereits Follower in der DB sind, greift das Delta-Gate (maxAllowed > 0).
  - Das sehe ich auch live in der DB für dein Profil `diego_gut1` (`tracked_profile_id = '4e7c5768-ca44-4b00-9be0-bab58e34cfc9'`):
    - `profile_followers`: `COUNT(*) = 100`
    - `follower_events`: `100` Einträge, alle `event_type='gained'`, `is_initial = true`
    - `tracked_profiles`:
      - `follower_count = 369`
      - `previous_follower_count = 370`
      - `last_follower_count = 369`
      - `initial_scan_done = true`
    - Letzter `trigger-scan`-Log:
      - `[DELTA-GATE] diego_gut1: ... followers 370→369 (max 0)`
      - `[FOLLOWER-BASELINE] ... saving 100 as initial baseline`
      - Ergebnis: `0 new follows, 100 new followers`
- Smart-Scan:
  - In `supabase/functions/smart-scan/index.ts` hat `syncNewFollowers` KEINE Baseline-Logik, nur Delta-Gate:
    ```ts
    async function syncNewFollowers(..., maxAllowed: number) {
      if (maxAllowed <= 0) return 0;
      // existingIds laden, newEntries berechnen
      const toProcess = newEntries.slice(0, maxAllowed);
      // Inserts in profile_followers + follower_events mit is_initial: false
    }
    ```
  - D.h. wenn ein Profil mit leerer `profile_followers`-Tabelle direkt nur über SPY / `smart-scan` läuft (oder nach einem manuellen Cleanup), wird die erste Seite Followers als „echte Events“ (`is_initial=false`) gespeichert – statt als Baseline. Das ist **inkonsistent** zur Logik von `trigger-scan` und zu deinem UX-Konzept („Present at first scan“).
- Frontend (ProfileDetail):
  - Tab „Neue Follower“ (`activeTab === "new_followers"`) macht:
    ```ts
    const newFollowerEventsList = followerEvents.filter(e => e.event_type === "gained" && !e.is_initial)
    const initialFollowerEventsList = followerEvents.filter(e => e.event_type === "gained" && e.is_initial === true)
    ```
  - Rendering:
    ```tsx
    <EventList events={newFollowerEventsList} ... 
      emptyText="Noch keine neuen Follower erkannt"
      sectionTitle={newFollowerEventsList.length > 0 && initialFollowerEventsList.length > 0 ? t("recently_detected") : undefined}
    />
    {initialFollowerEventsList.length > 0 && (
      <p>Present at first scan</p>
      <EventList events={initialFollowerEventsList} ... timeAgo={() => "Existing"} />
    )}
    ```
  - Wenn es **nur** Initial-Daten gibt (dein aktueller Fall: 100 `is_initial=true`, 0 echte Events):
    - Oben: eine große Karte „Noch keine neuen Follower erkannt“
    - Darunter: die Liste „PRESENT AT FIRST SCAN“ mit „Existing“
  - Genau das ist das, was du im 1. Screenshot siehst – und fühlt sich im Vergleich zur alten Web-App (2. Screenshot, „41 followers loaded“) falsch an, weil oben suggeriert wird, es gäbe gar keine Daten.

Fazit:
- Backend:
  - `trigger-scan` ist jetzt im Sinne deines Konzepts korrekt (Baseline + Delta-Gate).
  - `smart-scan` ist noch „alt“ und kennt keine Follower-Baseline → kann falsche Events erzeugen, wenn ein Profil nur über SPY/Background gescannt wird.
- Frontend:
  - Die Baseline-Einträge werden zwar korrekt unter „Present at first scan“ gezeigt, aber gleichzeitig sagt der Tab oben „Noch keine neuen Follower erkannt“, was UX-mäßig falsch wirkt und nicht deiner alten „41 followers loaded“-Darstellung entspricht.


2. Zielbild (was du willst, laut Screenshots + Specs)

- Erst-Scan (egal ob via `trigger-scan` oder `smart-scan`):
  - `profile_followers` ist leer → **erste Followers-Page als Baseline speichern**:
    - Alle Follower aus Page 1 in `profile_followers`.
    - `follower_events` mit `event_type='gained'`, `is_initial = true`.
  - Im UI:
    - Hauptliste „Neue Follower“ zeigt KEINE „no data“-Karte.
    - Stattdessen wird **nur** der Block „Present at first scan“ mit Label „Existing“ angezeigt (so wie Screenshot 1).
- Folge-Scans:
  - Nur wenn `actualFollowerCount > last_follower_count` (Delta-Gate):
    - Neue Follower werden als `follower_events` mit `is_initial = false` gespeichert.
    - Diese landen ganz oben im Tab „Neue Follower“ unter „Recently detected“.
  - Baseline-Einträge bleiben unten unter „Present at first scan“ sichtbar.
- Smart-Scan (Spy):
  - Muss dieselbe Logik wie `trigger-scan` nutzen, damit Spy-Scans und manuelle Scans dieselbe Datenbasis und Trennung (initial vs. echte Events) haben.


3. Konkreter Fix-Plan (Backend)

3.1 `smart-scan` → `syncNewFollowers` an `trigger-scan` angleichen

- Datei: `supabase/functions/smart-scan/index.ts`
- Funktion: `async function syncNewFollowers(...)` (Zeilen ~198–264)
- Aktuelle Signatur:
  ```ts
  async function syncNewFollowers(
    supabaseClient,
    profileId,
    currentFollowers,
    lastScannedAt,
    maxAllowed,
  )
  ```
- Geplante Logik (ohne Signaturänderung, nur Body ersetzen):

  1) **Baseline-Check vor Delta-Gate**:
     ```ts
     const { count: baselineCount } = await supabaseClient
       .from("profile_followers")
       .select("*", { count: "exact", head: true })
       .eq("tracked_profile_id", profileId);

     if (baselineCount === 0) {
       // Erste Page als Baseline speichern
       const nowMs = Date.now();
       for (let i = 0; i < currentFollowers.length; i++) {
         const f = currentFollowers[i];
         const ts = new Date(nowMs - i * 1000).toISOString();

         await supabaseClient.from("profile_followers").insert({
           tracked_profile_id: profileId,
           follower_user_id: f.pk,
           follower_username: f.username,
           follower_avatar_url: f.profile_pic_url || null,
           follower_display_name: f.full_name || null,
           follower_follower_count: f.follower_count || null,
           follower_is_verified: f.is_verified || false,
           follower_is_private: f.is_private || false,
           first_seen_at: ts,
         });

         await supabaseClient.from("follower_events").insert({
           profile_id: profileId,
           instagram_user_id: f.pk,
           username: f.username,
           full_name: f.full_name || null,
           profile_pic_url: f.profile_pic_url || null,
           is_verified: f.is_verified || false,
           follower_count: f.follower_count || null,
           event_type: "gained",
           detected_at: ts,
           gender_tag: detectGender(f.full_name, f.username),
           category: categorizeFollow(f.follower_count, f.is_private),
           is_initial: true,
         });
       }

       console.log(`[FOLLOWER-BASELINE][smart-scan] ${profileId}: saved ${currentFollowers.length} as initial baseline`);
       return currentFollowers.length;
     }
     ```

  2) **Delta-Gate nur wenn Baseline schon existiert**:
     ```ts
     if (maxAllowed <= 0) {
       console.log(`[DELTA-GATE][smart-scan] followers: maxAllowed=${maxAllowed}, skipping`);
       return 0;
     }
     ```

  3) **Diff + echte Events (is_initial=false)**:
     - Rest des Codes im Prinzip wie aktuell:
       - `existingIds` aus `profile_followers` laden (`is_current = true`).
       - `newEntries = currentFollowers.filter(!existingIds.has(pk))`.
       - `if (newEntries.length === 0) return 0;`
       - `toProcess = newEntries.slice(0, maxAllowed);`
       - Für `toProcess`:
         - Insert in `profile_followers`
         - Insert in `follower_events` mit `is_initial = false`.
       - Logging:
         ```ts
         console.log(`[DELTA-GATE][smart-scan] followers: ${newEntries.length} new found, processed ${toProcess.length} real events, ignored ${newEntries.length - toProcess.length}`);
         ```

- Call-Sites (`performSpyScan`) müssen nicht geändert werden – die Signatur bleibt, das Verhalten ändert sich nur intern:
  - Erster Spy-Scan auf einem Profil ohne Follower-Baseline → Baseline wird erzeugt (wie jetzt schon bei `trigger-scan`).
  - Folge-Scans → Delta-Gate greift korrekt.

3.2 Keine Änderungen an `trigger-scan` / `syncNewFollowers`

- `trigger-scan/index.ts` ist bereits korrekt im Sinne deines gewünschten Modells:
  - Baseline bei leerer Tabelle.
  - Delta-Gate für echte neue Follower.
- Wichtig ist nur, dass `smart-scan` die gleiche Baseline-Logik bekommt, damit SPY-Scans und manuelle Scans konsistent sind.


4. Konkreter Fix-Plan (Frontend ProfileDetail)

4.1 „Neue Follower“-Tab: Empty-State richtig handhaben

Problem:
- Wenn es **nur** Initial-Follower (`is_initial=true`) gibt, sehen User:
  - Oben: „Noch keine neuen Follower erkannt“
  - Darunter: Liste „Present at first scan“
- Das wirkt wie „es funktioniert nicht“, obwohl 100 Follower geladen sind (dein zweiter Screenshot zeigt, was du erwartest).

Lösung:
- Datei: `src/pages/ProfileDetail.tsx`
- Block `activeTab === "new_followers"` (Zeilen ~450–461) anpassen:

Aktuell:
```tsx
{activeTab === "new_followers" && (
  <div className="space-y-4">
    <EventList events={newFollowerEventsList.map(mapFollowerEvent)} ... />
    {initialFollowerEventsList.length > 0 && (
      <div>
        <p className="section-header px-1 mb-2">{t("existing_at_first_scan")}</p>
        <EventList events={initialFollowerEventsList.map(...)} ... />
      </div>
    )}
  </div>
)}
```

Geplante Logik:
- Nur dann einen Empty-State anzeigen, wenn:
  - `newFollowerEventsList.length === 0` UND `initialFollowerEventsList.length === 0`.
- Wenn es Initial-Daten gibt, aber keine echten neuen Events:
  - **Kein** „Noch keine neuen Follower erkannt“-Card.
  - Nur der Block „Present at first scan“.

Konkreter Umbau (Pseudocode):

```tsx
{activeTab === "new_followers" && (
  <div className="space-y-4">
    {newFollowerEventsList.length > 0 && (
      <EventList
        events={newFollowerEventsList.map(mapFollowerEvent)}
        shouldBlur={false}
        showPaywall={showPaywall}
        timeAgo={timeAgo}
        emptyIcon="👥"
        emptyText=""
        emptySubText=""
        sectionTitle={initialFollowerEventsList.length > 0 ? t("recently_detected") : undefined}
      />
    )}

    {newFollowerEventsList.length === 0 && initialFollowerEventsList.length === 0 && (
      <EventList
        events={[]}
        shouldBlur={false}
        showPaywall={showPaywall}
        timeAgo={timeAgo}
        emptyIcon="👥"
        emptyText={t("profile_detail.no_new_followers", "Noch keine neuen Follower erkannt")}
        emptySubText={profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}
      />
    )}

    {initialFollowerEventsList.length > 0 && (
      <div>
        <p className="section-header px-1 mb-2">{t("existing_at_first_scan")}</p>
        <EventList
          events={initialFollowerEventsList.map(e => ({ ...mapFollowerEvent(e), isRead: true }))}
          shouldBlur={false}
          showPaywall={showPaywall}
          timeAgo={() => t("initial_scan_label")}
          emptyIcon="👥"
          emptyText=""
          emptySubText=""
        />
      </div>
    )}
  </div>
)}
```

Optional:
- Gleiche Logik symmetrisch auch für „Folgt neu“-Tab (`new_follows`) anwenden, damit Initial-Followings nicht von einem „Keine neuen Events“ Card überdeckt werden.

4.2 Optionale UX-Verbesserung: „X followers loaded“

- Zusätzlich zur Entfernung des Empty-States kannst du einen kleinen Text an den Initial-Block hängen:
  - z.B. `"{initialFollowerEventsList.length} followers loaded at first scan"`.
- Das würde deinem alten weißen Screenshot mit „41 followers loaded“ sehr nahe kommen.


5. Daten / Migration

- Für `diego_gut1` ist der Zustand jetzt schon konsistent:
  - Baseline existiert (`profile_followers` + `follower_events.is_initial=true`).
  - Künftige Scans:
    - Wenn `follower_count` steigt → Delta-Gate erzeugt echte Events (`is_initial=false`).
    - Wenn `follower_count` gleich bleibt oder fällt → keine „Geister-Events“.
- Falls es Profile gibt, bei denen `smart-scan` bereits fälschlicherweise `is_initial=false`-Events beim ersten Scan erzeugt hat, könntest du optional eine einmalige SQL-Korrektur planen:
  - Beispiel-Idee:
    ```sql
    -- Pseudocode: 'erste Events' für Profile ohne matching profile_followers zum Zeitpunkt X nachträglich auf is_initial=true setzen
    update follower_events
    set is_initial = true
    where profile_id = '...'
      and event_type = 'gained'
      and created_at < 'FIX_TIMESTAMP';
    ```
  - Das würde aber gezielt und mit deinen genauen Kriterien geplant werden; aktuell ist das nicht zwingend.


6. Testplan (was nach dem Implementieren zu prüfen ist)

1) Neuer Account ohne Spy:
   - Profil hinzufügen.
   - Erste manuelle Scan (trigger-scan) auslösen.
   - Erwartung:
     - `profile_followers`: ~200 oder 100 Einträge.
     - `follower_events`: gleiche Anzahl, alle `is_initial=true`.
     - Im „Neue Follower“-Tab:
       - Kein „Noch keine neuen Follower“-Card.
       - Nur „Present at first scan“-Liste mit „Existing“.

2) Bestehendes Profil mit Spy (smart-scan):
   - Spy auf ein Profil ohne Follower-Baseline setzen (oder Baseline resetten).
   - `smart-scan` laufen lassen.
   - Erwartung:
     - Wie oben: Baseline + Initial-Events.
     - Kein „echtes“ Event.

3) Neuer echter Follower:
   - Nach dem Baseline-Scan auf einen Test-Account 1–2 echte neue Follower erzeugen.
   - Nächsten Scan (trigger-scan oder smart-scan) auslösen.
   - Erwartung:
     - `follower_events`: zusätzliche Einträge mit `is_initial=false`.
     - UI:
       - Oben „Recently detected“ mit den neuen Followern.
       - Darunter „Present at first scan“ mit allen bestehenden Followern.

4) Delta-Gate bei Follower-Drop:
   - Ein Follower geht verloren (Netto-Counter sinkt).
   - Nächster Scan:
     - Kein neuer `gained`-Event (maxAllowed=0).
     - Ggfs. später über Full-Scan / Loss-Detection als `event_type='lost'` markiert.
     - UI zeigt keine „Geister-Gewinne“.


<lov-actions>
<lov-suggestion message="Führe nach den Änderungen mehrere Scans für ein Testprofil durch (Initial-Scan, danach echte neue Follower hinzufügen) und prüfe im &quot;Neue Follower&quot;-Tab, ob &quot;Recently detected&quot; und &quot;Present at first scan&quot; korrekt angezeigt werden.">Test den Follower-Flow end-to-end</lov-suggestion>
<lov-suggestion message="Passe die Funktion syncNewFollowers in supabase/functions/smart-scan/index.ts so an, dass sie wie in trigger-scan zuerst eine Baseline in profile_followers + follower_events (is_initial:true) anlegt, wenn noch keine Follower für das Profil existieren, und erst danach das Delta-Gate für echte Events verwendet.">syncNewFollowers in smart-scan an trigger-scan angleichen</lov-suggestion>
<lov-suggestion message="Überarbeite den &quot;Neue Follower&quot;-Tab in src/pages/ProfileDetail.tsx so, dass bei vorhandenen Initial-Followern kein &quot;Noch keine neuen Follower&quot;-Empty-State angezeigt wird, sondern ausschließlich der Block &quot;Present at first scan&quot; mit einem optionalen Hinweis wie &quot;X followers loaded at first scan&quot;.">UX im &quot;Neue Follower&quot;-Tab korrigieren</lov-suggestion>
<lov-suggestion message="Führe eine stichprobenartige SQL-Analyse durch (SELECTs auf profile_followers und follower_events) für 2–3 weitere Profile, um sicherzustellen, dass Baseline- und Delta-Gate-Logik überall konsistent greifen.">Follower-Datenmodell stichprobenartig prüfen</lov-suggestion>
</lov-actions>
