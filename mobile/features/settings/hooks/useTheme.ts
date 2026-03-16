import { Colors, PhaseColors, CyclePhase } from "@/design/colors";
import { useThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const { colorScheme, themePreference, setThemePreference } = useThemeContext();
  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme];

  const getPhaseColors = (phase: CyclePhase) => {
    return PhaseColors[phase][isDark ? "dark" : "light"];
  };

  return {
    theme,
    isDark,
    colorScheme,
    themePreference,
    setThemePreference,
    getPhaseColors,
  };
}
