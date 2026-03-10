import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { storage } from "@/services/storage";

interface DiscreetModeContextType {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
  enableDiscreetMode: () => void;
  disableDiscreetMode: () => void;
}

const DiscreetModeContext = createContext<DiscreetModeContextType | undefined>(undefined);

interface DiscreetModeProviderProps {
  children: ReactNode;
}

export function DiscreetModeProvider({ children }: DiscreetModeProviderProps) {
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);

  useEffect(() => {
    loadDiscreetModeSetting();
  }, []);

  const loadDiscreetModeSetting = async () => {
    try {
      const enabled = await storage.isDiscreetModeEnabled();
      setIsDiscreetMode(enabled);
    } catch (error) {
      console.error("Error loading discreet mode setting:", error);
    }
  };

  const toggleDiscreetMode = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newValue = !isDiscreetMode;
    setIsDiscreetMode(newValue);
    await storage.setDiscreetModeEnabled(newValue);
  }, [isDiscreetMode]);

  const enableDiscreetMode = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsDiscreetMode(true);
    await storage.setDiscreetModeEnabled(true);
  }, []);

  const disableDiscreetMode = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsDiscreetMode(false);
    await storage.setDiscreetModeEnabled(false);
  }, []);

  return (
    <DiscreetModeContext.Provider
      value={{
        isDiscreetMode,
        toggleDiscreetMode,
        enableDiscreetMode,
        disableDiscreetMode,
      }}
    >
      {children}
    </DiscreetModeContext.Provider>
  );
}

export function useDiscreetMode(): DiscreetModeContextType {
  const context = useContext(DiscreetModeContext);
  if (!context) {
    throw new Error("useDiscreetMode must be used within a DiscreetModeProvider");
  }
  return context;
}
