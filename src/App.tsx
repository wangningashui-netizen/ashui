import { useState, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { WebcamBubble } from "./components/WebcamBubble";
import { RecordingControls } from "./components/RecordingControls";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { useWebcam } from "./hooks/useWebcam";
import { useRecorder } from "./hooks/useRecorder";
import { useCompositor } from "./hooks/useCompositor";
import "./App.css";

const DEFAULT_WEBCAM_SIZE = 180;

function App() {
  const [webcamPosition, setWebcamPosition] = useState({
    x: 30,
    y: window.innerHeight - DEFAULT_WEBCAM_SIZE - 90,
  });

  const {
    webcamEnabled,
    micEnabled,
    videoRef,
    webcamStreamRef: _webcamStreamRef,
    toggleWebcam,
    toggleMic,
    getAudioStream,
    stopAudio: _stopAudio,
  } = useWebcam();

  const { compositeCanvasRef, startCompositor, stopCompositor } = useCompositor({
    webcamVideoRef: videoRef,
    webcamEnabled,
    webcamPosition,
    webcamSize: DEFAULT_WEBCAM_SIZE,
    isRecording: false, // We'll manage this manually
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
    // Small delay to let compositor start producing frames
    await new Promise((r) => setTimeout(r, 100));
    _startRecording();
  }, [startCompositor, _startRecording]);

  const handleStopRecording = useCallback(() => {
    _stopRecording();
    // Delay stopping compositor to ensure final frames are captured
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
        size={DEFAULT_WEBCAM_SIZE}
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
    </div>
  );
}

export default App;
