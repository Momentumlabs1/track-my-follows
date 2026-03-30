

## Plan: Tutorial-Trigger Bugs fixen

### Problem-Analyse

**2 Bugs gefunden:**

1. **Pro-Tutorial zeigt nie**: `sessionStorage.setItem("show_pro_tutorial", "1")` wird **nirgendwo** im Code aufgerufen. Die alte PaywallSheet (die das Flag setzte) wurde geloescht. Der `nativePurchaseSuccess`-State im SubscriptionContext wird zwar gesetzt, aber von keiner Komponente gelesen.

2. **App-Tutorial unzuverlaessig**: Die Logik ist korrekt (profiles === [] + kein localStorage-Key), aber es fehlen Sicherheitsnetze:
   - Kein Logging zum Debuggen
   - Keine Route-Pruefung (Tutorial koennte starten bevor User auf /dashboard ist)
   - Race Condition: `profiles` ist kurz `undefined` bevor es `[]` wird

### Fixes

**1. `src/contexts/SubscriptionContext.tsx`** — Pro-Tutorial Trigger einbauen
- Im `onRevenueCatPurchase`-Callback: nach erfolgreichem Upgrade `sessionStorage.setItem("show_pro_tutorial", "1")` setzen
- Gleiches im Realtime-Listener: wenn Subscription von free auf pro wechselt, Flag setzen

**2. `src/components/ProTutorial.tsx`** — Alternativen Trigger hinzufuegen
- Zusaetzlich zum sessionStorage-Check: auch `nativePurchaseSuccess` aus SubscriptionContext als Trigger akzeptieren
- Wenn `nativePurchaseSuccess === true` UND `pro_tutorial_done` nicht in localStorage → Tutorial starten + `clearNativePurchaseSuccess()` aufrufen

**3. `src/components/AppTutorial.tsx`** — Robustheit verbessern
- Console-Logs einbauen fuer Debugging (`[AppTutorial] shouldStart`, `[AppTutorial] phase change`)
- Sicherstellen dass Tutorial nur auf `/dashboard` startet (Route-Check)
- `profiles` Fallback: wenn nach 3s immer noch `undefined`, als `[]` behandeln (Timeout-Fallback)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/contexts/SubscriptionContext.tsx` | `show_pro_tutorial` sessionStorage setzen bei Upgrade |
| `src/components/ProTutorial.tsx` | `nativePurchaseSuccess` als alternativen Trigger |
| `src/components/AppTutorial.tsx` | Route-Check + Timeout-Fallback + Debug-Logs |

3 Dateien editiert, keine neuen Dateien.

