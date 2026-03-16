

# Fix: Delta-Gate blockiert echte Follows bei unveraendertem Count

## Beweis aus den Live-Daten

Die Netzwerk-Response zeigt klar:
- `last_following_count: 274`, `following_count: 274` → `maxNewFollows = 0`
- `last_follower_count: 4168`, `follower_count: 4168` → `maxNewFollowers = 0`

Die Edge Functions wurden bei den UI-Aenderungen **nicht angefasst**. Der Delta-Gate war schon immer so — er hat beim ersten Post-Initial-Scan funktioniert, weil `last_following_count` noch `null` war (→ Fallback 200). Ab dem zweiten Scan greift er und blockiert alles bei stabilem Count.

## Loesung

Statt eines willkuerlichen Buffers: **Den Delta-Gate komplett entfernen und stattdessen auf den tatsaechlichen DB-Diff vertrauen.** Die `syncNewFollows`-Funktion prueft bereits gegen `profile_followings` — nur wirklich neue Accounts werden eingetragen. Der Delta-Gate ist eine unnoetige zweite Schranke.

### Aenderung in `supabase/functions/trigger-scan/index.ts`

**Zeilen 403-411 ersetzen** — Delta-Gate entfernen, stattdessen immer alle neuen Page-1-Accounts durchlassen:

```typescript
// ── No delta-gate: trust the DB diff in syncNewFollows/syncNewFollowers ──
const maxNewFollows = 200;
const maxNewFollowers = 200;
```

Die `syncNewFollows`-Funktion (Zeile 121-128) vergleicht bereits gegen bestehende `profile_followings` — nur Accounts die noch nicht in der DB sind, werden als Events erstellt. Der `maxAllowed`-Parameter ist dadurch nur noch ein Safety-Cap.

### Optional: Gleiches in `smart-scan/index.ts`

Smart-scan hat dieselbe Delta-Gate-Logik. Dort ebenfalls `maxNewFollows = 200` und `maxNewFollowers = 200` setzen statt der Count-Differenz.

### Ergebnis

- Neue Follows werden immer erkannt, auch wenn der Gesamtcount gleich bleibt
- Keine falschen Events, weil der DB-Diff in `syncNewFollows` bereits filtert
- Kein kuenstlicher Buffer noetig

