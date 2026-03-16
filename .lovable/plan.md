

# Plan: Blurred Pro-Layout fuer Free User statt Locked Cards

## Was sich aendert

Statt der aktuellen `LockedFeatureCard`-Bloecke (Zeilen 339-361 in ProfileDetail.tsx) sehen Free User **exakt dasselbe Layout wie Pro User** (SpyStatusCard + WeeklyGenderCards + SpyFindings), aber:

1. **Alles geblurrt** (`blur-md`) und nicht klickbar (`pointer-events-none`)
2. **Shimmer-Overlay** ueber dem geblurrten Content (subtiler animierter Gradient)
3. **Zentrierter Brand-Button** (pink gradient, SpyIcon + Text wie "Spy freischalten") der ueber dem Blur liegt
4. Tap auf den Button oeffnet die **PaywallSheet**

## Aenderungen

### `src/pages/ProfileDetail.tsx` (einzige Datei)

Zeilen 338-394 ersetzen. Statt der `!isPro`/`isPro`-Verzweigung gibt es nur noch **einen** Block fuer beide:

```tsx
{/* ═══ ANALYSIS SECTIONS ═══ */}
<div className="px-5 mb-2">
  <div className="relative">
    {/* Overlay for free users OR pro without spy */}
    {(!isPro || !hasSpy) && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl gap-3">
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 shimmer-overlay" />
        </div>
        <button
          onClick={() => !isPro ? showPaywall("analysis") : setMoveSpyOpen(true)}
          className="relative z-20 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg"
          style={{
            background: "linear-gradient(135deg, #FF2D55, #FF6B8A)",
            boxShadow: "0 4px 20px rgba(255,45,85,0.4)",
          }}
        >
          <SpyIcon size={16} />
          {!isPro
            ? t("locked_feature.unlock_with_pro", "Mit Pro freischalten")
            : t("spy.assign_spy_here")}
        </button>
        <p className="relative z-20 text-muted-foreground text-xs text-center px-8">
          {!isPro
            ? t("locked_feature.spy_teaser", "Verdachts-Score, Geschlechter-Analyse & mehr")
            : t("spy.spy_required_description")}
        </p>
      </div>
    )}
    <div className={(!isPro || !hasSpy) ? "blur-md pointer-events-none select-none" : ""}>
      <SpyStatusCard ... />
      <div className="border-t border-border/20 my-5" />
      <WeeklyGenderCards ... />
      <div className="h-4" />
    </div>
  </div>
</div>
```

### `src/index.css` — Shimmer Animation hinzufuegen

```css
.shimmer-overlay {
  background: linear-gradient(
    110deg,
    transparent 30%,
    hsl(var(--primary) / 0.06) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Was entfernt wird

- Die gesamte `!isPro`-Branch mit den drei `LockedFeatureCard`-Aufrufen (Zeilen 339-361)
- Der separate `isPro && !hasSpy`-Banner-Block (Zeilen 398-408) wird ueberfluesig, da der Overlay das schon abdeckt
- Import von `LockedFeatureCard` kann entfernt werden (falls sonst nirgends verwendet)

### Ergebnis

Free User sehen die gleiche UI wie Pro, nur geblurrt mit Shimmer und einem pinken "Mit Pro freischalten"-Button. Pro User ohne Spy sehen denselben Blur mit "Spy hierhin verschieben"-Button. Pro User mit Spy sehen alles normal.

