# Excalicord App v6 Code Review

> Review of `excalicord-app-v6.tar.gz` from repository `wangningashui-netizen/asss`

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| Name | excalicord-app |
| Version | 1.0.0 |
| Description | Excalidraw-based whiteboard video recording tool |
| Tech Stack | React 19 + Vite 7 + Excalidraw 0.18 + Electron 40 |
| Total Files | 11 source files |
| Main Component | `src/App.jsx` (526 lines, single-file architecture) |

---

## 2. Bug Issues

### BUG-1: `useEffect` missing dependencies (React Hooks rule violation)

**File:** `src/App.jsx:103-106`

```js
useEffect(() => {
  if (showBubble && bubbleMode === "camera") startWebcam();
  else if (bubbleMode === "image" || !showBubble) stopWebcam();
}, [showBubble, bubbleMode]);
// Missing: startWebcam, stopWebcam
```

`startWebcam` and `stopWebcam` are `useCallback` functions but not included in the dependency array. This violates the exhaustive-deps rule and can cause stale closures. Same issue exists with the `eslint-plugin-react-hooks` configured in the project but likely suppressed.

### BUG-2: Memory leak — Blob URL never revoked

**File:** `src/App.jsx:312`

```js
mr.onstop = () => {
  setDlUrl(URL.createObjectURL(new Blob(chunksRef.current, {type:"video/webm"})));
  // ...
};
```

`URL.createObjectURL()` creates a Blob URL that is never revoked with `URL.revokeObjectURL()`. Each recording session leaks a video Blob in memory. The close button (`setDlUrl(null)`) clears the state but does not revoke the URL.

### BUG-3: `requestAnimationFrame` loop continues even when not recording

**File:** `src/App.jsx:237`

```js
if (!sourceCanvas || !area) {
  animRef.current = requestAnimationFrame(compositeFrame);
  return;
}
```

If the Excalidraw canvas is not found (e.g. during initial render), the animation frame loop still continues indefinitely. Combined with `compositeFrame` being called from `startRec`, this can cause unnecessary CPU usage. There is no guard check like `if (!isRec) return;` at the beginning.

### BUG-4: Timer leak on pause/resume cycle

**File:** `src/App.jsx:321`

```js
if (paused) {
  mediaRecRef.current.resume();
  timerRef.current = setInterval(() => setRecTime(t => t+1), 1000);
  // Previous interval was cleared, but if pauseRec is called rapidly...
}
```

If `pauseRec` is called multiple times in quick succession, `setInterval` can be started without clearing the previous one first. The `clearInterval` only happens in the `else` branch, creating a potential for interval stacking.

### BUG-5: `drawBubbleToRec` is not wrapped in `useCallback`

**File:** `src/App.jsx:204`

`drawBubbleToRec` is a regular function defined inside the component body. It captures `bubbleMode`, `avatarImgRef`, and `videoRef` via closure. Since `compositeFrame` (a `useCallback`) calls it, and `drawBubbleToRec` is recreated every render, there's a stale closure risk — `compositeFrame` may use an old version of `drawBubbleToRec`.

---

## 3. Architecture Issues

### ARCH-1: God Component anti-pattern

The entire application logic (526 lines) lives in a single `App.jsx`. This includes:
- 15 `useState` hooks
- 12 `useRef` hooks
- 6 `useEffect` hooks
- Webcam management, recording logic, drag-and-drop, canvas compositing, settings UI

**Recommendation:** Extract into separate concerns:
- `useRecorder.ts` — recording state machine
- `useWebcam.ts` — camera/image management
- `useDragBubble.ts` — drag logic
- `SettingsPanel.jsx` — settings UI component
- `RecordingControls.jsx` — recording controls

### ARCH-2: No state persistence

All settings (aspect ratio, wallpaper, camera size, cursor color, etc.) are lost on page refresh. For a tool used during presentations, this is a significant UX issue.

### ARCH-3: No error boundary

The app has no React Error Boundary. If Excalidraw or the recording canvas throws an error, the entire app crashes with a white screen.

---

## 4. Electron Security

### SEC-1: Electron config is good

**File:** `electron-main.js:15-17`

```js
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
},
```

`nodeIntegration: false` and `contextIsolation: true` are the correct secure defaults. The renderer process cannot access Node.js APIs.

### SEC-2: Permission handler is reasonable

**File:** `electron-main.js:32-41`

Only `media`, `mediaKeySystem`, and `display-capture` permissions are allowed. Other permissions are correctly denied. This is appropriate for the app's functionality.

