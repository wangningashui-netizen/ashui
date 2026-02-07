import type { RefObject } from "react";

interface TeleprompterProps {
  enabled: boolean;
  text: string;
  fontSize: number;
  isScrolling: boolean;
  scrollSpeed: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  onTextChange: (text: string) => void;
  onFontSizeChange: (size: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleScroll: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function Teleprompter({
  enabled,
  text,
  fontSize,
  isScrolling,
  scrollSpeed,
  scrollRef,
  onTextChange,
  onFontSizeChange,
  onSpeedChange,
  onToggleScroll,
  onReset,
  onClose,
}: TeleprompterProps) {
  if (!enabled) return null;

  return (
    <div className="teleprompter-overlay">
      {/* Controls bar */}
      <div className="teleprompter-controls">
        <span className="teleprompter-title">Teleprompter</span>
        <div className="teleprompter-actions">
          <label className="tp-control">
            <span>Size</span>
            <input
              type="range"
              min={16}
              max={48}
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
            />
          </label>
          <label className="tp-control">
            <span>Speed</span>
            <input
              type="range"
              min={1}
              max={8}
              value={scrollSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
            />
          </label>
          <button
            className={`tp-btn ${isScrolling ? "active" : ""}`}
            onClick={onToggleScroll}
          >
            {isScrolling ? "Pause" : "Scroll"}
          </button>
          <button className="tp-btn" onClick={onReset}>
            Reset
          </button>
          <button className="tp-btn tp-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {/* Script display */}
      <div
        ref={scrollRef}
        className="teleprompter-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        {text ? (
          <div className="teleprompter-content">{text}</div>
        ) : (
          <textarea
            className="teleprompter-input"
            placeholder="Paste your script here..."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            style={{ fontSize: `${fontSize}px` }}
          />
        )}
      </div>
      {/* Edit button when text exists */}
      {text && (
        <button
          className="tp-edit-btn"
          onClick={() => onTextChange("")}
        >
          Clear & Edit
        </button>
      )}
    </div>
  );
}
