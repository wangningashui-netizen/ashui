import { useState, useRef, useCallback, useEffect } from "react";

export function useWebcam() {
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: "user" },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamEnabled(true);
    } catch (err) {
      console.error("Failed to access webcam:", err);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamEnabled(false);
  }, []);

  const toggleWebcam = useCallback(() => {
    if (webcamEnabled) {
      stopWebcam();
    } else {
      startWebcam();
    }
  }, [webcamEnabled, startWebcam, stopWebcam]);

  const getAudioStream = useCallback(async () => {
    if (audioStreamRef.current) return audioStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: false,
      });
      audioStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Failed to access microphone:", err);
      return null;
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setMicEnabled((prev) => !prev);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
      stopAudio();
    };
  }, [stopWebcam, stopAudio]);

  return {
    webcamEnabled,
    micEnabled,
    videoRef,
    webcamStreamRef,
    toggleWebcam,
    toggleMic,
    getAudioStream,
    stopAudio,
  };
}
