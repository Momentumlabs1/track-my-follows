

# Launch-Dokumentation & Apple Review Checkliste

---

## TEIL 1: CODE-FREEZE — Bestätigt

Die genannten Dateien werden als FROZEN markiert. Keine Änderungen ohne explizite Genehmigung.

**Backend (Edge Functions):**
- `smart-scan/index.ts` — FROZEN
- `trigger-scan/index.ts` — FROZEN
- `create-baseline/index.ts` — FROZEN
- `unfollow-check/index.ts` — FROZEN
- `_shared/apiGuard.ts` — FROZEN
- `_shared/genderDetection.ts` — FROZEN
- `revenuecat-webhook/index.ts` — FROZEN

**Frontend:**
- `InstagramAvatar.tsx` — FROZEN
- `ProfileCard.tsx` — FROZEN
- `ProfileDetail.tsx` — FROZEN (Sortierung + Tab-Logik)
- `suspicionAnalysis.ts` — FROZEN
- `genderDetection.ts` — FROZEN
- `SubscriptionContext.tsx` — FROZEN (showPaywall + onRevenueCatPurchase)

---

## TEIL 2: CODE-LOGIK DOKUMENTATION

### 2.1 smart-scan

**Auth:** `x-cron-secret` Header vs. `CRON_SECRET` env (Zeile 637-641)

**Profil-Selektion:** `tracked_profiles WHERE is_active=true ORDER BY last_scanned_at ASC NULLS FIRST LIMIT 50` (Zeile 661-666)

**Spy-Profil Flow (performSpyScan, Zeile 372-540):**
1. Falls kein `instagram_user_id`: `/v1/user/by/username` → speichert igUserId, avatar_url, display_name, counts (Zeile 384-402)
2. `/gql/user/info/by/id` → fresh following_count, follower_count, avatar_url refresh (Zeile 409-438)
3. `fetchPage1("following")` → /gql/user/following/chunk?count=200 (Zeile 446)
4. Private-Detection: followingUsers.length === 0 && actualFollowingCount > 0 → is_private=true (Zeile 450-453)
5. `syncNewFollows()` mit maxAllowed=200 (Zeile 459)
6. Smart Unfollow Hint: `baseline_complete && lastFollowingCount !== null` → Baseline-Coverage Check (>=85%) → `expectedCount - actualFollowingCount` = missingCount → `pending_unfollow_hint += missingCount` (Zeile 461-486)
7. Followers: Wenn baseline_count=0 → `fetchPages("followers", maxPages=5)`, sonst `fetchPage1("followers")` (Zeile 496-498)
8. `syncNewFollowers()` mit maxAllowed=200 (Zeile 513)
9. `refreshFollowingAvatars()` + `refreshFollowerAvatars()` (Zeile 525-526)
10. Update: previous_counts, last_counts, last_scanned_at, initial_scan_done=true (Zeile 529-536)

**Non-Spy Flow (performBasicScan, Zeile 545-631):**
1. Falls kein igUserId: `/v1/user/by/username` (Zeile 554-571)
2. `/gql/user/info/by/id` → fresh counts + avatar (Zeile 577-599)
3. `fetchPage1("following")` nur 1 Page (Zeile 602)
4. Private-Detection (Zeile 606-613)
5. `syncNewFollows()` maxAllowed=200 (Zeile 615)
6. `refreshFollowingAvatars()` (Zeile 618)
7. Kein Follower-Scan, kein Unfollow-Hint

**Cooldown:**
- Spy: `last_scanned_at > 55 min ago` → skip (Zeile 702-707)
- Non-Spy: `lastScanDate === today` → skip (Zeile 711-718)

**Gesamtlaufzeit:** `Date.now() - functionStartTime > 45_000` → stop (Zeile 681-684)

**API-Fehler:** 429 via trackedApiFetch → `skipped=true` → Profil übersprungen, kein Retry. 500/Timeout → `error` string → übersprungen.

**pending_unfollow_hint:** Zeile 477-483. Berechnung: `(lastFollowingCount + newFollowCount) - actualFollowingCount`. Nur wenn baseline_complete=true UND baselineCoverage >= 0.85.

**avatar_url refresh:** 
- tracked_profiles.avatar_url: via `/gql/user/info/by/id` (Zeile 425-432)
- profile_followings + follow_events: via `refreshFollowingAvatars()` (Zeile 9-39)
- profile_followers + follower_events: via `refreshFollowerAvatars()` (Zeile 42-71)

