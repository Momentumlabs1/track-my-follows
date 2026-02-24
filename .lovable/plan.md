

## Problem

The scan fails with error: `Following fetch failed: 404 {"detail":"Entries not found","exc_type":"NotFoundError"}`. This happens when HikerAPI returns a 404 for the following/follower chunk endpoint -- likely for accounts with 0 followings, private accounts, or accounts HikerAPI can't access. The current code `throw`s on any non-2xx response, which crashes the entire scan.

## Root Cause

In `fetchFollowingChunked` (line 111) and `fetchFollowerChunked` (line 137), a 404 response causes an immediate throw. Since `mtlabs.ai` has only 4 followings, HikerAPI may return 404 ("Entries not found") instead of an empty list.

## Fix

### 1. Handle 404 gracefully in both fetch functions (`trigger-scan/index.ts`)

In `fetchFollowingChunked` and `fetchFollowerChunked`, treat a 404 response as "empty list" instead of throwing:

```typescript
// Instead of:
if (!res.ok) { const text = await res.text(); throw new Error(...); }

// Do:
if (res.status === 404) {
  await res.text(); // consume body
  console.log(`No ${direction} entries found for user ${userId} (404)`);
  break;
}
if (!res.ok) { const text = await res.text(); throw new Error(...); }
```

This applies to both `fetchFollowingChunked` (line 111) and `fetchFollowerChunked` (line 137).

### 2. Same fix in `auto-scan/index.ts`

Apply the identical 404 handling in the auto-scan edge function's fetch loops.

### 3. No other changes needed

- No UI changes required -- the scan will simply return 0 new events for that direction instead of crashing
- The profile metadata (follower/following counts, avatar) will still update since that fetch uses a different endpoint (`/v1/user/by/username`) which works fine

