
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateCycleInfo } from './cycleService';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

const CHAT_HISTORY_KEY = "@kezi/chat_history";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

async function callChatAPI(message: string, cycleConfig: any, journalEntries: any[], conversation_id?: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      cycleConfig,
      journalEntries,
      conversation_id
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Chat request failed");
  }

  return data;
}

export const aiChatService = {

  async getChatHistory(): Promise<ChatMessage[]> {
    const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  },

  async saveChatHistory(messages: ChatMessage[]) {
    await AsyncStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(messages)
    );
  },

  async clearChatHistory() {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  },

  getWelcomeMessage(cycleConfig: any): ChatMessage {
    const phase = cycleConfig ? calculateCycleInfo(cycleConfig).phase : null;
    let welcomeText = "Hello! I'm Kezi, your personal wellness assistant. How can I help you today?";
    if (phase) {
      welcomeText = `Hello! I'm Kezi. I see you're in your ${phase} phase. How can I help you with that today?`;
    }
    return {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
  },

  getSuggestedQuestions(cycleConfig: any): string[] {
    const phase = cycleConfig ? calculateCycleInfo(cycleConfig).phase : 'menstrual';
    const baseQuestions = [
      "What are some good exercises for today?",
      "Can you give me a recipe for a healthy meal?",
    ];
    const phaseQuestions: Record<string, string[]> = {
        menstrual: ["What are some good foods for my period?", "Why do I have cramps?"],
        follicular: ["What's a good workout for my follicular phase?", "How can I be more productive?"],
        ovulation: ["Am I fertile today?", "What are signs of ovulation?"],
        luteal: ["Why am I feeling moody?", "What can I do to relax?"],
    };
    return [...(phaseQuestions[phase] || []), ...baseQuestions].slice(0, 4);
  },

  async sendMessage(
    message: string,
    chatHistory: ChatMessage[],
    cycleConfig: any,
    journalEntries: any[]
  ) {
    const lastAssistantMessage = [...chatHistory].reverse().find(m => m.role === 'assistant');
    const conversation_id = lastAssistantMessage ? lastAssistantMessage.id.split('_')[1] : undefined;

    const apiResponse = await callChatAPI(message, cycleConfig, journalEntries, conversation_id);

    const assistantMessage: ChatMessage = {
      id: `assistant_${apiResponse.conversation_id || Date.now()}`,
      role: "assistant",
      content: apiResponse.reply,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [
      ...chatHistory,
      assistantMessage
    ];

    await this.saveChatHistory(updatedHistory);

    return {
      response: assistantMessage,
      updatedHistory
    };
  }
};
