import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Lock } from "lucide-react";
import { SpyIcon } from "@/components/SpyIcon";

interface SpyLupeProps {
  active: boolean;
  children: React.ReactNode;
  onSpyClick?: () => void;
  hintText?: string;
  unlockText?: string;
}

export function SpyLupe({ active, children, onSpyClick, hintText = "🕵️ Drag the spy to peek — upgrade to see everything", unlockText = "Upgrade to reveal" }: SpyLupeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [maskPos, setMaskPos] = useState({ x: 0, y: 0 });
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const didDrag = useRef(false);
  const tapStart = useRef(0);

  const handleDrag = useCallback((_: any, info: { point: { x: number; y: number } }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMaskPos({
      x: info.point.x - rect.left,
      y: info.point.y - rect.top,
    });
  }, []);

  if (!active) return <>{children}</>;

  const maskStyle = isDragging
    ? {
        maskImage: `radial-gradient(circle 80px at ${maskPos.x}px ${maskPos.y}px, transparent 0%, transparent 50%, black 100%)`,
        WebkitMaskImage: `radial-gradient(circle 80px at ${maskPos.x}px ${maskPos.y}px, transparent 0%, transparent 50%, black 100%)`,
      }
    : {};

  return (
    <div ref={containerRef} className="relative">
      {/* Hint text */}
      <div className="text-center py-2">
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-xs text-muted-foreground"
        >
          {hintText}
        </motion.span>
      </div>

      {/* Real content (rendered normally) */}
      <div className="relative">
        {children}

        {/* Blur overlay — covers everything, mask reveals where spy is */}
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "hsl(var(--background) / 0.4)",
            ...maskStyle,
          }}
        />

        {/* Central upgrade button (hidden while dragging) */}
        {!isDragging && (
          <button
            onClick={() => onSpyClick?.()}
            className="absolute inset-0 z-20 flex items-center justify-center"
          >
            <span
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-primary-foreground text-sm shadow-lg min-h-[44px]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-rose)))",
                boxShadow: "0 4px 20px hsl(var(--primary) / 0.4)",
              }}
            >
              <Lock className="h-4 w-4" />
              {unlockText}
            </span>
          </button>
        )}

        {/* Draggable Spy */}
        <motion.div
          drag
          dragElastic={0.5}
          dragMomentum={false}
          dragConstraints={containerRef}
          style={{ x: dragX, y: dragY } as any}
          onPointerDown={() => {
            tapStart.current = Date.now();
            didDrag.current = false;
          }}
          onDragStart={() => {
            didDrag.current = true;
            setIsDragging(true);
          }}
          onDrag={handleDrag}
          onDragEnd={() => {
            setIsDragging(false);
            animate(dragX, 0, { duration: 0.3 });
            animate(dragY, 0, { duration: 0.3 });
          }}
          onPointerUp={() => {
            if (!didDrag.current && Date.now() - tapStart.current < 300) {
              onSpyClick?.();
            }
          }}
          className="absolute z-30 cursor-grab active:cursor-grabbing touch-none select-none top-4 right-4"
          style={{
            filter: "grayscale(0.8)",
            opacity: isDragging ? 1 : 0.6,
          }}
        >
          <motion.div
            animate={isDragging ? {} : {
              y: [0, -2, 2, -1, 0],
              rotate: [0, 1, -1, 0.5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <SpyIcon size={56} glow={isDragging} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
