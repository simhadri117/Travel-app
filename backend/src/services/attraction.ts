import axios from 'axios';
import * as admin from 'firebase-admin';
import { AttractionImage } from '../models/AttractionImage';
import { uploadToCloudinary } from './upload';

const getGoogleApiKey = () => process.env.GOOGLE_MAPS_API_KEY || '';
const getUnsplashAccessKey = () => process.env.UNSPLASH_ACCESS_KEY || '';
const getPexelsApiKey = () => process.env.PEXELS_API_KEY || '';

// Runtime local cache to prevent redundant queries
const localCache: Record<string, any> = {};

// Helper to validate HTTP URL response
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 3000 });
    return res.status === 200;
  } catch (err) {
    try {
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
    console.warn(`[Attraction Service] Failed to download image from ${url}:`, err);
    return null;
  }
}

// Validate image relevance using Gemini Multimodal API
async function validateImageRelevanceWithAI(
  base64Data: string,
  mimeType: string,
  attractionName: string,
  city: string,
  state: string,
  country: string
): Promise<{ confidence: number; isMatch: boolean; reason: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Attraction Service] GEMINI_API_KEY is not defined, skipping AI validation');
    return { confidence: 100, isMatch: true, reason: 'Gemini API key missing, skipped validation.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are an expert travel image validation system.
Analyze this image and determine if it is a photo of the actual attraction: "${attractionName}" located in ${city}, ${state}, ${country}.

Ensure the image actually represents the requested attraction and is not a generic stock travel photo.

Strictly reject the image (confidence < 90) if it contains:
- A stock travel/tourism/vacation photo
- A generic beach photo (unless the attraction itself is specifically that beach)
- A camera (like a camera body/lens)
- Sketches, drawings, or line artwork
- Paintings, generic illustrations, or unrelated artwork
- Unrelated landscapes

Provide a confidence score between 0 and 100.
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
    console.log(`[AI Validation] Result for "${attractionName}":`, result);
    return {
      confidence: Number(result.confidence) ?? 0,
      isMatch: Number(result.confidence) >= 90,
      reason: result.reason || ''
    };
  } catch (err) {
    console.warn(`[AI Validation] Failed to validate image relevance for ${attractionName}:`, err);
    // On error, we fallback to true to prevent blocking if the AI service has temporary issues
    return { confidence: 95, isMatch: true, reason: 'AI validation errored, fallback to true.' };
  }
}

// 1. Google Place Search (gather candidate photos and metadata)
async function fetchGooglePlaceData(searchQuery: string, attractionName: string, city: string): Promise<{
  candidatePhotos: string[];
  placeId: string;
  rating: number;
  location: string;
  category: string;
  openingHours: string;
}> {
  let rating = 4.5;
  let location = `${city}, India`;
  let category = 'Historical Site';
  let openingHours = '9:00 AM - 6:00 PM';
  let placeId = '';
  const candidatePhotos: string[] = [];

  const apiKey = getGoogleApiKey();
  if (!apiKey) return { candidatePhotos, placeId, rating, location, category, openingHours };

  try {
    const searchRes = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: searchQuery,
        key: apiKey
      }
    });

    if (searchRes.data.results && searchRes.data.results.length > 0) {
      const place = searchRes.data.results[0];
      placeId = place.place_id || '';
      rating = place.rating || rating;

      if (place.formatted_address) {
        const parts = place.formatted_address.split(',');
        if (parts.length > 1) {
          location = `${parts[parts.length - 3]?.trim() || parts[0]}, ${parts[parts.length - 2]?.trim() || city}`;
        } else {
          location = place.formatted_address;
        }
      }

      if (place.types && place.types.length > 0) {
        if (place.types.includes('church') || place.types.includes('hindu_temple') || place.types.includes('place_of_worship')) {
          category = 'Temple';
        } else if (place.types.includes('museum')) {
          category = 'Museum';
        } else if (place.types.includes('amusement_park') || place.types.includes('park')) {
          category = 'Adventure';
        }
      }

      // Fetch opening hours details
      try {
        const detailsRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
          params: {
            place_id: placeId,
            fields: 'opening_hours',
            key: apiKey
          }
        });
        if (detailsRes.data.result?.opening_hours?.weekday_text) {
          const rawHours = detailsRes.data.result.opening_hours.weekday_text[0] || '';
          if (rawHours.includes(':')) {
            openingHours = rawHours.substring(rawHours.indexOf(':') + 1).trim();
          }
        } else if (detailsRes.data.result?.opening_hours?.open_now !== undefined) {
          openingHours = detailsRes.data.result.opening_hours.open_now ? 'Open Now' : 'Closed';
        }
      } catch (detailErr) {
        console.warn('[Google Place Details] Failed to fetch details:', detailErr);
      }

      // Gather up to 10 photo references
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

  return { candidatePhotos, placeId, rating, location, category, openingHours };
}

