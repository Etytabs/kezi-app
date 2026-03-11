import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { storage, DependentProfile, CycleConfig, User } from "@/services/storage";
import { useAuth } from "@/context/AuthContext";

export interface Profile {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  cycleConfig: CycleConfig | null;
  isPrimary: boolean;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  switchProfile: (profileId: string) => Promise<void>;
  addDependentProfile: (name: string, relation: string) => Promise<Profile>;
  updateDependentProfile: (id: string, updates: Partial<DependentProfile>) => Promise<void>;
  updateDependentCycleConfig: (id: string, config: CycleConfig) => Promise<void>;
  removeDependentProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, cycleConfig, updateCycleConfig } = useAuth();
  const [dependentProfiles, setDependentProfiles] = useState<DependentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      const deps = await storage.getDependentProfiles();
      const activeId = await storage.getActiveProfileId();
      setDependentProfiles(deps);
      setActiveProfileId(activeId);
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const primaryProfile: Profile | null = user
    ? {
        id: "primary",
        name: user.name,
        relation: "Primary Account",
        avatar: user.avatar,
        cycleConfig: cycleConfig,
        isPrimary: true,
      }
    : null;

  const allProfiles: Profile[] = [
    ...(primaryProfile ? [primaryProfile] : []),
    ...dependentProfiles.map((dep) => ({
      id: dep.id,
      name: dep.name,
      relation: dep.relation,
      avatar: dep.avatar,
      cycleConfig: dep.cycleConfig || null,
      isPrimary: false,
    })),
  ];

  const activeProfile: Profile | null =
    activeProfileId === null || activeProfileId === "primary"
      ? primaryProfile
      : allProfiles.find((p) => p.id === activeProfileId) || primaryProfile;

  const switchProfile = async (profileId: string) => {
    const newId = profileId === "primary" ? null : profileId;
    await storage.setActiveProfileId(newId);
    setActiveProfileId(newId);
  };

  const addDependentProfile = async (name: string, relation: string): Promise<Profile> => {
    const newProfile: DependentProfile = {
      id: `dep_${Date.now()}`,
      name,
      relation,
      createdAt: new Date().toISOString(),
    };
    await storage.addDependentProfile(newProfile);
    setDependentProfiles((prev) => [...prev, newProfile]);
    
    return {
      id: newProfile.id,
      name: newProfile.name,
      relation: newProfile.relation,
      cycleConfig: null,
      isPrimary: false,
    };
  };

  const updateDependentProfile = async (id: string, updates: Partial<DependentProfile>) => {
    await storage.updateDependentProfile(id, updates);
    setDependentProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const updateDependentCycleConfig = async (id: string, config: CycleConfig) => {
    if (id === "primary") {
      await updateCycleConfig(config);
    } else {
      await storage.updateDependentProfile(id, { cycleConfig: config });
      setDependentProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, cycleConfig: config } : p))
      );
    }
  };

  const removeDependentProfile = async (id: string) => {
    await storage.removeDependentProfile(id);
    setDependentProfiles((prev) => prev.filter((p) => p.id !== id));
    
    if (activeProfileId === id) {
      await switchProfile("primary");
    }
  };

  const refreshProfiles = async () => {
    setIsLoading(true);
    await loadProfiles();
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles: allProfiles,
        activeProfile,
        isLoading,
        switchProfile,
        addDependentProfile,
        updateDependentProfile,
        updateDependentCycleConfig,
        removeDependentProfile,
        refreshProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfiles must be used within a ProfileProvider");
  }
  return context;
}
