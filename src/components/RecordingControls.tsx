import type { RecordingState } from "../hooks/useRecorder";

interface RecordingControlsProps {
  state: RecordingState;
  elapsed: number;
  webcamEnabled: boolean;
  micEnabled: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onToggleWebcam: () => void;
  onToggleMic: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// SVG Icons as inline components
function CameraIcon({ on }: { on: boolean }) {
  if (on) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function MicIcon({ on }: { on: boolean }) {
  if (on) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .67-.09 1.31-.27 1.92" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="8,5 20,12 8,19" />
    </svg>
  );
}

export function RecordingControls({
  state,
  elapsed,
  webcamEnabled,
  micEnabled,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onToggleWebcam,
  onToggleMic,
}: RecordingControlsProps) {
  const isRecordingOrPaused = state === "recording" || state === "paused";

  return (
    <div className="recording-controls">
      {/* Media toggles */}
      <div className="media-toggle">
        <button
          className={`control-btn ${webcamEnabled ? "active" : ""}`}
          onClick={onToggleWebcam}
          title={webcamEnabled ? "Turn off camera" : "Turn on camera"}
        >
          <CameraIcon on={webcamEnabled} />
        </button>
        <button
          className={`control-btn ${micEnabled ? "active" : ""}`}
          onClick={onToggleMic}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          <MicIcon on={micEnabled} />
        </button>
      </div>

      <div className="controls-separator" />

      {/* Recording controls */}
      {!isRecordingOrPaused ? (
        <button
          className="control-btn record-btn"
          onClick={onStartRecording}
          disabled={state === "countdown"}
        >
          <RecordIcon />
          Record
        </button>
      ) : (
        <>
          <div className="recording-timer">{formatTime(elapsed)}</div>

          <button
            className="control-btn pause-btn"
            onClick={state === "paused" ? onResumeRecording : onPauseRecording}
            title={state === "paused" ? "Resume" : "Pause"}
          >
            {state === "paused" ? <PlayIcon /> : <PauseIcon />}
          </button>

          <button className="control-btn stop-btn" onClick={onStopRecording}>
            <StopIcon />
            Stop & Save
          </button>
        </>
      )}
    </div>
  );
}
