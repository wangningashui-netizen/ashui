import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "countdown" | "recording" | "paused";

interface UseRecorderOptions {
  compositeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  getAudioStream: () => Promise<MediaStream | null>;
}

export function useRecorder({
  compositeCanvasRef,
  getAudioStream,
}: UseRecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedTimeRef.current;
    timerRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;

    // Countdown 3-2-1
    setState("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(0);

    // Get canvas stream
    const canvasStream = canvas.captureStream(30);

    // Get audio stream
    const audioStream = await getAudioStream();

    // Combine streams
    const tracks = [...canvasStream.getVideoTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(tracks);

    // Determine supported MIME type
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    let mimeType = "video/webm";
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) {
        mimeType = mt;
        break;
      }
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 5_000_000,
    });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `excalicord-${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    pausedTimeRef.current = 0;
    setElapsed(0);
    startTimer();
    setState("recording");
  }, [compositeCanvasRef, getAudioStream, startTimer]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      stopTimer();
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      setState("paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      startTimer();
      setState("recording");
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stopTimer();
    setElapsed(0);
    pausedTimeRef.current = 0;
    setState("idle");
    mediaRecorderRef.current = null;
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopTimer]);

  return {
    state,
    elapsed,
    countdown,
    showToast,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