**Baseline-Recovery:** Zeile 725-773. Bedingung: `initial_scan_done=true && baseline_complete=false && !is_private && hoursSinceAttempt >= 24`. Setzt `last_baseline_attempt_at` ZUERST, dann ruft `create-baseline` per fetch auf.

---

### 2.2 trigger-scan

**Auth:** Bearer Token → `getUser()` (Zeile 339-349)

**Budget-Check (Push-Scans):** Nur wenn `isPro && !isProMax && scanType === "push"` (Zeile 373-388):
- Reset: `scans_reset_at < todayMidnight` → push=4, unfollow=1
- `pushRemaining <= 0` → 429
- Decrement: `push_scans_today = pushRemaining - 1`
- ProMax: Budget komplett übersprungen

**Free-User Gate:** `!isPro && initial_scan_done` → 403 PAYWALL_REQUIRED (Zeile 368-370)

**API-Calls pro Profil:**
1. Falls kein igUserId: `/v1/user/by/username` (Zeile 404-423)
2. Falls `hoursSinceLastScan >= 24`: `/v1/user/by/username` → avatar_url + counts refresh (Zeile 432-458)
3. `fetchPage1("following")` → /gql/user/following/chunk (Zeile 459)
4. `fetchPage1("followers")` → /gql/user/followers/chunk (Zeile 494)
5. `refreshFollowingAvatars()` + `refreshFollowerAvatars()` (Zeile 502-504)

**avatar_url refresh:** Zeile 432-458 (tracked_profiles via user-info) + Zeile 502-504 (followings/followers Avatare)

---

### 2.3 create-baseline

**Max API-Calls:** `MAX_API_CALLS_PER_INVOCATION = 100` (Zeile 7)

**`last_baseline_attempt_at` gesetzt:** SOFORT vor Profile-Load (Zeile 133-135), verhindert Recovery-Loops

**Pagination Flow:**
- `followingCount > 10000`: nur Page 1 via /gql, `isFullBaseline=false` (Zeile 191-205)
- Sonst: Full pagination mit /gql, maxPages = `min(max(ceil(count/200)+8, 20), 60)` (Zeile 218-220)
- Stale-Page Detection: 3 consecutive pages mit 0 neuen → Switch von gql zu v1 (Zeile 270-278)
- Cursor-Loop Detection: seenCursors Set pro Source (Zeile 280-296)
- API-Call-Limit: `apiCallCount >= 100` → partial save (Zeile 225-228)
- 402 (HikerAPI-Limit) → partial save (Zeile 244-246)
- Early-Exit: `allFollowings.length >= followingCount * 1.1` (Zeile 264-267)

**baseline_complete = true:** Zeile 396. Bedingung: `isFullBaseline || baselineCoverage >= 0.85 || followingCount <= 10`

**DB-Save:** Batch-Upsert in Chunks von 500, `ignoreDuplicates: true` (Zeile 77-87, 348)

---

### 2.4 unfollow-check

**Budget-Check:** Zeile 253-270.
- `unfollowRemaining = profile.unfollow_scans_today ?? 2`
- ProMax (`isProMax`, Zeile 232): gesamter Budget-Block übersprungen
- Reset: `scans_reset_at < todayMidnight` → push=4, unfollow=2
- `unfollowRemaining <= 0` → 429 LIMIT_REACHED
- Decrement: `unfollow_scans_today = unfollowRemaining - 1`

**Following-Limit:** `following_count > 1500` → 422 FOLLOWING_LIMIT, Budget refunded (Zeile 277-280)

**Vergleichs-Algorithmus:**

STEP 1 — Fresh count: `/gql/user/info/by/id` → freshFollowingCount (Zeile 305-342). Fallback: `/v1/user/by/username`

STEP 1b — Fetch ALL followings: `fetchAllFollowings()` mit gql preferred (Zeile 351-361)
- Retry: max 2 Attempts. Attempt 1=gql, Attempt 2=v1 (Zeile 351-383)
- PARTIAL_FETCH Guard: `allFollowings.length < expectedCount * threshold` (0.5 trusted, 0.3 untrusted, nur >= 10 expected) → Retry oder 422 (Zeile 369-380)