// 2. Wikimedia Commons exact query (generator = search, namespace 6)
async function fetchWikimediaCommonsPhotos(searchQuery: string): Promise<string[]> {
  try {
    const res = await axios.get('https://commons.wikimedia.org/w/api.php', {
      headers: {
        'User-Agent': 'WanderWiseTravelApp/1.0 (contact@wanderwise.com)'
      },
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: searchQuery,
        gsrnamespace: 6,
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        origin: '*'
      }
    });
    const pages = res.data?.query?.pages || {};
    const urls: string[] = [];
    for (const key of Object.keys(pages)) {
      const page = pages[key];
      if (page.imageinfo && page.imageinfo.length > 0) {
        urls.push(page.imageinfo[0].url);
      }
    }
    return urls;
  } catch (err) {
    console.warn('[Wikimedia Commons API] Search failed:', err);
    return [];
  }
}

// 3. Unsplash search
async function fetchUnsplashPhotos(searchQuery: string): Promise<string[]> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return [];
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: searchQuery,
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

// 4. Pexels search
async function fetchPexelsPhotos(searchQuery: string): Promise<string[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: apiKey
      },
      params: {
        query: searchQuery,
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

export async function enrichAttraction(
  name: string,
  city: string,
  state: string,
  country: string,
  existingData: any
) {
  const attractionNameClean = name.trim();
  const cityClean = city.trim();
  const stateClean = state ? state.trim() : 'India';
  const countryClean = country ? country.trim() : 'India';

  const queryKey = `${attractionNameClean} ${cityClean} ${stateClean} ${countryClean}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Check local runtime cache
  if (localCache[queryKey]) {
    console.log(`[Attraction Cache] Local cache hit for "${queryKey}"`);
    return {
      ...existingData,
      ...localCache[queryKey]
    };
  }

  // 2. Check MongoDB cache
  try {
    const mongoDoc = await AttractionImage.findOne({ name: queryKey });
    if (mongoDoc && mongoDoc.imageUrl) {
      console.log(`[Attraction Cache] MongoDB cache hit for "${queryKey}": ${mongoDoc.imageUrl}`);
      const result = {
        name,
        location: existingData.location || `${cityClean}, India`,
        rating: existingData.rating || 4.5,
        opening_hours: existingData.opening_hours || '9:00 AM - 6:00 PM',
        duration: existingData.duration || '1-2 Hours',
        best_time: existingData.best_time || 'October - March',
        category: existingData.category || 'Historical Site',
        photo: mongoDoc.imageUrl,
        fee: existingData.fee || null
      };
      // Keep category/other metadata clean if existing is free
      if (result.fee && (result.fee.toLowerCase().includes('free') || result.fee.toLowerCase().includes('entry: free'))) {
        result.fee = null;
      }
      localCache[queryKey] = result;
      return result;
    }
  } catch (err) {
    console.warn('[Attraction Cache] MongoDB lookup failed:', err);
  }

  console.log(`[Attraction Cache] Cache miss for "${queryKey}". Running Pipeline...`);

  // Default values
  let rating = existingData.rating || 4.5;
  let openingHours = existingData.opening_hours || '9:00 AM - 6:00 PM';
  let bestTime = existingData.best_time || 'October - March';
  if (cityClean.toLowerCase() === 'goa') {
    bestTime = 'November - February';
  }
  let category = existingData.category || 'Historical Site';
  
  const nameLower = attractionNameClean.toLowerCase();
  if (nameLower.includes('beach')) category = 'Beach';
  else if (nameLower.includes('fort')) category = 'Fort';
  else if (nameLower.includes('temple') || nameLower.includes('church') || nameLower.includes('jesus') || nameLower.includes('basilica')) category = 'Temple';
  else if (nameLower.includes('waterfall')) category = 'Waterfall';
  else if (nameLower.includes('museum')) category = 'Museum';
  else if (nameLower.includes('adventure') || nameLower.includes('trek')) category = 'Adventure';

  let location = existingData.location || `${cityClean}, India`;
  let duration = existingData.duration || '1-2 Hours';
  let fee = existingData.fee || null;

  if (fee && (fee.toLowerCase().includes('free') || fee.toLowerCase().includes('entry: free') || fee.toLowerCase() === 'entry: free')) {
    fee = null;
  }

  // Exact image search query format
  const searchQuery = `${attractionNameClean} ${cityClean} ${stateClean} ${countryClean}`;

  // Gather details & photos from Google Place API
  const googleData = await fetchGooglePlaceData(searchQuery, attractionNameClean, cityClean);
  
  // Use metadata resolved from Google Place if found
  if (googleData.placeId) {
    rating = googleData.rating;
    location = googleData.location;
    category = googleData.category;
    openingHours = googleData.openingHours;
  }

  // Sequentially query sources for image candidates
  // Source order: Google Places, Wikimedia Commons, Unsplash, Pexels
  const sources = [
    { name: 'google_places', fetch: async () => googleData.candidatePhotos },
    { name: 'wikimedia_commons', fetch: async () => fetchWikimediaCommonsPhotos(searchQuery) },
    { name: 'unsplash', fetch: async () => fetchUnsplashPhotos(searchQuery) },
    { name: 'pexels', fetch: async () => fetchPexelsPhotos(searchQuery) }
  ];

  let selectedImageUrl = '';
  let selectedSource = 'fallback';
  let highestConfidenceCandidate: { url: string; confidence: number; source: string } | null = null;

  for (const src of sources) {
    try {
      console.log(`[Pipeline] Querying ${src.name}...`);
      const candidates = await src.fetch();
      if (candidates && candidates.length > 0) {
        for (const candidateUrl of candidates) {
          const isUrlOk = await validateImageUrl(candidateUrl);
          if (!isUrlOk) continue;

          const base64Info = await downloadImageAsBase64(candidateUrl);
          if (!base64Info) continue;

          const validation = await validateImageRelevanceWithAI(
            base64Info.data,
            base64Info.mimeType,
            attractionNameClean,
            cityClean,
            stateClean,
            countryClean
          );

          // Track candidate with the highest confidence
          if (!highestConfidenceCandidate || validation.confidence > highestConfidenceCandidate.confidence) {
            highestConfidenceCandidate = {
              url: candidateUrl,
              confidence: validation.confidence,
              source: src.name
            };
          }

          if (validation.isMatch) {
            selectedImageUrl = candidateUrl;
            selectedSource = src.name;
            console.log(`[Pipeline] Approved candidate found: ${candidateUrl} (Score: ${validation.confidence} from ${src.name})`);
            break;
          }
        }
      }
    } catch (srcErr) {
      console.warn(`[Pipeline] Failed querying source ${src.name}:`, srcErr);
    }

    if (selectedImageUrl) break;
  }

  // If no candidate met the 90% confidence threshold, fall back to highest confidence candidate (as long as we got something)
  if (!selectedImageUrl && highestConfidenceCandidate && highestConfidenceCandidate.confidence > 0) {
    selectedImageUrl = highestConfidenceCandidate.url;
    selectedSource = `${highestConfidenceCandidate.source}_fallback_highest`;
    console.log(`[Pipeline] Using fallback highest confidence candidate: ${selectedImageUrl} (Score: ${highestConfidenceCandidate.confidence})`);
  }

  // Final fallback to avoid broken image icons if absolutely nothing was found
  if (!selectedImageUrl) {
    selectedImageUrl = existingData.photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
    selectedSource = 'final_fallback';
  }

  // Upload the selected image to Cloudinary and Cache it
  let finalImageUrl = selectedImageUrl;
  if (selectedSource !== 'final_fallback') {
    try {
      // Since we already downloaded the image for validation, we can convert it to base64 data URL
      const base64Info = await downloadImageAsBase64(selectedImageUrl);
      if (base64Info) {
        const cloudinaryUrl = await uploadToCloudinary(`data:${base64Info.mimeType};base64,${base64Info.data}`);
        if (cloudinaryUrl) {
          finalImageUrl = cloudinaryUrl;
        }
      }
    } catch (uploadErr) {
      console.warn('[Attraction Service] Cloudinary upload failed, using original source url:', uploadErr);
    }
  }

  // Cache in MongoDB and Firestore (if it's not the final fallback)
  if (selectedSource !== 'final_fallback') {
    try {
      // MongoDB
      const mongoDoc = new AttractionImage({
        name: queryKey,
        imageUrl: finalImageUrl,
        placeId: googleData.placeId || '',
        source: selectedSource
      });
      await mongoDoc.save();

      // Firebase Firestore (if initialized)
      if (admin.apps.length > 0) {
        try {
          const db = admin.firestore();
          await db.collection('attraction_images').doc(queryKey).set({
            name: queryKey,
            imageUrl: finalImageUrl,
            placeId: googleData.placeId || '',
            source: selectedSource,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (fErr) {
          console.warn('[Attraction Service] Firestore save failed:', fErr);
        }
      }
    } catch (saveErr) {
      console.warn('[Attraction Service] Failed to save caches:', saveErr);
    }
  }

  const result = {
    name,
    location,
    rating,
    opening_hours: openingHours,
    duration,
    best_time: bestTime,
    category,
    photo: finalImageUrl,
    fee
  };

  localCache[queryKey] = result;
  return result;
}
