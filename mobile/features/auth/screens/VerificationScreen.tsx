import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeziLogo } from "@/components/KeziLogo";
import { useTheme } from "@/features/settings/hooks/useTheme";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Spacing } from "@/design/spacing";
import { BorderRadius } from "@/design/radius";
import { KeziColors } from "@/design/colors";
import { AuthStackParamList } from "@/features/auth/navigation/AuthNavigator";
import { authApi } from "@/services/api";
import { getFriendlyError } from "@/utils/errorMessages";

type VerificationParams = {
  email: string;
  verificationCode?: string;
  expiresAt?: string;
};

type VerificationScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Verification">;
  route: { params: VerificationParams };
};

export default function VerificationScreen({ navigation, route }: VerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { refreshUser } = useAuth();

  const { email, verificationCode: devCode, expiresAt } = route.params;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [devVerificationCode, setDevVerificationCode] = useState(devCode);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
        setCountdown(remaining);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "");
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await authApi.verify(email, fullCode);
      
      if (error) {
        const friendly = getFriendlyError(error);
        Alert.alert(friendly.title, friendly.message);
        return;
      }

      if (data?.verified) {
        await refreshUser();
        Alert.alert("Success", "Your email has been verified!", [
          { text: "Continue", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      const friendly = getFriendlyError('network error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const { data, error } = await authApi.resendCode(email);
      
      if (error) {
        const friendly = getFriendlyError(error);
        Alert.alert(friendly.title, friendly.message);
        return;
      }

      if (data) {
        if (data.verificationCode) {
          setDevVerificationCode(data.verificationCode);
        }
        Alert.alert("Code Sent", "A new verification code has been sent.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const friendly = getFriendlyError('network error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsResending(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={styles.backdrop} onPress={() => navigation.goBack()} />

      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? KeziColors.night.base : "#FFFFFF",
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.handle} />

        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={theme.textMuted} />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <KeziLogo size={64} />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Verify Your Email
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <ThemedText type="body" style={{ fontWeight: "600" }}>{email}</ThemedText>
          </ThemedText>
        </View>

        {devVerificationCode ? (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={[
              styles.devBanner,
              { backgroundColor: KeziColors.phases.ovulation.secondary }
            ]}
          >
            <Feather name="info" size={16} color={KeziColors.phases.ovulation.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="small" style={{ color: KeziColors.phases.ovulation.primary, fontWeight: "600" }}>
                Development Mode
              </ThemedText>
              <ThemedText type="small" style={{ color: KeziColors.phases.ovulation.primary }}>
                Your code: <ThemedText type="body" style={{ fontWeight: "700", color: KeziColors.phases.ovulation.primary }}>{devVerificationCode}</ThemedText>
              </ThemedText>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: isDark
                      ? KeziColors.night.deep
                      : KeziColors.gray[50],
                    color: theme.text,
                    borderColor: digit
                      ? KeziColors.brand.pink500
                      : isDark
                      ? KeziColors.night.surface
                      : KeziColors.gray[200],
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {countdown > 0 ? (
            <ThemedText type="small" style={styles.countdown}>
              Code expires in {formatCountdown(countdown)}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={[styles.countdown, { color: KeziColors.brand.pink700 }]}>
              Code expired
            </ThemedText>
          )}

          <Button
            onPress={handleVerify}
            disabled={isLoading || code.join("").length !== 6}
            style={styles.button}
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>

          <Pressable
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={KeziColors.brand.pink500} />
            ) : (
              <ThemedText type="body" style={styles.resendText}>
                Didn\'t receive a code?{" "}
                <ThemedText type="body" style={styles.resendLink}>
                  Resend
                </ThemedText>
              </ThemedText>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: KeziColors.gray[300],
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.xl,
    padding: Spacing.sm,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: KeziColors.brand.pink50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: "center",
  },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  countdown: {
    textAlign: "center",
    opacity: 0.6,
  },
  button: {
    marginTop: Spacing.md,
  },
  resendContainer: {
    alignItems: "center",
    padding: Spacing.md,
  },
  resendText: {
    opacity: 0.6,
  },
  resendLink: {
    color: KeziColors.brand.pink500,
    fontWeight: "600",
  },
});
