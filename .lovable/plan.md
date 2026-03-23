

## Problem

Race condition: After `purchase()` resolves, `refetch()` runs immediately but the RevenueCat webhook hasn't updated the `subscriptions` table yet. So the app reads stale "free" data.

**Flow:**
```text
purchase() resolves → refetch() → DB still "free" → success animation shows → account stays free
                                    ↑ webhook hasn't arrived yet
```

The realtime listener should eventually catch the DB change, but by then the user may have already closed the paywall.

## Fix

**File: `src/components/PaywallSheet.tsx`** — Replace the single `refetch()` with a polling retry that waits for the subscription to actually update to "pro":

```typescript
// After purchase succeeds:
haptic.success();

// Poll up to 10 times (every 1.5s = max 15s) until subscription updates
let retries = 0;
const pollSubscription = async () => {
  while (retries < 10) {
    await refetch();
    // Check if plan is now pro (need to read from context or re-query)
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data?.plan_type === "pro" && ["active", "in_trial"].includes(data.status)) {
      break;
    }
    retries++;
    await new Promise(r => setTimeout(r, 1500));
  }
  await refetch(); // Final refetch to update context
};

await pollSubscription();
setShowSuccess(true);
```

This ensures the success animation only shows once the DB is actually updated, and the context has the correct "pro" state.

**Additional safeguard:** The realtime listener in `SubscriptionContext.tsx` is already set up, so even if polling somehow misses it, the realtime event will trigger `fetchSubscription()` eventually.

### Files to edit
1. **`src/components/PaywallSheet.tsx`** — Add polling logic in `handlePurchase` after `purchase()` succeeds

