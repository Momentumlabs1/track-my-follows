

## Fix: ScanStatus zeigt falsch "Hourly" bei allen Pro-Profilen

### Problem
`ScanStatus.tsx` prueft nur ob der User Pro ist (`plan === "pro"`) und zeigt dann bei **jedem** Profil "Hourly" an. Es wird nicht geprueft ob das Profil den Spy hat.

### Ist-Zustand Backend (korrekt)
- Spy-Profil (`has_spy: true`): stuendlich (55min Cooldown via Cron)
- Andere Pro-Profile: 1x taeglich via Cron
- Free-Profile: 1x taeglich, reduzierte Datenmenge

### Fix

**`src/components/ScanStatus.tsx`** — neue Prop `hasSpy` hinzufuegen:

```typescript
interface ScanStatusProps {
  lastScannedAt: string | null;
  hasSpy?: boolean;
}
```

Anzeige-Logik:
- `plan === "pro" && hasSpy` → "✓ Hourly"
- `plan === "pro" && !hasSpy` → "1x Daily"
- `plan !== "pro"` → "1x Daily"

**`src/pages/ProfileDetail.tsx`** — `hasSpy` an ScanStatus durchreichen:
```tsx
<ScanStatus lastScannedAt={profile.last_scanned_at} hasSpy={profile.has_spy} />
```

**`src/pages/Dashboard.tsx`** — falls ScanStatus dort auch genutzt wird, ebenfalls `hasSpy` durchreichen.

### Betroffene Dateien
| Datei | Aenderung |
|-------|-----------|
| `src/components/ScanStatus.tsx` | Neue Prop `hasSpy`, Logik anpassen |
| `src/pages/ProfileDetail.tsx` | `hasSpy` Prop durchreichen |
| `src/pages/Dashboard.tsx` | Pruefen ob ScanStatus dort genutzt wird, ggf. Prop durchreichen |

Kleine Aenderung, keine funktionalen Auswirkungen auf Scan-Backend oder andere Features.

