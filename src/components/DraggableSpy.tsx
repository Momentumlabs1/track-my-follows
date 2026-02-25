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
      className="cursor-grab active:cursor-grabbing select-none"
      title="Drag onto a profile to assign"
    >
      <div
        draggable
        onDragStart={handleNativeDragStart}
        onDragEnd={handleNativeDragEnd}
      >
        <SpyIcon size={64} glow />
      </div>
    </motion.div>
  );
}
