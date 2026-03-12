import { isNativeApp } from "./native";

const PUBLISHED_DOMAIN = "https://track-my-follows.lovable.app";
const CALLBACK_PATH = "/auth/callback";
const SUPABASE_AUTH_HOST = "bqqmfajowxzkdcvmrtyd.supabase.co";

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
 * Always bypass auth-bridge and handle redirect manually for consistency.
 */
export function shouldSkipBrowserRedirect(): boolean {
  return true;
}

const ALLOWED_OAUTH_HOSTS = [
  SUPABASE_AUTH_HOST,
  "accounts.google.com",
  "appleid.apple.com",
];

/**
 * Validate OAuth URL before redirecting the browser.
 */
export function isValidOAuthUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return false;
    }

    return ALLOWED_OAUTH_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

