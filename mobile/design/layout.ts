import { Platform } from "react-native";

export const CycleWheelSpec = {
  size: 180,
  viewBox: 180,
  strokeWidth: 8,
  radius: 82,
  circumference: 2 * Math.PI * 82,
  knobRadius: 8.5,
  knobStrokeWidth: 3,
  ovulationMarkerRadius: 4,
  ovulationMarkerStroke: 2,
  gradientStart: "#F472B6",
  gradientEnd: "#A855F7",
};

export const GlassMaterial = {
  light: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    blurAmount: 24,
  },
  dark: {
    backgroundColor: "rgba(46, 32, 53, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    blurAmount: 24,
  },
};

export const DeepLavender = {
  base: "#1A1025",
  surface: "#2E2035",
  deep: "#3D2B4C",
  elevated: "#4D3A5C",
  innerGlow: "rgba(255, 255, 255, 0.1)",
  transitions: {
    duration: 500,
    timing: "ease-in-out",
  },
  glass: {
    blur: 24,
    opacity: 0.6,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
};

export const PhaseGradients = {
  menstrual: {
    colors: ["#EC4899", "#F43F5E"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  follicular: {
    colors: ["#2DD4BF", "#10B981"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  ovulation: {
    colors: ["#A855F7", "#6366F1"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  luteal: {
    colors: ["#94A3B8", "#475569"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  fertile: {
    colors: ["#2DD4BF", "#10B981"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Inter",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Breakpoints = {
  small: 360,
  tablet: 768,
  desktop: 1024,
};
