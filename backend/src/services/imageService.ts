import axios from 'axios';
import * as admin from 'firebase-admin';
import { uploadToCloudinary } from './upload';

const getGoogleApiKey = () => process.env.GOOGLE_MAPS_API_KEY || '';
const getUnsplashAccessKey = () => process.env.UNSPLASH_ACCESS_KEY || '';
const getPexelsApiKey = () => process.env.PEXELS_API_KEY || '';
const getPixabayApiKey = () => process.env.PIXABAY_API_KEY || '';

// Runtime local cache to prevent duplicate external requests in the same process
const imageMemoryCache = new Map<string, string>();

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

async function downloadImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];
    const mimeType = typeof contentType === 'string' ? contentType : 'image/jpeg';
    const data = buffer.toString('base64');
    return { data, mimeType };
  } catch (err: any) {
    console.warn(`[ImageService] Failed to download image from ${url}:`, err.message);
    return null;
  }
}

// 1. Google Places Photos
async function fetchGooglePlacesPhotos(query: string): Promise<string[]> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return [];
  try {
    const searchRes = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: { query, key: apiKey },
      timeout: 5000
    });
    if (searchRes.data.results && searchRes.data.results.length > 0) {
      const place = searchRes.data.results[0];
      if (place.photos && place.photos.length > 0) {
        return place.photos
          .map((photo: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${photo.photo_reference}&key=${apiKey}`)
          .filter(Boolean);
      }
    }
  } catch (err: any) {
    console.warn('[ImageService - Google Places API] Search failed:', err.message);
  }
  return [];
}

// 2. Pexels API
async function fetchPexelsPhotos(query: string): Promise<string[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: apiKey },
      params: { query, per_page: 5 },
      timeout: 5000
    });
    if (res.data.photos && res.data.photos.length > 0) {
      return res.data.photos.map((p: any) => p.src.large);
    }
  } catch (err: any) {
    console.warn('[ImageService - Pexels API] Search failed:', err.message);
  }
  return [];
}

// 3. Pixabay API
async function fetchPixabayPhotos(query: string): Promise<string[]> {
  const apiKey = getPixabayApiKey();
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: { key: apiKey, q: query, image_type: 'photo', per_page: 5 },
      timeout: 5000
    });
    if (res.data.hits && res.data.hits.length > 0) {
      return res.data.hits.map((h: any) => h.largeImageURL);
    }
  } catch (err: any) {
    console.warn('[ImageService - Pixabay API] Search failed:', err.message);
  }
  return [];
}

// 4. Unsplash API
async function fetchUnsplashPhotos(query: string): Promise<string[]> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return [];
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        Authorization: `Client-ID ${accessKey}`
      },
      params: {
        query: query,
        per_page: 5
      },
      timeout: 5000
    });
    // Check rate limit headers for logging/monitoring
    const limit = res.headers['x-ratelimit-limit'];
    const remaining = res.headers['x-ratelimit-remaining'];
    console.log(`[Unsplash Rate Limit] Limit: ${limit}, Remaining: ${remaining}`);

    if (res.data.results && res.data.results.length > 0) {
      return res.data.results.map((r: any) => r.urls.regular);
    }
  } catch (err: any) {
    console.warn('[ImageService - Unsplash API] Search failed:', err.response?.data || err.message);
  }
  return [];
}

// Main image fetcher using fallback chain
export async function getFallbackPhoto(query: string, fallback: string = ''): Promise<string> {
  const cacheKey = query.toLowerCase().trim();
  if (imageMemoryCache.has(cacheKey)) {
    return imageMemoryCache.get(cacheKey) || fallback;
  }

  // Check Firebase Firestore Cache
  if (admin.apps.length > 0) {
    try {
      const db = admin.firestore();
      const sanitizedDocId = cacheKey.replace(/[^a-z0-9_-]/g, '_').substring(0, 100);
      const cachedDoc = await db.collection('cached_images').doc(sanitizedDocId).get();
      if (cachedDoc.exists) {
        const data = cachedDoc.data();
        if (data && data.imageUrl) {
          console.log(`[ImageService Cache] Firebase hit for "${cacheKey}":`, data.imageUrl);
          imageMemoryCache.set(cacheKey, data.imageUrl);
          return data.imageUrl;
        }
      }
    } catch (fErr: any) {
      console.warn('[ImageService Cache] Firebase read failed:', fErr.message);
    }
  }

  console.log(`[ImageService] Fetching image for "${query}" from providers...`);

  // Provider chain
  const providers = [
    { name: 'google_places', fetch: () => fetchGooglePlacesPhotos(query) },
    { name: 'pexels', fetch: () => fetchPexelsPhotos(query) },
    { name: 'pixabay', fetch: () => fetchPixabayPhotos(query) },
    { name: 'unsplash', fetch: () => fetchUnsplashPhotos(query) }
  ];

  let foundUrl = '';
  let selectedSource = '';

  for (const provider of providers) {
    try {
      console.log(`[ImageService] Querying provider: ${provider.name}`);
      const candidates = await provider.fetch();
      if (candidates && candidates.length > 0) {
        for (const candidateUrl of candidates) {
          const isValid = await validateImageUrl(candidateUrl);
          if (isValid) {
            foundUrl = candidateUrl;
            selectedSource = provider.name;
            console.log(`[ImageService] Approved candidate from ${provider.name}: ${foundUrl}`);
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[ImageService] Provider ${provider.name} query failed:`, err.message);
    }
    if (foundUrl) break;
  }

  if (!foundUrl) {
    console.warn(`[ImageService] No provider returned a valid image for "${query}". Returning fallback.`);
    const ultimateFallback = fallback || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
    imageMemoryCache.set(cacheKey, ultimateFallback);
    return ultimateFallback;
  }

  // Cache image in Cloudinary
  let finalUrl = foundUrl;
  try {
    const base64Info = await downloadImageAsBase64(foundUrl);
    if (base64Info) {
      const cloudinaryUrl = await uploadToCloudinary(`data:${base64Info.mimeType};base64,${base64Info.data}`);
      if (cloudinaryUrl) {
        finalUrl = cloudinaryUrl;
        console.log(`[ImageService] Caching successful! Cloudinary URL: ${finalUrl}`);
      }
    }
  } catch (err: any) {
    console.warn('[ImageService] Cloudinary caching failed, using raw url:', err.message);
  }

  // Save metadata to Firebase Firestore
  if (admin.apps.length > 0) {
    try {
      const db = admin.firestore();
      const sanitizedDocId = cacheKey.replace(/[^a-z0-9_-]/g, '_').substring(0, 100);
      await db.collection('cached_images').doc(sanitizedDocId).set({
        query: query,
        imageUrl: finalUrl,
        source: selectedSource,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[ImageService Cache] Saved cache in Firebase Firestore for "${cacheKey}"`);
    } catch (fErr: any) {
      console.warn('[ImageService Cache] Firebase save failed:', fErr.message);
    }
  }

  imageMemoryCache.set(cacheKey, finalUrl);
  return finalUrl;
}
