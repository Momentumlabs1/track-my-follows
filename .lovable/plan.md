

# Fix: Baseline Recovery Loop drosseln + saif_nassiri fixen

## Ist-Zustand (Problem)

1. **`smart-scan` Zeile 672-692**: Jede Stunde wird für jedes Profil mit `baseline_complete = false` ein `create-baseline` als fire-and-forget abgefeuert — ohne Cooldown, ohne await.
2. **saif_nassiri Spy-Profil** (`64c4865c...`): Hat `baseline_complete = false` + `has_spy = true`. Jede ungerade Stunde (Spy = stündlich) werden die normalen 2-3 Scan-Calls PLUS ~6-7 Baseline-Calls abgefeuert = ~46 Calls/Stunde statt 2-3.
3. Das `create-baseline` setzt `baseline_complete` nur auf `true` wenn `isFullBaseline = true`. Falls die API mal einen 402/429 zurückgibt, bleibt es `false` und der Loop geht ewig weiter.

## Sofort-Fix: DB Update

SQL im Supabase Editor ausführen:
```sql
UPDATE tracked_profiles 
SET baseline_complete = true 
WHERE id = '64c4865c-3806-43a7-93a1-224ef23b8e09';
```
(Spalte heißt `username`, nicht `instagram_username`)

## Code-Fix: Recovery-Loop drosseln

**Datei: `supabase/functions/smart-scan/index.ts`** (Zeile 672-692)

Änderungen:
1. **Cooldown**: Nur 1x pro 24h pro Profil triggern (prüfe `updated_at` oder neues Feld `last_baseline_attempt`)
2. **Await statt fire-and-forget**: Auf die Antwort warten, damit keine parallelen Runs entstehen
3. **Partial-Baseline akzeptieren**: Wenn `create-baseline` mit `isFullBaseline = false` endet (wegen 402/429), trotzdem `baseline_complete = true` setzen — die Daten reichen für den Scan-Betrieb

Konkreter Code-Ansatz:
```typescript
// Baseline Recovery — max 1x pro 24h
if (profile.initial_scan_done === true && profile.baseline_complete === false && !profile.is_private) {
  const lastAttempt = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const hoursSinceUpdate = (Date.now() - lastAttempt) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate >= 24) {
    console.log(`[BASELINE-RECOVERY] ${profile.username}: triggering (last attempt ${hoursSinceUpdate.toFixed(1)}h ago)`);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-baseline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ profileId: profile.id }),
      });
      // ... log result
    } catch (err) {
      console.error(`[BASELINE-RECOVERY] ${profile.username}: error:`, err);
    }
  }
}
```

Zusätzlich in **`create-baseline/index.ts`**: `baseline_complete` immer auf `true` setzen (auch bei partial), da ein partieller Baseline besser ist als ein endloser Recovery-Loop.

## Dateien

1. **DB**: `UPDATE tracked_profiles SET baseline_complete = true WHERE id = '64c4865c-3806-43a7-93a1-224ef23b8e09'`
2. **`supabase/functions/smart-scan/index.ts`** — Recovery-Loop mit 24h-Cooldown + await
3. **`supabase/functions/create-baseline/index.ts`** — `baseline_complete` immer auf `true` setzen (Zeile 359)

