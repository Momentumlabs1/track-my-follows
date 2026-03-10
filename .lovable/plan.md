

## Problem

Die HikerAPI-Calls für Following-Listen verwenden aktuell keine Sortierung. Instagram gibt standardmassig nach "Relevanz/Interaktion" sortiert zuruck, nicht chronologisch. Andere Spy-Tools (Dolphin Radar etc.) nutzen den Parameter `order=date_followed_latest`, um die neuesten Follows zuerst zu bekommen.

## Betroffene Stellen

### 1. `trigger-scan/index.ts` — Zeile 87
```typescript
// AKTUELL:
const url = `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}`;
// FIX (nur fur "following"):
// Wenn endpoint === "following", &order=date_followed_latest anhangen
```

### 2. `smart-scan/index.ts` — Zeile 90 (fetchPage1) und Zeilen 107-109 (fetchAllPages)
Gleiche Anderung: Fur `endpoint === "following"` den order-Parameter anhangen.

### 3. `create-baseline/index.ts` — Zeilen 155 und 161
Die paginierten Following-Calls brauchen ebenfalls `&order=date_followed_latest`.

## Konkrete Anderungen

**In allen drei Dateien** wird die URL-Konstruktion fur Following-Endpoints um `&order=date_followed_latest` erganzt. Fur Follower-Endpoints bleibt alles gleich (Follower-Sortierung stimmt bereits).

**trigger-scan `fetchPage1`** (Z.87):
```typescript
const orderParam = endpoint === "following" ? "&order=date_followed_latest" : "";
const url = `https://api.hikerapi.com/v1/user/${endpoint}/chunk?user_id=${userId}${orderParam}`;
```

**smart-scan `fetchPage1`** (Z.90): Gleich.

**smart-scan `fetchAllPages`** (Z.107-109):
```typescript
const orderParam = endpoint === "following" ? "&order=date_followed_latest" : "";
const url = nextMaxId
  ? `...&max_id=${nextMaxId}${orderParam}`
  : `...?user_id=${userId}${orderParam}`;
```

**create-baseline** (Z.155, 161): `&order=date_followed_latest` an beide Following-URLs anhangen.

## Daten-Reset fur @timwger

Per SQL (insert tool):
1. `tracked_profile_id` fur username `timwger` aus `tracked_profiles` holen
2. `DELETE FROM follow_events WHERE tracked_profile_id = '<id>'`
3. `DELETE FROM profile_followings WHERE tracked_profile_id = '<id>'`
4. `UPDATE tracked_profiles SET initial_scan_done = false, baseline_complete = false, last_scanned_at = NULL WHERE id = '<id>'`

## Neu-Scan

Nach Deploy der Edge Functions und Daten-Reset manuell einen Scan triggern (App offnen, Profil auswahlen, Refresh). Die Following-Liste sollte dann chronologisch sortiert sein und mit Dolphin Radar ubereinstimmen.

