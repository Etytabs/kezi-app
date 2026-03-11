import { Platform } from "react-native";

export const KeziColors = {
  brand: {
    pink500: "#EC4899",
    pink400: "#F472B6",
    pink300: "#F9A8D4",
    pink200: "#FBCFE8",
    pink100: "#FCE7F3",
    pink50: "#FDF2F8",
    pink700: "#BE185D",
    pink900: "#831843",
    purple600: "#9333EA",
    purple500: "#A855F7",
    purple400: "#C084FC",
    purple100: "#FAF5FF",
    purple50: "#FAF5FF",
    teal700: "#0F766E",
    teal600: "#0D9488",
    teal400: "#2DD4BF",
    teal200: "#99F6E4",
    teal50: "#F0FDFA",
    emerald500: "#10B981",
    emerald400: "#34D399",
    emerald50: "#ECFDF5",
    indigo500: "#6366F1",
    indigo50: "#EEF2FF",
    rose500: "#F43F5E",
    rose50: "#FFF1F2",
    slate400: "#94A3B8",
    slate600: "#475569",
    yellow300: "#FDE047",
    yellow400: "#FACC15",
    amber100: "#FEF3C7",
    amber500: "#F59E0B",
    amber600: "#D97706",
  },
  maternal: {
    primary: "#0D9488",
    secondary: "#10B981",
    surface: "#F0FDFA",
    text: "#115E59",
    border: "#D1D5DB",
    teal600: "#0D9488",
    teal500: "#14B8A6",
    teal400: "#2DD4BF",
    teal100: "#CCFBF1",
    emerald500: "#10B981",
    emerald100: "#D1FAE5",
  },
  functional: {
    warning: "#F59E0B",
    warningDark: "#FBBF24",
    danger: "#EF4444",
    dangerDark: "#F87171",
    success: "#10B981",
    successDark: "#34D399",
  },
  night: {
    base: "#1A1025",
    surface: "#2E2035",
    deep: "#3D2B4C",
    text: "#E9D5FF",
    textSecondary: "#D1D5DB",
    textMuted: "#9CA3AF",
  },
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  phases: {
    menstrual: {
      primary: "#EC4899",
      secondary: "#F9A8D4",
    },
    follicular: {
      primary: "#0D9488",
      secondary: "#CCFBF1",
    },
    ovulation: {
      primary: "#9333EA",
      secondary: "#FAF5FF",
    },
    luteal: {
      primary: "#F472B6",
      secondary: "#FCE7F3",
    },
  },
};

export const Colors = {
  light: {
    text: "#1F2937",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: KeziColors.brand.purple600,
    link: KeziColors.brand.pink500,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: KeziColors.gray[50],
    backgroundSecondary: KeziColors.gray[100],
    backgroundTertiary: KeziColors.gray[200],
    glass: "rgba(255, 255, 255, 0.6)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    cardBackground: "rgba(255, 255, 255, 0.95)",
    inputBackground: KeziColors.gray[50],
    placeholder: "#687076",
  },
  dark: {
    text: KeziColors.night.text,
    textSecondary: KeziColors.night.textSecondary,
    textMuted: KeziColors.night.textMuted,
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: KeziColors.brand.purple500,
    link: KeziColors.brand.pink400,
    backgroundRoot: KeziColors.night.base,
    backgroundDefault: KeziColors.night.surface,
    backgroundSecondary: KeziColors.night.deep,
    backgroundTertiary: "#4D3A5C",
    glass: "rgba(46, 32, 53, 0.6)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    cardBackground: "rgba(46, 32, 53, 0.95)",
    inputBackground: KeziColors.night.deep,
    placeholder: "#9CA3AF",
  },
};

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export const PhaseColors = {
  menstrual: {
    light: {
      primary: KeziColors.brand.pink500,
      secondary: KeziColors.brand.pink400,
      background: KeziColors.brand.pink50,
      backgroundSecondary: KeziColors.brand.rose50,
    },
    dark: {
      primary: KeziColors.brand.pink400,
      secondary: KeziColors.brand.pink300,
      background: KeziColors.brand.pink900,
      backgroundSecondary: "#2D1F35",
    },
  },
  follicular: {
    light: {
      primary: KeziColors.brand.teal600,
      secondary: KeziColors.brand.teal400,
      background: KeziColors.brand.teal50,
      backgroundSecondary: KeziColors.brand.emerald50,
    },
    dark: {
      primary: KeziColors.brand.teal400,
      secondary: "#5EEAD4",
      background: "#134E4A",
      backgroundSecondary: "#1A3A38",
    },
  },
  ovulation: {
    light: {
      primary: KeziColors.brand.purple600,
      secondary: KeziColors.brand.purple500,
      background: KeziColors.brand.purple50,
      backgroundSecondary: KeziColors.brand.indigo50,
    },
    dark: {
      primary: KeziColors.brand.purple500,
      secondary: KeziColors.brand.purple400,
      background: "#3B1D5F",
      backgroundSecondary: "#2E1B4D",
    },
  },
  luteal: {
    light: {
      primary: KeziColors.brand.pink400,
      secondary: KeziColors.brand.purple400,
      background: KeziColors.brand.pink50,
      backgroundSecondary: KeziColors.brand.purple50,
    },
    dark: {
      primary: KeziColors.brand.pink300,
      secondary: KeziColors.brand.purple400,
      background: KeziColors.night.surface,
      backgroundSecondary: KeziColors.night.deep,
    },
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  xxxl: 64,
  inputHeight: 52,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  logotype: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.6,
  },
  hero: {
    fontSize: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.75,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  chip: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.25,
  },
  displayNumber: {
    fontSize: 48,
    fontWeight: "700" as const,
  },
  link: {
    fontSize: 14,
    fontWeight: "500" as const,
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

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
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

export const Animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 0.3,
  },
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
    theme: 500,
  },
  easing: {
    smooth: [0.4, 0, 0.2, 1],
    springy: [0.68, -0.55, 0.265, 1.55],
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
