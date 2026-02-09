import { useState, useEffect, useRef } from "react";
import type { RecordingSettings } from "../types/settings";
import { getResolution } from "../types/settings";

interface RecordingFrameProps {
  settings: RecordingSettings;
  visible: boolean;
}

export function RecordingFrame({ settings, visible }: RecordingFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    if (!visible) return;

    const update = () => {
      const el = containerRef.current?.parentElement;
      if (!el) return;

      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const res = getResolution(settings);
      const targetRatio = res.width / res.height;
      const margin = 0.88; // use 88% of available space

      let fw: number;
      let fh: number;
      if (targetRatio > cw / ch) {
        fw = cw * margin;
        fh = fw / targetRatio;
      } else {
        fh = ch * margin;
        fw = fh * targetRatio;
      }

      setFrame({
        x: (cw - fw) / 2,
        y: (ch - fh) / 2,
        w: fw,
        h: fh,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, [visible, settings]);

  if (!visible || frame.w === 0) return <div ref={containerRef} />;

  const label =
    settings.aspectRatio === "custom"
      ? `${settings.customWidth}x${settings.customHeight}`
      : settings.aspectRatio;

  return (
    <div ref={containerRef} className="rec-frame-root">
      {/* Dimmed overlay with cutout — uses box-shadow trick */}
      <div
        className="rec-frame-border"
        style={{
          left: frame.x,
          top: frame.y,
          width: frame.w,
          height: frame.h,
        }}
      >
        {/* Corner marks */}
        <span className="rec-corner tl" />
        <span className="rec-corner tr" />
        <span className="rec-corner bl" />
        <span className="rec-corner br" />

        {/* Ratio label */}
        <span className="rec-frame-label">{label}</span>
      </div>
    </div>
  );
}
