import { useState } from "react";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";

function getProxiedUrl(src: string): string {
  // Only proxy Instagram CDN URLs
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
}

export function InstagramAvatar({ src, alt, fallbackInitials, size = 40, className = '' }: InstagramAvatarProps) {
  const [showFallback, setShowFallback] = useState(false);

  if (!src || showFallback) {
    return (
      <div
        className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={getProxiedUrl(src)}
      alt={alt}
      className={`rounded-full object-cover bg-muted ${className}`}
      style={{ width: size, height: size }}
      onError={() => setShowFallback(true)}
    />
  );
}
