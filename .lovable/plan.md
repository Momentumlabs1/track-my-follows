
Ziel: Apple-Fehler 2.1(b) für IAP-Preise/Trial sicher beheben.

1) Kurzantwort (einfach)
- Nein, im aktuellen Stand ist es nicht 100% sicher.
- Es gibt im Code einen konkreten Grund, warum Apple falsche Preise/Trial sehen konnte.

2) Analyse (mit Code-Beweis)
- `src/contexts/SubscriptionContext.tsx` Zeile 203-213:
  - Native Paywall wird gestartet (`launchNativePaywall(user.id)`), ABER gleichzeitig immer ein 3s-Timer gesetzt.
  - Nach 3s öffnet dieser Timer die Custom-Paywall (`setIsPaywallOpen(true)`), unabhängig davon, ob die native Paywall korrekt offen ist.
- `src/contexts/SubscriptionContext.tsx` Zeile 195-200:
  - Timer wird nur bei `nativePurchaseSuccess` gelöscht (also erst nach erfolgreichem Kauf), nicht beim reinen Anzeigen der nativen Paywall.
- `src/components/PaywallSheet.tsx` Zeile 17-21 + 400-427:
  - Custom-Paywall nutzt harte Preise/Trial-Flags (`PRICES`) statt StoreKit-Live-Daten.
  - Genau dadurch kann Preis/Trial von den echten IAP-Produkten abweichen.

3) Was Apple wahrscheinlich gesehen hat
- Native Paywall startet.
- Nach 3 Sekunden legt sich eure Custom-Paywall mit statischen Preisen darüber.
- Reviewer sieht dann Preis-/Trial-Widerspruch zwischen IAP-Produktdaten und In-App-Paywall.

4) Fix-Plan (minimal, launch-sicher)
1. In `SubscriptionContext.tsx` (FROZEN-Datei, nur mit Freigabe):
   - Auto-Fallback im nativen Flow entfernen (kein `setTimeout`-Auto-Open der Custom-Paywall).
   - Native = nur `launchNativePaywall(...)`.
   - Web = weiterhin Custom-Paywall.
2. Optional Sicherheitsnetz:
   - Manuellen „Paywall erneut öffnen“-Button statt Auto-Fallback (nur falls native Anzeige wirklich fehlschlägt).
3. In RevenueCat/App Store Connect prüfen:
   - Intro Offer/Free Trial je Produkt korrekt gesetzt.
   - Produkte im `default` Offering korrekt zugeordnet.
   - Paid Apps Agreement aktiv.
4. Keine weiteren Änderungen an Scan/Frozen-Logik.

5) Re-Submission Testplan (Pflicht, iPad Sandbox)
1. Native App öffnen, Paywall triggern, 10+ Sekunden warten:
   - Es darf keine Custom-Paywall automatisch erscheinen.
2. Angezeigte Preise in nativer Paywall mit App Store Connect Produkten vergleichen.
3. Trial-Text in nativer Paywall prüfen (monatlich/jährlich je nach Produktkonfiguration).
4. Testkauf + Restore durchführen und Logs/Screenshots für Apple-Antwort sichern.
