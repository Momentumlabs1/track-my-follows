

## Problem

`trigger-scan/index.ts` hat noch die **alte** `syncNewFollowers`-Funktion (Zeilen 141-201). Diese wurde NIE gefixt. Beim Initial-Scan (`isInitialScan=true`) passiert:

1. ~200 Follower von Page 1 werden in `profile_followers` eingefuegt
2. ~200 `follower_events` mit `is_initial: true` werden erstellt
3. Das sind die "41 followers loaded" und die "PRESENT AT FIRST SCAN" Eintraege die du siehst

**Das ist falsch**: Follower-Listen werden by-design NIE gebaslined. Der Initial-Scan sollte fuer Follower GAR NICHTS tun.

### Die Loesung

**`trigger-scan/index.ts` Zeilen 141-201**: `syncNewFollowers` identisch zum `smart-scan` Fix umschreiben:

```typescript
async function syncNewFollowers(
  supabase, profileId, currentFollowers, lastScannedAt, isInitialScan, maxAllowed
) {
  // Initial scan: KEINE Follower-Baseline erstellen
  if (isInitialScan) return 0;
  
  // Kein Count-Anstieg: nichts tun
  if (maxAllowed <= 0) return 0;

  // ... existingIds laden, newEntries berechnen ...
  const toProcess = newEntries.slice(0, maxAllowed);
  // Nur echte Events (is_initial: false), kein Backfill
}
```

**Danach**: DB-Cleanup — alle `follower_events` und `profile_followers` fuer diego_gut1 loeschen (SQL-Migration).

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/trigger-scan/index.ts` | `syncNewFollowers` (Z. 141-201): Bei `isInitialScan` sofort `return 0`. Bei `maxAllowed <= 0` sofort `return 0`. Sonst nur `maxAllowed` echte Events, kein Backfill. |
| SQL-Migration | `DELETE FROM follower_events` und `DELETE FROM profile_followers` fuer alle tracked profiles (Reset) |

