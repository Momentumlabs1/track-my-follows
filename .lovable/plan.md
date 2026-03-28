

## Problem: PARTIAL_FETCH false positive im Unfollow-Check

### Ursache
Der `unfollow-check` vergleicht die Anzahl gefetchter Followings gegen `profile.following_count` aus der DB. Dieser Wert wird nur vom `smart-scan` aktualisiert. Wenn er veraltet ist (User hat z.B. 200+ Leuten entfolgt), blockt der PARTIAL_FETCH-Guard fälschlich — obwohl 48 Followings die echte Zahl ist.

### Lösung: Frischen Following-Count per API holen

**Datei: `supabase/functions/unfollow-check/index.ts`**

Vor dem Paginierungs-Fetch einen schnellen Info-Call an HikerAPI machen (`/gql/user/info/by/id`), um den **aktuellen** `following_count` direkt von Instagram zu holen. Diesen Wert:
1. In der DB updaten (`tracked_profiles.following_count`)
2. Als `expectedCount` für den PARTIAL_FETCH-Guard verwenden

```
// Vor fetchAllFollowings:
const infoUrl = `https://api.hikerapi.com/gql/user/info/by/id?id=${igUserId}`;
const infoResult = await trackedApiFetch(supabase, FUNCTION_NAME, profileId, infoUrl, { "x-access-key": hikerApiKey });

let freshFollowingCount = profile.following_count ?? 0;
if (infoResult.response?.ok) {
  const info = await infoResult.response.json();
  const freshCount = info?.following_count ?? info?.response?.following_count;
  if (typeof freshCount === "number") {
    freshFollowingCount = freshCount;
    // Update DB with fresh count
    await supabase.from("tracked_profiles")
      .update({ following_count: freshCount })
      .eq("id", profileId);
  }
}

// Dann: expectedCount = freshFollowingCount statt profile.following_count
```

Damit wird der Guard gegen den **echten** aktuellen Wert geprüft, nicht gegen einen veralteten DB-Wert. Kostet 1 zusätzlichen API-Call ($0.00069) pro Unfollow-Check — vernachlässigbar bei max 2 Checks/Tag/Profil.

### Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/unfollow-check/index.ts` | Info-Call vor Pagination einfügen, `expectedCount` auf frischen Wert setzen |

