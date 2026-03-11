import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { PhaseIcon } from "@/components/PhaseIcon";
import { useTheme } from "@/hooks/useTheme";
import {
  KeziColors,
  Spacing,
  BorderRadius,
  CyclePhase,
  Shadows,
} from "@/constants/theme";
import { getPhaseForDay } from "@/services/cycleService";

interface CycleCalendarProps {
  currentDay: number;
  totalDays: number;
  periodLength?: number;
  cycleStartDate: Date;
  selectedDay: number | null;
  onDaySelect: (day: number) => void;
  loggedDays?: number[];
}

interface DayCellProps {
  day: number;
  cycleDay: number | null;
  phase: CyclePhase | null;
  isToday: boolean;
  isSelected: boolean;
  hasLog: boolean;
  isDark: boolean;
  isOvulationDay: boolean;
  isFuture: boolean;
  onPress: () => void;
}

const CELL_SIZE = 40;
const PHASE_DOT_SIZE = 28;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DayCell({
  day,
  cycleDay,
  phase,
  isToday,
  isSelected,
  hasLog,
  isDark,
  isOvulationDay,
  isFuture,
  onPress,
}: DayCellProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.1 : 1, { damping: 15, stiffness: 300 });
  };

  const getPhaseColor = () => {
    if (!phase) return "transparent";
    switch (phase) {
      case "menstrual":
        return isDark ? KeziColors.brand.pink500 : KeziColors.brand.pink300;
      case "follicular":
        return isDark ? KeziColors.brand.teal700 : KeziColors.brand.teal200;
      case "ovulation":
        return isDark ? KeziColors.brand.purple500 : KeziColors.brand.purple400;
      case "luteal":
        return isDark ? KeziColors.brand.slate400 : KeziColors.gray[300];
      default:
        return "transparent";
    }
  };

  const getTextColor = () => {
    if (isSelected) {
      return isDark ? KeziColors.gray[900] : "#FFFFFF";
    }
    if (isToday) {
      return isDark ? KeziColors.brand.pink300 : KeziColors.brand.pink500;
    }
    if (isFuture && phase) {
      return isDark ? KeziColors.gray[400] : KeziColors.gray[500];
    }
    return isDark ? KeziColors.gray[300] : KeziColors.gray[700];
  };

  return (
    <AnimatedPressable
      style={[
        styles.dayCell,
        animatedStyle,
        isSelected && [
          styles.dayCellSelected,
          {
            backgroundColor: isDark ? "#FFFFFF" : KeziColors.gray[800],
          },
        ],
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {isToday && !isSelected ? (
        <View
          style={[
            styles.todayRing,
            { borderColor: KeziColors.brand.pink300 },
          ]}
        />
      ) : null}
      
      {!isSelected && phase ? (
        <View
          style={[
            styles.phaseIndicator,
            {
              backgroundColor: getPhaseColor(),
              opacity: isFuture ? 0.3 : 0.5,
            },
            isOvulationDay && styles.ovulationIndicator,
            isFuture && styles.futurePrediction,
          ]}
        />
      ) : null}

      <ThemedText
        style={[
          styles.dayText,
          { color: getTextColor() },
          isToday && !isSelected && styles.dayTextToday,
        ]}
      >
        {day}
      </ThemedText>

      {hasLog ? (
        <View
          style={[
            styles.logDot,
            {
              backgroundColor: isSelected
                ? isDark
                  ? KeziColors.brand.pink500
                  : KeziColors.brand.pink300
                : KeziColors.brand.pink500,
            },
          ]}
        />
      ) : null}
    </AnimatedPressable>
  );
}

export function CycleCalendar({
  currentDay,
  totalDays,
  periodLength = 5,
  cycleStartDate,
  selectedDay,
  onDaySelect,
  loggedDays = [],
}: CycleCalendarProps) {
  const { isDark } = useTheme();
  
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const { weeks } = useMemo(() => {
    const startOfMonth = new Date(viewYear, viewMonth, 1);
    const endOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    const weekRows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekRows.push(days.slice(i, i + 7));
    }
    
    return { calendarDays: days, weeks: weekRows };
  }, [viewMonth, viewYear]);

  const getCycleDayForCalendarDay = (calendarDay: number): number | null => {
    const cycleStart = new Date(cycleStartDate);
    const targetDate = new Date(viewYear, viewMonth, calendarDay);
    
    const diffTime = targetDate.getTime() - cycleStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    
    const cycleDay = (diffDays % totalDays) + 1;
    return cycleDay;
  };

  const isDateInFuture = (calendarDay: number): boolean => {
    const targetDate = new Date(viewYear, viewMonth, calendarDay);
    return targetDate > today;
  };

  const isOvulationDayInCurrentCycle = (
    calendarDay: number,
    year: number,
    month: number,
    startDate: Date,
    cycleLen: number
  ): boolean => {
    const cycleStart = new Date(startDate);
    const targetDate = new Date(year, month, calendarDay);
    const exactOvulationCycleDay = Math.round(cycleLen / 2);
    
    const diffTime = targetDate.getTime() - cycleStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return false;
    
    const cycleNumber = Math.floor(diffDays / cycleLen);
    const ovulationDate = new Date(cycleStart);
    ovulationDate.setDate(ovulationDate.getDate() + (cycleNumber * cycleLen) + (exactOvulationCycleDay - 1));
    
    return (
      ovulationDate.getFullYear() === year &&
      ovulationDate.getMonth() === month &&
      ovulationDate.getDate() === calendarDay
    );
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const todayDate = today.getDate();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(26, 16, 37, 0.6)"
            : "#FFFFFF",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.05)"
            : KeziColors.gray[100],
        },
      ]}
    >
      {isDark && Platform.OS !== "web" ? (
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      ) : null}
      
      <View style={styles.monthHeader}>
        <Pressable 
          onPress={goToPrevMonth} 
          style={({ pressed }) => [
            styles.navButton,
            { 
              backgroundColor: pressed 
                ? (isDark ? KeziColors.night.deep : KeziColors.gray[100])
                : "transparent" 
            }
          ]}
        >
          <Feather 
            name="chevron-left" 
            size={24} 
            color={isDark ? KeziColors.gray[300] : KeziColors.gray[700]} 
          />
        </Pressable>
        
        <ThemedText style={styles.monthTitle}>{monthName}</ThemedText>
        
        <Pressable 
          onPress={goToNextMonth} 
          style={({ pressed }) => [
            styles.navButton,
            { 
              backgroundColor: pressed 
                ? (isDark ? KeziColors.night.deep : KeziColors.gray[100])
                : "transparent" 
            }
          ]}
        >
          <Feather 
            name="chevron-right" 
            size={24} 
            color={isDark ? KeziColors.gray[300] : KeziColors.gray[700]} 
          />
        </Pressable>
      </View>
      
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <ThemedText
              style={[
                styles.weekdayText,
                { color: isDark ? KeziColors.gray[400] : KeziColors.gray[500] },
              ]}
            >
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.emptyCell} />;
            }

            const cycleDay = getCycleDayForCalendarDay(day);
            const phase = cycleDay ? getPhaseForDay(cycleDay, totalDays, periodLength) : null;
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = day === selectedDay && isCurrentMonth;
            const hasLog = loggedDays.includes(day);
            const isFuture = isDateInFuture(day);
            
            const exactOvulationCycleDay = Math.round(totalDays / 2);
            const isOvulationDay = cycleDay !== null && cycleDay === exactOvulationCycleDay && isOvulationDayInCurrentCycle(day, viewYear, viewMonth, cycleStartDate, totalDays);

            return (
              <DayCell
                key={dayIndex}
                day={day}
                cycleDay={cycleDay}
                isOvulationDay={isOvulationDay}
                phase={phase}
                isToday={isToday}
                isSelected={isSelected}
                hasLog={hasLog}
                isDark={isDark}
                isFuture={isFuture}
                onPress={() => onDaySelect(day)}
              />
            );
          })}
        </View>
      ))}
      
      <View style={styles.legend}>
        <LegendItem phase="menstrual" label="Period" isDark={isDark} />
        <LegendItem phase="follicular" label="Fertile" isDark={isDark} />
        <LegendItem phase="ovulation" label="Ovulation" isDark={isDark} />
        <LegendItem phase="luteal" label="Luteal" isDark={isDark} />
      </View>

      {selectedDay ? (
        <View style={[
          styles.selectedInfo,
          { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[50] }
        ]}>
          <ThemedText style={styles.selectedDate}>
            {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </ThemedText>
          {getCycleDayForCalendarDay(selectedDay) ? (
            <View style={[
              styles.phaseBadge,
              { backgroundColor: getPhaseColorForBadge(getPhaseForDay(getCycleDayForCalendarDay(selectedDay) || 1, totalDays, periodLength)) }
            ]}>
              <ThemedText style={styles.phaseBadgeText}>
                {getPhaseLabelForBadge(getPhaseForDay(getCycleDayForCalendarDay(selectedDay) || 1, totalDays, periodLength))}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

function getPhaseColorForBadge(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual": return KeziColors.brand.pink400;
    case "follicular": return KeziColors.brand.teal600;
    case "ovulation": return KeziColors.brand.purple500;
    case "luteal": return KeziColors.gray[500];
  }
}

function getPhaseLabelForBadge(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual": return "Period";
    case "follicular": return "Fertile Window";
    case "ovulation": return "Ovulation";
    case "luteal": return "Luteal Phase";
  }
}

function LegendItem({ phase, label, isDark }: { phase: CyclePhase; label: string; isDark: boolean }) {
  return (
    <View style={styles.legendItem}>
      <PhaseIcon phase={phase} size={16} />
      <ThemedText style={[styles.legendText, { color: isDark ? KeziColors.gray[300] : KeziColors.gray[600] }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    width: CELL_SIZE,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayCellSelected: {
    transform: [{ scale: 1.1 }],
    ...Shadows.lg,
  },
  todayRing: {
    position: "absolute",
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderRadius: (CELL_SIZE - 2) / 2,
    borderWidth: 1,
  },
  phaseIndicator: {
    position: "absolute",
    width: PHASE_DOT_SIZE,
    height: PHASE_DOT_SIZE,
    borderRadius: PHASE_DOT_SIZE / 2,
  },
  ovulationIndicator: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  futurePrediction: {
    borderStyle: "dashed",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    zIndex: 1,
  },
  dayTextToday: {
    fontWeight: "700",
  },
  logDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
  },
  selectedDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  phaseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
