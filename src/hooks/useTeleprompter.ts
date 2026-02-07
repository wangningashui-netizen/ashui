import { useState, useRef, useCallback, useEffect } from "react";

export function useTeleprompter() {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [scrollSpeed, setScrollSpeed] = useState(2); // pixels per frame
  const [isScrolling, setIsScrolling] = useState(false);
  const [fontSize, setFontSize] = useState(28);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number>(0);

  const toggle = useCallback(() => setEnabled((p) => !p), []);

  const startScroll = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const stopScroll = useCallback(() => {
    setIsScrolling(false);
  }, []);

  const toggleScroll = useCallback(() => {
    setIsScrolling((p) => !p);
  }, []);

  const resetScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setIsScrolling(false);
  }, []);

  useEffect(() => {
    if (!isScrolling || !scrollRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const tick = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += scrollSpeed * 0.5;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  return {
    enabled,
    text,
    scrollSpeed,
    isScrolling,
    fontSize,
    scrollRef,
    toggle,
    setText,
    setScrollSpeed,
    setFontSize,
    startScroll,
    stopScroll,
    toggleScroll,
    resetScroll,
  };
}
