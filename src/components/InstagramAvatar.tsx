import { useState } from "react";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";

function getProxiedUrl(src: string): string {
  if (src.includes("cdninstagram.com") || src.includes("fbcdn.net")) {
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

interface InstagramAvatarProps {
  src: string | null | undefined;
  alt: string;
  fallbackInitials: string;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function InstagramAvatar({ src, alt, fallbackInitials, size = 40, className = '', ring = false }: InstagramAvatarProps) {
  const [showFallback, setShowFallback] = useState(false);

  const ringStyle = ring
    ? {
        boxShadow: "0 0 0 1.5px hsl(0 0% 100% / 0.1), 0 0 0 3px hsl(var(--card))",
      }
    : {};

  if (!src || showFallback) {
    return (
      <div
        className={`rounded-full gradient-pink text-primary-foreground flex items-center justify-center font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35, ...ringStyle }}
      >
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={getProxiedUrl(src)}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`rounded-full object-cover bg-muted ${className}`}
      style={{ width: size, height: size, ...ringStyle }}
      onError={() => setShowFallback(true)}
    />
  );
}
