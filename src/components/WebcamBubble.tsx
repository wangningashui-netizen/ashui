import { useState, useCallback, useEffect, type RefObject } from "react";

interface WebcamBubbleProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  size: number;
}

export function WebcamBubble({
  videoRef,
  enabled,
  position,
  onPositionChange,
  size,
}: WebcamBubbleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onPositionChange({
        x: Math.max(0, Math.min(window.innerWidth - size, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - size, e.clientY - dragOffset.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange, size]);

  if (!enabled) return null;

  return (
    <div
      className={`webcam-bubble ${isDragging ? "dragging" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
      }}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
    </div>
  );
}
