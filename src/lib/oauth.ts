import { isNativeApp } from "./native";

const PUBLISHED_DOMAIN = "https://track-my-follows.lovable.app";
const CALLBACK_PATH = "/auth/callback";

function isLovableDomain(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
}

/**
 * Determines the correct OAuth redirect URL based on the current environment.
 * - Lovable domains → redirect to /dashboard (auth-bridge handles session)
 * - Custom domains / native / localhost → redirect to /auth/callback on published domain
 */
export function getOAuthRedirectUrl(): string {
  const origin = window.location.origin;

  // Lovable domains: auth-bridge handles the session exchange, redirect directly to dashboard
  if (isLovableDomain()) {
    return origin + "/dashboard";
  }

  // Native WebView or localhost → force published domain callback
  if (
    isNativeApp() ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    return PUBLISHED_DOMAIN + CALLBACK_PATH;
  }

  // Custom domain → use callback on current origin
  return origin + CALLBACK_PATH;
}

/**
 * Whether to skip browser redirect (let us handle it manually).
 * On Lovable domains, the auth-bridge handles everything → don't skip.
 * On custom domains / native → skip and handle manually.
 */
export function shouldSkipBrowserRedirect(): boolean {
  if (isLovableDomain()) {
    return false; // Let auth-bridge handle it
  }

  const hostname = window.location.hostname;
  return (
    isNativeApp() ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    true // All non-Lovable domains need manual handling
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
