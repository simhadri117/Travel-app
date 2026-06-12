const axios = require('axios');
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY';

async function testGeminiPlaces() {
  const query = 'Chennai';
  const lat = 13.0827;
  const lng = 80.2707;
  const prompt = `You are a travel assistant. Generate popular, real, and authentic local places in "${query}" (centered at latitude ${lat}, longitude ${lng}).
  The output must be a single JSON object matching this structure:
  {
    "city_info": {
      "population": "string (e.g. 8.7 million)",
      "best_time_to_visit": "string (e.g. Nov - Feb)"
    },
    "attractions": [
      {
        "name": "string (real, popular attraction in ${query}, e.g. Marina Beach)",
        "rating": number,
        "types": ["tourist_attraction"],
        "geometry": { "location": { "lat": number, "lng": number } },
        "image": "string (optimized search term for Unsplash)",
        "description": "string"
      }
    ],
    "hotels": [
      {
        "name": "string (real, popular hotel in ${query})",
        "rating": number,
        "types": ["lodging"],
        "geometry": { "location": { "lat": number, "lng": number } },
        "image": "string (optimized search term for Unsplash)",
        "description": "string"
      }
    ],
    "restaurants": [
      {
        "name": "string (real, popular restaurant in ${query})",
        "rating": number,
        "types": ["restaurant"],
        "geometry": { "location": { "lat": number, "lng": number } },
        "image": "string (optimized search term for Unsplash)",
        "description": "string"
      }
    ],
    "hidden_gems": [
      {
        "name": "string (real, offbeat/hidden gem attraction in ${query})",
        "rating": number,
        "types": ["tourist_attraction"],
        "geometry": { "location": { "lat": number, "lng": number } },
        "image": "string (optimized search term for Unsplash)",
        "description": "string"
      }
    ]
  }

  Generate exactly:
  - 4 attractions
  - 3 hotels
  - 3 restaurants
  - 2 hidden_gems
  
  CRITICAL RULES:
  1. Do not include markdown formatting or backticks like \`\`\`json. Return only raw, valid JSON.
  2. All geometry coordinates MUST be real coordinates in ${query} or offsets within a strict 5-10km radius of the centered coordinates (${lat}, ${lng}).
  3. Only recommend places situated inside "${query}" itself. Never recommend places outside.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`;
    const response = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    console.log('Gemini Status:', response.status);
    console.log('Gemini Response:', response.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testGeminiPlaces();
