import spyIcon from "@/assets/spy-icon.png";

interface SpyIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function SpyIcon({ size = 24, className = "", glow = false }: SpyIconProps) {
  return (
    <img
      src={spyIcon}
      alt="Spy"
      loading="eager"
      fetchPriority="high"
      className={`inline-block object-contain ${glow ? "drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]" : ""} ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
