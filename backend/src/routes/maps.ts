import { Router } from 'express';
import axios from 'axios';
import { getFallbackPhoto } from '../services/imageService';

const router = Router();
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || '';
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const unsplashCache = new Map<string, string>();

async function getUnsplashPhoto(query: string, fallback: string): Promise<string> {
  try {
    return await getFallbackPhoto(query, fallback);
  } catch (err: any) {
    console.warn(`[maps POI Unsplash] Failed to get photo for "${query}":`, err.message);
    return fallback;
  }
}

const CITY_FALLBACK_IMAGES: Record<string, string[]> = {
  bangalore: [
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
    'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600&q=80',
    'https://images.unsplash.com/photo-1627306036351-036986f292a9?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1741769971460-aad286ffe96b?w=600&q=80',
    'https://images.unsplash.com/photo-1671074344915-0dc2ba44c668?w=600&q=80',
    'https://images.unsplash.com/photo-1573330013103-79abb849927b?w=600&q=80',
    'https://images.unsplash.com/photo-1671074344915-0dc2ba44c668?w=600&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ],
  goa: [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    'https://images.unsplash.com/photo-1696235446230-472f19e9a55b?w=600&q=80',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',
    'https://images.unsplash.com/photo-1652820330085-82a0c2b88d78?w=600&q=80',
    'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=600&q=80',
    'https://images.unsplash.com/photo-1675613948277-7ae2195c8fde?w=600&q=80',
    'https://images.unsplash.com/photo-1649542783831-33974dac818f?w=600&q=80',
    'https://images.unsplash.com/photo-1642313281504-77925e214635?w=600&q=80',
    'https://images.unsplash.com/photo-1579783411194-f697db862dcd?w=600&q=80',
    'https://images.unsplash.com/photo-1701430662597-ff86c1cba95a?w=600&q=80',
    'https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?w=600&q=80'
  ],
  london: [
    'https://images.unsplash.com/photo-1746393333137-66e59d72eb0b?w=600&q=80',
    'https://images.unsplash.com/photo-1610719798062-d4fb368a3364?w=600&q=80',
    'https://images.unsplash.com/photo-1650060823261-8f817b8af0a4?w=600&q=80',
    'https://images.unsplash.com/photo-1679159469983-9d16a01cbaaa?w=600&q=80',
    'https://images.unsplash.com/photo-1679581810919-a17ea7b86726?w=600&q=80',
    'https://images.unsplash.com/photo-1622916053149-008b5a2673d1?w=600&q=80',
    'https://images.unsplash.com/photo-1622916053149-008b5a2673d1?w=600&q=80',
    'https://images.unsplash.com/photo-1485182708500-e8f1f318ba72?w=600&q=80',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80',
    'https://images.unsplash.com/photo-1650435489945-96b2b19b943b?w=600&q=80',
    'https://images.unsplash.com/photo-1700923884850-761f1da0c0e7?w=600&q=80',
    'https://images.unsplash.com/photo-1482685945432-29a7abf2f466?w=600&q=80'
  ],
  paris: [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
    'https://images.unsplash.com/photo-1510253687831-0f982d7862fc?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1581262208382-c2dad6c67c9b?w=600&q=80',
    'https://images.unsplash.com/photo-1638290046992-db6003db69d1?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ],
  delhi: [
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ],
  mumbai: [
    'https://images.unsplash.com/photo-1566557623262-b51c2513a641?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600&q=80',
    'https://images.unsplash.com/photo-1570168007244-df7a628efccd?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ],
  manali: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ],
  jaipur: [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80',
    'https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=600&q=80'
  ]
};

function getCityFallbackImage(cityKey: string, itemName: string, originalImage: string): string {
  const images = CITY_FALLBACK_IMAGES[cityKey];
  if (!images || images.length === 0) return originalImage;
  
  const lowerName = itemName.toLowerCase();
  
  // Specific fallbacks for attractions
  if (lowerName.includes('heritage palace')) return images[0 % images.length];
  if (lowerName.includes('botanical gardens')) return images[1 % images.length];
  if (lowerName.includes('art & science museum')) return images[2 % images.length];
  if (lowerName.includes('sunset point overlook')) return images[3 % images.length];
  
  // Specific fallbacks for hotels
  if (lowerName.includes('grand palace resort')) return images[4 % images.length];
  if (lowerName.includes('central residency')) return images[5 % images.length];
  if (lowerName.includes('zostel backpackers')) return images[6 % images.length];
  
  // Specific fallbacks for restaurants
  if (lowerName.includes('spice junction')) return images[7 % images.length];
  if (lowerName.includes('the green bistro')) return images[8 % images.length];
  if (lowerName.includes('coastal seafood grill')) return images[9 % images.length];
  
  // Specific fallbacks for gems
  if (lowerName.includes('ancient cave temple')) return images[10 % images.length];
  if (lowerName.includes('hidden forest waterfall')) return images[11 % images.length];

  return images[0];
}

// 1. Config endpoint to expose the public key
router.get('/maps/config', (req, res) => {
  return res.json({ success: true, googleMapsApiKey: GOOGLE_KEY });
});

// 2. Google Place Autocomplete suggestion endpoint
router.get('/maps/autocomplete', async (req, res) => {
  const input = req.query.input ? String(req.query.input) : '';
  if (!input) {
    return res.json({ success: true, predictions: [] });
  }

  if (!GOOGLE_KEY) {
    return res.status(500).json({ success: false, error: 'Google API key is not configured' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: GOOGLE_KEY,
        language: 'en'
      }
    });
    return res.json({ success: true, predictions: response.data.predictions || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  }, { timeout: 10000 });
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// 3. Google Geocode endpoint (using Google Geocoding API, fallback to Nominatim/Gemini)
router.get('/maps/geocode', async (req, res) => {
  const address = req.query.address ? String(req.query.address) : '';
  if (!address) {
    return res.status(400).json({ success: false, error: 'address is required' });
  }

  // 1. Try Google Geocoding API first if configured and not dummy key
  const isDummyKey = !GOOGLE_KEY || GOOGLE_KEY.startsWith('AIzaSyC1PDk5');
  if (GOOGLE_KEY && !isDummyKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`;
      const response = await axios.get(url, {
        params: {
          address,
          key: GOOGLE_KEY
        },
        timeout: 5000
      });

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return res.json({
          success: true,
          location: result.geometry.location,
          name: result.formatted_address,
          place_id: result.place_id
        });
      }
    } catch (error: any) {
      console.warn('Google Geocoding API failed, falling back:', error.message);
    }
  }

  // 2. Try Nominatim Geocoder next (free, accurate, no key required)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'TravelSphere-AI-App'
      },
      timeout: 4000
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return res.json({
        success: true,
        location: { lat: parseFloat(result.lat), lng: parseFloat(result.lon) },
        name: result.display_name,
        place_id: String(result.place_id || result.osm_id || '')
      });
    }
  } catch (error: any) {
    console.warn('Nominatim geocoding failed, falling back to Gemini geocoding:', error.message);
  }

  // 3. Try Gemini Geocoder fallback
  try {
    const prompt = `Find the latitude, longitude, and full formatted address for: "${address}". 
    Respond in JSON format: { "lat": number, "lng": number, "name": "string", "place_id": "string" }`;
    const resultText = await callGemini(prompt);
    const resultJson = JSON.parse(resultText);
    if (resultJson.lat !== undefined && resultJson.lng !== undefined) {
      return res.json({
        success: true,
        location: { lat: resultJson.lat, lng: resultJson.lng },
        name: resultJson.name || address,
        place_id: resultJson.place_id || 'gemini-fallback-place'
      });
    }
  } catch (err: any) {
    console.warn('Gemini geocoding failed:', err.message);
  }

  // 4. Ultimate default fallback coordinates for safety if everything fails
  return res.json({
    success: true,
    location: { lat: 13.0827, lng: 80.2707 }, // Chennai default
    name: `${address}, India`,
    place_id: 'default-fallback-place'
  });
});

// 3.5. Google Reverse Geocode endpoint (using Google Geocoding API with latlng, fallback to Nominatim/Gemini)
router.get('/maps/reverse-geocode', async (req, res) => {
  const lat = req.query.lat ? String(req.query.lat) : '';
  const lng = req.query.lng ? String(req.query.lng) : '';

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'lat and lng are required' });
  }

  // 1. Try Google Reverse Geocoding API first if configured and not dummy key
  const isDummyKey = !GOOGLE_KEY || GOOGLE_KEY.startsWith('AIzaSyC1PDk5');
  if (GOOGLE_KEY && !isDummyKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`;
      const response = await axios.get(url, {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_KEY
        },
        timeout: 5000
      });

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.address_components || [];
        
        let city = '';
        let district = '';
        let state = '';
        let country = '';
        let postalCode = '';

        for (const comp of components) {
          const types = comp.types || [];
          if (types.includes('locality') || types.includes('postal_town')) {
            city = comp.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            district = comp.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          } else if (types.includes('country')) {
            country = comp.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = comp.long_name;
          }
        }

        // Fallbacks for city if locality is missing
        if (!city) {
          for (const comp of components) {
            const types = comp.types || [];
            if (types.includes('administrative_area_level_3') || types.includes('sublocality') || types.includes('sublocality_level_1')) {
              city = comp.long_name;
              break;
            }
          }
        }

        return res.json({
          success: true,
          formatted_address: result.formatted_address,
          city: city || 'Local Area',
          district: district || 'Local District',
          state: state || 'Local State',
          country: country || 'Local Country',
          postal_code: postalCode || 'N/A'
        });
      }
    } catch (error: any) {
      console.warn('Google Reverse Geocoding API failed, falling back:', error.message);
    }
  }

  // 2. Try Nominatim reverse geocoder next (free, accurate, no key required)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'TravelSphere-AI-App'
      },
      timeout: 4000
    });

    if (response.data) {
      const result = response.data;
      const addr = result.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || 'Local Area';
      const district = addr.county || addr.city_district || addr.district || 'Local District';
      const state = addr.state || 'Local State';
      const country = addr.country || 'Local Country';
      const postalCode = addr.postcode || 'N/A';

      return res.json({
        success: true,
        formatted_address: result.display_name,
        city,
        district,
        state,
        country,
        postal_code: postalCode
      });
    }
  } catch (error: any) {
    console.warn('Nominatim reverse geocoding failed, falling back to Gemini:', error.message);
  }

  // 3. Try Gemini reverse geocoder fallback
  try {
    const prompt = `Identify the city, district, state, country, postal code, and formatted address for coordinates lat: ${lat}, lng: ${lng}. 
    Respond in JSON format: { "city": "string", "district": "string", "state": "string", "country": "string", "postal_code": "string", "formatted_address": "string" }`;
    const resultText = await callGemini(prompt);
    const resultJson = JSON.parse(resultText);
    return res.json({
      success: true,
      formatted_address: resultJson.formatted_address || `${lat}, ${lng}`,
      city: resultJson.city || 'Local Area',
      district: resultJson.district || 'Local District',
      state: resultJson.state || 'Local State',
      country: resultJson.country || 'Local Country',
      postal_code: resultJson.postal_code || 'N/A'
    });
  } catch (err: any) {
    console.warn('Gemini reverse geocoding failed:', err.message);
  }

  // 4. Default fallback
  return res.json({
    success: true,
    formatted_address: `Coordinates: ${lat}, ${lng}`,
    city: 'Local Area',
    district: 'Local District',
    state: 'Local State',
    country: 'India',
    postal_code: 'N/A'
  });
});

