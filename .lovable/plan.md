

## Plan: SpyStatusCard grösser, befüllter, cleaner

### Änderungen in `src/components/SpyStatusCard.tsx`

**1. Spy-Icon und Ring deutlich vergrössern**
- `ringSize`: 130 → **160px**
- `SpyIcon`: 82 → **105px**
- `strokeWidth`: 4 → **5**

**2. Texte grösser und besser angeordnet**
- Level-Label: `text-base` → **`text-lg`** (font-black)
- Score: `text-sm` → **`text-base`**, `/100` etwas grösser
- Emoji: `text-base` → **`text-lg`**
- Description: `text-xs` → **`text-sm`**, etwas mehr margin-top
- CTA-Button: `text-xs px-5 py-2` → **`text-sm px-6 py-2.5`**

**3. Mehr Padding in der Karte**
- Inner container: `px-5 pt-6 pb-5` → **`px-6 pt-8 pb-6`**
- Mehr Abstand zwischen Ring und Text: `mt-3` → **`mt-4`**
- Mehr Abstand zwischen Description und CTA: `mt-4` → **`mt-5`**

Das Ergebnis: Die Karte wirkt "voller" und der Spy dominiert als zentrales Element, mit grösseren Texten die den Raum besser ausfüllen.

