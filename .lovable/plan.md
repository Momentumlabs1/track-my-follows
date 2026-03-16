

# Problem: Tutorial erscheint nicht bei neuem Account

## Ursache

Der `WelcomeDialog` nutzt `localStorage.getItem("welcome_shown")` als Gate. LocalStorage ist **browser-basiert, nicht account-basiert**. Wenn du vorher schon mal die App im gleichen Browser geöffnet hast (auch mit einem anderen Account), wurde `welcome_shown` bereits gesetzt. Ein neuer Account im gleichen Browser sieht das Tutorial deshalb nie.

## Loesung

Den localStorage-Key an die **User-ID** koppeln, sodass jeder neue Account sein eigenes Tutorial bekommt.

### Aenderungen in `src/components/WelcomeDialog.tsx`

- `useAuth()` importieren, um die aktuelle `user.id` zu bekommen
- Key aendern von `"welcome_shown"` zu `"welcome_shown_<userId>"`
- Erst pruefen wenn `user` vorhanden ist (nicht im ausgeloggten Zustand)

```ts
// Vorher:
const WELCOME_KEY = "welcome_shown";
if (!localStorage.getItem(WELCOME_KEY)) { ... }

// Nachher:
const { user } = useAuth();
const welcomeKey = user ? `welcome_shown_${user.id}` : null;

useEffect(() => {
  if (!welcomeKey || localStorage.getItem(welcomeKey)) return;
  const timer = setTimeout(() => setOpen(true), 600);
  return () => clearTimeout(timer);
}, [welcomeKey]);

// handleClose setzt localStorage.setItem(welcomeKey, "1")
```

Nur eine Datei betroffen, minimale Aenderung.

