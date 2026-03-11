import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { CycleInfo, calculateCycleInfo, getPhaseName, getPhaseDescription } from "./cycleService";
import { CycleConfig, JournalEntry, storage } from "./storage";

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl && configuredUrl !== "http://localhost:3001/api") {
    return configuredUrl;
  }
  
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!origin.includes("localhost")) {
      return `${origin}/api`;
    }
  }
  
  return "http://localhost:3001/api";
}

const API_BASE_URL = getApiBaseUrl();

const CHAT_HISTORY_KEY = "@kezi/chat_history";
const MAX_HISTORY_MESSAGES = 50;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

async function buildSystemPrompt(cycleConfig: CycleConfig | null, journalEntries: JournalEntry[]): Promise<string> {
  const cycleInfo = calculateCycleInfo(cycleConfig);
  const recentEntries = journalEntries.slice(-7);
  
  let systemPrompt = `You are Kezi, a warm, empathetic, and knowledgeable AI wellness companion specializing in menstrual health, cycle tracking, and women's wellness. You communicate with care, understanding, and positivity while being informative and supportive.

## Your Personality:
- Warm, caring, and encouraging
- Uses gentle, supportive language
- Celebrates small wins and progress
- Never judgmental about symptoms or feelings
- Provides practical, actionable advice
- Acknowledges emotions and validates experiences

## Key Guidelines:
- Keep responses concise but helpful (2-3 paragraphs max unless asked for detail)
- Use conversational language, not clinical terminology
- Offer personalized tips based on cycle phase when relevant
- If asked medical questions, gently remind users to consult healthcare providers for medical advice
- Focus on self-care, wellness, and emotional support
- Be encouraging about tracking and self-awareness`;

  if (cycleInfo.hasData) {
    systemPrompt += `

## User's Current Cycle Status:
- Current Day: Day ${cycleInfo.currentDay} of their cycle
- Phase: ${getPhaseName(cycleInfo.phase)}
- Phase Description: ${getPhaseDescription(cycleInfo.phase)}
- Days Until Next Period: ${cycleInfo.daysUntilPeriod}
- Days Until Ovulation: ${cycleInfo.daysUntilOvulation}
- Fertile Window: ${cycleInfo.fertileWindow ? "Currently in fertile window" : "Not in fertile window"}
- Cycle Length: ${cycleConfig?.cycleLength || 28} days
- Period Length: ${cycleConfig?.periodLength || 5} days`;
  } else {
    systemPrompt += `

## Note: User hasn't set up cycle tracking yet. Encourage them to start tracking for personalized insights.`;
  }

  if (recentEntries.length > 0) {
    systemPrompt += `

## Recent Journal Entries (last 7 days):`;
    recentEntries.forEach(entry => {
      systemPrompt += `
- ${new Date(entry.date).toLocaleDateString()}: Mood: ${entry.mood}${entry.symptoms.length > 0 ? `, Symptoms: ${entry.symptoms.join(", ")}` : ""}${entry.notes ? `, Notes: "${entry.notes}"` : ""}`;
    });
  }

  systemPrompt += `

## Phase-Specific Wellness Tips:
### Menstrual Phase:
- Rest is important, honor your body's need for recovery
- Gentle movement like walking or yoga
- Iron-rich foods and staying hydrated
- Self-care activities that bring comfort

### Follicular Phase:
- Energy is rising - great for new projects
- Social activities and creativity
- Try new workouts or activities
- Focus on planning and goal-setting

### Ovulation Phase:
- Peak energy and confidence
- Great time for important conversations
- Higher libido is normal
- Stay hydrated and nourished

### Luteal Phase:
- Energy may start declining
- Prioritize self-care and rest
- Healthy comfort foods
- Prepare for potential PMS symptoms

Remember to personalize your responses based on the user's current phase and recent journal entries when available.`;

  return systemPrompt;
}

const ENABLE_DIRECT_OPENAI_FALLBACK = false;

