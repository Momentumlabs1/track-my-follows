

## Problem

The `image-proxy` Edge Function returns **502 (Upstream 403)** because Instagram blocks server-side image fetches. Every avatar URL in `InstagramAvatar` and `ProfileCard.RectAvatar` goes through the proxy first, which fails, triggering the fallback initials.

Confirmed via direct test: `GET /functions/v1/image-proxy?url=...cdninstagram.com...` → `{"error":"Upstream 403"}`

## Solution

Browser `<img>` tags can load Instagram CDN URLs directly (no CORS restriction for images, `referrerPolicy="no-referrer"` prevents referer-based blocking). Change the loading strategy:

1. **Try direct URL first** (browser fetches from Instagram CDN directly)
2. **If that fails → try proxied URL** (as backup for edge cases)
3. **If both fail → show initials fallback**

## Changes

### 1. `src/components/InstagramAvatar.tsx`
- Add two-stage loading: direct first, proxy second, then fallback
- Track state: `'direct'` → `'proxy'` → `'fallback'`
- On first `onError`, switch src to proxied URL
- On second `onError`, show initials

### 2. `src/components/ProfileCard.tsx` → `RectAvatar`
- Same two-stage pattern for the rectangular avatars in "Zuletzt gefolgt"

Both components already have `referrerPolicy="no-referrer"` set, so direct loading should work in browsers.

