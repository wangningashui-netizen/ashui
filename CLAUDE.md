# CLAUDE.md — ashui

> "Draw. Speak. Record." — A whiteboard video recording tool built with React, TypeScript, and Excalidraw.

## Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
npm run build        # Type-check (tsc -b) then Vite build
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run electron:dev # Run Electron app against dev server
npm run electron:build # Build desktop app (macOS/Windows/Linux)
```

## Project Overview

ashui is a cross-platform (web + Electron) whiteboard video recorder. Users draw on an Excalidraw canvas, optionally enable webcam/microphone, and record the session as a WebM video. Key features include multi-scene support, a teleprompter, laser pointer trails, and picture-in-picture preview.

**Tech stack:** React 19 + TypeScript (strict) + Vite 7 + Excalidraw + Electron 35

## Directory Structure

```
src/
├── components/          # React UI components with co-located CSS
│   ├── RecordingControls.tsx   # Start/stop/pause recording buttons
│   ├── SettingsPanel.tsx       # Settings modal (resolution, wallpaper, devices)
│   ├── WebcamBubble.tsx        # Draggable circular webcam preview
│   ├── Teleprompter.tsx        # Auto-scrolling script display
│   ├── SceneBar.tsx            # Scene navigation/management bar
│   └── CountdownOverlay.tsx    # 3-2-1 countdown before recording
├── hooks/               # Custom React hooks (one per file)
│   ├── useWebcam.ts     # Webcam/microphone stream acquisition
│   ├── useRecorder.ts   # MediaRecorder lifecycle and WebM export
│   ├── useCompositor.ts # Canvas composition (scene + webcam + cursor)
│   ├── useScenes.ts     # Multi-scene Excalidraw state management
│   ├── useTeleprompter.ts  # Teleprompter scroll/toggle control
│   └── useLaserPointer.ts  # Laser pointer trail rendering
├── types/
│   └── settings.ts      # Shared TypeScript types and constants
├── App.tsx              # Root component — wires hooks and components together
├── main.tsx             # React DOM entry point
├── App.css              # Global app styles
└── index.css            # CSS variables and reset
electron/
└── main.cjs             # Electron main process (window management)
public/
└── favicon.svg          # App icon
```

## Architecture

### Recording Pipeline

1. **Input Sources:** Excalidraw canvas, webcam video (optional), microphone audio (optional), mouse position
2. **Composition (`useCompositor`):** Renders inputs onto a hidden canvas at configured resolution (~30 FPS via requestAnimationFrame). Applies wallpaper gradient, draws Excalidraw content with padding/rounded corners, overlays webcam bubble, and renders cursor/laser effects.
3. **Recording (`useRecorder`):** Captures the composite canvas stream at 30 FPS, merges audio, and uses MediaRecorder (VP8/VP9) to produce WebM. Auto-downloads as `ashui-YYYY-MM-DDTHH-MM-SS.webm`.

### State Management

- Local `useState` + `useRef` — no global store (Redux, Zustand, etc.)
- Props are passed through the component tree from `App.tsx`
- Each custom hook encapsulates one domain concern

### Electron Integration

- `contextIsolation: true`, `nodeIntegration: false` (secure defaults)
- Frameless window on macOS with custom title bar
- Builds via electron-builder: DMG (macOS), NSIS (Windows), AppImage (Linux)

## Code Conventions

### TypeScript

- **Strict mode enabled** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2022, module resolution: `bundler`
- All components and hooks are fully typed

### React

- **Functional components only** — no class components
- **One custom hook per file** in `src/hooks/`
- **Co-located CSS** — each component has a matching `.css` file in `src/components/`
- **Inline SVG icons** — no icon library; SVGs are embedded directly in JSX

### Styling

- **CSS variables** defined in `src/index.css` — dark theme with warm accent (`--accent: #c8956c`)
- **Settings panel uses light theme** (`#faf8f5`) for contrast
- **Default border radius:** 10px
- **No CSS-in-JS** — plain CSS files with BEM-ish class naming

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + M` | Add new scene |
| `PageDown` / `Cmd + →` | Next scene |
| `PageUp` / `Cmd + ←` | Previous scene |
| `Ctrl/Cmd + T` | Toggle teleprompter |
| `Space` (in teleprompter) | Toggle auto-scroll |
| `L` | Activate laser pointer |

## Dependencies

Only **3 runtime dependencies** — keep it minimal:
- `@excalidraw/excalidraw` — whiteboard drawing canvas
- `react` / `react-dom` — UI framework

## Linting

ESLint 9 with flat config (`eslint.config.js`):
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` (hooks rules)
- `eslint-plugin-react-refresh` (Vite HMR validation)

Run: `npm run lint`

## Testing

No test framework is configured yet. When adding tests, Vitest is the recommended choice given the Vite build system.

## Guidelines for AI Assistants

1. **Read before editing** — always read a file before proposing changes.
2. **Keep dependencies minimal** — this project intentionally has very few runtime deps. Don't add libraries for things achievable with browser APIs.
3. **Follow the hooks pattern** — new stateful logic should go in a dedicated hook in `src/hooks/`. Keep components thin.
4. **Co-locate CSS** — new components get a `.css` file in `src/components/`.
5. **TypeScript strict** — all code must pass `tsc -b` with strict mode. No `any` types without justification.
6. **No class components** — functional components with hooks only.
7. **Verify changes** — run `npm run build` (type-check + build) and `npm run lint` after making changes.
8. **Electron security** — never enable `nodeIntegration` or disable `contextIsolation`.
9. **Keep it simple** — no over-engineering. Inline utilities are preferred over premature abstractions.
10. **Dark theme by default** — UI additions should respect the existing dark color scheme and CSS variables.
