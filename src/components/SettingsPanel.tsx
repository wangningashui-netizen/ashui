import { useState, useMemo } from "react";
import type {
  RecordingSettings,
  BgCategory,
} from "../types/settings";
import {
  ASPECT_RATIO_OPTIONS,
  BG_CATEGORIES,
  WALLPAPERS,
  CURSOR_COLORS,
} from "../types/settings";

interface SettingsPanelProps {
  open: boolean;
  settings: RecordingSettings;
  onClose: () => void;
  onChange: (settings: RecordingSettings) => void;
}

export function SettingsPanel({
  open,
  settings,
  onClose,
  onChange,
}: SettingsPanelProps) {
  const [bgCategory, setBgCategory] = useState<BgCategory>("All");

  const filteredWallpapers = useMemo(
    () =>
      bgCategory === "All"
        ? WALLPAPERS
        : WALLPAPERS.filter((w) => w.category === bgCategory),
    [bgCategory]
  );

  const pickRandomWallpaper = () => {
    const list = filteredWallpapers;
    const pick = list[Math.floor(Math.random() * list.length)];
    onChange({ ...settings, background: pick.gradient, backgroundId: pick.id });
  };

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Aspect Ratio */}
          <section className="settings-section">
            <h3 className="settings-label">Aspect Ratio</h3>
            <div className="aspect-ratio-grid">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`aspect-btn ${settings.aspectRatio === opt.value ? "active" : ""}`}
                  onClick={() =>
                    onChange({ ...settings, aspectRatio: opt.value })
                  }
                >
                  <span className="aspect-main">{opt.label}</span>
                  <span className="aspect-sub">{opt.sub}</span>
                </button>
              ))}
            </div>
            {settings.aspectRatio === "custom" && (
              <div className="custom-size-inputs">
                <label>
                  W
                  <input
                    type="number"
                    value={settings.customWidth}
                    min={320}
                    max={3840}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        customWidth: Number(e.target.value) || 1920,
                      })
                    }
                  />
                </label>
                <span className="size-x">x</span>
                <label>
                  H
                  <input
                    type="number"
                    value={settings.customHeight}
                    min={320}
                    max={3840}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        customHeight: Number(e.target.value) || 1080,
                      })
                    }
                  />
                </label>
              </div>
            )}
          </section>

          {/* Background */}
          <section className="settings-section">
            <h3 className="settings-label">Background</h3>
            <div className="bg-category-tabs">
              {BG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`cat-btn ${bgCategory === cat ? "active" : ""}`}
                  onClick={() => setBgCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button className="random-wallpaper-btn" onClick={pickRandomWallpaper}>
              <span className="sparkle">&#10024;</span> Pick random wallpaper
            </button>
            <div className="wallpaper-grid">
              {filteredWallpapers.map((wp) => (
                <button
                  key={wp.id}
                  className={`wallpaper-item ${settings.backgroundId === wp.id ? "selected" : ""}`}
                  style={{ background: wp.gradient }}
                  onClick={() =>
                    onChange({
                      ...settings,
                      background: wp.gradient,
                      backgroundId: wp.id,
                    })
                  }
                >
                  {settings.backgroundId === wp.id && (
                    <span className="wallpaper-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Corner Radius */}
          <section className="settings-section">
            <h3 className="settings-label">
              Corner Radius: {settings.cornerRadius}px
            </h3>
            <input
              type="range"
              className="settings-slider"
              min={0}
              max={48}
              value={settings.cornerRadius}
              onChange={(e) =>
                onChange({ ...settings, cornerRadius: Number(e.target.value) })
              }
            />
            <div className="slider-labels">
              <span>Sharp</span>
              <span>Rounded</span>
            </div>
          </section>

          {/* Camera */}
          <section className="settings-section">
            <h3 className="settings-label">Camera</h3>
            <label className="toggle-row">
              <div
                className={`toggle-switch ${settings.showCamera ? "on" : ""}`}
                onClick={() =>
                  onChange({ ...settings, showCamera: !settings.showCamera })
                }
              >
                <div className="toggle-thumb" />
              </div>
              <span>Show camera bubble in recording</span>
            </label>
            {settings.showCamera && (
              <>
                <div className="slider-value-label">
                  Size: {settings.cameraSize}px
                </div>
                <input
                  type="range"
                  className="settings-slider"
                  min={80}
                  max={320}
                  value={settings.cameraSize}
                  onChange={(e) =>
                    onChange({ ...settings, cameraSize: Number(e.target.value) })
                  }
                />
                <div className="slider-labels">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </>
            )}
          </section>

          {/* Canvas Padding */}
          <section className="settings-section">
            <h3 className="settings-label">
              Canvas Padding: {settings.canvasPadding}px
            </h3>
            <input
              type="range"
              className="settings-slider"
              min={0}
              max={160}
              value={settings.canvasPadding}
              onChange={(e) =>
                onChange({ ...settings, canvasPadding: Number(e.target.value) })
              }
            />
            <div className="slider-labels">
              <span>None</span>
              <span>Large</span>
            </div>
          </section>

          {/* Mouse Cursor Effect */}
          <section className="settings-section">
            <h3 className="settings-label">Mouse Cursor Effect</h3>
            <label className="toggle-row">
              <div
                className={`toggle-switch ${settings.showCursorEffect ? "on" : ""}`}
                onClick={() =>
                  onChange({
                    ...settings,
                    showCursorEffect: !settings.showCursorEffect,
                  })
                }
              >
                <div className="toggle-thumb" />
              </div>
              <span>Show cursor highlight in recording</span>
            </label>
            {settings.showCursorEffect && (
              <div className="cursor-color-row">
                <span className="cursor-color-label">Cursor color:</span>
                <div className="cursor-colors">
                  {CURSOR_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`cursor-color-btn ${settings.cursorColor === color ? "selected" : ""}`}
                      style={{ background: color }}
                      onClick={() =>
                        onChange({ ...settings, cursorColor: color })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
