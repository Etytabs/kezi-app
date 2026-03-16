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
import { useTheme } from "@/features/settings/hooks/useTheme";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLanguage } from "@/features/settings/context/LanguageContext";
import { Spacing } from "@/design/spacing";
import { BorderRadius } from "@/design/radius";
import { KeziColors } from "@/design/colors";
import { AuthStackParamList } from "@/features/auth/navigation/AuthNavigator";
import { getFriendlyError } from "@/utils/errorMessages";
import { SupportedLanguage } from "@/features/settings/i18n";

WebBrowser.maybeCompleteAuthSession();

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      if (GOOGLE_CLIENT_ID) {
        Alert.alert(
          "Google Sign-In",
          "Google Sign-In is configured but requires a development build. For Expo Go testing, please use email sign-in.",
          [{ text: "Use Email", onPress: () => setShowEmailForm(true) }]
        );
      } else {
        Alert.alert(
          "Google Sign-In",
          "Google Sign-In is ready for production. To enable:\n\n1. Create a Google Cloud project\n2. Set up OAuth 2.0 credentials\n3. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your environment\n\nFor beta testing, use email sign-in.",
          [{ text: "Use Email", onPress: () => setShowEmailForm(true) }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not initiate Google sign-in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Alert.alert(
      "Apple Sign-In",
      "Apple Sign-In is ready for production. To enable:\n\n1. Configure Apple Developer account\n2. Create Sign in with Apple capability\n3. Build a development build\n\nFor beta testing, use email sign-in.",
      [{ text: "Use Email", onPress: () => setShowEmailForm(true) }]
    );
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter your email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        const friendly = getFriendlyError(result.error);
        Alert.alert(friendly.title, friendly.message);
      }
    } catch (error) {
      const friendly = getFriendlyError('network error');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, name, password);
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
      const friendly = getFriendlyError('network error');
      Alert.alert(friendly.title, friendly.message);
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

        <View style={styles.languageToggleContainer}>
          <Pressable
            style={[
              styles.languageToggle,
              {
                backgroundColor: isDark ? KeziColors.night.surface : KeziColors.gray[100],
                borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
              },
            ]}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Feather name="globe" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.languageToggleText}>
              {LANGUAGE_FLAGS[language]}
            </ThemedText>
            <Feather 
              name={showLanguageMenu ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={theme.textMuted} 
            />
          </Pressable>

          {showLanguageMenu && (
            <Animated.View 
              entering={FadeIn.duration(150)}
              style={[
                styles.languageMenu,
                {
                  backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
                  borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
                },
              ]}
            >
              {languages.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageMenuItem,
                    language === lang.code && {
                      backgroundColor: isDark 
                        ? KeziColors.night.deep 
                        : KeziColors.brand.pink100,
                    },
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <ThemedText 
                    type="small" 
                    style={[
                      styles.languageMenuText,
                      language === lang.code && { color: KeziColors.brand.pink500 },
                    ]}
                  >
                    {lang.nativeName}
                  </ThemedText>
                  {language === lang.code && (
                    <Feather name="check" size={14} color={KeziColors.brand.pink500} />
                  )}
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>

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

        {!showEmailForm ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.authOptions}>
            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: isDark ? KeziColors.night.surface : "#FFFFFF",
                  borderColor: isDark ? KeziColors.night.deep : KeziColors.gray[200],
                },
              ]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color={KeziColors.brand.pink500} />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Feather name="chrome" size={18} color="#4285F4" />
                  </View>
                  <ThemedText type="body" style={styles.socialButtonText}>
                    Continue with Google
                  </ThemedText>
                </>
              )}
            </Pressable>

            {Platform.OS === "ios" && (
              <Pressable
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: isDark ? "#FFFFFF" : "#000000",
                    borderColor: isDark ? "#FFFFFF" : "#000000",
                  },
                ]}
                onPress={handleAppleSignIn}
              >
                <Feather
                  name="smartphone"
                  size={18}
                  color={isDark ? "#000000" : "#FFFFFF"}
                />
                <ThemedText
                  type="body"
                  style={[
                    styles.socialButtonText,
                    { color: isDark ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  Continue with Apple
                </ThemedText>
              </Pressable>
            )}

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[200] }]} />
              <ThemedText type="small" style={styles.dividerText}>
                or
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[200] }]} />
            </View>

            <Pressable
              style={[
                styles.emailButton,
                {
                  backgroundColor: isDark ? KeziColors.night.deep : KeziColors.gray[100],
                },
              ]}
              onPress={() => setShowEmailForm(true)}
            >
              <Feather name="mail" size={18} color={theme.text} />
              <ThemedText type="body" style={styles.emailButtonText}>
                Continue with Email
              </ThemedText>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
            <Pressable
              style={styles.backToOptions}
              onPress={() => {
                setShowEmailForm(false);
                setIsRegistering(false);
              }}
            >
              <Feather name="arrow-left" size={16} color={KeziColors.brand.pink500} />
              <ThemedText type="small" style={{ color: KeziColors.brand.pink500 }}>
                Other sign-in options
              </ThemedText>
            </Pressable>

            {isRegistering && (
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>
                  Your Name
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
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Email Address
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
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Password
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: isDark
                        ? KeziColors.night.deep
                        : KeziColors.gray[50],
                      color: theme.text,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={isRegistering ? handleRegister : handleEmailLogin}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <Button
              onPress={isRegistering ? handleRegister : handleEmailLogin}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading
                ? isRegistering
                  ? "Creating Account..."
                  : "Signing in..."
                : isRegistering
                ? "Create Account"
                : "Sign In"}
            </Button>

            <Pressable
              style={styles.switchMode}
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <ThemedText type="small" style={styles.switchModeText}>
                {isRegistering
                  ? "Already have an account? "
                  : "Don\'t have an account? "}
                <ThemedText type="small" style={styles.switchModeLink}>
                  {isRegistering ? "Sign In" : "Sign Up"}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}

        <ThemedText type="small" style={styles.termsText}>
          By continuing, you agree to our{" "}
          <ThemedText type="small" style={styles.termsLink}>
            Terms of Service
          </ThemedText>{" "}
          and{" "}
          <ThemedText type="small" style={styles.termsLink}>
            Privacy Policy
          </ThemedText>
        </ThemedText>
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
  languageToggleContainer: {
    position: "absolute",
    top: Spacing.xl,
    left: Spacing.xl,
    zIndex: 10,
  },
  languageToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  languageToggleText: {
    fontWeight: "600",
    marginLeft: 2,
  },
  languageMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  languageMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  languageMenuText: {
    fontWeight: "500",
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
  authOptions: {
    gap: Spacing.md,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    opacity: 0.5,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emailButtonText: {
    fontWeight: "500",
  },
  form: {
    gap: Spacing.lg,
  },
  backToOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "600",
    opacity: 0.8,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
  },
  button: {
    marginTop: Spacing.md,
  },
  hint: {
    textAlign: "center",
    opacity: 0.5,
  },
  termsText: {
    textAlign: "center",
    marginTop: Spacing.xl,
    opacity: 0.6,
    lineHeight: 18,
  },
  termsLink: {
    color: KeziColors.brand.pink500,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.md,
    padding: Spacing.sm,
  },
  switchMode: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  switchModeText: {
    opacity: 0.6,
  },
  switchModeLink: {
    color: KeziColors.brand.pink500,
    fontWeight: "600",
  },
});
