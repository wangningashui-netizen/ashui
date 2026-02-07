import { useState, useRef, useCallback, useEffect } from "react";

export interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

const TRAIL_DURATION = 800; // ms

export function useLaserPointer() {
  const [active, setActive] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const trailRef = useRef<LaserPoint[]>([]);
  const activeRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Key listeners: hold 'l' to activate
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "l" && !e.repeat && !e.ctrlKey && !e.metaKey) {
        // Don't activate if typing in an input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setActive(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "l") {
        setActive(false);
        // Keep trail for fade-out, clear after duration
        setTimeout(() => {
          if (!activeRef.current) {
            trailRef.current = [];
          }
        }, TRAIL_DURATION);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Track mouse while active
  useEffect(() => {
    if (!active) return;
    const move = (e: MouseEvent) => {
      const now = Date.now();
      trailRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      // Prune old points
      trailRef.current = trailRef.current.filter(
        (p) => now - p.time < TRAIL_DURATION
      );
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [active]);

  const getTrail = useCallback((): LaserPoint[] => {
    const now = Date.now();
    trailRef.current = trailRef.current.filter(
      (p) => now - p.time < TRAIL_DURATION
    );
    return trailRef.current;
  }, []);

  return {
    active,
    color,
    setColor,
    trailRef,
    getTrail,
  };
}
