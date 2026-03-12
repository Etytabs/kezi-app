import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

const CHAT_HISTORY_KEY = "@kezi/chat_history";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

async function callChatAPI(message: string, conversation_id?: string) {

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
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

  async sendMessage(
    message: string,
    chatHistory: ChatMessage[],
    conversation_id?: string
  ) {

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };

    const apiResponse = await callChatAPI(message, conversation_id);

    const assistantMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: apiResponse.reply,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [
      ...chatHistory,
      userMessage,
      assistantMessage
    ];

    await this.saveChatHistory(updatedHistory);

    return {
      response: assistantMessage,
      conversation_id: apiResponse.conversation_id,
      updatedHistory
    };
  }

};