async function callOpenAIDirectly(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<ChatResponse> {
  if (!ENABLE_DIRECT_OPENAI_FALLBACK) {
    return {
      success: false,
      message: "",
      error: "AI service is temporarily unavailable. Please try again later.",
    };
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      message: "",
      error: "AI service not configured. Please try again later.",
    };
  }

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return {
        success: false,
        message: "",
        error: "Failed to get AI response. Please try again.",
      };
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return {
        success: false,
        message: "",
        error: "No response from AI",
      };
    }

    return {
      success: true,
      message: assistantMessage.trim(),
    };
  } catch (error) {
    console.error("OpenAI direct call error:", error);
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Failed to connect to AI service",
    };
  }
}

async function callChatAPI(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<ChatResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        systemPrompt: systemPrompt,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.log("Backend API returned error, falling back to direct OpenAI call");
      return callOpenAIDirectly(messages, systemPrompt);
    }

    if (!data.message) {
      return callOpenAIDirectly(messages, systemPrompt);
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Backend API timeout, using direct OpenAI call");
    } else {
      console.log("Backend API unavailable, using direct OpenAI call");
    }
    return callOpenAIDirectly(messages, systemPrompt);
  }
}

export const aiChatService = {
  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [];
  },

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  },

  async clearChatHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  },

  async sendMessage(
    userMessage: string,
    chatHistory: ChatMessage[],
    cycleConfig: CycleConfig | null,
    journalEntries: JournalEntry[]
  ): Promise<{ response: ChatMessage; updatedHistory: ChatMessage[] }> {
    const systemPrompt = await buildSystemPrompt(cycleConfig, journalEntries);

    const apiMessages = chatHistory.slice(-20).map(msg => ({
      role: msg.role as string,
      content: msg.content,
    }));

    const result = await callChatAPI(apiMessages, systemPrompt);

    const assistantMsg: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: result.success
        ? result.message
        : result.error || "I'm having trouble responding right now. Please try again.",
      timestamp: new Date().toISOString(),
    };

    const finalHistory = [...chatHistory, assistantMsg];
    
    await this.saveChatHistory(finalHistory);

    return {
      response: assistantMsg,
      updatedHistory: finalHistory,
    };
  },

  getWelcomeMessage(cycleConfig: CycleConfig | null): ChatMessage {
    const cycleInfo = calculateCycleInfo(cycleConfig);
    
    let welcomeText: string;
    if (cycleInfo.hasData) {
      const phaseName = getPhaseName(cycleInfo.phase);
      welcomeText = `Hi there! I'm Kezi, your personal wellness companion. I see you're on day ${cycleInfo.currentDay} of your cycle, currently in your ${phaseName.toLowerCase()}. How can I support you today?`;
    } else {
      welcomeText = `Hi there! I'm Kezi, your personal wellness companion. I'm here to help you understand your body and support your wellness journey. To give you personalized insights, consider setting up your cycle tracking. What would you like to know?`;
    }

    return {
      id: "welcome",
      role: "assistant",
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
  },

  getSuggestedQuestions(cycleConfig: CycleConfig | null): string[] {
    const cycleInfo = calculateCycleInfo(cycleConfig);
    
    const generalQuestions = [
      "What foods should I eat?",
      "Suggest self-care activities",
      "How can I improve my sleep?",
    ];

    if (!cycleInfo.hasData) {
      return [
        "How do I start tracking my cycle?",
        "What are the cycle phases?",
        ...generalQuestions.slice(0, 2),
      ];
    }

    const phaseQuestions: Record<string, string[]> = {
      menstrual: [
        "Why am I feeling tired?",
        "Best exercises during my period",
        "Foods to ease cramps",
      ],
      follicular: [
        "Why do I have more energy?",
        "Good workouts for this phase",
        "How to maximize productivity",
      ],
      ovulation: [
        "What should I know about fertility?",
        "Why is my mood different?",
        "Best activities for peak energy",
      ],
      luteal: [
        "How to manage PMS symptoms",
        "Why am I feeling emotional?",
        "Comfort food recommendations",
      ],
    };

    return [
      `What phase am I in?`,
      ...(phaseQuestions[cycleInfo.phase] || generalQuestions),
    ].slice(0, 4);
  },
};
