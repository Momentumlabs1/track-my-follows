

# Fix: smart-scan Boot-Crash

## Problem
`smart-scan` crasht beim Booten. Zeile 536-537 in `performBasicScan` haben eine doppelte Variablendeklaration:
```typescript
const igUserId = profile.instagram_user_id as string | null;  // MUSS WEG
let igUserId = profile.instagram_user_id as string | null;     // bleibt
```

## Fix
1. **smart-scan/index.ts**: Die `const igUserId`-Zeile (536) entfernen. Nur die `let`-Deklaration behalten (wird weiter unten im Fallback reassignt).

Ein 1-Zeilen-Fix. Danach bootet smart-scan wieder sofort.

