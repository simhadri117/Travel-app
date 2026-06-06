import axios from 'axios';
import * as admin from 'firebase-admin';
import { DestinationImage } from '../models/DestinationImage';
import { uploadToCloudinary } from './upload';

// Helper functions to fetch API keys dynamically inside functions (resolving import order bugs)
const getGoogleApiKey = () => process.env.GOOGLE_MAPS_API_KEY || '';
const getUnsplashAccessKey = () => process.env.UNSPLASH_ACCESS_KEY || '';
const getPexelsApiKey = () => process.env.PEXELS_API_KEY || '';
const getPixabayApiKey = () => process.env.PIXABAY_API_KEY || '';

// Simple runtime cache to avoid database checks for very frequent requests
const localCache: Record<string, string> = {};

// Hardcoded expected features and custom query overrides for target destinations
const DESTINATION_METADATA: Record<
  string, 
  { name: string; state: string; country: string; query: string; expectedFeatures: string[] }
> = {
  goa: {
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    query: 'Goa India Beach',
    expectedFeatures: ['Beaches', 'Palm Trees', 'Coastline', 'Ocean or sea views', 'Sandy shores']
  },
  jaipur: {
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    query: 'Jaipur Rajasthan India',
    expectedFeatures: ['Hawa Mahal', 'Amber Fort', 'Pink City', 'Palaces', 'Rajasthani architecture']
  },
  manali: {
    name: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    query: 'Manali Himachal Pradesh India',
    expectedFeatures: ['Snow Mountains', 'Valleys', 'Himalayan Roads', 'Pine forests', 'Mountain landscapes']
  },
  kerala: {
    name: 'Kerala',
    state: 'Kerala',
    country: 'India',
    query: 'Kerala Backwaters India',
    expectedFeatures: ['Backwaters', 'Houseboats', 'Coconut Trees', 'Tranquil canals', 'Lush greenery']
  },
  agra: {
    name: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    query: 'Agra Taj Mahal India',
    expectedFeatures: ['Taj Mahal', 'Mughal Architecture', 'Yamuna River front', 'White marble monument']
  },
  chennai: {
    name: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    query: 'Chennai India Marina Beach Kapaleeshwarar Temple',
    expectedFeatures: ['Kapaleeshwarar Temple', 'Marina Beach', 'gopuram tower', 'Dravidian architecture', 'Chennai landmarks', 'Bay of Bengal views']
  }
};

// Validates image URL responds with HTTP 200/206
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 3000 });
    return res.status === 200;
  } catch (err) {
    try {
      // Some servers block HEAD requests, retry with GET limit 1 byte
      const res = await axios.get(url, { 
        headers: { Range: 'bytes=0-0' },
        timeout: 3000 
      });
      return res.status === 200 || res.status === 206;
    } catch (getErr) {
      return false;
    }
  }
}

// Download remote image and convert it to Base64
async function downloadImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];
    const mimeType = typeof contentType === 'string' ? contentType : 'image/jpeg';
    const data = buffer.toString('base64');
    return { data, mimeType };
  } catch (err) {
    console.warn(`[DestinationImage Service] Failed to download image from ${url}:`, err);
    return null;
  }
}

