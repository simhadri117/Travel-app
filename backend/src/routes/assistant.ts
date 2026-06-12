import { Router } from 'express';
import { AuthRequest, optionalAuthMiddleware } from '../services/auth';
import axios from 'axios';

const router = Router();

// Robust retry logic with exponential backoff
async function callGeminiWithRetry(
  url: string,
  payload: any,
  sessionId: string,
  maxRetries = 3
): Promise<{ text: string; tokenUsage: any; duration: number }> {
  let attempt = 0;
  let delay = 1000; // start at 1 second

  while (attempt <= maxRetries) {
    const startTime = Date.now();
    try {
      console.log(`[Assistant] Request Sent | Session ID: ${sessionId} | Attempt: ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await axios.post(url, payload, { timeout: 10000 });
      const duration = Date.now() - startTime;
      
      const responseData = response.data;
      const textResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('Invalid API Response: Text content is missing');
      }

      const tokenUsage = responseData?.usageMetadata || {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0
      };

      console.log(`[Assistant] Response Received | Session ID: ${sessionId} | Duration: ${duration}ms | Token Usage: ${JSON.stringify(tokenUsage)}`);

      return {
        text: textResponse,
        tokenUsage,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      attempt++;

      const status = error.response?.status;
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const errorType = status ? `HTTP ${status}` : error.code || 'UNKNOWN';

      console.error(`[Assistant] Retry Attempt ${attempt} failed | Session ID: ${sessionId} | Error Type: ${errorType} | Error Msg: ${errorMessage} | Duration: ${duration}ms`);

      // 400/403 are usually invalid key / bad request. We don't retry those as they aren't transient.
      const isRetriable = !status || [429, 500, 503].includes(status) || error.code === 'ECONNABORTED';

      if (status === 400 || status === 403) {
        console.error(`[Developer Console Error] Gemini API Key is invalid or unauthorized. Status: ${status}`);
      }

      if (attempt > maxRetries || !isRetriable) {
        throw {
          status: status || 500,
          message: errorMessage,
          errorType
        };
      }

      console.log(`[Assistant] Waiting ${delay}ms before next retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff: 1s -> 2s -> 4s
    }
  }
  throw new Error('Retry limit exceeded');
}

router.post('/assistant/chat', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  const { message, chatHistory = [], sessionId = 'default-session', conversationId = 'default-conv' } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("[Developer Console Error] GEMINI_API_KEY is missing from environment variables.");
    return res.status(500).json({
      success: false,
      error: "I'm currently having trouble connecting. Please try again in a few moments."
    });
  }

  try {
    const systemInstructionText = "You are a TravelSphere AI assistant. Answer the user's travel questions, budget queries, destination ideas, visa queries, and local tips politely and concisely in markdown format.";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    // Clean and alternate roles for Gemini API format
    const cleanContents: any[] = [];
    const rawContents = [
      ...chatHistory.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        text: h.text
      })),
      { role: 'user', text: message }
    ];

    for (const item of rawContents) {
      if (!item.text || !item.text.trim()) continue;
      
      if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === item.role) {
        cleanContents[cleanContents.length - 1].parts[0].text += "\n" + item.text;
      } else {
        cleanContents.push({
          role: item.role,
          parts: [{ text: item.text }]
        });
      }
    }

    // Ensure it starts with user and is not empty
    while (cleanContents.length > 0 && cleanContents[0].role !== 'user') {
      cleanContents.shift();
    }

    if (cleanContents.length === 0) {
      cleanContents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const payload = {
      contents: cleanContents,
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      }
    };

    const result = await callGeminiWithRetry(url, payload, sessionId);
    
    return res.json({
      success: true,
      message: result.text,
      sessionId,
      conversationId
    });
  } catch (error: any) {
    console.error("[Assistant Error] Chat service failed:", error.message || error);
    return res.status(error.status || 500).json({
      success: false,
      error: "I'm currently having trouble connecting. Please try again in a few moments."
    });
  }
});

export default router;