// Helper: Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`;
}

// Helper: Map Google place type to friendly category name
function getCategoryAndDescription(types: string[], name: string) {
  let category = 'Sightseeing';
  let description = `A popular point of interest in the area.`;

  const lowerName = name.toLowerCase();

  if (types.includes('hindu_temple') || types.includes('church') || types.includes('place_of_worship')) {
    category = 'Religious Site';
    description = `A beautiful place of worship holding deep historical and spiritual significance.`;
  } else if (types.includes('museum') || types.includes('art_gallery')) {
    category = 'Cultural Museum';
    description = `An enriching museum featuring captivating historical exhibits, local art, and archives.`;
  } else if (types.includes('park') || types.includes('amusement_park') || types.includes('zoo')) {
    category = 'Park & Recreation';
    description = `A pleasant outdoor park area offering green spaces, recreational activities, and relaxing scenery.`;
  } else if (types.includes('lodging')) {
    category = 'Hotel & Stay';
    description = `A comfortable lodging option featuring modern amenities, excellent hospitality, and convenient access.`;
  } else if (types.includes('restaurant') || types.includes('cafe') || types.includes('food') || types.includes('bar')) {
    category = 'Dining & Cuisine';
    description = `A highly rated venue known for serving local specialties, culinary treats, and warm dining experiences.`;
  } else if (lowerName.includes('beach') || lowerName.includes('island') || lowerName.includes('coast')) {
    category = 'Scenic Beach';
    description = `A gorgeous beach destination offering soothing waves, golden sand, and scenic coastal vistas.`;
  } else if (lowerName.includes('palace') || lowerName.includes('fort') || lowerName.includes('castle') || lowerName.includes('monument')) {
    category = 'Historic Landmark';
    description = `A majestic historical monument representing rich heritage, royal architecture, and local history.`;
  } else if (types.includes('transit_station') || types.includes('bus_station') || types.includes('train_station') || lowerName.includes('station') || lowerName.includes('terminal') || lowerName.includes('metro')) {
    category = 'Transport Station';
    description = `A central transit station facilitating city-wide travel, public buses, trains, and metro routes.`;
  } else if (types.includes('airport') || lowerName.includes('airport')) {
    category = 'Airport Hub';
    description = `A major airport terminal connecting this region to global flight paths.`;
  }

  return { category, description };
}

