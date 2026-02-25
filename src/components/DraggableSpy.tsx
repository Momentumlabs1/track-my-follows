import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SpyIcon } from "@/components/SpyIcon";

interface DraggableSpyProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableSpy({ onDragStart, onDragEnd }: DraggableSpyProps) {
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", "spy");
    e.dataTransfer.effectAllowed = "move";

    // Create a drag image from the spy icon
    const img = new Image();
    img.src = new URL("@/assets/spy-icon.png", import.meta.url).href;
    // Use a transparent drag image and let CSS handle visuals
    try {
      e.dataTransfer.setDragImage(ref.current!, 32, 32);
    } catch {
      // fallback
    }

    setIsDragging(true);
    onDragStart?.();
  };

  const handleNativeDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <motion.div
      ref={ref}
      animate={{
        scale: isDragging ? 1.15 : 1,
      }}
      whileHover={{ scale: 1.08 }}
      className="cursor-grab active:cursor-grabbing select-none touch-none"
      title="Drag onto a profile to assign"
    >
      <div
        draggable="true"
        onDragStart={handleNativeDragStart}
        onDragEnd={handleNativeDragEnd}
        style={{ WebkitUserDrag: "element" } as React.CSSProperties}
      >
        <SpyIcon size={64} glow />
      </div>
    </motion.div>
  );
}
