

## Fix: ProTutorial-Trigger nur bei echtem Upgrade

### Problem
`SubscriptionContext.tsx` Zeile 151: Realtime-Listener setzt `show_pro_tutorial = "1"` bei **jedem** DB-Update wo `plan_type === "pro"`. Das triggert das ProTutorial fälschlicherweise bei:
- Renewals
- Billing-Status-Änderungen
- Jeder Feldänderung an der Subscription-Zeile

Für bestehende Pro-User ohne `pro_tutorial_done_${userId}` in localStorage (weil das Tutorial bei ihnen nie lief) wird es dann fälschlicherweise angezeigt.

### AppTutorial-Status
Bereits korrekt: Prüft `profilesLoaded === true` + `profiles.length === 0`. Bestehende User mit Profilen sind sicher.

### Fix (1 Datei, 1 Stelle)

**`src/contexts/SubscriptionContext.tsx`** — Realtime-Listener (Zeile 148-154):

Vorher:
```typescript
if (payload?.new?.plan_type === "pro" && ["active", "in_trial"].includes(payload?.new?.status)) {
  sessionStorage.setItem("show_pro_tutorial", "1");
}
```

Nachher:
```typescript
const wasNotPro = payload?.old?.plan_type !== "pro" || !["active", "in_trial"].includes(payload?.old?.status);
const isNowPro = payload?.new?.plan_type === "pro" && ["active", "in_trial"].includes(payload?.new?.status);
if (wasNotPro && isNowPro) {
  sessionStorage.setItem("show_pro_tutorial", "1");
  console.log("[SubscriptionContext] Realtime: genuine upgrade detected");
}
```

Das stellt sicher, dass nur ein echter Statuswechsel (non-pro → pro) das Tutorial triggert. Renewals und sonstige Updates werden ignoriert.

Der native Purchase-Flow (`onRevenueCatPurchase`, Zeile 175) bleibt unverändert — der setzt den Flag weiterhin korrekt, weil er nur nach einem aktiven Kauf-Callback feuert.

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `src/contexts/SubscriptionContext.tsx` | Realtime-Listener: Upgrade-Transition prüfen statt jeden Pro-Status |

