import { useRef, useCallback, useEffect } from "react";
import type { RecordingSettings } from "../types/settings";
import { getResolution } from "../types/settings";

interface UseCompositorOptions {
  webcamVideoRef: React.RefObject<HTMLVideoElement | null>;
  webcamEnabled: boolean;
  webcamPosition: { x: number; y: number };
  settings: RecordingSettings;
  isRecording: boolean;
  mousePos: React.RefObject<{ x: number; y: number }>;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Parse CSS gradient to fill canvas
function fillGradient(
  ctx: CanvasRenderingContext2D,
  cssGradient: string,
  w: number,
  h: number
) {
  // Parse "linear-gradient(135deg, #color1 0%, #color2 50%, #color3 100%)"
  const match = cssGradient.match(
    /linear-gradient\((\d+)deg,\s*(.+)\)/
  );
  if (!match) {
    ctx.fillStyle = cssGradient || "#ffffff";
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const angle = (Number(match[1]) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  const x0 = cx - Math.cos(angle) * len;
  const y0 = cy - Math.sin(angle) * len;
  const x1 = cx + Math.cos(angle) * len;
  const y1 = cy + Math.sin(angle) * len;

  const grad = ctx.createLinearGradient(x0, y0, x1, y1);

  const stops = match[2].split(",").map((s) => s.trim());
  for (const stop of stops) {
    const parts = stop.match(/(#[0-9a-fA-F]+|rgba?\([^)]+\))\s+(\d+)%/);
    if (parts) {
      grad.addColorStop(Number(parts[2]) / 100, parts[1]);
    }
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function useCompositor({
  webcamVideoRef,
  webcamEnabled,
  webcamPosition,
  settings,
  isRecording,
  mousePos,
}: UseCompositorOptions) {
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const renderFrame = useCallback(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const excalidrawContainer = document.querySelector(".excalidraw");
    if (!excalidrawContainer) return;

    const excalidrawCanvases = excalidrawContainer.querySelectorAll("canvas");
    if (excalidrawCanvases.length === 0) return;

    // Get target recording resolution
    const res = getResolution(settings);
    const outW = res.width;
    const outH = res.height;

    canvas.width = outW;
    canvas.height = outH;

    const padding = settings.canvasPadding;
    const radius = settings.cornerRadius;

    // 1. Fill background (wallpaper gradient)
    fillGradient(ctx, settings.background, outW, outH);

    // 2. Draw the Excalidraw content area (with padding and rounded corners)
    const contentX = padding;
    const contentY = padding;
    const contentW = outW - padding * 2;
    const contentH = outH - padding * 2;

    if (contentW > 0 && contentH > 0) {
      ctx.save();
      if (radius > 0) {
        drawRoundRect(ctx, contentX, contentY, contentW, contentH, radius);
        ctx.clip();
      }

      // White background for the canvas area
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(contentX, contentY, contentW, contentH);

      // Draw Excalidraw canvases scaled to fit
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      for (const srcCanvas of excalidrawCanvases) {
        if (srcCanvas.width > 0 && srcCanvas.height > 0) {
          ctx.drawImage(
            srcCanvas,
            0, 0, srcCanvas.width, srcCanvas.height,
            contentX, contentY, contentW, contentH
          );
        }
      }

      // 3. Draw cursor highlight if enabled
      if (settings.showCursorEffect && mousePos.current) {
        const mx = mousePos.current.x;
        const my = mousePos.current.y;
        // Map screen coords to recording coords
        const rx = contentX + (mx / winW) * contentW;
        const ry = contentY + (my / winH) * contentH;

        ctx.beginPath();
        ctx.arc(rx, ry, 18, 0, Math.PI * 2);
        ctx.fillStyle = settings.cursorColor + "44"; // with alpha
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        ctx.fillStyle = settings.cursorColor;
        ctx.fill();
      }

      ctx.restore();

      // Draw border around content area if we have padding
      if (padding > 0 && radius > 0) {
        drawRoundRect(ctx, contentX, contentY, contentW, contentH, radius);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 4. Draw webcam bubble if enabled in settings
    if (
      settings.showCamera &&
      webcamEnabled &&
      webcamVideoRef.current
    ) {
      const video = webcamVideoRef.current;
      if (video.readyState >= 2) {
        const bubbleSize = settings.cameraSize;
        // Map webcam position from screen to recording coords
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const bx = (webcamPosition.x / winW) * outW;
        const by = (webcamPosition.y / winH) * outH;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
          bx + bubbleSize / 2,
          by + bubbleSize / 2,
          bubbleSize / 2,
          0,
          Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();

        ctx.translate(bx + bubbleSize, by);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, bubbleSize, bubbleSize);
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(
          bx + bubbleSize / 2,
          by + bubbleSize / 2,
          bubbleSize / 2,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [webcamEnabled, webcamVideoRef, webcamPosition, settings, mousePos]);

  useEffect(() => {
    if (isRecording) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [isRecording, renderFrame]);

  const startCompositor = useCallback(() => {
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, [renderFrame]);

  const stopCompositor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
  }, []);

  return {
    compositeCanvasRef,
    startCompositor,
    stopCompositor,
  };
}
