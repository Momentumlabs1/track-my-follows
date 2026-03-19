const CALLBACK_PATH = "/auth/callback";

export function getOAuthRedirectUrl(): string {
  return window.location.origin + CALLBACK_PATH;
}