// 4. Fetch dynamic attractions, hotels, restaurants, hidden gems
router.get('/maps/places', async (req, res) => {
  const latStr = req.query.lat ? String(req.query.lat) : '';
  const lngStr = req.query.lng ? String(req.query.lng) : '';
  const query = req.query.query ? String(req.query.query) : '';

  if (!latStr || !lngStr || !query) {
    return res.status(400).json({ success: false, error: 'lat, lng, and query are required' });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  let attractionsResults: any[] = [];
  let hotelsResults: any[] = [];
  let restaurantsResults: any[] = [];
  let gemsResults: any[] = [];
  let cityInfo = { population: 'N/A', best_time_to_visit: 'N/A' };

  const isDummyKey = !GOOGLE_KEY || GOOGLE_KEY.startsWith('AIzaSyC1PDk5');
  let loadedFromGoogle = false;

  if (!isDummyKey) {
    try {
      const [attractionsResp, hotelsResp, restaurantsResp, gemsResp] = await Promise.all([
        axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: { query: `top tourist attractions in ${query}`, key: GOOGLE_KEY, language: 'en' }
        }),
        axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: { query: `top hotels in ${query}`, key: GOOGLE_KEY, language: 'en' }
        }),
        axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: { query: `top restaurants in ${query}`, key: GOOGLE_KEY, language: 'en' }
        }),
        axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: { query: `unique offbeat hidden gems in ${query}`, key: GOOGLE_KEY, language: 'en' }
        })
      ]);

      if (attractionsResp.data.status === 'OK') {
        attractionsResults = attractionsResp.data.results || [];
        hotelsResults = hotelsResp.data.results || [];
        restaurantsResults = restaurantsResp.data.results || [];
        gemsResults = gemsResp.data.results || [];
        loadedFromGoogle = true;
      }
    } catch (err: any) {
      console.warn('Google Places API call failed:', err.message);
    }
  }

  // If Google API failed or billing is not enabled, use Gemini to generate real, local places dynamically!
  if (!loadedFromGoogle || attractionsResults.length === 0) {
    try {
      const prompt = `You are a travel assistant. Generate popular, real, and authentic local places in "${query}" (centered at latitude ${lat}, longitude ${lng}).
      The output must be a single JSON object matching this structure:
      {
        "city_info": {
          "population": "string (e.g. 8.7 million, 2.2 million)",
          "best_time_to_visit": "string (e.g. Nov - Feb)"
        },
        "attractions": [
          {
            "name": "string (real, popular attraction in ${query})",
            "rating": number,
            "types": ["tourist_attraction", "park", "museum", "palace", "landmark", "place_of_worship"],
            "geometry": { "location": { "lat": number, "lng": number } },
            "image": "string (optimized search term for Unsplash matching this specific place)",
            "description": "string (compelling 1-2 sentence description)"
          }
        ],
        "hotels": [
          {
            "name": "string (real, popular hotel/resort in ${query})",
            "rating": number,
            "types": ["lodging"],
            "geometry": { "location": { "lat": number, "lng": number } },
            "image": "string (optimized search term for Unsplash)",
            "description": "string"
          }
        ],
        "restaurants": [
          {
            "name": "string (real, popular restaurant/cafe in ${query})",
            "rating": number,
            "types": ["restaurant", "cafe"],
            "geometry": { "location": { "lat": number, "lng": number } },
            "image": "string (optimized search term for Unsplash)",
            "description": "string"
          }
        ],
        "hidden_gems": [
          {
            "name": "string (real, offbeat/hidden gem tourist attraction in ${query})",
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
      1. Do not include markdown formatting or backticks. Return only raw, valid JSON.
      2. All geometry coordinates MUST be real coordinates in ${query} or offsets within a strict 5-10km radius of the centered coordinates (${lat}, ${lng}).
      3. Only recommend places situated inside "${query}" itself. Never recommend places outside.`;

      const resultText = await callGemini(prompt);
      const parsedData = JSON.parse(resultText);

      if (parsedData.attractions) attractionsResults = parsedData.attractions;
      if (parsedData.hotels) hotelsResults = parsedData.hotels;
      if (parsedData.restaurants) restaurantsResults = parsedData.restaurants;
      if (parsedData.hidden_gems) gemsResults = parsedData.hidden_gems;
      if (parsedData.city_info) cityInfo = parsedData.city_info;
    } catch (err: any) {
      console.warn('Gemini dynamic place generation failed, falling back to basic mock generator:', err.message);
      attractionsResults = [
        { name: `${query} Heritage Palace`, rating: 4.8, types: ['tourist_attraction', 'palace'], geometry: { location: { lat: lat + 0.005, lng: lng - 0.003 } }, image: `${query} palace`, description: `A popular landmark in the heart of ${query}.` },
        { name: `${query} Botanical Gardens`, rating: 4.6, types: ['park', 'garden'], geometry: { location: { lat: lat - 0.008, lng: lng + 0.006 } }, image: `${query} garden`, description: `Lush green gardens in ${query}.` }
      ];
    }
  }

  const formatPlaces = (results: any[], defaultCatPrice: string) => {
    return (results || []).slice(0, 10).map((p: any) => {
      const { category, description } = getCategoryAndDescription(p.types || [], p.name);
      
      let price = defaultCatPrice;
      if (p.price_level !== undefined) {
        price = '$'.repeat(p.price_level + 1);
      } else if (p.types?.includes('tourist_attraction') && !p.types?.includes('museum')) {
        price = 'Free';
      }

      const photoRef = p.photos?.[0]?.photo_reference || '';
      const photoUrl = p.image || (photoRef 
        ? `/api/v1/itinerary/place-photo?ref=${photoRef}` 
        : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80');

      const placeLat = p.geometry?.location?.lat ?? lat;
      const placeLng = p.geometry?.location?.lng ?? lng;

      return {
        name: p.name,
        category: category,
        distance: calculateDistance(lat, lng, placeLat, placeLng),
        rating: p.rating || 4.5,
        price: price,
        coord: { lat: placeLat, lng: placeLng },
        photo_reference: photoRef,
        image: photoUrl,
        description: p.description || description
      };
    });
  };

  const cleanCity = query.split(',')[0].trim();

  const resolveImages = async (list: any[]) => {
    await Promise.all(
      list.map(async (item) => {
        const searchKeyword = (typeof item.image === 'string' && item.image.length > 5 && !item.image.startsWith('http')) 
          ? item.image 
          : `${cleanCity} ${item.name.replace(query, '').trim()}`;

        let img = await getUnsplashPhoto(searchKeyword, '');
        if (img) {
          item.image = img;
          return;
        }

        // Try clean fallback keyword
        let categoryKeyword = 'sightseeing';
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('resort')) categoryKeyword = 'resort';
        else if (lowerName.includes('hotel')) categoryKeyword = 'hotel';
        else if (lowerName.includes('restaurant')) categoryKeyword = 'restaurant';
        else if (lowerName.includes('cafe') || lowerName.includes('bistro')) categoryKeyword = 'cafe';
        else if (lowerName.includes('waterfall')) categoryKeyword = 'waterfall';
        else if (lowerName.includes('temple') || lowerName.includes('church') || lowerName.includes('cave')) categoryKeyword = 'temple';
        else if (lowerName.includes('museum') || lowerName.includes('art')) categoryKeyword = 'museum';
        else if (lowerName.includes('garden') || lowerName.includes('park')) categoryKeyword = 'park';
        else if (lowerName.includes('palace') || lowerName.includes('fort')) categoryKeyword = 'palace';

        img = await getUnsplashPhoto(`${cleanCity} ${categoryKeyword}`, '');
        if (img) {
          item.image = img;
          return;
        }

        // Curated city-specific fallback when Unsplash fails
        item.image = getCityFallbackImage(cleanCity.toLowerCase(), item.name, item.image);
      })
    );
  };

  await Promise.all([
    resolveImages(attractionsResults),
    resolveImages(hotelsResults),
    resolveImages(restaurantsResults),
    resolveImages(gemsResults)
  ]);

  return res.json({
    success: true,
    data: {
      city_info: cityInfo,
      attractions: formatPlaces(attractionsResults, 'Free'),
      hotels: formatPlaces(hotelsResults, '$$'),
      restaurants: formatPlaces(restaurantsResults, '$$'),
      hidden_gems: formatPlaces(gemsResults, 'Free')
    }
  });
});

