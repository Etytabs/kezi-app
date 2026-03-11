import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, TextInput, Modal, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, Layout, FadeIn, SlideInUp } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfileContext";
import { CycleConfig, storage } from "@/services/storage";
import { navigateToCycleTab } from "@/services/navigation";
import { biometricAuth, BiometricType } from "@/services/biometricAuth";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { getFriendlyError } from "@/utils/errorMessages";

export default function ManageProfilesScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { profiles: contextProfiles, activeProfile, switchProfile, addDependentProfile, updateDependentCycleConfig, removeDependentProfile } = useProfiles();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileRelation, setNewProfileRelation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [lastPeriodDate, setLastPeriodDate] = useState(new Date());
  const [cycleLength, setCycleLength] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dependentProfiles = contextProfiles.filter(p => !p.isPrimary);
  const primaryProfile = contextProfiles.find(p => p.isPrimary);

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert("Missing Name", "Please enter a name for the profile.");
      return;
    }

    setIsLoading(true);
    try {
      const newProfile = await addDependentProfile(
        newProfileName.trim(),
        newProfileRelation.trim() || "Dependent"
      );

      setNewProfileName("");
      setNewProfileRelation("");
      setShowAddForm(false);
      
      setSelectedProfileId(newProfile.id);
      setShowOnboarding(true);
    } catch (error) {
      const friendly = getFriendlyError('server error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCycleConfig = async () => {
    if (!selectedProfileId) return;
    
    const config: CycleConfig = {
      lastPeriodDate: lastPeriodDate.toISOString(),
      cycleLength: parseInt(cycleLength) || 28,
      periodLength: parseInt(periodLength) || 5,
    };
    
    await updateDependentCycleConfig(selectedProfileId, config);
    await switchProfile(selectedProfileId);
    
    setShowOnboarding(false);
    setSelectedProfileId(null);
    
    navigateToCycleTab();
  };

  const handleSetActive = async (profileId: string | null) => {
    const profile = contextProfiles.find(p => p.id === profileId);
    
    if (profileId && profile) {
      const authSuccess = await biometricAuth.authenticateForProfileSwitch(profile.name);
      if (!authSuccess) {
        return;
      }
    }
    
    await switchProfile(profileId || "primary");
    
    if (profileId && profile && !profile.cycleConfig) {
      setSelectedProfileId(profileId);
      setShowOnboarding(true);
    } else {
      navigateToCycleTab();
    }
  };

  const handleEditCycleConfig = async (profile: { id: string; name: string; cycleConfig: CycleConfig | null }) => {
    const authSuccess = await biometricAuth.authenticateForSensitiveData(`${profile.name}'s cycle data`);
    if (!authSuccess) {
      return;
    }
    
    setSelectedProfileId(profile.id);
    if (profile.cycleConfig) {
      setLastPeriodDate(new Date(profile.cycleConfig.lastPeriodDate));
      setCycleLength(profile.cycleConfig.cycleLength.toString());
      setPeriodLength(profile.cycleConfig.periodLength.toString());
    }
    setShowOnboarding(true);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete ${profileName}'s profile? This will remove all their cycle data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeDependentProfile(profileId);
          },
        },
      ]
    );
  };

  const selectedProfile = contextProfiles.find(p => p.id === selectedProfileId);

  return (
    <ScreenKeyboardAwareScrollView>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={styles.infoCard}>
          <Feather
            name="users"
            size={24}
            color={KeziColors.brand.purple500}
          />
          <ThemedText type="body" style={styles.infoText}>
            Manage cycle tracking for yourself and your dependents. Switch between profiles to track different cycles.
          </ThemedText>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ThemedText type="sectionHeader" style={styles.sectionLabel}>
          YOUR PROFILE
        </ThemedText>
        <Pressable
          onPress={() => handleSetActive(null)}
          style={({ pressed }) => [
            styles.profileCard,
            {
              backgroundColor: isDark
                ? KeziColors.night.surface
                : "#FFFFFF",
              borderColor: activeProfile?.isPrimary
                ? KeziColors.brand.pink500
                : "transparent",
              borderWidth: 2,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDark
                  ? KeziColors.night.deep
                  : KeziColors.brand.pink100,
              },
            ]}
          >
            <ThemedText type="h4" style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || "Y"}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="body" style={styles.profileName}>
              {user?.name || "You"}
            </ThemedText>
            <ThemedText type="small" style={styles.profileRelation}>
              Primary Account
            </ThemedText>
          </View>
          {activeProfile?.isPrimary ? (
            <View style={styles.activeBadge}>
              <Feather name="check" size={14} color="#FFFFFF" />
              <ThemedText type="small" style={styles.activeBadgeText}>
                Active
              </ThemedText>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>

      {dependentProfiles.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <ThemedText type="sectionHeader" style={styles.sectionLabel}>
            DEPENDENTS
          </ThemedText>
          {dependentProfiles.map((profile, index) => (
            <Animated.View
              key={profile.id}
              entering={FadeInDown.delay(index * 75).duration(400)}
              layout={Layout.springify()}
            >
              <Pressable
                onPress={() => handleSetActive(profile.id)}
                style={({ pressed }) => [
                  styles.profileCard,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.surface
                      : "#FFFFFF",
                    borderColor: activeProfile?.id === profile.id
                      ? KeziColors.brand.pink500
                      : "transparent",
                    borderWidth: 2,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.brand.purple100,
                    },
                  ]}
                >
                  <ThemedText type="h4" style={styles.avatarText}>
                    {profile.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.profileInfo}>
                  <ThemedText type="body" style={styles.profileName}>
                    {profile.name}
                  </ThemedText>
                  <ThemedText type="small" style={styles.profileRelation}>
                    {profile.relation}
                  </ThemedText>
                  {profile.cycleConfig ? (
                    <ThemedText type="small" style={styles.cycleStatus}>
                      Cycle: {profile.cycleConfig.cycleLength} days
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" style={styles.noCycleStatus}>
                      No cycle data yet
                    </ThemedText>
                  )}
                </View>
                <View style={styles.profileActions}>
                  {activeProfile?.id === profile.id ? (
                    <View style={styles.activeBadge}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                      <ThemedText type="small" style={styles.activeBadgeText}>
                        Active
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => handleEditCycleConfig(profile)}
                        style={styles.iconButton}
                      >
                        <Feather
                          name="edit-2"
                          size={18}
                          color={KeziColors.brand.purple500}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteProfile(profile.id, profile.name)}
                        style={styles.iconButton}
                      >
                        <Feather
                          name="trash-2"
                          size={18}
                          color={KeziColors.functional.danger}
                        />
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        {showAddForm ? (
          <GlassCard style={styles.addForm}>
            <ThemedText type="h4" style={styles.formTitle}>
              Add New Profile
            </ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[50],
                    color: theme.text,
                  },
                ]}
                value={newProfileName}
                onChangeText={setNewProfileName}
                placeholder="Enter name"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Relationship (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[50],
                    color: theme.text,
                  },
                ]}
                value={newProfileRelation}
                onChangeText={setNewProfileRelation}
                placeholder="e.g., Daughter, Sister"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={styles.formButtons}>
              <Button
                variant="secondary"
                onPress={() => {
                  setShowAddForm(false);
                  setNewProfileName("");
                  setNewProfileRelation("");
                }}
                style={styles.formButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleAddProfile}
                disabled={isLoading}
                style={styles.formButton}
              >
                {isLoading ? "Adding..." : "Add Profile"}
              </Button>
            </View>
          </GlassCard>
        ) : (
          <Button
            variant="outline"
            onPress={() => setShowAddForm(true)}
            style={styles.addButton}
          >
            <View style={styles.addButtonContent}>
              <Feather name="plus" size={20} color={theme.link} />
              <ThemedText type="body" style={[styles.addButtonText, { color: theme.link }]}>
                Add Dependent Profile
              </ThemedText>
            </View>
          </Button>
        )}
      </Animated.View>

      <Modal
        visible={showOnboarding}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOnboarding(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={SlideInUp.springify().damping(15)}
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF" }
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3" style={styles.modalTitle}>
                Set Up Cycle Tracking
              </ThemedText>
              <ThemedText type="body" style={styles.modalSubtitle}>
                for {selectedProfile?.name || "this profile"}
              </ThemedText>
            </View>

            <View style={styles.onboardingForm}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>
                  Last Period Start Date
                </ThemedText>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[50],
                    },
                  ]}
                >
                  <Feather name="calendar" size={20} color={KeziColors.brand.pink500} />
                  <ThemedText style={styles.dateText}>
                    {lastPeriodDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </ThemedText>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={lastPeriodDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setLastPeriodDate(date);
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText type="small" style={styles.label}>
                    Cycle Length (days)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[50],
                        color: theme.text,
                      },
                    ]}
                    value={cycleLength}
                    onChangeText={setCycleLength}
                    placeholder="28"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText type="small" style={styles.label}>
                    Period Length (days)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark
                          ? KeziColors.night.deep
                          : KeziColors.gray[50],
                        color: theme.text,
                      },
                    ]}
                    value={periodLength}
                    onChangeText={setPeriodLength}
                    placeholder="5"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                variant="secondary"
                onPress={() => {
                  setShowOnboarding(false);
                  setSelectedProfileId(null);
                }}
                style={styles.modalButton}
              >
                Skip for Now
              </Button>
              <Button
                onPress={handleSaveCycleConfig}
                style={styles.modalButton}
              >
                Save & Continue
              </Button>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    opacity: 0.7,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: KeziColors.brand.pink500,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: "600",
  },
  profileRelation: {
    opacity: 0.6,
    marginTop: 2,
  },
  cycleStatus: {
    color: KeziColors.brand.teal600,
    marginTop: 2,
  },
  noCycleStatus: {
    color: KeziColors.gray[400],
    marginTop: 2,
    fontStyle: "italic",
  },
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: KeziColors.brand.pink500,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  addForm: {
    marginBottom: Spacing.xl,
  },
  formTitle: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  formButton: {
    flex: 1,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  addButtonText: {
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    opacity: 0.6,
  },
  onboardingForm: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
