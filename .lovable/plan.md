

## Plan: Profilkarten zurück auf weissen Card-Background

### Problem
Die letzte Änderung hat den weissen Hintergrund der Profilkarten entfernt — jetzt sind sie unsichtbar/transparent. Das war falsch, nur die Spy-Karte sollte angepasst werden.

### Änderung

**`src/components/ProfileCard.tsx`** — Zeile 91-92:
- `border-b border-border/50` + `background: transparent` → zurück zu `rounded-2xl border border-border bg-card`
- Die Karten bekommen wieder ihren weissen (bzw. card-farbigen) Hintergrund mit vollem Border

Konkret wird der Button-Style geändert von:
```tsx
className="w-full text-start overflow-hidden rounded-2xl border-b border-border/50"
style={{ background: 'transparent' }}
```
zu:
```tsx
className="w-full text-start overflow-hidden rounded-2xl border border-border bg-card"
```

Alles andere bleibt wie es ist — die neutralen Textfarben, das "1x täglich" Badge, die Spy-Karte mit ihrem Pink-Gradient.

### Dateien
| Datei | Was |
|---|---|
| `ProfileCard.tsx` | Button-Style: transparent → bg-card mit border |

