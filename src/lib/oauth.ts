import { isNativeApp } from "./native";

const PUBLISHED_DOMAIN = "https://track-my-follows.lovable.app";
const CALLBACK_PATH = "/auth/callback";

const isLocalhost = () => {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

/**
 * Use one deterministic callback target so Supabase never falls back to Site URL.
 */
export function getOAuthRedirectUrl(): string {
  if (isNativeApp() || isLocalhost()) {
    return PUBLISHED_DOMAIN + CALLBACK_PATH;
  }

  return window.location.origin + CALLBACK_PATH;
}

/**
 * Skip browser redirect only for native apps (Despia WebView).
 */
export function shouldSkipBrowserRedirect(): boolean {
  return isNativeApp();
}
