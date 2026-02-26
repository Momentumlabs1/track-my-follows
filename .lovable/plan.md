

## Plan: Logo einbinden und Email-Templates professionalisieren

### Problem
Die Templates nutzen aktuell einen Text-basierten "SpySecret"-Block statt des echten Logos. Das Design ist funktional, aber nicht professionell genug (kein Logo-Bild, kein Card-Layout, kein visuelles Gewicht).

### Umsetzung

**1. Logo in `public/` kopieren**
- `src/assets/logo-wide.png` nach `public/email-logo.png` kopieren, damit es per URL erreichbar ist
- Referenz-URL: `https://track-my-follows.lovable.app/email-logo.png`

**2. Alle 6 Email-Templates upgraden**

Gemeinsame Design-Verbesserungen in allen Templates:
- **Logo als `<Img>`** statt Text-Block: `logo-wide.png` zentriert oben, ca. 180px breit
- **Card-Layout**: Weisser Container mit `border-radius: 20px`, leichtem Schatten (`box-shadow`) und Padding auf hellgrauem Body (`#f4f4f5`)
- **Spy-Icon** als subtiles Element im Footer (🕵️)
- **Professionellerer Footer**: App-Name, Tagline, ggf. Link zu Impressum/Datenschutz
- **Konsistentere Typografie**: Etwas grössere Abstände, klarere Hierarchie

Betroffene Dateien:
- `supabase/functions/_shared/email-templates/signup.tsx`
- `supabase/functions/_shared/email-templates/recovery.tsx`
- `supabase/functions/_shared/email-templates/magic-link.tsx`
- `supabase/functions/_shared/email-templates/invite.tsx`
- `supabase/functions/_shared/email-templates/email-change.tsx`
- `supabase/functions/_shared/email-templates/reauthentication.tsx`

**3. Edge Function deployen**
- `auth-email-hook` neu deployen, damit die aktualisierten Templates live gehen

### Template-Struktur (neu)

```text
┌─────────────────────────────────┐  ← #f4f4f5 body bg
│                                 │
│  ┌───────────────────────────┐  │  ← white card, rounded-20px, shadow
│  │                           │  │
│  │     [ LOGO-WIDE.PNG ]     │  │  ← echtes Logo-Bild, 180px
│  │                           │  │
│  │   ─────────────────────   │  │  ← subtle divider
│  │                           │  │
│  │   Bestätige deine E-Mail  │  │  ← heading
│  │   Gib diesen Code ein...  │  │  ← body text
│  │                           │  │
│  │   ┌───────────────────┐   │  │
│  │   │    6 8 2 8 9 0    │   │  │  ← gradient code box
│  │   └───────────────────┘   │  │
│  │                           │  │
│  │   60 Min gültig...        │  │
│  │                           │  │
│  │   ─────────────────────   │  │
│  │   🕵️ Spy-Secret           │  │
│  │   Dein geheimer Agent     │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Was sich NICHT andert
- Email-Versandlogik in `index.ts` (Resend)
- Deutsche Texte und Agent-Tonfall
- Farben (#FF2D78 Pink, #000 Schwarz)
- `deno.json` Imports

