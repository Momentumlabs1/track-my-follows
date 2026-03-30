

## Diagnose — bestätigte Fakten

### Problem 1: Profilbilder weg
**Aktueller Code** (`InstagramAvatar.tsx` Zeile 40): Versucht zuerst `direct` (raw CDN URL), dann `proxy`, dann `fallback`.
**Warum kaputt**: Die CDN-URLs in der DB sind abgelaufen (`oe=` Timestamp expired). Direct-Load schlägt fehl → Proxy schlägt fehl (Instagram blockt Server-seitige Fetches mit 403) → Fallback-Initialen.
**Alter funktionierender Code**: Hat immer über den Proxy geladen (proxy-first), nicht direct-first. Der Proxy hat damals funktioniert weil die URLs noch gültig waren UND/ODER die URLs wurden bei jedem Scan refreshed.

**Fix**: InstagramAvatar und RectAvatar zurück auf **proxy-first** umstellen. Wenn die URL ein Instagram-CDN-Link ist → sofort proxied URL nutzen. Nur bei non-Instagram URLs direct laden. Kein mehrstufiges `direct→proxy→fallback`.

### Problem 2: "Zuletzt gefolgt" falsche Reihenfolge
**DB-Query-Ergebnis** für Profil `6a060c46`:
- 285 Einträge total, davon **234 mit `first_seen_at` zwischen 29.03. 16:00-16:15** (= Backfill)
- Nur 51 originale Einträge (ab 25.03.)
- `last_baseline_attempt_at` = `2026-03-25T18:11:02.1Z`

**Ursache**: `unfollow-check/index.ts` Zeile 418: Baseline-Reparatur setzt `first_seen_at: new Date().toISOString()` statt das Original-Baseline-Datum zu nutzen. Dadurch erscheinen alte Follows (einfachnurbenni, realdonaldtrump etc.) ganz oben.

**Fix**:
1. `unfollow-check` Zeile 418: `first_seen_at` auf `profile.last_baseline_attempt_at || profile.created_at` setzen statt `new Date()`
2. DB-Reparatur: Die 234 falschen Einträge auf das Baseline-Datum `2026-03-25T18:11:02.1Z` zurücksetzen

---

## Plan

### Datei 1: `src/components/InstagramAvatar.tsx`
Revert auf proxy-first Logik:
- Entferne das `stage`-State-Management (`direct→proxy→fallback`)
- Wenn `src` ein Instagram-CDN-Link ist (`cdninstagram.com` oder `fbcdn.net`): sofort `getProxiedUrl(src)` als `img src` nutzen
- Wenn nicht: `src` direkt nutzen
- `onError`: Fallback-Initialen anzeigen
- `referrerPolicy="no-referrer"` beibehalten

### Datei 2: `src/components/ProfileCard.tsx` → `RectAvatar`
Gleiche proxy-first Änderung wie InstagramAvatar.

### Datei 3: `supabase/functions/unfollow-check/index.ts`
Zeile 418 ändern:
```typescript
// Vorher:
first_seen_at: new Date().toISOString(),
// Nachher:
first_seen_at: profile.last_baseline_attempt_at || profile.created_at || new Date().toISOString(),
```

### Datei 4: DB-Reparatur (SQL UPDATE)
```sql
UPDATE profile_followings 
SET first_seen_at = '2026-03-25T18:11:02.1Z'
WHERE tracked_profile_id = '6a060c46-4919-4d0f-8c18-a509c74d48ea'
  AND direction = 'following'
  AND first_seen_at >= '2026-03-29 16:00:00'
  AND first_seen_at <= '2026-03-29 16:15:00';
```
Betrifft exakt 234 Einträge.

### Backend Avatar-Refresh
Bereits in der letzten Runde korrekt eingebaut (`refreshFollowingAvatars` / `refreshFollowerAvatars` in smart-scan und trigger-scan). Diese Funktionen updaten **nur** `following_avatar_url` / `follower_avatar_url` — kein `first_seen_at`, kein `is_initial`. Das ist korrekt und bleibt.

---

## Zusammenfassung der Diffs

| Datei | Änderung |
|---|---|
| `InstagramAvatar.tsx` | `direct→proxy→fallback` → proxy-first + fallback |
| `ProfileCard.tsx` (RectAvatar) | Gleich wie oben |
| `unfollow-check/index.ts` | Zeile 418: `new Date()` → `profile.last_baseline_attempt_at` |
| DB | 234 Rows `first_seen_at` zurück auf `2026-03-25T18:11:02.1Z` |

