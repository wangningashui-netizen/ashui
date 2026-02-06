export interface RecordingSettings {
  aspectRatio: AspectRatio;
  customWidth: number;
  customHeight: number;
  background: string; // CSS gradient or color
  backgroundId: string;
  cornerRadius: number;
  showCamera: boolean;
  cameraSize: number;
  canvasPadding: number;
  showCursorEffect: boolean;
  cursorColor: string;
}

export type AspectRatio = "16:9" | "4:3" | "3:4" | "9:16" | "1:1" | "custom";

export const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio;
  label: string;
  sub: string;
}[] = [
  { value: "16:9", label: "16:9", sub: "YouTube" },
  { value: "4:3", label: "4:3", sub: "Classic" },
  { value: "3:4", label: "3:4", sub: "RedNote" },
  { value: "9:16", label: "9:16", sub: "TikTok" },
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "custom", label: "Custom", sub: "Your size" },
];

export type BgCategory = "All" | "Vibrant" | "Pastel" | "Dark" | "Nature";

export const BG_CATEGORIES: BgCategory[] = [
  "All",
  "Vibrant",
  "Pastel",
  "Dark",
  "Nature",
];

export interface WallpaperItem {
  id: string;
  gradient: string;
  category: BgCategory;
}

export const WALLPAPERS: WallpaperItem[] = [
  // Vibrant
  {
    id: "v1",
    gradient: "linear-gradient(135deg, #f8b4d9 0%, #f0abfc 50%, #c4b5fd 100%)",
    category: "Vibrant",
  },
  {
    id: "v2",
    gradient: "linear-gradient(135deg, #fde68a 0%, #a3e635 50%, #34d399 100%)",
    category: "Vibrant",
  },
  {
    id: "v3",
    gradient: "linear-gradient(135deg, #67e8f9 0%, #6ee7b7 50%, #a78bfa 100%)",
    category: "Vibrant",
  },
  {
    id: "v4",
    gradient: "linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #818cf8 100%)",
    category: "Vibrant",
  },
  // Pastel
  {
    id: "p1",
    gradient: "linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%)",
    category: "Pastel",
  },
  {
    id: "p2",
    gradient: "linear-gradient(135deg, #fef3c7 0%, #d1fae5 100%)",
    category: "Pastel",
  },
  {
    id: "p3",
    gradient: "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)",
    category: "Pastel",
  },
  {
    id: "p4",
    gradient: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fae8ff 100%)",
    category: "Pastel",
  },
  // Dark
  {
    id: "d1",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
    category: "Dark",
  },
  {
    id: "d2",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    category: "Dark",
  },
  {
    id: "d3",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    category: "Dark",
  },
  {
    id: "d4",
    gradient: "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
    category: "Dark",
  },
  // Nature
  {
    id: "n1",
    gradient: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    category: "Nature",
  },
  {
    id: "n2",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    category: "Nature",
  },
  {
    id: "n3",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    category: "Nature",
  },
  {
    id: "n4",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    category: "Nature",
  },
];

export const CURSOR_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const DEFAULT_SETTINGS: RecordingSettings = {
  aspectRatio: "16:9",
  customWidth: 1920,
  customHeight: 1080,
  background: WALLPAPERS[0].gradient,
  backgroundId: WALLPAPERS[0].id,
  cornerRadius: 16,
  showCamera: true,
  cameraSize: 180,
  canvasPadding: 80,
  showCursorEffect: true,
  cursorColor: "#ef4444",
};

export function getResolution(
  settings: RecordingSettings
): { width: number; height: number } {
  switch (settings.aspectRatio) {
    case "16:9":
      return { width: 1920, height: 1080 };
    case "4:3":
      return { width: 1440, height: 1080 };
    case "3:4":
      return { width: 1080, height: 1440 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "custom":
      return { width: settings.customWidth, height: settings.customHeight };
  }
}