STEP 2 — DB-Baseline: `profile_followings WHERE tracked_profile_id AND direction='following' AND is_current=true LIMIT 10000` (Zeile 388-394)

**Baseline-Coverage Check:** Zeile 401-448. `coverageRatio = dbCurrentCount / freshFollowingCount`. Wenn < 0.9 und >= 10: Baseline-Reparatur. Fehlende Einträge mit `first_seen_at = last_baseline_attempt_at` eingefügt, is_initial=true. Budget refunded.

STEP 3 — Compare (Zeile 458-490):
- `currentApiIds = Set(allFollowings.map(u => u.pk))`
- `dbMap = Map(dbFollowings.map(f => [f.following_user_id, f]))`
- **Unfollow erkannt wenn:** `dbMap.has(userId) && !currentApiIds.has(userId)` → is_current=false, follow_event type="unfollow" erstellt, gender decremented
- **Confirmed:** In API UND DB → last_seen_at aktualisiert

STEP 4 — Neue Follows (Zeile 494-531):
- `allFollowings.filter(f => !existingIds.has(f.pk))`
- `maxNewFollows = max(actualFollowingCount - lastFollowingCount, 0)`. Wenn kein lastFollowingCount → 0 (alle als backfill)
- `first_seen_at`: Real follows = random timestamp in Scan-Intervall. Backfill = `last_baseline_attempt_at`
- Events: `is_initial = isBackfill`

STEP 5 — Write (Zeile 536-566):
- Unfollows: `profile_followings.update({ is_current: false })`
- Confirm: `batchUpdateLastSeen()`
- Events: `batchUpsert` mit ignoreDuplicates
- Gender: `decrement_gender_count` für Unfollows
- Profile: `pending_unfollow_hint=0, last_following_count=allFollowings.length, totals incremented`
- `unfollow_checks` Insert

---

### 2.5 ProfileDetail.tsx — "Zuletzt gefolgt" Liste

**Query:** `useProfileFollowings(id)` (Zeile 78) → `profile_followings WHERE tracked_profile_id AND is_current=true` (hook Zeile 7-16). Kein ORDER BY in der Query.

**Sortierung:** Events aus `useFollowEvents(id)` (Zeile 76). 
- `newFollowEvents` (Zeile 95-98): `is_initial=false && direction='following'` → sortiert nach `detected_at DESC`
- `initialFollowEvents` (Zeile 100-103): `is_initial=true && direction='following'` → sortiert nach `detected_at DESC`

**Trennung:** 
- "Kürzlich erkannt" = `newFollowEvents` (is_initial=false)
- "Vor Tracking" = `initialFollowEvents` (is_initial=true), Section-Header: `t("existing_at_first_scan")`
- Beide werden als separate Sektionen gerendert (Zeile 420-436)

---

### 2.6 InstagramAvatar.tsx

**Lade-Strategie:** Proxy-first für Meta-CDNs. 
- `isInstagramCdn(url)` → `cdninstagram.com` oder `fbcdn.net` → sofort über `/functions/v1/image-proxy` proxied (Zeile 5-7)
- Andere URLs: direkt geladen
- **Fallback:** `onError` → `setFailed(true)` → Initials-Circle mit gradient-pink Background (Zeile 30-35)
- `useEffect` setzt `failed=false` bei src-Änderung (Zeile 26-28)

---

### 2.7 SubscriptionContext.tsx — Paywall

