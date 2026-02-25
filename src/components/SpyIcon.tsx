import spyIcon from "@/assets/spy-icon.png";

interface SpyIconProps {
  size?: number;
  className?: string;
}

export function SpyIcon({ size = 24, className = "" }: SpyIconProps) {
  return (
    <img
      src={spyIcon}
      alt="Spy"
      className={`inline-block object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
