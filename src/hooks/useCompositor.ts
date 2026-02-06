import { useRef, useCallback, useEffect } from "react";

interface UseCompositorOptions {
  webcamVideoRef: React.RefObject<HTMLVideoElement | null>;
  webcamEnabled: boolean;
  webcamPosition: { x: number; y: number };
  webcamSize: number;
  isRecording: boolean;
}

export function useCompositor({
  webcamVideoRef,
  webcamEnabled,
  webcamPosition,
  webcamSize,
  isRecording,
}: UseCompositorOptions) {
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const renderFrame = useCallback(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find the Excalidraw canvases
    const excalidrawContainer = document.querySelector(".excalidraw");
    if (!excalidrawContainer) return;

    const canvases = excalidrawContainer.querySelectorAll("canvas");
    if (canvases.length === 0) return;

    // Set composite canvas to match window size
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw each Excalidraw canvas
    for (const srcCanvas of canvases) {
      if (srcCanvas.width > 0 && srcCanvas.height > 0) {
        ctx.drawImage(srcCanvas, 0, 0, width, height);
      }
    }

    // Draw webcam bubble if enabled
    if (webcamEnabled && webcamVideoRef.current) {
      const video = webcamVideoRef.current;
      if (video.readyState >= 2) {
        const bubbleSize = webcamSize;
        const bx = webcamPosition.x;
        const by = webcamPosition.y;

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

        // Mirror the webcam
        ctx.translate(bx + bubbleSize, by);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, bubbleSize, bubbleSize);
        ctx.restore();

        // Draw border
        ctx.beginPath();
        ctx.arc(
          bx + bubbleSize / 2,
          by + bubbleSize / 2,
          bubbleSize / 2,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [webcamEnabled, webcamVideoRef, webcamPosition, webcamSize]);

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

  // Also run compositor when in countdown so it's ready
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
