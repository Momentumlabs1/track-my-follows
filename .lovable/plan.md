

## Plan: Alle hardcoded Strings internationalisieren

### Problem
Viele Stellen in der App haben hardcodierte deutsche Strings statt `t()` Translation-Keys. Betroffen sind Toasts, Labels, Datumsformate und ganze Seiten.

### Betroffene Stellen

**1. `src/pages/SpyDetail.tsx`** — 8 hardcoded Strings:
- `toast.success("Name gespeichert ✅")` → `t("spy_detail.name_saved")`
- `` toast.success(`Scan abgeschlossen! ${newCount} neue Änderungen 🔍`) `` → `t("spy_detail.scan_complete", { count: newCount })`
- `toast.error("Scan fehlgeschlagen")` → `t("spy_detail.scan_failed")`
- `` toast.success(`Unfollow-Check fertig! ${total} Änderungen gefunden 👁`) `` → `t("spy_detail.unfollow_complete", { count: total })`
- `toast.error("Unfollow-Check fehlgeschlagen")` → `t("spy_detail.unfollow_failed")`
- `{pushRemaining} von 4 übrig` → `t("spy_detail.remaining", { current: pushRemaining, max: 4 })`
- `{unfollowRemaining} von 1 übrig` → `t("spy_detail.remaining", { current: unfollowRemaining, max: 1 })`
- `toLocaleDateString("de-DE")` → dynamisch basierend auf `i18n.language`

**2. `src/components/SpyStatusCard.tsx`** — gleiche Strings:
- Toasts: `"Scan abgeschlossen!"`, `"Scan fehlgeschlagen"`, `"Unfollow-Check fertig!"`, `"Unfollow-Check fehlgeschlagen"`
- Labels: `von 4 übrig`, `von 1 übrig`

**3. `src/pages/NotFound.tsx`** — komplett hardcoded:
- `"Oops! Page not found"` → `t("not_found.title")`
- `"Return to Home"` → `t("not_found.back_home")`

**4. `src/pages/Onboarding.tsx`** — 1 hardcoded notification text:
- `"@saif folgt jetzt @jessica_x 👀"` → `t("onboarding.notification_example")`

**5. `src/pages/Dashboard.tsx`** — 1 Toast:
- `` toast.success(`Tracking aktiv für @${...} 🕵️`) `` → `t("dashboard.tracking_active", { username })`

**6. Legal Pages** (`Impressum.tsx`, `Datenschutz.tsx`, `AGB.tsx`, `Widerruf.tsx`):
- Diese bleiben deutsch — sie sind rechtlich bindend und muessen in der Originalsprache bleiben. Kein Handlungsbedarf.

### Translation Keys hinzufuegen

In **de.json**, **en.json**, **ar.json**:

```
"spy_detail": {
  // existing keys ...
  "name_saved": "Name gespeichert ✅" / "Name saved ✅" / "تم حفظ الاسم ✅",
  "scan_complete": "Scan abgeschlossen! {{count}} neue Änderungen 🔍" / "Scan complete! {{count}} new changes 🔍" / "اكتمل الفحص! {{count}} تغييرات جديدة 🔍",
  "scan_failed": "Scan fehlgeschlagen" / "Scan failed" / "فشل الفحص",
  "unfollow_complete": "Unfollow-Check fertig! {{count}} Änderungen gefunden 👁" / "Unfollow check done! {{count}} changes found 👁" / "اكتمل فحص إلغاء المتابعة! {{count}} تغييرات 👁",
  "unfollow_failed": "Unfollow-Check fehlgeschlagen" / "Unfollow check failed" / "فشل فحص إلغاء المتابعة",
  "remaining": "{{current}} von {{max}} übrig" / "{{current}} of {{max}} remaining" / "{{current}} من {{max}} متبقي",
  "push_scan": "Push Scan" (bleibt englisch in allen Sprachen),
  "unfollow_scan": "Unfollow Scan" (bleibt englisch in allen Sprachen),
  "current_mission": ... (bereits vorhanden),
  "capabilities": ... (bereits vorhanden)
}

"not_found": {
  "title": "Seite nicht gefunden" / "Page not found" / "الصفحة غير موجودة",
  "back_home": "Zurück zur Startseite" / "Return to Home" / "العودة للرئيسية"
}

"dashboard": {
  "tracking_active": "Tracking aktiv für @{{username}} 🕵️" / "Tracking active for @{{username}} 🕵️" / "التتبع نشط لـ @{{username}} 🕵️"
}

"onboarding": {
  "notification_example": "@saif folgt jetzt @jessica_x 👀" / "@saif now follows @jessica_x 👀" / "@saif يتابع الآن @jessica_x 👀"
}
```

Zusaetzlich fehlende Keys in **ar.json** nachtragen (alles was in de/en existiert aber in ar fehlt):
- `nav.feed`, `nav.spy`
- `feed.*` (meiste Keys fehlen)
- `welcome.*`
- `spy_detail.*`
- `spy_findings.*`
- `spy_status.*`
- `weekly.*`
- `suspicion.unauffaellig`, `suspicion.leicht_auffaellig`, `suspicion.spy_report`
- `unfollow_check.phase_*`, `unfollow_check.timeout`, `unfollow_check.has_unfollowed`, etc.
- `private_frozen*`, `private_cannot_track`
- `auth.code_expired`, `auth.code_invalid`, `auth.only_latest_code_valid`, `auth.account_exists_check_password`, `auth.forgot_password*`, `auth.new_password*`, `auth.update_password`, `auth.password_updated`, `auth.passwords_dont_match`, `auth.password_too_short`, `auth.back_to_login`, `auth.terms_*`

### Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/SpyDetail.tsx` | Hardcoded Strings → `t()` |
| `src/components/SpyStatusCard.tsx` | Hardcoded Strings → `t()` |
| `src/pages/NotFound.tsx` | `useTranslation` + `t()` |
| `src/pages/Onboarding.tsx` | Notification-Text → `t()` |
| `src/pages/Dashboard.tsx` | Toast → `t()` |
| `src/i18n/locales/de.json` | Neue Keys |
| `src/i18n/locales/en.json` | Neue Keys |
| `src/i18n/locales/ar.json` | Alle fehlenden Keys nachtragen |