### SEC-3: Missing `webSecurity` consideration

The Electron config does not explicitly set `webSecurity: true` (it's the default). Good. However, there's no Content Security Policy (CSP) header configured, which could be improved for production.

---

## 5. Performance Issues

### PERF-1: Canvas resize every frame

**File:** `src/App.jsx:245`

```js
rc.width = recW; rc.height = recH;
```

Setting `canvas.width` or `canvas.height` clears the canvas and resets its state every frame. This is redundant if dimensions haven't changed and forces a full re-initialization of the 2D context state.

### PERF-2: `WALLPAPERS.find()` in every animation frame

**File:** `src/App.jsx:248`

```js
const wp = WALLPAPERS.find(w => w.id === bgWallpaper);
```

This linear search runs ~60 times per second during recording. Should be pre-computed or cached.

### PERF-3: DOM query in animation loop

**File:** `src/App.jsx:236`

```js
const sourceCanvas = area?.querySelector(".excalidraw canvas");
```

`querySelector` is called every frame (~60fps). The Excalidraw canvas element should be cached via a ref.

### PERF-4: `computeRecFrame` + `getBoundingClientRect` every frame

**File:** `src/App.jsx:259`

```js
const areaRect = area.getBoundingClientRect();
const canvasRect = sourceCanvas.getBoundingClientRect();
```

`getBoundingClientRect()` triggers layout recalculation. Calling this 60 times per second can cause layout thrashing. Should be cached and updated only on resize.

---

## 6. Code Quality Issues

### CQ-1: Extremely compressed code style

Throughout the codebase, code is compressed to the point of poor readability:

```js
if (webcamStreamRef.current) return;
const stream = await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
webcamStreamRef.current = stream;
if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
```

Multi-statement lines with semicolons, missing spaces, and inline conditions make debugging difficult.

### CQ-2: Silent error swallowing

**File:** `src/App.jsx:303`

```js
try { audio = await navigator.mediaDevices.getUserMedia({audio:true}); } catch{}
```

Audio permission failure is silently swallowed. The user has no idea if their audio is being recorded or not. At minimum, this should update UI state to indicate "recording without audio".

### CQ-3: Magic numbers

Numerous magic numbers without explanation:
- `M = 8` (line 197) — what is this margin?
- `camSize: 180`, `canvasPadding: 80` — why these defaults?
- `upscale: Math.min(2, 1920/...)` — the `1920` presumably targets 1080p but isn't documented
- `100` in `mr.start(100)` — timeslice meaning unclear

### CQ-4: Dead CSS

**File:** `src/App.css:51-52`

```css
.webcam-container { ... }
.webcam-container video { ... }
```

The `.webcam-container` class is never used in `App.jsx`. Similarly, `.avatar-theme-section`, `.avatar-themes`, `.avatar-theme-btn`, and `.tracker-badge` are defined in CSS but unused in the JSX — likely leftovers from a previous version.

---

## 7. Dependency Concerns

| Package | Version | Note |
|---------|---------|------|
| react | ^19.2.0 | Latest, OK |
| @excalidraw/excalidraw | ^0.18.0 | OK |
| electron | ^40.2.1 | OK |
| vite | ^7.2.4 | OK |

- No lock file pinning issues found
- `package-lock.json` is included (good)
- No known vulnerable packages at time of review

**Missing:**
- No test framework configured (no Jest, Vitest, or Playwright)
- No TypeScript despite `@types/react` being installed (JSX, not TSX)

---

## 8. Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| Bugs | 5 | 2 High, 3 Medium |
| Architecture | 3 | Medium |
| Security | 0 critical | Low (good Electron defaults) |
| Performance | 4 | Medium-High (all in recording loop) |
| Code Quality | 4 | Medium |
| Dependencies | Minor inconsistencies | Low |

### Top Priority Fixes

1. **Revoke Blob URLs** to prevent memory leaks (BUG-2)
2. **Cache DOM queries and layout calculations** outside the animation loop (PERF-3, PERF-4)
3. **Fix useEffect dependencies** to prevent stale closure bugs (BUG-1)
4. **Add recording-active guard** to `compositeFrame` to prevent runaway animation frames (BUG-3)
5. **Show audio status** to user instead of silently failing (CQ-2)

### Overall Assessment

The application is **functionally complete** and implements a sophisticated feature set (canvas compositing, webcam overlay, multi-format recording). The Electron security configuration follows best practices. However, the **single-file architecture** and **animation loop performance issues** should be addressed before production use. The code quality would benefit significantly from decomposition into smaller modules and adding basic test coverage.
