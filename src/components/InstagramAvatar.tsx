import { useState } from "react";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";

function getProxiedUrl(src: string): string {
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`;
}

function isInstagramCdn(url: string): boolean {
  return url.includes("cdninstagram.com") || url.includes("fbcdn.net");
}

interface InstagramAvatarProps {
  src: string | null | undefined;
  alt: string;
  fallbackInitials: string;
  size?: number;
  className?: string;
}

export function InstagramAvatar({ src, alt, fallbackInitials, size = 40, className = '' }: InstagramAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`rounded-full gradient-pink text-primary-foreground flex items-center justify-center font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  const imgSrc = isInstagramCdn(src) ? getProxiedUrl(src) : src;

  return (
    <img
      src={imgSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`rounded-full object-cover bg-muted ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
