import { CyclePhase } from "@/constants/theme";
import { CycleConfig } from "@/services/storage";

export interface CycleInfo {
  currentDay: number;
  phase: CyclePhase;
  daysUntilPeriod: number;
  daysUntilOvulation: number;
  fertileWindow: boolean;
  progress: number;
  hasData: boolean;
}

export function calculateCycleInfo(config: CycleConfig | null): CycleInfo {
  if (!config || !config.lastPeriodDate) {
    return {
      currentDay: 0,
      phase: "follicular",
      daysUntilPeriod: 0,
      daysUntilOvulation: 0,
      fertileWindow: false,
      progress: 0,
      hasData: false,
    };
  }

  const cycleConfig = config;
  const lastPeriod = new Date(cycleConfig.lastPeriodDate);
  const today = new Date();
  
  const daysSinceLastPeriod = Math.floor(
    (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const currentDay = (daysSinceLastPeriod % cycleConfig.cycleLength) + 1;
  
  const ovulationDay = Math.round(cycleConfig.cycleLength / 2);
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;
  
  let phase: CyclePhase;
  if (currentDay <= cycleConfig.periodLength) {
    phase = "menstrual";
  } else if (currentDay <= ovulationDay - 1) {
    phase = "follicular";
  } else if (currentDay <= ovulationDay + 1) {
    phase = "ovulation";
  } else {
    phase = "luteal";
  }
  
  const daysUntilPeriod = cycleConfig.cycleLength - currentDay + 1;
  const daysUntilOvulation = currentDay <= ovulationDay 
    ? ovulationDay - currentDay 
    : cycleConfig.cycleLength - currentDay + ovulationDay;
  
  const fertileWindow = currentDay >= fertileStart && currentDay <= fertileEnd;
  
  const progress = currentDay / cycleConfig.cycleLength;
  
  return {
    currentDay,
    phase,
    daysUntilPeriod,
    daysUntilOvulation,
    fertileWindow,
    progress,
    hasData: true,
  };
}

export function getPhaseDescription(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Rest and recover. Your body is renewing itself.";
    case "follicular":
      return "Energy is rising. Great time for new projects.";
    case "ovulation":
      return "Peak energy and fertility. You're at your best!";
    case "luteal":
      return "Wind down and prepare. Self-care is important now.";
  }
}

export function getPhaseName(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Menstrual Phase";
    case "follicular":
      return "Follicular Phase";
    case "ovulation":
      return "Ovulation";
    case "luteal":
      return "Luteal Phase";
  }
}

export function getPhaseIcon(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "droplet";
    case "follicular":
      return "heart";
    case "ovulation":
      return "zap";
    case "luteal":
      return "moon";
  }
}

export function generateCycleDays(config: CycleConfig | null): { day: number; phase: CyclePhase }[] {
  if (!config || !config.lastPeriodDate) {
    return [];
  }
  
  const ovulationDay = Math.round(config.cycleLength / 2);
  const days: { day: number; phase: CyclePhase }[] = [];
  
  for (let i = 1; i <= config.cycleLength; i++) {
    let phase: CyclePhase;
    if (i <= config.periodLength) {
      phase = "menstrual";
    } else if (i <= ovulationDay - 1) {
      phase = "follicular";
    } else if (i <= ovulationDay + 1) {
      phase = "ovulation";
    } else {
      phase = "luteal";
    }
    days.push({ day: i, phase });
  }
  
  return days;
}

export function getPhaseForDay(day: number, cycleLength: number, periodLength: number = 5): CyclePhase {
  const ovulationDay = Math.round(cycleLength / 2);
  
  if (day <= periodLength) {
    return "menstrual";
  } else if (day <= ovulationDay - 1) {
    return "follicular";
  } else if (day <= ovulationDay + 1) {
    return "ovulation";
  } else {
    return "luteal";
  }
}
