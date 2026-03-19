

## Audit: Fehlende Übersetzungen & Hardcoded German Strings

### Gefundene Probleme

#### 1. Fehlende EN/AR Keys für `locked_feature`
- `locked_feature.unlock_with_pro` → Fallback: "Mit Pro freischalten" (DE!)
- `locked_feature.spy_teaser` → Fallback: "Verdachts-Score, Geschlechter-Analyse & mehr" (DE!)
- EN hat nur `locked_feature.available_with_pro` — die anderen 2 Keys fehlen komplett

#### 2. Fehlender EN/AR Key für `spy_status.info_title`
- SpyStatusCard.tsx Zeile 344: `t("spy_status.info_title", "Spy-Status Erklärung")` — Key fehlt in allen 3 Sprachen

#### 3. Hardcoded "Push Scan" / "Unfollow Scan" Labels
- `SpyStatusCard.tsx` Zeile 283: `"Push Scan"` (hardcoded, nicht übersetzt)
- `SpyStatusCard.tsx` Zeile 312: `"Unfollow Scan"` (hardcoded, nicht übersetzt)
- `SpyDetail.tsx` Zeile 248: `"Push Scan"` (hardcoded)
- `SpyDetail.tsx` Zeile 277: `"Unfollow Scan"` (hardcoded)

#### 4. Hardcoded "∞ unlimited"
- `SpyStatusCard.tsx` Zeile 291 und `SpyDetail.tsx` Zeile 256

#### 5. Hardcoded "Accounts" in Gender-Bar
- `ProfileDetail.tsx` Zeile 364: `{followings.length} Accounts` — "Accounts" nicht übersetzt

#### 6. Gender-Bar Fallback-Strings sind Deutsch
- `t("gender.followed_distribution", "Geschlechterverteilung...")` — Fallback sollte EN sein, aber da die Keys in allen 3 JSON-Dateien existieren, ist das nur ein kosmetisches Problem bei den Fallbacks

### Zusammenfassung der Änderungen

| Datei | Was |
|---|---|
| `src/i18n/locales/en.json` | Keys hinzufügen: `locked_feature.unlock_with_pro`, `locked_feature.spy_teaser`, `spy_status.info_title` |
| `src/i18n/locales/de.json` | Keys hinzufügen: `locked_feature.unlock_with_pro`, `locked_feature.spy_teaser`, `spy_status.info_title` |
| `src/i18n/locales/ar.json` | Keys hinzufügen: `locked_feature.unlock_with_pro`, `locked_feature.spy_teaser`, `spy_status.info_title` |
| `src/components/SpyStatusCard.tsx` | "Push Scan", "Unfollow Scan", "∞ unlimited" durch `t()` ersetzen |
| `src/pages/SpyDetail.tsx` | "Push Scan", "Unfollow Scan", "∞ unlimited" durch `t()` ersetzen |
| `src/pages/ProfileDetail.tsx` | `{followings.length} Accounts` → `t()` mit Interpolation; deutsche Fallback-Strings auf EN ändern |

Neue Translation-Keys:
- `locked_feature.unlock_with_pro`: DE "Mit Pro freischalten" / EN "Unlock with Pro" / AR "فتح مع Pro"
- `locked_feature.spy_teaser`: DE "Verdachts-Score, Geschlechter-Analyse & mehr" / EN "Suspicion score, gender analysis & more" / AR "مؤشر الشك، تحليل الجنس والمزيد"
- `spy_status.info_title`: DE "Spy-Status Erklärung" / EN "Spy Status Explained" / AR "شرح حالة الجاسوس"
- `spy_detail.push_scan_title`: DE "Push Scan" / EN "Push Scan" / AR "فحص فوري"
- `spy_detail.unfollow_scan_title`: DE "Unfollow Scan" / EN "Unfollow Scan" / AR "فحص إلغاء المتابعة"
- `spy_detail.unlimited`: DE "∞ unbegrenzt" / EN "∞ unlimited" / AR "∞ غير محدود"
- `gender.accounts_count`: DE "{{count}} Accounts" / EN "{{count}} accounts" / AR "{{count}} حساب"

