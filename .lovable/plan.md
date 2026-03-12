

## Problem

The screenshot shows only "hat entfolgt" text with no avatars or usernames visible. The logic is also wrong:

1. **"Entfolgt" shouldn't exist** — only follow events exist (new follows / new followers)
2. **Layout logic is wrong** — it should be: LEFT = the account that followed, RIGHT = the account that received the follower
   - If Tim follows someone → Tim is LEFT, other person is RIGHT
   - If someone follows Tim → that person is LEFT, Tim is RIGHT
3. **Tracked profile username is missing** — needs to show under their avatar
4. **Cards should be slightly bigger** — more space in the middle
5. **Add an arrow** in the center to show direction (left → right = "follows")

## Changes

### `src/components/EventFeedItem.tsx`

Completely rework the layout logic:

**New logic for LEFT / RIGHT placement:**
- `source === "follow"` (Tim follows someone): LEFT = tracked profile (Tim), RIGHT = target
- `source === "follower"` (someone follows Tim): LEFT = the other person, RIGHT = tracked profile (Tim)
- LEFT always follows RIGHT — that's the universal rule

**New verb:** Replace all verbs with a simple arrow icon (e.g., `→` or `ArrowRight` from lucide) + small label like "folgt" (follows). No "entfolgt" verb.

**Layout per row:**
```text
[@username]     →      [@username]
[Avatar 58px]  folgt   [Avatar 58px]
```

- Both sides show username above avatar
- Center: arrow icon + "folgt" label in green
- Avatars slightly larger (58px instead of 50-52px)
- Tracked profile avatar keeps the pink square border to distinguish it
- Remove all unfollow/entfolgt/lost verb logic — only "folgt" exists

### `src/index.css`

Adjust `.feed-row` padding slightly if needed for the larger cards.

