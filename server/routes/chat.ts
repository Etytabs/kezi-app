import { Router, Request, Response } from 'express';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, systemPrompt }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(503).json({ 
        error: 'AI service unavailable',
        message: 'The AI chat service is not configured. Please contact support.'
      });
    }

    const apiMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      if (response.status === 401) {
        return res.status(503).json({ 
          error: 'AI service unavailable',
          message: 'Invalid API configuration. Please contact support.'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limited',
          message: 'Too many requests. Please try again in a moment.'
        });
      }
      
      return res.status(500).json({ 
        error: 'AI service error',
        message: 'Failed to get AI response. Please try again.'
      });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(500).json({ 
        error: 'No response',
        message: 'No response from AI. Please try again.'
      });
    }

    res.json({
      success: true,
      message: assistantMessage.trim(),
      usage: data.usage,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

export default router;