// 5. Google Directions Route
router.get('/maps/directions', async (req, res) => {
  const origin = req.query.origin ? String(req.query.origin) : '';
  const destination = req.query.destination ? String(req.query.destination) : '';

  if (!origin || !destination) {
    return res.status(400).json({ success: false, error: 'origin and destination are required' });
  }

  if (!GOOGLE_KEY) {
    return res.status(500).json({ success: false, error: 'Google API key is not configured' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        key: GOOGLE_KEY,
        mode: 'driving'
      }
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      const steps = (leg.steps || []).map((s: any) => ({
        step: s.html_instructions.replace(/<[^>]*>/g, ''), // Strip html tags
        dist: s.distance?.text || ''
      }));

      // Decode overview polyline points for maps rendering (optional but nice)
      const points = route.overview_polyline?.points || '';

      return res.json({
        success: true,
        steps,
        points,
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || ''
      });
    } else {
      return res.status(404).json({ success: false, error: 'No routes found' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. OpenWeather 7-Day weather forecast proxy
router.get('/maps/weather', async (req, res) => {
  const lat = req.query.lat ? String(req.query.lat) : '';
  const lng = req.query.lng ? String(req.query.lng) : '';
  const name = req.query.name ? String(req.query.name) : '';

  if (!OPENWEATHER_KEY) {
    return res.json({
      success: true,
      weather_forecast: [
        { day: 'Mon', temp: '26°C', condition: 'Sunny' },
        { day: 'Tue', temp: '25°C', condition: 'Sunny' },
        { day: 'Wed', temp: '27°C', condition: 'Partly Cloudy' },
        { day: 'Thu', temp: '24°C', condition: 'Light Rain' },
        { day: 'Fri', temp: '25°C', condition: 'Sunny' },
        { day: 'Sat', temp: '26°C', condition: 'Clear' },
        { day: 'Sun', temp: '28°C', condition: 'Clear' }
      ]
    });
  }

  try {
    const params: any = {
      appid: OPENWEATHER_KEY,
      units: 'metric'
    };

    if (lat && lng) {
      params.lat = lat;
      params.lon = lng;
    } else if (name) {
      params.q = name;
    } else {
      return res.status(400).json({ success: false, error: 'lat/lng or name is required' });
    }

    const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', { params });
    const list = weatherResponse.data?.list || [];
    const dailyForecasts: any[] = [];
    const seenDates = new Set<string>();

    for (const item of list) {
      const dateStr = item.dt_txt.split(' ')[0];
      if (!seenDates.has(dateStr) && dailyForecasts.length < 7) {
        seenDates.add(dateStr);
        const dateObj = new Date(dateStr);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const condition = item.weather?.[0]?.main || 'Clear';
        const temp = `${Math.round(item.main.temp)}°C`;
        dailyForecasts.push({
          day: dayName,
          temp,
          condition
        });
      }
    }

    return res.json({ success: true, weather_forecast: dailyForecasts });
  } catch (err: any) {
    // Graceful fallback
    return res.json({
      success: true,
      weather_forecast: [
        { day: 'Mon', temp: '26°C', condition: 'Sunny' },
        { day: 'Tue', temp: '25°C', condition: 'Sunny' },
        { day: 'Wed', temp: '27°C', condition: 'Partly Cloudy' },
        { day: 'Thu', temp: '24°C', condition: 'Light Rain' },
        { day: 'Fri', temp: '25°C', condition: 'Sunny' },
        { day: 'Sat', temp: '26°C', condition: 'Clear' },
        { day: 'Sun', temp: '28°C', condition: 'Clear' }
      ]
    });
  }
});

export default router;
