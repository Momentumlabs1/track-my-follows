

# Fix: Settings-Seite — Fehlende Übersetzungen + unsichtbarer Text auf aktiven Buttons

## Problem 1: Übersetzungs-Keys werden als Rohtext angezeigt

In allen drei Sprachdateien (`de.json`, `en.json`, `ar.json`) gibt es am Ende der Datei einen **zweiten `settings`-Block** (nur mit `disclaimer`), der den **ersten `settings`-Block** (mit allen echten Keys wie `title`, `logout`, `danger_zone` etc.) **überschreibt**. JSON erlaubt keine doppelten Keys — der letzte gewinnt.

Dasselbe passiert mit dem `feed`-Block (doppelt vorhanden).

**Fix:** Den zweiten `settings`-Block und den zweiten `feed`-Block am Ende jeder Datei entfernen und die fehlenden Keys (`disclaimer`, `your_feed`) in den jeweiligen **ersten** Block integrieren.

Betroffen: `src/i18n/locales/de.json`, `en.json`, `ar.json` (alle drei identisches Problem).

## Problem 2: Text auf ausgewählten Buttons unsichtbar

Die aktiven Sprach- und Theme-Buttons verwenden die CSS-Klasse `gradient-bg`, die **nirgends definiert ist** — weder in `index.css` noch in `tailwind.config.ts`. Dadurch haben die aktiven Buttons **keinen sichtbaren Hintergrund**, und der weiße Text (`text-primary-foreground`) verschwindet.

**Fix:** Die Klasse `gradient-bg` in `src/index.css` als Utility definieren:

```css
.gradient-bg {
  background: linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)));
}
```

Das ist konsistent mit dem bestehenden `gradient-pink` und den Avatar-Ring-Styles, die denselben Gradient verwenden.

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/i18n/locales/de.json` | Zweiten `settings`/`feed`-Block entfernen, Keys in ersten Block mergen |
| `src/i18n/locales/en.json` | Dasselbe |
| `src/i18n/locales/ar.json` | Dasselbe |
| `src/index.css` | `.gradient-bg` Utility-Klasse hinzufügen |

