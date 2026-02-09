import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { WebcamBubble } from "./components/WebcamBubble";
import { RecordingControls } from "./components/RecordingControls";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { SettingsPanel } from "./components/SettingsPanel";
import { Teleprompter } from "./components/Teleprompter";
import { SceneBar } from "./components/SceneBar";
import { RecordingFrame } from "./components/RecordingFrame";
import { useWebcam } from "./hooks/useWebcam";
import { useRecorder } from "./hooks/useRecorder";
import { useCompositor } from "./hooks/useCompositor";
import { useScenes } from "./hooks/useScenes";
import { useTeleprompter } from "./hooks/useTeleprompter";
import { useLaserPointer } from "./hooks/useLaserPointer";
import { DEFAULT_SETTINGS } from "./types/settings";
import type { RecordingSettings } from "./types/settings";
import "./App.css";
import "./components/SettingsPanel.css";
import "./components/Teleprompter.css";
import "./components/SceneBar.css";
import "./components/RecordingFrame.css";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function TeleprompterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function PipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <rect x="12" y="9" width="8" height="6" rx="1" ry="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function App() {
  const [settings, setSettings] = useState<RecordingSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [webcamPosition, setWebcamPosition] = useState({
    x: 30,
    y: window.innerHeight - settings.cameraSize - 90,
  });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

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

  const scenes = useScenes();
  const teleprompter = useTeleprompter();
  const laser = useLaserPointer();

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

  const closePip = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
    setPipActive(false);
  }, []);

  const handleStopRecording = useCallback(() => {
    _stopRecording();
    closePip();
    setTimeout(() => stopCompositor(), 500);
  }, [_stopRecording, closePip, stopCompositor]);

  const openPip = useCallback(async () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    try {
      const stream = canvas.captureStream(15);
      let video = pipVideoRef.current;
      if (!video) {
        video = document.createElement("video");
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px";
        document.body.appendChild(video);
        pipVideoRef.current = video;
      }
      video.srcObject = stream;
      await video.play();
      await video.requestPictureInPicture();
      setPipActive(true);
      video.addEventListener("leavepictureinpicture", () => setPipActive(false), { once: true });
    } catch (err) {
      console.error("PiP failed:", err);
    }
  }, [compositeCanvasRef]);

  const togglePip = useCallback(() => {
    if (pipActive) closePip();
    else openPip();
  }, [pipActive, openPip, closePip]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "m" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); scenes.addScene(); }
      if (e.key === "PageDown" || (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); scenes.nextScene(); }
      if (e.key === "PageUp" || (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); scenes.prevScene(); }
      if (e.key === "t" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); teleprompter.toggle(); }
      if (e.key === " " && teleprompter.enabled) { e.preventDefault(); teleprompter.toggleScroll(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scenes, teleprompter]);

  void laser.getTrail;

  return (
    <div className="app-container">
      {/* Unified top toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="brand">
            <div className="brand-icon">a</div>
            <span className="brand-name">ashui</span>
          </div>
          <div className="toolbar-sep" />
          <button
            className={`toolbar-btn ${teleprompter.enabled ? "active" : ""}`}
            onClick={teleprompter.toggle}
            title="Teleprompter (Ctrl+T)"
          >
            <TeleprompterIcon />
          </button>
          <button
            className={`toolbar-btn ${pipActive ? "active" : ""}`}
            onClick={togglePip}
            title="Preview (PiP)"
          >
            <PipIcon />
          </button>
        </div>

        <div className="toolbar-right">
          {pipActive && (
            <div className="pip-badge">
              <div className="pip-dot" />
              Preview
            </div>
          )}

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

          <div className="toolbar-sep" />
          <button
            className="toolbar-btn"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </div>

      {/* Main content: sidebar + canvas */}
      <div className="main-layout">
        <SceneBar
          scenes={scenes.scenes}
          currentIndex={scenes.currentIndex}
          transitioning={scenes.transitioning}
          onGoToScene={scenes.goToScene}
          onAddScene={scenes.addScene}
          onDeleteScene={scenes.deleteScene}
          onDuplicateScene={scenes.duplicateScene}
        />

        <div className="canvas-area">
          <div className={`whiteboard-container ${scenes.transitioning ? "scene-transitioning" : ""}`}>
            <Excalidraw
              theme="light"
              excalidrawAPI={(api: any) => {
                scenes.excalidrawAPIRef.current = api;
              }}
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  export: false,
                },
              }}
            />
          </div>

          <WebcamBubble
            videoRef={videoRef}
            enabled={webcamEnabled}
            position={webcamPosition}
            onPositionChange={setWebcamPosition}
            size={settings.cameraSize}
          />

          {/* Recording frame preview — hidden during recording */}
          <RecordingFrame
            settings={settings}
            visible={recordingState === "idle"}
          />

          {laser.active && (
            <div
              className="laser-dot"
              style={{
                left: mousePosRef.current.x,
                top: mousePosRef.current.y,
                background: laser.color,
                color: laser.color,
              }}
            />
          )}
        </div>
      </div>

      <canvas ref={compositeCanvasRef} className="composite-canvas" />

      {teleprompter.enabled && (
        <Teleprompter
          enabled={teleprompter.enabled}
          text={teleprompter.text}
          fontSize={teleprompter.fontSize}
          isScrolling={teleprompter.isScrolling}
          scrollSpeed={teleprompter.scrollSpeed}
          scrollRef={teleprompter.scrollRef}
          onTextChange={teleprompter.setText}
          onFontSizeChange={teleprompter.setFontSize}
          onSpeedChange={teleprompter.setScrollSpeed}
          onToggleScroll={teleprompter.toggleScroll}
          onReset={teleprompter.resetScroll}
          onClose={teleprompter.toggle}
        />
      )}

      <CountdownOverlay count={countdown} />
      {showToast && <div className="download-toast">Video saved</div>}
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
