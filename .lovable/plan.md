

## Plan: Custom Paywall (Web) entfernen

Da die native App ausschliesslich die RevenueCat-Paywall nutzt und auf Web keine Paywall gebraucht wird, entfernen wir die Custom-Paywall-Komponente und die zugehoerigen State-Variablen.

### Was sich aendert

**1. `src/components/PaywallSheet.tsx` loeschen**
- Gesamte Datei entfernen.

**2. `src/App.tsx` bereinigen**
- Import von `PaywallSheet` entfernen (Zeile 12).
- `<PaywallSheet />` aus dem JSX entfernen (Zeile 70).

**3. `src/contexts/SubscriptionContext.tsx` vereinfachen**
- `isPaywallOpen`, `closePaywall`, `paywallTrigger` State und Logik entfernen.
- `showPaywall` bleibt erhalten — auf Native ruft es weiterhin `launchNativePaywall()` auf, auf Web wird es ein No-Op (oder zeigt einen Toast "Upgrade in der App").
- Interface und Context-Default entsprechend anpassen.

### Was NICHT geaendert wird

- `showPaywall()` Aufrufe in 8 Dateien (Dashboard, FeedPage, Settings, ProfileDetail, etc.) bleiben bestehen. Sie funktionieren weiterhin: Native oeffnet RevenueCat, Web tut nichts.
- Keine Aenderungen an Edge Functions oder Scan-Logik (Code-Freeze).

### Zusammenfassung

3 Dateien betroffen: 1 loeschen, 2 editieren. Alle `showPaywall`-Aufrufe in der App bleiben funktional.

