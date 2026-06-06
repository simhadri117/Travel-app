import { Router } from 'express';
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../services/auth';
import axios from 'axios';

const router = Router();

router.post('/assistant/chat', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  try {
    if (apiKey) {
      const isGemini = apiKey === process.env.GEMINI_API_KEY;
      if (isGemini) {
        const systemInstruction = "You are a TravelSphere AI assistant. Answer the user's travel questions, budget queries, destination ideas, visa queries, and local tips politely and concisely in markdown format.";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const contents = chatHistory.length > 0 ? [
          ...chatHistory.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ] : [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }] }
        ];

        const response = await axios.post(url, { contents });
        const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          return res.json({ success: true, message: textResponse });
        }
      } else {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a TravelSphere AI assistant. Answer user travel questions in markdown.' },
            ...chatHistory.map((h: any) => ({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.text
            })),
            { role: 'user', content: message }
          ]
        }, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        const textResponse = response.data?.choices?.[0]?.message?.content;
        if (textResponse) {
          return res.json({ success: true, message: textResponse });
        }
      }
    }

    let responseText = "I'd be happy to help you with your trip! Since I am in offline mode, here is some general info:\n\n";
    const msgLower = message.toLowerCase();
    if (msgLower.includes('visa')) {
      responseText += "🌍 **Visa Advice**:\n- Indian passport holders can visit countries like Thailand, Sri Lanka, and Mauritius visa-free or with visa-on-arrival.\n- Make sure your passport has at least 6 months validity from date of entry!";
    } else if (msgLower.includes('pack')) {
      responseText += "🎒 **Smart Packing list**:\n1. Roll your clothes to save space.\n2. Keep a universal power adapter.\n3. Always carry a small medical kit.\n4. Keep copies of your documents on your phone.";
    } else if (msgLower.includes('goa')) {
      responseText += "🏖️ **Goa Highlights**:\n- Best time: November to February.\n- North Goa for party and water sports (Anjuna, Baga).\n- South Goa for quiet heritage stays (Palolem, Agonda).\n- Try local Fish Curry and Feni!";
    } else if (msgLower.includes('jaipur')) {
      responseText += "🕌 **Jaipur Highlights**:\n- Pink City heritage sights: Amer Fort, Hawa Mahal, Patrika Gate.\n- Eat Dal Baati Churma at Chokhi Dhani.\n- Great for shopping colorful textiles.";
    } else {
      responseText += "I am your TravelSphere AI assistant. Ask me about weather, visa guides, local food, or safety tips, and I'll assist you right away!";
    }

    return res.json({ success: true, message: responseText });
  } catch (error: any) {
    console.error("AI assistant error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: "Failed to query AI model. Please try again." });
  }
});

export default router;
