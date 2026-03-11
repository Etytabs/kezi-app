import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { KeziBrandIcon } from "@/components/KeziBrandIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { KeziColors, Spacing, BorderRadius } from "@/constants/theme";
import { aiChatService, ChatMessage } from "@/services/aiChatService";
import { storage } from "@/services/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const { isDark } = useTheme();
  const { cycleConfig } = useAuth();
  const insets = useSafeAreaInsets();
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const typingDot1 = useSharedValue(0.3);
  const typingDot2 = useSharedValue(0.3);
  const typingDot3 = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      loadChatHistory();
      loadJournalEntries();
    }
  }, [visible]);

  const loadJournalEntries = async () => {
    try {
      const entries = await storage.getJournalEntries();
      setJournalEntries(entries);
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      const history = await aiChatService.getChatHistory();
      
      if (history.length === 0) {
        const welcomeMsg = aiChatService.getWelcomeMessage(cycleConfig);
        setMessages([welcomeMsg]);
        await aiChatService.saveChatHistory([welcomeMsg]);
      } else {
        setMessages(history);
      }
      
      const questions = aiChatService.getSuggestedQuestions(cycleConfig);
      setSuggestedQuestions(questions);
    } catch (error) {
      console.error("Error loading chat:", error);
      const welcomeMsg = aiChatService.getWelcomeMessage(cycleConfig);
      setMessages([welcomeMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTyping) {
      typingDot1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1
      );
      typingDot2.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 150 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1
      );
      typingDot3.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 150 })
        ),
        -1
      );
    }
  }, [isTyping]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: typingDot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: typingDot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: typingDot3.value }));

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const entries = journalEntries || [];
      const { response, updatedHistory } = await aiChatService.sendMessage(
        messageText,
        [...messages, userMessage],
        cycleConfig,
        entries
      );

      setMessages(updatedHistory);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, isTyping, messages, cycleConfig, journalEntries]);

  const handleClearChat = () => {
    Alert.alert(
      "Clear Conversation",
      "Start a fresh conversation? Your chat history will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await aiChatService.clearChatHistory();
            const welcomeMsg = aiChatService.getWelcomeMessage(cycleConfig);
            setMessages([welcomeMsg]);
            await aiChatService.saveChatHistory([welcomeMsg]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === "user";

    return (
      <Animated.View
        entering={FadeInDown.delay(index === messages.length - 1 ? 0 : 50).duration(300)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.jasminMessageContainer,
        ]}
      >
        {!isUser ? (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[KeziColors.brand.purple500, KeziColors.brand.purple600]}
              style={styles.avatar}
            >
              <KeziBrandIcon size={18} />
            </LinearGradient>
          </View>
        ) : null}

        <View
          style={[
            styles.messageBubble,
            isUser 
              ? styles.userBubble 
              : [styles.jasminBubble, isDark && styles.jasminBubbleDark],
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isUser ? styles.userText : [styles.jasminText, isDark && styles.jasminTextDark],
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText 
            style={[
              styles.timestamp,
              isUser && styles.userTimestamp,
            ]}
          >
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.messageContainer, styles.jasminMessageContainer]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[KeziColors.brand.purple500, KeziColors.brand.purple600]}
            style={styles.avatar}
          >
            <KeziBrandIcon size={18} animated animationType="pulse" />
          </LinearGradient>
        </View>
        <View style={[
          styles.messageBubble, 
          styles.jasminBubble, 
          styles.typingBubble,
          isDark && styles.jasminBubbleDark,
        ]}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, dot1Style]} />
            <Animated.View style={[styles.typingDot, dot2Style]} />
            <Animated.View style={[styles.typingDot, dot3Style]} />
          </View>
        </View>
      </Animated.View>
    );
  };

  const bgColor = isDark ? KeziColors.night.base : "#FAFAFA";
  const headerBg = isDark ? KeziColors.night.surface : KeziColors.gray[50];
  const inputBg = isDark ? KeziColors.night.deep : "#FFFFFF";
  const inputBorder = isDark ? KeziColors.night.deep : KeziColors.gray[200];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={SlideInUp.duration(350).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutDown.duration(280).easing(Easing.in(Easing.cubic))}
        style={[styles.container, { backgroundColor: bgColor }]}
      >
        <LinearGradient
          colors={[KeziColors.brand.purple500, KeziColors.brand.purple600]}
          style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <KeziBrandIcon size={28} animated animationType="pulse" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Kezi AI</ThemedText>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <ThemedText style={styles.headerSubtitle}>
                    {isTyping ? "Typing..." : "Online"}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable 
                style={styles.headerButton} 
                onPress={handleClearChat}
                hitSlop={8}
              >
                <Feather name="trash-2" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {suggestedQuestions.length > 0 && messages.length <= 2 ? (
          <View style={[styles.suggestionsContainer, isDark && styles.suggestionsContainerDark]}>
            <FlatList
              data={suggestedQuestions}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.suggestionChip,
                    isDark && styles.suggestionChipDark,
                  ]}
                  onPress={() => handleSend(item)}
                >
                  <Feather 
                    name="message-circle" 
                    size={14} 
                    color={KeziColors.brand.purple500} 
                    style={styles.suggestionIcon}
                  />
                  <ThemedText style={styles.suggestionText}>{item}</ThemedText>
                </Pressable>
              )}
            />
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={KeziColors.brand.purple500} />
            <ThemedText style={styles.loadingText}>Loading conversation...</ThemedText>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderTypingIndicator}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View
            style={[
              styles.inputContainer,
              { 
                paddingBottom: insets.bottom + Spacing.sm, 
                backgroundColor: headerBg,
                borderTopColor: inputBorder,
              },
            ]}
          >
            <View style={[
              styles.inputWrapper, 
              { 
                backgroundColor: inputBg,
                borderColor: inputBorder,
              }
            ]}>
              <TextInput
                style={[styles.input, { color: isDark ? "#FFFFFF" : "#000000" }]}
                placeholder="Message Kezi..."
                placeholderTextColor={KeziColors.gray[400]}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!isTyping}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <Pressable
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isTyping}
              >
                <LinearGradient
                  colors={
                    inputText.trim() && !isTyping
                      ? [KeziColors.brand.pink500, KeziColors.brand.purple600]
                      : [KeziColors.gray[300], KeziColors.gray[400]]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <Feather name="send" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
            <ThemedText style={styles.poweredBy}>
              Powered by OpenAI
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KeziColors.gray[200],
    backgroundColor: "#FFFFFF",
  },
  suggestionsContainerDark: {
    backgroundColor: KeziColors.night.surface,
    borderBottomColor: KeziColors.night.deep,
  },
  suggestionsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: KeziColors.brand.purple50,
    marginRight: Spacing.sm,
  },
  suggestionChipDark: {
    backgroundColor: KeziColors.night.deep,
  },
  suggestionIcon: {
    marginRight: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: KeziColors.brand.purple600,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: KeziColors.gray[500],
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    maxWidth: "85%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  jasminMessageContainer: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  userBubble: {
    backgroundColor: KeziColors.brand.purple600,
    borderBottomRightRadius: BorderRadius.xs,
  },
  jasminBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: KeziColors.gray[100],
  },
  jasminBubbleDark: {
    backgroundColor: KeziColors.night.surface,
    borderColor: KeziColors.night.deep,
  },
  typingBubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  jasminText: {
    color: KeziColors.gray[800],
  },
  jasminTextDark: {
    color: KeziColors.gray[100],
  },
  timestamp: {
    fontSize: 10,
    color: KeziColors.gray[400],
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  typingDots: {
    flexDirection: "row",
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KeziColors.brand.purple500,
  },
  inputContainer: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: Spacing.sm,
    lineHeight: 22,
  },
  sendButton: {
    marginBottom: Spacing.xxs,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  poweredBy: {
    fontSize: 11,
    color: KeziColors.gray[400],
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
