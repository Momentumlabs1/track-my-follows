

# Optimierung: User-Info Call eliminiert + Unfollow-Scan auf 1500 begrenzt

## Status: ✅ DONE

### Was geändert wurde

1. **Migration**: `instagram_user_id TEXT` Spalte zu `tracked_profiles` hinzugefügt
2. **`create-baseline`**: Speichert `instagram_user_id` nach dem user-info Call
3. **`smart-scan`** (performSpyScan + performBasicScan): User-info Call entfernt, nutzt gespeicherte `instagram_user_id`. Fallback: holt pk einmalig wenn nicht vorhanden und speichert sie.
4. **`trigger-scan`**: Gleiche Änderung — user-info entfernt, Fallback für fehlende ID
5. **`unfollow-check`**: User-info entfernt + 1500 Following-Limit + Budget-Refund bei Limit
6. **Alle Funktionen**: `count=200` explizit auf allen HikerAPI Calls

### API Calls pro Scan (nachher)

- **Basic-Scan**: 1 Call (following P1, count=200)
- **Spy-Scan**: 2 Calls (following P1 + follower P1, count=200)
- **Unfollow-Check**: max 8 Calls (1500/200), kein user-info
- **Fallback**: Einmalig 1 extra Call wenn `instagram_user_id` noch fehlt (wird dann gespeichert)

### Vorheriger Fix: Baseline Recovery Loop (noch aktiv)

- `smart-scan` Recovery-Loop: 24h Cooldown + await (statt fire-and-forget)
- `create-baseline`: Setzt `baseline_complete = true` auch bei partial
- `saif_nassiri`: Manuell auf `baseline_complete = true` gesetzt
