

## Problem

Das aktuelle Feed-Layout zeigt im Center-Bereich redundant beide Usernames + Verb + Zeitangabe. Der User will:

1. **Tracked-Profil links** (eckig, pink) — kein Name nötig, ist klar wer das ist
2. **Verb in der Mitte** (hat entfolgt / neuer Follow etc.)
3. **Anderer Account rechts** mit Username **über** dem Avatar
4. **Zeitangabe entfernen**

## Änderungen

### `src/components/EventFeedItem.tsx`

Layout umbauen von:

```
[tracked avatar] | @timwger / hat entfolgt / @talha01_ | Vor 3 Min. | [other avatar]
```

zu:

```
[tracked avatar] | hat entfolgt | @talha01_ [other avatar]
```

Konkret:
- Center-Block: nur noch das Verb (farbig), kein Username mehr
- Rechte Seite: Username **über** dem Avatar des anderen Accounts anzeigen
- Zeitangabe + unread-Dot komplett entfernen
- Unread-Dot ggf. als kleiner Indikator am linken Rand oder ganz weglassen

