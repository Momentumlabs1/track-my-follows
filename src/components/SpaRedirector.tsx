import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Handles SPA redirects from 404.html fallback.
 * When the static host serves 404.html, it redirects to /?redirect=/original-path
 * This component picks that up and navigates to the correct route (preserving hash).
 */
export function SpaRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    if (redirect && location.pathname === "/") {
      // Clean the redirect param from URL
      params.delete("redirect");
      const remaining = params.toString();
      const target = redirect + (remaining ? (redirect.includes("?") ? "&" : "?") + remaining : "") + location.hash;
      
      console.info("[SpaRedirector] Redirecting to:", target);
      navigate(target, { replace: true });
    }
  }, [location, navigate]);

  return null;
}
