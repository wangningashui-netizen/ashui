import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { WebcamBubble } from "./components/WebcamBubble";
import { RecordingControls } from "./components/RecordingControls";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { SettingsPanel } from "./components/SettingsPanel";
import { useWebcam } from "./hooks/useWebcam";
import { useRecorder } from "./hooks/useRecorder";
import { useCompositor } from "./hooks/useCompositor";
import { DEFAULT_SETTINGS } from "./types/settings";
import type { RecordingSettings } from "./types/settings";
import "./App.css";
import "./components/SettingsPanel.css";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function App() {
  const [settings, setSettings] = useState<RecordingSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webcamPosition, setWebcamPosition] = useState({
    x: 30,
    y: window.innerHeight - settings.cameraSize - 90,
  });
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Track mouse position for cursor effect
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const {
    webcamEnabled,
    micEnabled,
    videoRef,
    toggleWebcam,
    toggleMic,
    getAudioStream,
  } = useWebcam();

  const { compositeCanvasRef, startCompositor, stopCompositor } = useCompositor({
    webcamVideoRef: videoRef,
    webcamEnabled,
    webcamPosition,
    settings,
    isRecording: false,
    mousePos: mousePosRef,
  });

  const {
    state: recordingState,
    elapsed,
    countdown,
    showToast,
    startRecording: _startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording: _stopRecording,
  } = useRecorder({
    compositeCanvasRef,
    getAudioStream,
  });

  const handleStartRecording = useCallback(async () => {
    startCompositor();
    await new Promise((r) => setTimeout(r, 100));
    _startRecording();
  }, [startCompositor, _startRecording]);

  const handleStopRecording = useCallback(() => {
    _stopRecording();
    setTimeout(() => {
      stopCompositor();
    }, 500);
  }, [_stopRecording, stopCompositor]);

  return (
    <div className="app-container">
      {/* Top brand bar */}
      <div className="top-bar">
        <div className="brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
          </svg>
          Excalicord
        </div>
        <div className="separator" />
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Record Whiteboard Videos
        </span>
        <div className="separator" />
        <button
          className="settings-btn"
          onClick={() => setSettingsOpen(true)}
          title="Recording Settings"
        >
          <GearIcon />
        </button>
      </div>

      {/* Excalidraw whiteboard */}
      <div className="whiteboard-container">
        <Excalidraw
          theme="dark"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
            },
          }}
        />
      </div>

      {/* Webcam bubble overlay */}
      <WebcamBubble
        videoRef={videoRef}
        enabled={webcamEnabled}
        position={webcamPosition}
        onPositionChange={setWebcamPosition}
        size={settings.cameraSize}
      />

      {/* Hidden composite canvas for recording */}
      <canvas ref={compositeCanvasRef} className="composite-canvas" />

      {/* Recording controls bar */}
      <RecordingControls
        state={recordingState}
        elapsed={elapsed}
        webcamEnabled={webcamEnabled}
        micEnabled={micEnabled}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onToggleWebcam={toggleWebcam}
        onToggleMic={toggleMic}
      />

      {/* Countdown overlay */}
      <CountdownOverlay count={countdown} />

      {/* Download success toast */}
      {showToast && (
        <div className="download-toast">
          Video saved successfully!
        </div>
      )}

      {/* Settings panel */}
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettings}
      />
    </div>
  );
}

export default App;