**showPaywall() (Zeile 194-204):**
- `isNativeApp() && user` → `launchNativePaywall(user.id)` (revenuecat://launchPaywall). Custom Paywall wird NICHT geöffnet.
- Sonst (Web) → `setIsPaywallOpen(true)` → Custom PaywallSheet

**Web Flow (PaywallSheet.tsx):**
- 3 Preiskarten (weekly/monthly/yearly) mit hardcoded Preisen (Zeile 17-21, 400-427)
- `handlePurchase()`: Wenn `isNativeApp()` → `purchase(userId, productId)` + `waitForUpgrade()` polling. Sonst (rein Web) → Toast "manage_in_app_store" (Zeile 233-271)
- Restore: `restorePurchases(userId)` (Zeile 274-283)

**Native Flow:**
- `launchNativePaywall()` ruft `revenuecat://launchPaywall?external_id=${userId}&offering=default` auf
- Nach Kauf: Native App ruft `window.onRevenueCatPurchase()` Callback auf (Zeile 166-178 in SubscriptionContext)
- Callback: `waitForUpgrade()` pollt DB (20x alle 1,5s), dann `fetchSubscription()`, bei Erfolg → `haptic.success()` + `setNativePurchaseSuccess(true)` → `NativePurchaseSuccessSheet` mit `SuccessView`

**Fallback wenn native Paywall fehlschlägt:** KEINER. Es gibt keinen 3-Sekunden-Timeout-Fallback auf die Custom Paywall.

---

## TEIL 3: APPLE REVIEW CHECKLISTE

1. ✅ **RevenueCat native Paywall published mit "default" Offering** — `showPaywall()` ruft `launchNativePaywall()` mit `offering=default` auf (SubscriptionContext Zeile 198). RevenueCat-Konfiguration liegt außerhalb des Codes, muss im RevenueCat Dashboard verifiziert werden.

2. ✅ **showPaywall() ruft im nativen Kontext launchNativePaywall() auf** — Bestätigt in SubscriptionContext.tsx Zeile 195-199. Keine hardcoded Preise im nativen Flow.

3. ✅ **Web-Fallback-Paywall zeigt Weekly + Monthly + Yearly** — PaywallSheet.tsx Zeile 400-427 zeigt alle 3 Perioden. ACHTUNG: Yearly ist ebenfalls enthalten (nicht nur Weekly + Monthly wie gefordert). Falls "kein Yearly" gewünscht war, wäre das eine Änderung.

4. ❌ **3-Sekunden-Fallback auf custom Paywall wenn native Paywall fehlschlägt** — NICHT implementiert. `launchNativePaywall()` hat keinen Timeout. Wenn die native Paywall nicht erscheint (z.B. Simulator, RevenueCat-Fehler), passiert nichts. **Muss implementiert werden.**

5. ✅ **Restore Purchases Button** — Vorhanden in Settings.tsx Zeile 227 (`handleRestore` → `restorePurchases(userId)`) UND in PaywallSheet.tsx Zeile 449 (`handleRestore`).

6. ✅ **Account-Löschung** — Settings.tsx Zeile 106: `supabase.rpc("delete_own_account")` mit Bestätigungs-Dialog (showDeleteConfirm).

7. ✅ **AGB/Datenschutz/Impressum erreichbar** — Legal-Seiten existieren unter `src/pages/legal/` (AGB.tsx, Datenschutz.tsx, Impressum.tsx, Widerruf.tsx). Erreichbar via Settings-Seite.

8. ✅ **Abo-Verlängerungshinweis sichtbar** — PaywallSheet.tsx Zeile 444-446: `t("paywall.subscription_disclosure")` wird unter dem CTA angezeigt.

9. ⚠️ **Kein Placeholder-Text in der App** — Nicht automatisch prüfbar. Erfordert manuelles Durchklicken aller Screens. Keine `Lorem ipsum` oder `TODO` im Code gefunden.

10. ⚠️ **Test-Account kontakt@momentumlabs.at / Test1234** — Erfordert Live-Test. Subscription muss in der DB mit plan_type="pro" und status="active" eingetragen sein.

11. ⚠️ **SPYSECRET.mp4 Screen Recording aktuell** — Kann ich nicht prüfen, liegt außerhalb des Codes.

---

## TEIL 4: OFFENE TASKS (NACH APPLE REVIEW)

Bestätigt als zurückgestellt:
- SpyDetail Redesign + Spy-Name im Dashboard
- Pro-Tutorial nach Abo-Kauf
- Automatischer wöchentlicher Unfollow-Check
- consecutive_scan_errors Tracking
- Security Warnings (follower_events RLS, Leaked Password, Avatar Bucket)

---

## AKTION ERFORDERLICH

**Punkt 4 (3-Sekunden-Fallback)** muss vor Apple-Einreichung implementiert werden. Die Änderung betrifft `SubscriptionContext.tsx` (showPaywall Funktion): Nach `launchNativePaywall()` einen 3s-Timer starten. Wenn `onRevenueCatPurchase` nicht innerhalb von 3s feuert UND der User nicht Pro ist, `setIsPaywallOpen(true)` als Fallback aufrufen.

Umfang: ~15 Zeilen in `SubscriptionContext.tsx` Zeile 194-204.

