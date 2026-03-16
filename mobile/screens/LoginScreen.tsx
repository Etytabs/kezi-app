import React, { useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeziLogo } from "@/components/KeziLogo";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Spacing, BorderRadius, KeziColors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import { getFriendlyError } from "@/utils/errorMessages";
import { SupportedLanguage } from "@/i18n";

WebBrowser.maybeCompleteAuthSession();

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

const GOOGLE_CLIENT_ID =
  Constants.expoConfig?.extra?.googleClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: "EN",
  fr: "FR",
  rw: "RW",
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, register } = useAuth();
  const { language, languages, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleLanguageChange = async (code: SupportedLanguage) => {
    await setLanguage(code);
    setShowLanguageMenu(false);
  };

  /* =========================
     EMAIL LOGIN
  ========================= */

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {

      const result = await login(email, password);

      console.log("LOGIN RESULT:", result);

      if (!result.success) {
        const friendly = getFriendlyError(result.error);
        Alert.alert(friendly.title, friendly.message);
      }

      // si success === true
      // AuthContext connectera automatiquement l'utilisateur

    } catch (error) {

      console.log("LOGIN ERROR:", error);

      Alert.alert(
        "Something Went Wrong",
        "An unexpected error occurred. Please try again."
      );

    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     REGISTER
  ========================= */

  const handleRegister = async () => {

    if (!email.trim() || !name.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {

      const result = await register(email, name, password);

      console.log("REGISTER RESULT:", result);

      if (!result.success) {

        const friendly = getFriendlyError(result.error);

        Alert.alert(friendly.title, friendly.message);

      } else if (result.requiresVerification) {

        navigation.navigate("Verification", {
          email,
          verificationCode: result.verificationCode,
          expiresAt: result.verificationExpiresAt,
        });

      }

    } catch (error) {

      console.log("REGISTER ERROR:", error);

      Alert.alert(
        "Something Went Wrong",
        "An unexpected error occurred. Please try again."
      );

    } finally {
      setIsLoading(false);
    }

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
            {t("auth.welcome")}
          </ThemedText>

          <ThemedText type="body" style={styles.subtitle}>
            {showEmailForm
              ? t("auth.enterDetails")
              : t("auth.signInSubtitle")}
          </ThemedText>
        </View>

        {/* EMAIL FORM */}

        <Animated.View entering={FadeIn.duration(300)} style={styles.form}>

          {isRegistering && (
            <View style={styles.inputGroup}>
              <ThemedText type="small">Your Name</ThemedText>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <ThemedText type="small">Email</ThemedText>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small">Password</ThemedText>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
          </View>

          <Button
            onPress={isRegistering ? handleRegister : handleEmailLogin}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading
              ? "Loading..."
              : isRegistering
              ? "Create Account"
              : "Sign In"}
          </Button>

          <Pressable
            style={styles.switchMode}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <ThemedText type="small">
              {isRegistering
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </ThemedText>
          </Pressable>

        </Animated.View>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },

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
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },

  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoContainer: {
    marginBottom: 16,
  },

  title: {
    marginBottom: 4,
  },

  subtitle: {
    opacity: 0.6,
  },

  form: {
    gap: 16,
  },

  inputGroup: {
    gap: 6,
  },

  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f2f2f2",
  },

  button: {
    marginTop: 10,
  },

  switchMode: {
    alignItems: "center",
    marginTop: 12,
  },
});