

# Auth-Flow Redesign: Social Login wie echte Apps

## Problem

Aktuell gibt es Email/Passwort Login und Signup -- das ist ein Web-Pattern. Echte mobile Apps machen es so:

```text
┌──────────────────────┐
│                      │
│       [Logo]         │
│    Spy-Secret        │
│                      │
│ ┌──────────────────┐ │
│ │  Sign in with   │ │  ← Apple Requirement wenn
│ │  Apple           │ │    andere Social Logins da sind
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │  Continue with   │ │
│ │  Google      [G] │ │
│ └──────────────────┘ │
│                      │
│ ─── or ───────────── │
│                      │
│ ┌──────────────────┐ │
│ │ 📧 Email         │ │  ← Fallback fuer User ohne
│ └──────────────────┘ │    Apple/Google Account
│ ┌──────────────────┐ │
│ │ 🔒 Password      │ │
│ └──────────────────┘ │
│                      │
│ [Continue →]         │
│                      │
│ No subscription      │
│ needed. Start free.  │
└──────────────────────┘
```

## Was aendert sich

### 1. Unified Auth Screen (`src/pages/Login.tsx`)

- **Sign in with Apple** Button (gross, schwarz, oben) -- Apple Pflicht!
- **Continue with Google** Button (weiss mit Google-Icon)
- Trennlinie "or"
- Email/Passwort darunter als Fallback
- **Smart Auth**: Ein Button "Continue" -- versucht Login, bei Fehler automatisch Signup
- Kein separater Signup-Screen mehr
- Kein Name-Feld (kann spaeter in Settings)

### 2. `/signup` Route entfernen (`src/App.tsx`)

- Route entfernen, alles geht ueber `/login`
- Onboarding-Buttons zeigen auf `/login`

### 3. `src/pages/Index.tsx` -- Links anpassen

- Beide Buttons (Start Mission + Login) auf `/login`

### 4. Supabase OAuth Setup

- `supabase.auth.signInWithOAuth({ provider: 'apple' })` 
- `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Wichtig**: Die Provider muessen im Supabase Dashboard aktiviert werden (Apple + Google). Das ist ein manueller Schritt fuer den User.

### 5. i18n Keys (alle 3 Sprachen)

Neue Keys:
- `auth.continue_title` -- "Continue" / "Weiter" / "متابعة"
- `auth.or_divider` -- "or" / "oder" / "أو"
- `auth.sign_in_apple` -- "Sign in with Apple"
- `auth.continue_google` -- "Continue with Google"
- `auth.free_note` -- "No subscription needed. Start free."

### 6. `src/components/BottomNav.tsx`

- `/signup` aus hiddenRoutes entfernen

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/Login.tsx` | Komplett neu: Apple + Google + Email/PW Fallback, Smart Auth |
| `src/App.tsx` | `/signup` Route entfernen |
| `src/pages/Index.tsx` | Alle Links auf `/login` |
| `src/components/BottomNav.tsx` | `/signup` aus hiddenRoutes |
| `src/i18n/locales/en.json` | Neue auth Keys |
| `src/i18n/locales/de.json` | Neue auth Keys |
| `src/i18n/locales/ar.json` | Neue auth Keys |

## Technische Details

- **Sign in with Apple**: Supabase unterstuetzt das nativ via `signInWithOAuth({ provider: 'apple' })`. Muss im Supabase Dashboard unter Authentication > Providers aktiviert werden. Apple Developer Account noetig.
- **Google Sign-In**: Gleich via `signInWithOAuth({ provider: 'google' })`. Google Cloud Console OAuth Credentials noetig.
- **Smart Auth (Email)**: `signInWithPassword()` zuerst. Bei "Invalid login credentials" automatisch `signUp()`. User merkt nichts.
- **Apple Requirement**: Wenn die App Social Login anbietet (Google), MUSS auch "Sign in with Apple" vorhanden sein. Sonst wird die App im Review abgelehnt.
- Die OAuth Buttons werden im Frontend sofort funktionieren. Die Provider-Konfiguration im Supabase Dashboard ist ein separater Schritt den der User machen muss.

