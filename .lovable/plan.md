

## Diagnose

Der Screenshot zeigt: **Alle Paywall-Texte werden als rohe Translation-Keys angezeigt** (z.B. "paywall.title" statt "Pro freischalten"). Die Übersetzungen existieren aber in allen 3 Sprachdateien (DE, EN, AR).

### Ursache
`react-i18next` nutzt standardmäßig `useSuspense: true`. Ohne `<Suspense>`-Boundary in der App (keines vorhanden!) werden Komponenten gerendert bevor i18n fertig initialisiert ist. Das Resultat: `t("paywall.title")` gibt den rohen Key zurück statt den übersetzten Text.

### Zusätzliche Probleme (aus dem Audit)

1. **Fehlende Translation-Keys** in allen 3 Locale-Dateien:
   - `paywall.unlock_spy_agent` (Dashboard.tsx:305)
   - `locked_feature.available_with_pro` (LockedFeatureCard.tsx:31)

2. **Hardcodierte deutsche Strings** (nicht übersetzt):
   - Dashboard.tsx:116-117: `"Account"` / `"Accounts"` statt i18n-Key
   - Dashboard.tsx:107: `"Spy Secret Pro"` und `:110` `"Spy Secret"` hardcodiert
   - PaywallSheet.tsx:155-156: Apple-Abo-Hinweis komplett auf Deutsch hardcodiert

## Umsetzungsplan

### 1. i18n-Config fixen (Hauptproblem)
**Datei: `src/i18n/index.ts`**
- `react: { useSuspense: false }` zur Config hinzufügen
- Damit rendern alle Komponenten sofort mit korrekten Übersetzungen, ohne dass ein `<Suspense>`-Wrapper nötig ist

### 2. Fehlende Translation-Keys ergänzen
**Dateien: `src/i18n/locales/de.json`, `en.json`, `ar.json`**
- `paywall.unlock_spy_agent` hinzufügen (DE: "Spy Agent freischalten", EN: "Unlock Spy Agent", AR: "فتح عميل التجسس")
- `locked_feature.available_with_pro` hinzufügen (DE: "Verfügbar mit Pro", EN: "Available with Pro", AR: "متاح مع Pro")
- `paywall.subscription_disclosure` hinzufügen (DE/EN/AR Varianten des Apple-Abo-Hinweises)

### 3. Hardcodierte Strings durch i18n-Keys ersetzen
**Datei: `src/pages/Dashboard.tsx`**
- Zeile 116-117: `"Account"/"Accounts"` → `t("dashboard.account_count", { count: profiles.length })`
- Translation-Key in allen 3 Dateien ergänzen

**Datei: `src/components/PaywallSheet.tsx`**
- Zeile 155-156: Hardcodierten Abo-Hinweis durch `t("paywall.subscription_disclosure")` ersetzen
- Key in allen 3 Locales anlegen

### 4. Gesamtaudit abschließen
- Alle Komponenten mit `useTranslation` sind bereits korrekt verdrahtet
- SpyDetail, FeedPage, Settings, Onboarding, etc. nutzen durchgehend `t()`-Aufrufe
- Rechtliche Seiten bleiben wie beabsichtigt nur auf Deutsch

## Technischer Hintergrund
- `useSuspense: false` bedeutet: Wenn i18n noch nicht bereit ist, rendert die Komponente trotzdem (mit Fallback-Werten). Sobald i18n fertig ist, wird automatisch neu gerendert mit den richtigen Übersetzungen.
- Das ist die Standard-Empfehlung für Apps ohne React.Suspense-Setup.

