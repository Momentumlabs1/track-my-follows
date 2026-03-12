import { isNativeApp } from "./native";

const PUBLISHED_DOMAIN = "https://track-my-follows.lovable.app";
const CALLBACK_PATH = "/auth/callback";

/**
 * Determines the correct OAuth redirect URL based on the current environment.
 * - Native app / localhost → always redirect to published domain
 * - Lovable preview / published → use current origin
 */
export function getOAuthRedirectUrl(): string {
  const origin = window.location.origin;

  // Native WebView or localhost → force published domain
  if (
    isNativeApp() ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    return PUBLISHED_DOMAIN + CALLBACK_PATH;
  }

  // Custom domain (not lovable.app / lovableproject.com) → force published domain
  if (
    !origin.includes("lovable.app") &&
    !origin.includes("lovableproject.com")
  ) {
    return PUBLISHED_DOMAIN + CALLBACK_PATH;
  }

  // Preview or published lovable domain → use current origin
  return origin + CALLBACK_PATH;
}

/**
 * Whether to skip browser redirect (let us handle it manually).
 * Required for custom domains and native apps to avoid auth-bridge issues.
 */
export function shouldSkipBrowserRedirect(): boolean {
  const hostname = window.location.hostname;
  return (
    isNativeApp() ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    (
      !hostname.includes("lovable.app") &&
      !hostname.includes("lovableproject.com")
    )
  );
}

const ALLOWED_OAUTH_HOSTS = [
  "accounts.google.com",
  "appleid.apple.com",
  "bqqmfajowxzkdcvmrtyd.supabase.co",
];

/**
 * Validates that an OAuth URL points to an allowed provider host.
 */
export function isValidOAuthUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_OAUTH_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}
