## ✅ FIXED: Avatar-URLs expired weil Refresh-Logik im Audit entfernt wurde

### Ursache
Im System-Audit wurde `"★ FIX 1.9: NO avatar refresh for existing rows"` eingebaut. Dadurch wurden Avatar-URLs in `profile_followings`, `profile_followers` und `tracked_profiles` nie mehr aktualisiert. Instagram-CDN-URLs laufen nach ~24h ab → alle Bilder weg.

### Fix (v6)
1. **smart-scan + trigger-scan**: `refreshFollowingAvatars()` und `refreshFollowerAvatars()` nach jedem Scan — updatet nur Rows wo sich die URL geändert hat
2. **trigger-scan**: Täglicher User-Info-Call wenn `last_scanned_at` > 24h → refreshed `tracked_profiles.avatar_url`
3. **Frontend**: Nicht angefasst, `direct→proxy→fallback` bleibt
