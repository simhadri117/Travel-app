import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await axios.get(url);
    console.log('Supported models:');
    for (const model of res.data.models || []) {
      console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
    }
  } catch (err: any) {
    console.error('List models failed:', err.response?.data || err.message);
  }
}

run();