// Validate image relevance using Gemini Multimodal API (gemini-2.5-flash)
async function validateImageRelevanceWithAI(
  base64Data: string,
  mimeType: string,
  destinationName: string,
  state: string,
  country: string,
  expectedFeatures: string[]
): Promise<{ confidence: number; isMatch: boolean; reason: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[DestinationImage Service] GEMINI_API_KEY is not defined, skipping AI validation');
    return { confidence: 100, isMatch: true, reason: 'Gemini API key missing, skipped validation.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are an expert travel image validation system.
Analyze this image and determine if it is an iconic photo representing the destination: "${destinationName}" located in ${state}, ${country}.

Expected visual features for this destination:
${expectedFeatures.map(f => `- ${f}`).join('\n')}

Strictly reject the image (confidence < 90) if it is:
- A generic stock photo (e.g., travelers with suitcases in airports, generic passports, globes, airplanes, camera gear)
- A camera or photography lens
- A sketch, line drawing, cartoon, painting, or digital illustration
- A stock travel template or generic placeholder graphic
- An empty thumbnail, broken picture, or unrelated landscape not representative of "${destinationName}"

We need the image to instantly represent "${destinationName}" to a traveler looking at a destination cover card.

Provide a confidence/similarity score between 0 and 100 indicating how well this image represents "${destinationName}".
Respond ONLY with a JSON object in this exact format:
{
  "confidence": number,
  "isMatch": boolean,
  "reason": string
}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const res = await axios.post(url, payload, { timeout: 8000 });
    let textResponse = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (textResponse.includes('```')) {
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const result = JSON.parse(textResponse);
    console.log(`[Destination AI Validation] Result for "${destinationName}":`, result);
    return {
      confidence: Number(result.confidence) ?? 0,
      isMatch: Number(result.confidence) >= 90,
      reason: result.reason || ''
    };
  } catch (err) {
    console.warn(`[AI Validation] Failed to validate image relevance for ${destinationName}:`, err);
    // On error, fallback to true so the app is not blocked by temporary Gemini API issues
    return { confidence: 95, isMatch: true, reason: 'AI validation errored, fallback to true.' };
  }
}

// 1. Google Places API + Place Photos API
async function fetchGooglePlacesPhotos(query: string): Promise<{ candidatePhotos: string[]; placeId: string }> {
  const candidatePhotos: string[] = [];
  let placeId = '';
  const apiKey = getGoogleApiKey();
  if (!apiKey) return { candidatePhotos, placeId };

  try {
    const searchRes = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: query,
        key: apiKey
      }
    });

    if (searchRes.data.results && searchRes.data.results.length > 0) {
      const place = searchRes.data.results[0];
      placeId = place.place_id || '';

      if (place.photos && place.photos.length > 0) {
        for (const photo of place.photos) {
          if (photo.photo_reference) {
            candidatePhotos.push(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${photo.photo_reference}&key=${apiKey}`
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Google Places API] Textsearch failed:', err);
  }

  return { candidatePhotos, placeId };
}

// 2. Unsplash API
async function fetchUnsplashPhotos(query: string): Promise<string[]> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return [];
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        client_id: accessKey,
        per_page: 5
      }
    });
    if (res.data.results && res.data.results.length > 0) {
      return res.data.results.map((r: any) => r.urls.regular);
    }
  } catch (err) {
    console.warn('[Unsplash API] Search failed:', err);
  }
  return [];
}

// 3. Pexels API
async function fetchPexelsPhotos(query: string): Promise<string[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: apiKey
      },
      params: {
        query: query,
        per_page: 5
      }
    });
    if (res.data.photos && res.data.photos.length > 0) {
      return res.data.photos.map((p: any) => p.src.large);
    }
  } catch (err) {
    console.warn('[Pexels API] Search failed:', err);
  }
  return [];
}

// 4. Pixabay API
async function fetchPixabayPhotos(query: string): Promise<string[]> {
  const apiKey = getPixabayApiKey();
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: {
        key: apiKey,
        q: query,
        image_type: 'photo',
        per_page: 5
      }
    });
    if (res.data.hits && res.data.hits.length > 0) {
      return res.data.hits.map((h: any) => h.largeImageURL);
    }
  } catch (err) {
    console.warn('[Pixabay API] Search failed:', err);
  }
  return [];
}

// Helper to resolve state and country dynamically from Google Places
async function resolveStateAndCountry(name: string): Promise<{ state: string; country: string }> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return { state: 'India', country: 'India' };
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: { query: name, key: apiKey }
    });
    if (res.data.results && res.data.results.length > 0) {
      const place = res.data.results[0];
      const address = place.formatted_address || '';
      const parts = address.split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        const country = parts[parts.length - 1];
        let state = parts[parts.length - 2] || '';
        state = state.replace(/\d+/g, '').trim(); // Remove postal codes
        return { state, country };
      }
    }
  } catch (err) {
    console.warn('[resolveStateAndCountry] Failed:', err);
  }
  return { state: 'India', country: 'India' };
}

export async function resolveDestinationImage(name: string): Promise<string> {
  const nameClean = name.trim().toLowerCase();

  // 1. Check local runtime cache
  if (localCache[nameClean]) {
    console.log(`[DestinationImage Cache] Local cache hit for "${nameClean}"`);
    return localCache[nameClean];
  }

  // 2. Check MongoDB cache
  try {
    const mongoDoc = await DestinationImage.findOne({ name: nameClean });
    if (mongoDoc && mongoDoc.imageUrl) {
      console.log(`[DestinationImage Cache] MongoDB cache hit for "${nameClean}": ${mongoDoc.imageUrl}`);
      localCache[nameClean] = mongoDoc.imageUrl;
      return mongoDoc.imageUrl;
    }
  } catch (err) {
    console.warn('[DestinationImage Cache] MongoDB check failed:', err);
  }

  // 3. Cache miss. Run pipeline.
  console.log(`[DestinationImage] Cache miss for "${nameClean}". Running high-precision pipeline...`);

  // Determine metadata, state, country, search query, and expected features
  let state = 'India';
  let country = 'India';
  let searchQuery = '';
  let expectedFeatures = ['Scenic landmark', 'City view', 'Landscape'];
  
  const meta = DESTINATION_METADATA[nameClean];
  if (meta) {
    state = meta.state;
    country = meta.country;
    searchQuery = meta.query;
    expectedFeatures = meta.expectedFeatures;
  } else {
    // Resolve dynamically
    const resolved = await resolveStateAndCountry(nameClean);
    state = resolved.state;
    country = resolved.country;
    searchQuery = `${name.trim()} ${state} ${country}`;
    expectedFeatures = [
      `Historic monuments of ${name.trim()}`,
      `Typical streetscape or cityscape of ${name.trim()}`,
      `Scenic view representing ${name.trim()}`
    ];
  }

  console.log(`[DestinationImage] Search query constructed: "${searchQuery}"`);

  // Fetch candidate photos from Google Places first (to capture Place ID)
  const googleResult = await fetchGooglePlacesPhotos(searchQuery);
  const placeId = googleResult.placeId;

  // Pipeline sources in priority order
  const sources = [
    { name: 'google_places', fetch: async () => googleResult.candidatePhotos },
    { name: 'unsplash', fetch: async () => fetchUnsplashPhotos(searchQuery) },
    { name: 'pexels', fetch: async () => fetchPexelsPhotos(searchQuery) },
    { name: 'pixabay', fetch: async () => fetchPixabayPhotos(searchQuery) }
  ];

  let selectedImageUrl = '';
  let selectedSource = 'fallback';
  let highestConfidenceCandidate: { url: string; confidence: number; source: string } | null = null;

  for (const src of sources) {
    try {
      console.log(`[Destination Pipeline] Querying ${src.name}...`);
      const candidates = await src.fetch();
      if (candidates && candidates.length > 0) {
        for (const candidateUrl of candidates) {
          // Check HTTP status code
          const isUrlOk = await validateImageUrl(candidateUrl);
          if (!isUrlOk) continue;

          // Download as base64 for multimodal AI validation
          const base64Info = await downloadImageAsBase64(candidateUrl);
          if (!base64Info) continue;

          // Validate relevance
          const validation = await validateImageRelevanceWithAI(
            base64Info.data,
            base64Info.mimeType,
            meta ? meta.name : name.trim(),
            state,
            country,
            expectedFeatures
          );

          // Track the highest confidence candidate as fallback
          if (!highestConfidenceCandidate || validation.confidence > highestConfidenceCandidate.confidence) {
            highestConfidenceCandidate = {
              url: candidateUrl,
              confidence: validation.confidence,
              source: src.name
            };
          }

          // If meets the 90% threshold, select it
          if (validation.isMatch) {
            selectedImageUrl = candidateUrl;
            selectedSource = src.name;
            console.log(`[Destination Pipeline] Approved candidate found: ${candidateUrl} (Score: ${validation.confidence} from ${src.name})`);
            break;
          }
        }
      }
    } catch (srcErr) {
      console.warn(`[Destination Pipeline] Failed querying source ${src.name}:`, srcErr);
    }

    if (selectedImageUrl) break;
  }

  // Fall back to highest confidence candidate if nothing met 90%
  if (!selectedImageUrl && highestConfidenceCandidate && highestConfidenceCandidate.confidence > 0) {
    selectedImageUrl = highestConfidenceCandidate.url;
    selectedSource = `${highestConfidenceCandidate.source}_fallback_highest`;
    console.log(`[Destination Pipeline] Using fallback highest confidence candidate: ${selectedImageUrl} (Score: ${highestConfidenceCandidate.confidence})`);
  }

  // Final emergency fallback to avoid broken cards
  if (!selectedImageUrl) {
    selectedImageUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200';
    selectedSource = 'final_fallback';
  }

  // Upload to Cloudinary
  let finalImageUrl = selectedImageUrl;
  if (selectedSource !== 'final_fallback') {
    try {
      const base64Info = await downloadImageAsBase64(selectedImageUrl);
      if (base64Info) {
        const cloudinaryUrl = await uploadToCloudinary(`data:${base64Info.mimeType};base64,${base64Info.data}`);
        if (cloudinaryUrl) {
          finalImageUrl = cloudinaryUrl;
        }
      }
    } catch (uploadErr) {
      console.warn('[DestinationImage] Cloudinary upload failed, using original source url:', uploadErr);
    }
  }

  // Cache in MongoDB and Firestore (if not the final fallback)
  if (selectedSource !== 'final_fallback') {
    try {
      // MongoDB
      const mongoDoc = new DestinationImage({
        name: nameClean,
        imageUrl: finalImageUrl,
        placeId,
        source: selectedSource
      });
      await mongoDoc.save();

      // Firebase Firestore
      if (admin.apps.length > 0) {
        try {
          const db = admin.firestore();
          await db.collection('destination_images').doc(nameClean).set({
            name: nameClean,
            imageUrl: finalImageUrl,
            placeId,
            source: selectedSource,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (fErr) {
          console.warn('[DestinationImage] Firestore save failed:', fErr);
        }
      }
    } catch (saveErr) {
      console.warn('[DestinationImage] Cache save failed:', saveErr);
    }
  }

  localCache[nameClean] = finalImageUrl;
  return finalImageUrl;
}
