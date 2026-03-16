

# Fix: Profilbild auf der Analyse-Seite anzeigen

## Problem

In `src/pages/AnalyzingProfile.tsx` Zeile 90 wird `src={null}` hardcoded an `InstagramAvatar` uebergeben. Das Bild wird nie geladen, obwohl `trigger-scan` die `avatar_url` in `tracked_profiles` schreibt.

## Loesung

Nach dem Scan (ab Step 4, wenn `trigger-scan` fertig ist) die `avatar_url` aus der DB holen und anzeigen.

### Aenderung in `src/pages/AnalyzingProfile.tsx`

1. **State fuer avatar_url hinzufuegen**: `const [avatarUrl, setAvatarUrl] = useState<string | null>(null);`

2. **Nach erfolgreichem Scan die URL aus der DB lesen** (im `runScan` Block, nach `setCurrentStep(4)`):
```typescript
// Fetch avatar after scan completes
const { data: profileData } = await supabase
  .from("tracked_profiles")
  .select("avatar_url")
  .eq("id", profileId)
  .single();
if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);
```

3. **Avatar-Komponente updaten** (Zeile 90):
```tsx
<InstagramAvatar src={avatarUrl} alt={username || ""} fallbackInitials={username || "?"} size={90} className="border-2 border-background" />
```

### Ergebnis

Sobald der erste Scan abgeschlossen ist (Step 4), wird das echte Profilbild mit Gradient-Ring angezeigt, statt nur die Initialen-Fallback-Bubble.

