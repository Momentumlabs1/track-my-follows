

# Fix: Scan-Profiles Edge Function reparieren

## Probleme identifiziert

1. **HikerAPI Following-Endpoint gibt 400 zurueck**: Der Parameter `user_id` und/oder `max_id` ist falsch. Die HikerAPI v2 verwendet moeglicherweise andere Parameter-Namen. Die Paginierung sollte `end_cursor` statt `max_id` verwenden.

2. **Auth-Fehler**: `getClaims()` existiert nicht in der aktuellen Supabase JS Client-Version. Muss durch `getUser()` ersetzt werden (wie im Stack Overflow Pattern beschrieben).

3. **Profil-Metadaten zeigen 0/0**: Der User-Info-Call scheint zu funktionieren, aber die `follower_count` und `following_count` werden mit `|| 0` behandelt -- wenn der Wert tatsaechlich 0 ist, ist das korrekt, aber die Profil-Daten werden moeglicherweise nicht korrekt gespeichert wegen des Auth-Fehlers.

## Aenderungen

### 1. Edge Function `scan-profiles/index.ts` ueberarbeiten

**Auth-Fix**: `getClaims()` durch `getUser()` ersetzen:
```text
// Vorher (fehlerhaft):
const { data } = await userClient.auth.getClaims(token);
userId = data?.claims?.sub;

// Nachher (korrekt):
const { data: { user } } = await supabase.auth.getUser(token);
userId = user?.id;
```

**HikerAPI Following-Fix**: Mehrere moegliche Korrekturen:
- Parameter `user_id` durch `id` ersetzen (v2-Konvention)
- Paginierungs-Parameter `max_id` durch `end_cursor` ersetzen
- Logging hinzufuegen um die genaue API-Antwort zu sehen

```text
// Vorher:
const params = new URLSearchParams({ user_id: String(igUserId) });
if (nextMaxId) params.set("max_id", nextMaxId);

// Nachher:
const params = new URLSearchParams({ id: String(igUserId) });
if (nextMaxId) params.set("end_cursor", nextMaxId);
```

**Response-Parsing anpassen**: Die Paginierungs-Antwort koennte `end_cursor` statt `next_max_id` enthalten:
```text
// Vorher:
nextMaxId = followingData.next_max_id || null;

// Nachher:
nextMaxId = followingData.next_max_id || followingData.end_cursor || null;
```

**Logging hinzufuegen**: `console.log` Statements um die API-Antworten zu debuggen, falls der Fix nicht sofort greift.

### 2. Testen

Nach dem Deployment die Edge Function erneut aufrufen und die Logs pruefen, um sicherzustellen, dass die HikerAPI korrekt antwortet und Follow-Events in die Datenbank geschrieben werden.

## Technische Details

Die Edge Function wird an folgenden Stellen geaendert:
- **Zeile 29-32**: `getClaims()` durch `getUser()` ersetzen
- **Zeile 107**: `user_id` durch `id` im URL-Parameter ersetzen
- **Zeile 108**: `max_id` durch `end_cursor` ersetzen
- **Zeile 130**: `next_max_id` Fallback auf `end_cursor`
- Mehrere `console.log` Statements fuer Debugging
