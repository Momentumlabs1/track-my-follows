

## Plan: Feed-Seite + Neue Bottom Navigation

### 1) Neue Bottom Navigation (`BottomNav.tsx`)

Replace the 3 tabs with:
- **Feed** (`/feed`) — icon: `Newspaper` from lucide
- **Spy** (`/dashboard`) — icon: custom `SpyIcon` or `Eye` — this is the default/home tab
- **Settings** (`/settings`) — icon: `Settings`

Remove the old "Add" tab. Keep the active indicator (pink dot + pink color). Update `isActive` logic so `/feed` highlights Feed tab, `/dashboard` + `/profile/*` highlights Spy tab. Hide on same routes as before.

### 2) New Feed Page (`src/pages/FeedPage.tsx`)

A new page at route `/feed` showing all activity chronologically.

**Structure:**
- Header: "SpySecret" logo + "What's new?" title
- **Spy des Tages** card pinned at top (move existing logic from Dashboard)
- **Filter pills**: `Alle | 🟢 Follows | 🔴 Unfollows` — horizontal, active = pink bg
- **Event list** grouped by time period (Heute / Gestern / Letzte Woche / Älter)
- Each event: avatar, @target, event badge (green/red), "bei @tracked_account", relative time
- Empty state with spy emoji
- Load 50 events, "Mehr laden" button for pagination

**Data:** Reuse `useFollowEvents()` + `useFollowerEvents()` hooks. Build unified feed same as Dashboard currently does, but move the feed logic into a `useFeedEvents` hook or directly into FeedPage.

### 3) Dashboard Changes (`Dashboard.tsx`)

- **Remove** the entire event feed section (lines ~378-416) — feed moves to `/feed`
- **Remove** the "Spy des Tages" section — moves to `/feed`
- **Keep**: Header/greeting, SpyAgentCard, Profile cards list, "Add profile" button
- The Dashboard becomes the "Spy" tab — focused on profiles management

### 4) Spy Agent Card Height Fix (`SpyAgentCard.tsx`)

Make the Spy Dock (right side) match the height of the account card (left side) by using `items-stretch` on the flex container and making the dock div fill available height with `h-full`.

### 5) Routing (`App.tsx`)

- Add route: `/feed` → `<ProtectedRoute><FeedPage /></ProtectedRoute>`
- Update Splash redirect: default to `/dashboard` (already done)

### 6) i18n Keys

Add to `de.json` (and `en.json`):
- `nav.feed`: "Feed"
- `nav.spy`: "Spy"  
- `feed.whats_new`: "What's new?"
- `feed.all`: "Alle"
- `feed.follows`: "Follows"
- `feed.unfollows`: "Unfollows"
- `feed.load_more`: "Mehr laden"
- `feed.empty_title`: "Noch keine Aktivitäten"
- `feed.empty_subtitle`: "Dein Spion ist auf der Lauer... Neue Follows und Unfollows erscheinen hier."
- `feed.this_week`: "Diese Woche"
- `feed.older`: "Älter"

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/FeedPage.tsx` | **Create** — new feed page with filters, grouped events, spy of the day |
| `src/components/BottomNav.tsx` | **Edit** — 3 new tabs (Feed, Spy, Settings) |
| `src/pages/Dashboard.tsx` | **Edit** — remove event feed + spy of the day sections |
| `src/components/SpyAgentCard.tsx` | **Edit** — fix dock height to match left card |
| `src/App.tsx` | **Edit** — add `/feed` route |
| `src/i18n/locales/de.json` | **Edit** — add feed-related keys |
| `src/i18n/locales/en.json` | **Edit** — add feed-related keys |

