import axios from 'axios';
import { CURATED_DESTINATIONS } from './curated-data';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

export interface RealtimeFilters {
  source: string;
  destination: string;
  startDate: string;     // 'YYYY-MM-DD'
  endDate: string;       // 'YYYY-MM-DD'
  budget: number;
  travelType: string;    // 'Solo'|'Couple'|'Family'|'Friends'|'Adventure'|'Luxury'|'Backpacking'|'Business'
  travelers: number;
  themes?: string[];
  accommodation?: string;
  mealPreference?: string;
  specialNeeds?: string;
}

// ──────────────────────────────────────────────────────────────
// 1. Google Places — fetch top attractions for destination
// ──────────────────────────────────────────────────────────────
export async function fetchPlaces(destination: string, type: string, limit = 20): Promise<any[]> {
  if (!GOOGLE_KEY) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const resp = await axios.get(url, {
      params: {
        query: `top ${type} in ${destination}`,
        key: GOOGLE_KEY,
        language: 'en'
      }
    });
    return (resp.data.results || []).slice(0, limit);
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 2. Get Place Photo URL (proxied reference)
// ──────────────────────────────────────────────────────────────
export function getPlacePhotoUrl(photoReference: string, maxWidth = 800): string {
  if (!photoReference || !GOOGLE_KEY) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_KEY}`;
}

// ──────────────────────────────────────────────────────────────
// 3. OpenWeather — 5-day forecast for destination
// ──────────────────────────────────────────────────────────────
export async function fetchWeatherForecast(destination: string, days: number): Promise<any[]> {
  if (!OPENWEATHER_KEY) return [];
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast`;
    const resp = await axios.get(url, {
      params: {
        q: destination + ',IN',
        appid: OPENWEATHER_KEY,
        units: 'metric',
        cnt: Math.min(days * 8, 40)  // 8 readings per day (3h intervals)
      }
    });

    // Group by day and pick the midday (12:00) reading
    const byDay: Record<string, any> = {};
    for (const item of resp.data.list || []) {
      const date = item.dt_txt.split(' ')[0];
      if (!byDay[date]) byDay[date] = item;
      if (item.dt_txt.includes('12:00')) byDay[date] = item;  // prefer noon reading
    }

    return Object.entries(byDay).slice(0, days).map(([date, item]: [string, any]) => ({
      date,
      temp_max: Math.round(item.main.temp_max),
      temp_min: Math.round(item.main.temp_min),
      feels_like: Math.round(item.main.feels_like),
      condition: item.weather[0].main,           // 'Rain', 'Clear', 'Clouds'
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      rain_chance: Math.round((item.pop || 0) * 100),
      humidity: item.main.humidity,
      wind_speed: Math.round(item.wind.speed * 3.6),  // m/s → km/h
    }));
  } catch (e) {
    console.warn('OpenWeather fetch failed:', e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 4. Distance Matrix — travel time between consecutive places
// ──────────────────────────────────────────────────────────────
export async function fetchDistanceMatrix(origins: string[], destinations: string[]): Promise<any> {
  if (!GOOGLE_KEY || origins.length === 0) return null;
  try {
    const resp = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        key: GOOGLE_KEY,
        units: 'metric',
        mode: 'driving'
      }
    });
    return resp.data;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Helper Functions for Geolocation & Weather
// ──────────────────────────────────────────────────────────────
export function getDistance(p1: any, p2: any): number {
  const lat1 = p1.geometry?.location?.lat;
  const lng1 = p1.geometry?.location?.lng;
  const lat2 = p2.geometry?.location?.lat;
  const lng2 = p2.geometry?.location?.lng;
  
  if (lat1 !== undefined && lng1 !== undefined && lat2 !== undefined && lng2 !== undefined) {
    const dy = lat1 - lat2;
    const dx = lng1 - lng2;
    return Math.sqrt(dx * dx + dy * dy);
  }
  return 1;
}

export function isOutdoorPlace(place: any): boolean {
  const name = (place.name || '').toLowerCase();
  const types = (place.types || []).join(' ').toLowerCase();
  return (
    name.includes('beach') ||
    name.includes('waterfall') ||
    name.includes('lake') ||
    name.includes('trek') ||
    name.includes('park') ||
    name.includes('garden') ||
    name.includes('view point') ||
    name.includes('viewpoint') ||
    name.includes('sunset') ||
    types.includes('natural_feature') ||
    types.includes('park') ||
    place.outdoor === true
  );
}

// ──────────────────────────────────────────────────────────────
// 6. Travel type → category preferences
// ──────────────────────────────────────────────────────────────
export function getTravelTypeCategories(travelType: string): string[] {
  const map: Record<string, string[]> = {
    'Couple':       ['romantic', 'fine dining', 'sunset point', 'spa', 'viewpoint'],
    'Family':       ['family attraction', 'park', 'museum', 'zoo', 'amusement'],
    'Adventure':    ['trekking', 'water sports', 'adventure', 'hiking', 'rafting'],
    'Luxury':       ['luxury', '5 star', '4 star', 'premium', 'resort', 'spa'],
    'Backpacking':  ['hostel', 'budget', 'street food', 'local market', 'budget stay'],
    'Friends':      ['nightlife', 'bar', 'group activity', 'beach', 'street food'],
    'Business':     ['conference', 'business hotel', 'airport', 'lounge'],
    'Solo':         ['cafe', 'museum', 'solo travel', 'cultural', 'photography'],
  };
  return map[travelType] || ['attraction', 'sightseeing'];
}

// ──────────────────────────────────────────────────────────────
// Procedural Destination Generator (for unsupported inputs)
// ──────────────────────────────────────────────────────────────
function generateProceduralPlaces(destination: string): any {
  const capDest = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const attractions = [
    {
      name: `${capDest} Heritage Palace`,
      description: `Explore the magnificent courtyards, ancient weaponry exhibits, and royal galleries at ${capDest} Heritage Palace.`,
      vicinity: `Old Town District, ${capDest}`,
      rating: 4.7,
      user_ratings_total: 1850,
      estimated_cost: 100,
      visit_duration_hours: 2.0,
      tips: "Hire a local guide at the gate. Wear comfortable shoes.",
      best_time_to_visit: "09:00 AM - 11:30 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800",
      types: ["tourist_attraction", "museum", "heritage"]
    },
    {
      name: `${capDest} Cathedral of St. Luke`,
      description: `An architectural marvel from the 18th century, famous for its stained-glass windows and peaceful prayers.`,
      vicinity: `Church Square, ${capDest}`,
      rating: 4.6,
      user_ratings_total: 940,
      estimated_cost: 0,
      visit_duration_hours: 1.0,
      tips: "Maintain absolute silence. Dress modestly.",
      best_time_to_visit: "10:00 AM - 11:30 AM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?w=800",
      types: ["church", "place_of_worship", "heritage"]
    },
    {
      name: `${capDest} Botanical Gardens`,
      description: `A lush conservatory containing hundreds of species of tropical plants, walking paths, and glasshouses.`,
      vicinity: `Green Avenue, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 1240,
      estimated_cost: 30,
      visit_duration_hours: 1.5,
      tips: "Excellent spot for bird watching. Carry mosquito repellent.",
      best_time_to_visit: "07:30 AM - 09:30 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800",
      types: ["park", "garden", "nature"]
    },
    {
      name: `${capDest} Central Shopping Mall`,
      description: `The premier retail hub of the city, hosting global fashion brands, a huge food court, and multiplexes.`,
      vicinity: `City Center Plaza, ${capDest}`,
      rating: 4.4,
      user_ratings_total: 4100,
      estimated_cost: 0,
      visit_duration_hours: 2.5,
      tips: "Great place to escape afternoon heat or rain. Try local fast foods.",
      best_time_to_visit: "01:00 PM - 03:30 PM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
      types: ["shopping_mall", "establishment"]
    },
    {
      name: `${capDest} Old Town Market`,
      description: `A bustling open-air market selling traditional spices, handmade souvenirs, and local textiles.`,
      vicinity: `Bazaar Street, ${capDest}`,
      rating: 4.3,
      user_ratings_total: 2850,
      estimated_cost: 0,
      visit_duration_hours: 2.0,
      tips: "Be prepared to bargain. Watch out for pickpockets.",
      best_time_to_visit: "04:30 PM - 07:00 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
      types: ["local_market", "shopping"]
    },
    {
      name: `${capDest} Sunset Point Overlook`,
      description: `A popular cliffside vantage point offering breathtaking panoramic views of the sunset over the valley.`,
      vicinity: `Hill Ridge Road, ${capDest}`,
      rating: 4.7,
      user_ratings_total: 3400,
      estimated_cost: 0,
      visit_duration_hours: 1.5,
      tips: "Arrive 45 minutes before sunset to secure the best photo spots.",
      best_time_to_visit: "05:00 PM - 06:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800",
      types: ["viewpoint", "scenic"]
    },
    {
      name: `${capDest} Adventure Valley Trek`,
      description: `A scenic, moderately challenging trekking trail climbing up to the highest peak in the region.`,
      vicinity: `North Foothills, ${capDest}`,
      rating: 4.6,
      user_ratings_total: 820,
      estimated_cost: 200,
      visit_duration_hours: 3.5,
      tips: "Wear sturdy hiking boots. Carry plenty of drinking water.",
      best_time_to_visit: "06:30 AM - 10:00 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1627894006066-b45b4c5b7b9d?w=800",
      types: ["trek", "adventure", "nature"]
    },
    {
      name: `${capDest} Science & History Museum`,
      description: `Learn about regional scientific developments and history through interactive and informative exhibits.`,
      vicinity: `Museum Road, ${capDest}`,
      rating: 4.4,
      user_ratings_total: 1540,
      estimated_cost: 50,
      visit_duration_hours: 2.0,
      tips: "Good for families. Audioguides are highly recommended.",
      best_time_to_visit: "10:30 AM - 01:00 PM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800",
      types: ["museum", "cultural"]
    },
    {
      name: `${capDest} National Sanctuary Park`,
      description: `A dense forest sanctuary hosting native animal species, birds, and guided nature safari tours.`,
      vicinity: `Sanctuary Forest, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 2150,
      estimated_cost: 300,
      visit_duration_hours: 3.0,
      tips: "Book the early morning jungle safari for higher chances of animal sightings.",
      best_time_to_visit: "07:00 AM - 10:00 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800",
      types: ["sanctuary", "park", "nature"]
    },
    {
      name: `${capDest} Golden Sands Beach`,
      description: `A wide sandy beach perfect for sunbathing, swimming, and tasting fresh local snacks at beach stalls.`,
      vicinity: `Marine Drive, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 5400,
      estimated_cost: 0,
      visit_duration_hours: 2.5,
      tips: "Carry towels and change of dry clothing. Avoid swimming during high tides.",
      best_time_to_visit: "04:00 PM - 06:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      types: ["beach", "nature"]
    },
    {
      name: `${capDest} Ancient Caves & Temple`,
      description: `Beautiful rock-cut cave temples dedicated to ancient deities, featuring detailed stone wall carvings.`,
      vicinity: `Cave Hill, ${capDest}`,
      rating: 4.7,
      user_ratings_total: 1650,
      estimated_cost: 40,
      visit_duration_hours: 1.5,
      tips: "Requires climbing about 80 stone steps. Watch out for monkeys.",
      best_time_to_visit: "08:00 AM - 09:30 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
      types: ["cave", "temple", "heritage"]
    },
    {
      name: `${capDest} Fine Arts Center`,
      description: `Exhibiting outstanding contemporary and classical artwork from regional and national artists.`,
      vicinity: `Gallery Road, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 780,
      estimated_cost: 20,
      visit_duration_hours: 1.5,
      tips: "Check their calendar for workshops and live painting displays.",
      best_time_to_visit: "02:30 PM - 04:00 PM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
      types: ["gallery", "cultural"]
    },
    {
      name: `${capDest} Riverside Walkway`,
      description: `A beautifully paved pedestrian boulevard lining the city river, featuring sunset cafes.`,
      vicinity: `River Bank Road, ${capDest}`,
      rating: 4.4,
      user_ratings_total: 3200,
      estimated_cost: 0,
      visit_duration_hours: 1.5,
      tips: "Excellent place to rent a bicycle and explore the path.",
      best_time_to_visit: "05:00 PM - 06:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
      types: ["promenade", "nature"]
    },
    {
      name: `${capDest} River Cruise`,
      description: `A pleasant boat cruise along the main river, showcasing local folk music and scenic water views.`,
      vicinity: `Central Jetty, ${capDest}`,
      rating: 4.2,
      user_ratings_total: 2100,
      estimated_cost: 400,
      visit_duration_hours: 1.5,
      tips: "The evening cruise offers beautiful sights of the city lights.",
      best_time_to_visit: "06:00 PM - 07:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
      types: ["cruise", "entertainment"]
    },
    {
      name: `${capDest} Amusement Park`,
      description: `A fun-filled amusement park offering thrilling roller coasters, water slides, and family activities.`,
      vicinity: `Parkway Drive, ${capDest}`,
      rating: 4.3,
      user_ratings_total: 5600,
      estimated_cost: 800,
      visit_duration_hours: 3.5,
      tips: "Buy fast-track passes online to skip long queue lines at popular rides.",
      best_time_to_visit: "11:00 AM - 02:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800",
      types: ["amusement_park", "entertainment"]
    },
    {
      name: `${capDest} Hilltop Shrine`,
      description: `A sacred, historic temple/church perched on a hilltop, offering panoramic city vistas.`,
      vicinity: `Hill Summit, ${capDest}`,
      rating: 4.6,
      user_ratings_total: 4200,
      estimated_cost: 0,
      visit_duration_hours: 1.5,
      tips: "Climb of 120 steps. Dress appropriately. Respect local prayers.",
      best_time_to_visit: "08:00 AM - 09:30 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1548625361-155de0c7f546?w=800",
      types: ["shrine", "place_of_worship", "heritage"]
    },
    {
      name: `${capDest} Local Street Food Street`,
      description: `A famous food lane packed with stalls serving regional delicacies, chaats, and desserts.`,
      vicinity: `Food Lane Road, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 1800,
      estimated_cost: 250,
      visit_duration_hours: 1.5,
      tips: "Ensure you eat at highly crowded, clean stalls. Try their hot desserts.",
      best_time_to_visit: "05:30 PM - 07:00 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
      types: ["food_street", "local_experience"]
    },
    {
      name: `${capDest} Hidden Forest Waterfall`,
      description: `A secluded waterfall tucked inside the city's outskirts forest, ideal for hikes and natural dips.`,
      vicinity: `Outskirts Reserve, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 310,
      estimated_cost: 50,
      visit_duration_hours: 3.0,
      tips: "Requires a 20-minute guide walk through the forest path. Wear mosquito lotion.",
      best_time_to_visit: "09:00 AM - 12:00 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1432406186267-e8c9f2b7045a?w=800",
      types: ["waterfall", "nature", "hidden_gem"]
    },
    {
      name: `${capDest} Traditional Craft Center`,
      description: `Watch local artisans make handicrafts, pottery, and handloom fabrics. Buy authentic souvenirs.`,
      vicinity: `Artisans Enclave, ${capDest}`,
      rating: 4.4,
      user_ratings_total: 890,
      estimated_cost: 0,
      visit_duration_hours: 2.0,
      tips: "Credit cards accepted, but cash is preferred for small purchases.",
      best_time_to_visit: "11:30 AM - 01:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800",
      types: ["craft_center", "local_experience"]
    },
    {
      name: `${capDest} Coastal Lighthouse`,
      description: `A historic 19th-century coastal lighthouse built on a rocky cliff overlook.`,
      vicinity: `Ocean Cliff Road, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 2100,
      estimated_cost: 20,
      visit_duration_hours: 1.0,
      tips: "Climb up the spiral stairs for amazing views of the coast.",
      best_time_to_visit: "04:30 PM - 05:30 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
      types: ["lighthouse", "scenic"]
    },
    {
      name: `${capDest} War Memorial Arch`,
      description: `A monumental stone arch dedicated to local soldiers who served in historic battles.`,
      vicinity: `Boulevard Circle, ${capDest}`,
      rating: 4.6,
      user_ratings_total: 3400,
      estimated_cost: 0,
      visit_duration_hours: 1.0,
      tips: "Excellent spot for evening photographs when the arch is illuminated.",
      best_time_to_visit: "06:00 PM - 07:00 PM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800",
      types: ["historical", "monument"]
    },
    {
      name: `${capDest} Royal Stepwell`,
      description: `An ancient architectural stepwell with beautiful symmetrical stone steps and underground arches.`,
      vicinity: `Heritage Suburb, ${capDest}`,
      rating: 4.4,
      user_ratings_total: 1200,
      estimated_cost: 20,
      visit_duration_hours: 1.0,
      tips: "Fascinating geometric views. Perfect for creative photography.",
      best_time_to_visit: "10:00 AM - 11:00 AM",
      outdoor: true,
      photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
      types: ["stepwell", "heritage"]
    },
    {
      name: `${capDest} Skydeck Observatory`,
      description: `Located on the 30th floor of a central business tower, offering clear bird's-eye views of the city.`,
      vicinity: `Skyline Towers, ${capDest}`,
      rating: 4.3,
      user_ratings_total: 920,
      estimated_cost: 150,
      visit_duration_hours: 1.0,
      tips: "Visit right before dusk to see the city transit from day to night.",
      best_time_to_visit: "05:30 PM - 06:30 PM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800",
      types: ["observatory", "entertainment"]
    },
    {
      name: `${capDest} Cultural Folk Theatre`,
      description: `Enjoy an evening of traditional music and dance showing regional legends and culture.`,
      vicinity: `Theatre Row, ${capDest}`,
      rating: 4.5,
      user_ratings_total: 750,
      estimated_cost: 300,
      visit_duration_hours: 2.0,
      tips: "Book tickets online in advance. Shows are usually at 7:00 PM.",
      best_time_to_visit: "07:00 PM - 09:00 PM",
      outdoor: false,
      photo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
      types: ["theatre", "cultural"]
    }
  ];

  const restaurants = [
    {
      name: `${capDest} Spice Junction`,
      cuisine: "Local Traditional Specialties",
      price_range: "₹250-500 per person",
      must_try_dish: "Chef's Signature Curry & Rice",
      address: "Bazaar Road, ${capDest}",
      rating: 4.5,
      reviews_count: 1200,
      photo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
    },
    {
      name: `The Green Bistro ${capDest}`,
      cuisine: "Organic Vegetarian & Salads",
      price_range: "₹300-600 per person",
      must_try_dish: "Farm Fresh Garden Platter",
      address: "Greenway Lane, ${capDest}",
      rating: 4.4,
      reviews_count: 850,
      photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
    },
    {
      name: `${capDest} Seafood Grill`,
      cuisine: "Fresh Coastal Seafood",
      price_range: "₹500-1000 per person",
      must_try_dish: "Butter Garlic Fish & Grilled Prawns",
      address: "Beachfront Boulevard, ${capDest}",
      rating: 4.5,
      reviews_count: 1400,
      photo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
    },
    {
      name: `The Royal Dining Hall`,
      cuisine: "Heritage Feast & Mughlai",
      price_range: "₹600-1200 per person",
      must_try_dish: "Traditional Banquet Platter",
      address: "Palace Road, ${capDest}",
      rating: 4.6,
      reviews_count: 980,
      photo_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
    },
    {
      name: `${capDest} Cafe & Roasters`,
      cuisine: "Artisanal Coffee & Sandwiches",
      price_range: "₹200-400 per person",
      must_try_dish: "Cold Brew & Avocado Toast",
      address: "High Street, ${capDest}",
      rating: 4.5,
      reviews_count: 1100,
      photo_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
    },
    {
      name: `The Local Street Food Court`,
      cuisine: "Quick Bites & Local Chaats",
      price_range: "₹100-250 per person",
      must_try_dish: "Assorted Street Snacks Platter",
      address: "Market Square, ${capDest}",
      rating: 4.3,
      reviews_count: 2400,
      photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
    },
    {
      name: `${capDest} Pizza Kitchen`,
      cuisine: "Woodfired Italian Pizzas",
      price_range: "₹350-750 per person",
      must_try_dish: "Classic Margherita & Pasta",
      address: "Park Street, ${capDest}",
      rating: 4.4,
      reviews_count: 1300,
      photo_url: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800"
    },
    {
      name: `The Golden Tandoor`,
      cuisine: "Kebabs & North Indian",
      price_range: "₹400-800 per person",
      must_try_dish: "Paneer/Chicken Tikka & Butter Naan",
      address: "Station Road, ${capDest}",
      rating: 4.5,
      reviews_count: 1600,
      photo_url: "https://images.unsplash.com/photo-1502301197279-669b95141c0e?w=800"
    },
    {
      name: `Rooftop Lounge ${capDest}`,
      cuisine: "Global Fusion & Cocktails",
      price_range: "₹800-1500 per person",
      must_try_dish: "Grilled Platters & Mocktails",
      address: "Skyview Plaza, ${capDest}",
      rating: 4.3,
      reviews_count: 920,
      photo_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"
    },
    {
      name: `Noodle House ${capDest}`,
      cuisine: "Pan-Asian Noodles & Dimsum",
      price_range: "₹300-600 per person",
      must_try_dish: "Special Schezwan Noodles & Momos",
      address: "Link Road, ${capDest}",
      rating: 4.4,
      reviews_count: 1050,
      photo_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
    },
    {
      name: `The Cocoa Laboratory`,
      cuisine: "Desserts, Cakes & Coffee",
      price_range: "₹250-500 per person",
      must_try_dish: "Molten Lava Cake & Waffles",
      address: "Gourmet Avenue, ${capDest}",
      rating: 4.5,
      reviews_count: 750,
      photo_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800"
    },
    {
      name: `${capDest} Tavern & Brewery`,
      cuisine: "Craft Beverages & Finger Food",
      price_range: "₹500-1200 per person",
      must_try_dish: "Loaded Nachos & Local Brews",
      address: "Club Road, ${capDest}",
      rating: 4.2,
      reviews_count: 1150,
      photo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800"
    }
  ];

  const hotels = [
    {
      name: `${capDest} Grand Palace Resort`,
      stars: 5,
      location: "Royal Enclave, ${capDest}",
      price_per_night: 8000,
      amenities: ["Swimming Pool", "Spa", "Fitness Center", "Bar", "Valet Parking"],
      photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
    },
    {
      name: `Taj Heritage ${capDest}`,
      stars: 5,
      location: "Lakeview Vista, ${capDest}",
      price_per_night: 9500,
      amenities: ["Rooftop Pool", "Lake Views", "Communal Gardens", "Fine Dining", "AC"],
      photo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"
    },
    {
      name: `Fairfield Residency ${capDest}`,
      stars: 4,
      location: "Commercial Belt, ${capDest}",
      price_per_night: 4500,
      amenities: ["Gym", "Free Breakfast", "Restaurant", "WiFi", "AC"],
      photo_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800"
    },
    {
      name: `Lemon Tree Hotel ${capDest}`,
      stars: 4,
      location: "Central Avenue, ${capDest}",
      price_per_night: 3800,
      amenities: ["Pool", "Gym", "Lounge Bar", "WiFi", "Breakfast"],
      photo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a304?w=800"
    },
    {
      name: `Zostel Backpacker ${capDest}`,
      stars: 2,
      location: "Old Suburbs, ${capDest}",
      price_per_night: 1000,
      amenities: ["AC Dorms", "WiFi", "Social Deck", "Communal Kitchen", "Chill Zone"],
      photo_url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
    }
  ];

  return {
    title: `${capDest} Heritage Expedition`,
    tagline: `Explore the vibrant local markets, scenic views, and heritage sights of ${capDest}.`,
    weather_summary: "Pleasant seasonal conditions with comfortable sightseeing windows.",
    packing_tips: ["Comfortable outfits", "Sturdy footwear", "Reusable water bottle", "Camera"],
    local_phrases: [
      { phrase: "Hello / Namaste", meaning: "Greeting" },
      { phrase: "Thank you / Dhanyavaad", meaning: "Gratitude" }
    ],
    emergency_contacts: { police: "100", ambulance: "102", tourist_helpline: "1363" },
    nearby_hidden_gems: ["Local countryside trails", "Old town artisan shops"],
    instagram_worthy_spots: [
      { spot: "Central historic monument", best_time: "Morning (9:00 AM)" },
      { spot: "Sunset Overlook Point", best_time: "Sunset (5:30 PM)" }
    ],
    dos_and_donts: {
      dos: ["Dress respectfully at historical sites", "Keep emergency numbers handy"],
      donts: ["Do not litter around tourist sites", "Avoid drinking tap water directly"]
    },
    attractions,
    restaurants,
    hotels
  };
}

// ──────────────────────────────────────────────────────────────
// Smart Merge Logic to combine and deduplicate Places API with Curated Database
// ──────────────────────────────────────────────────────────────
function mergePlaces(fetched: any[], curated: any[], targetLength: number): any[] {
  const seenNames = new Set<string>();
  const merged: any[] = [];
  
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // First, add all valid fetched items
  for (const item of fetched) {
    if (!item || !item.name) continue;
    const key = normalize(item.name);
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push({
        name: item.name,
        rating: item.rating || 4.2,
        user_ratings_total: item.user_ratings_total || 120,
        types: item.types || ['attraction'],
        vicinity: item.vicinity || item.formatted_address || '',
        price_level: item.price_level !== undefined ? item.price_level : 2,
        photo_reference: item.photos?.[0]?.photo_reference || null,
        photo_url: item.photo_url || null,
        place_id: item.place_id || '',
        geometry: item.geometry || null,
        outdoor: isOutdoorPlace(item)
      });
    }
  }

  // Next, fill in using curated/procedural items to meet target length
  for (const item of curated) {
    if (merged.length >= targetLength) break;
    const key = normalize(item.name);
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push({
        name: item.name,
        rating: item.rating || 4.5,
        user_ratings_total: item.user_ratings_total || item.reviews_count || 150,
        types: item.types || ['attraction'],
        vicinity: item.vicinity || '',
        price_level: item.price_level || 2,
        photo_reference: item.photo_reference || null,
        photo_url: item.photo_url || null,
        place_id: item.place_id || '',
        geometry: item.geometry || null,
        outdoor: item.outdoor !== undefined ? item.outdoor : isOutdoorPlace(item),
        description: item.description || '',
        tips: item.tips || '',
        best_time_to_visit: item.best_time_to_visit || ''
      });
    }
  }

  return merged;
}

// ──────────────────────────────────────────────────────────────
// 7. Fetch all live data in parallel (Orchestrated Entrypoint)
// ──────────────────────────────────────────────────────────────
export async function orchestrateLiveData(filters: RealtimeFilters, onStep: (step: string, progress: number) => void) {
  const days = Math.ceil(
    (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  onStep('Fetching top attractions from Google Places...', 10);

  // Select search terms based on destination + travel type for maximum specificity
  let typeQuery1 = 'tourist attractions';
  let typeQuery2 = 'sightseeing points';
  let typeQuery3 = 'historical landmarks';

  const travelType = filters.travelType;
  if (travelType === 'Adventure') {
    typeQuery1 = 'adventure trekking hiking trails';
    typeQuery2 = 'water sports outdoor activities';
    typeQuery3 = 'national parks viewpoints waterfalls';
  } else if (travelType === 'Couple') {
    typeQuery1 = 'romantic spots scenic viewpoints';
    typeQuery2 = 'sunset points beaches lakes';
    typeQuery3 = 'cozy cafes historic palaces';
  } else if (travelType === 'Family') {
    typeQuery1 = 'family amusement parks kids activities';
    typeQuery2 = 'zoos science museums gardens';
    typeQuery3 = 'safe tourist sightseeing spots';
  } else if (travelType === 'Luxury') {
    typeQuery1 = 'yacht rental private clubs fine spa';
    typeQuery2 = 'fine dining heritage palaces';
    typeQuery3 = 'exclusive sightseeing landmarks';
  } else if (travelType === 'Backpacking') {
    typeQuery1 = 'free walking tours local street markets';
    typeQuery2 = 'cheap historical ruins landmarks';
    typeQuery3 = 'nature trails temples points of interest';
  } else if (travelType === 'Friends') {
    typeQuery1 = 'nightlife pubs bars beach shacks';
    typeQuery2 = 'adventure water sports local markets';
    typeQuery3 = 'fun group activities sightseeing';
  } else if (travelType === 'Solo') {
    typeQuery1 = 'museums art galleries cultural heritage';
    typeQuery2 = 'book cafes walking streets libraries';
    typeQuery3 = 'historical landmarks photography spots';
  }

  // Parallel fetch: attractions + restaurants + hotels
  const [attractions1, attractions2, attractions3, rawRestaurants, rawHotels] = await Promise.all([
    fetchPlaces(filters.destination, typeQuery1, 20),
    fetchPlaces(filters.destination, typeQuery2, 20),
    fetchPlaces(filters.destination, typeQuery3, 20),
    fetchPlaces(filters.destination, 'restaurants', 20),
    fetchPlaces(filters.destination, 'hotels', 20),
  ]);

  // Combine fetched places
  const combinedAttractions = [...attractions1, ...attractions2, ...attractions3].filter(
    (item: any) => item && item.name
  );

  // Normalize destination name and load curated data
  const destKey = filters.destination.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  let curatedData = CURATED_DESTINATIONS[destKey];
  if (!curatedData) {
    for (const [key, data] of Object.entries(CURATED_DESTINATIONS)) {
      if (destKey.includes(key) || key.includes(destKey)) {
        curatedData = data;
        break;
      }
    }
  }

  if (!curatedData) {
    curatedData = generateProceduralPlaces(filters.destination);
  }

  // Merge the fetched data with the curated database (ensures we have at least 25 unique attractions, 12 restaurants, 5 hotels)
  const rawAttractions = mergePlaces(combinedAttractions, curatedData.attractions, 30);
  const restaurants = mergePlaces(rawRestaurants, curatedData.restaurants, 15);
  const hotels = mergePlaces(rawHotels, curatedData.hotels, 10);

  // AI Decision Engine Step 3: Rank attractions based on Rating, Reviews count, and Travel Type keywords
  const rankAttraction = (a: any) => {
    let score = (a.rating || 3.0) * 10;
    
    // Boost based on number of reviews
    const reviews = a.user_ratings_total || 0;
    if (reviews > 0) {
      score += Math.log10(reviews) * 6;
    }
    
    // Boost based on travel type keywords matching name/types
    const nameLower = (a.name || '').toLowerCase();
    const typesStr = (a.types || []).join(' ').toLowerCase();
    
    const keywords: Record<string, string[]> = {
      'Couple': ['romantic', 'sunset', 'scenic', 'viewpoint', 'view point', 'beach', 'lake', 'cafe', 'resort', 'garden', 'palace'],
      'Family': ['family', 'zoo', 'park', 'museum', 'amusement', 'garden', 'kid', 'child', 'palace', 'fort', 'temple', 'church'],
      'Adventure': ['trek', 'hike', 'waterfall', 'adventure', 'sports', 'rafting', 'valley', 'hill', 'camping', 'cave'],
      'Luxury': ['luxury', 'spa', 'yacht', 'club', 'golf', 'fine', 'palace', 'heritage', 'premium', 'resort'],
      'Backpacking': ['market', 'street', 'free', 'budget', 'hostel', 'cheap', 'ruins', 'temple', 'church', 'local'],
      'Friends': ['beach', 'bar', 'club', 'pub', 'nightlife', 'market', 'sports', 'water', 'shack', 'cafe', 'lounge'],
      'Solo': ['cafe', 'museum', 'gallery', 'art', 'library', 'walking', 'history', 'cultural', 'photography'],
    };
    
    const list = keywords[travelType] || [];
    for (const kw of list) {
      if (nameLower.includes(kw) || typesStr.includes(kw)) {
        score += 10;
      }
    }
    
    return score;
  };

  // Sort raw attractions by ranking score descending
  rawAttractions.sort((a, b) => rankAttraction(b) - rankAttraction(a));

  // Geographically cluster top 30 attractions using nearest-neighbor starting from highest ranked
  const attractions: any[] = [];
  if (rawAttractions.length > 0) {
    const candidates = [...rawAttractions];
    let current = candidates[0];
    attractions.push(candidates.splice(0, 1)[0]);
    
    while (candidates.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < candidates.length; i++) {
        const dist = getDistance(current, candidates[i]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }
      current = candidates.splice(nearestIdx, 1)[0];
      attractions.push(current);
    }
  }

  onStep('Getting live weather forecast...', 30);
  const weather = await fetchWeatherForecast(filters.destination, days);

  onStep('Calculating distances between attractions...', 50);

  // Distance matrix for top 6 attractions
  const topPlaces = attractions.slice(0, 6);
  let distanceData: any = null;
  if (topPlaces.length > 1) {
    const locations = topPlaces.map((p: any) =>
      p.geometry?.location ? `${p.geometry.location.lat},${p.geometry.location.lng}` : p.name
    );
    distanceData = await fetchDistanceMatrix(locations.slice(0, -1), locations.slice(1));
  }

  onStep('Gemini AI building your personalized plan...', 70);

  // Build enriched context for Gemini
  const enrichedContext = {
    filters,
    days,
    attractions: attractions.slice(0, 30).map((p: any) => ({
      name: p.name,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      types: (p.types || []).slice(0, 3),
      vicinity: p.vicinity,
      photo_reference: p.photo_reference,
      photo_url: p.photo_url || null,
      place_id: p.place_id,
      price_level: p.price_level,
      geometry: p.geometry,
      outdoor: p.outdoor,
      description: p.description || '',
      tips: p.tips || '',
      best_time_to_visit: p.best_time_to_visit || ''
    })),
    restaurants: restaurants.slice(0, 15).map((r: any) => ({
      name: r.name,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total || r.reviews_count || 100,
      vicinity: r.vicinity || r.address || '',
      price_level: r.price_level || 2,
      photo_reference: r.photo_reference,
      photo_url: r.photo_url || null,
      place_id: r.place_id,
      cuisine: r.cuisine || '',
      must_try_dish: r.must_try_dish || '',
      price_range: r.price_range || ''
    })),
    hotels: hotels.slice(0, 10).map((h: any) => ({
      name: h.name,
      rating: h.rating || h.stars || 4.0,
      user_ratings_total: h.user_ratings_total || 200,
      vicinity: h.vicinity || h.location || '',
      price_level: h.price_level || 3,
      price_per_night: h.price_per_night || 5000,
      photo_reference: h.photo_reference,
      photo_url: h.photo_url || null,
      place_id: h.place_id,
      amenities: h.amenities || []
    })),
    weather,
    travelTypePreferences: getTravelTypeCategories(filters.travelType),
    curatedData
  };

  const itinerary = await generateRealtimeItinerary(enrichedContext);

  onStep('Finalizing your itinerary...', 95);
  return itinerary;
}

// ──────────────────────────────────────────────────────────────
// 8. Gemini mega-prompt with all live data
// ──────────────────────────────────────────────────────────────
async function generateRealtimeItinerary(ctx: any): Promise<any> {
  const { filters, days, attractions, restaurants, hotels, weather, travelTypePreferences, curatedData } = ctx;
  
  if (!GEMINI_KEY) {
    // Fallback: build from live data without AI
    return buildFallbackFromLiveData(ctx);
  }

  const weatherSummary = weather.map((w: any, i: number) =>
    `Day ${i + 1} (${w.date}): ${w.condition}, ${w.temp_max}°C max / ${w.temp_min}°C min, Rain chance: ${w.rain_chance}%`
  ).join('\n');

  const attractionsList = attractions.filter((a: any) => a && a.name).map((a: any) =>
    `- Name: ${a.name} | Rating: ${a.rating || 'N/A'} | Reviews Count: ${a.user_ratings_total || 0} | Type: ${(a.types || []).join(', ')} | Location: ${a.vicinity || 'N/A'} | Photo: ${a.photo_reference ? 'YES' : 'NO'} | Outdoor: ${a.outdoor ? 'YES' : 'NO'}`
  ).join('\n');

  const restaurantsList = restaurants.filter((r: any) => r && r.name).map((r: any) =>
    `- Name: ${r.name} | Rating: ${r.rating || 'N/A'} | Reviews Count: ${r.user_ratings_total || 0} | Location: ${r.vicinity || 'N/A'} | Cuisine: ${r.cuisine || 'Local'} | Must-Try: ${r.must_try_dish || 'Chef Special'}`
  ).join('\n');

  const hotelsList = hotels.filter((h: any) => h && h.name).map((h: any) =>
    `- Name: ${h.name} | Rating: ${h.rating || 'N/A'} | Reviews Count: ${h.user_ratings_total || 0} | Location: ${h.vicinity || 'N/A'} | Price Per Night: ₹${h.price_per_night || 5000}`
  ).join('\n');

  const rulesMap: Record<string, string> = {
    'Couple':       'Focus on romantic dinners, sunset viewpoints, couple activities, spa experiences, and scenic drives.',
    'Family':       'Prioritize child-friendly venues, parks, zoos, easy walks, family restaurants. Avoid late-night activities.',
    'Adventure':    'Include trekking, water sports, off-beat trails, rafting, local food markets. High energy throughout.',
    'Luxury':       'Select only 4★/5★ hotels, fine dining, VIP experiences, private tours, chauffeur suggestions.',
    'Backpacking':  'Budget-first. Hostels, street food, local transport, free attractions, night buses to save on stays.',
    'Friends':      'Mix of beach/party, group food, local experiences, nightlife, budget-to-mid range. Fun activities.',
    'Business':     'Near airport/CBD, business hotels, conference-ready venues, quick lunches, limited exploration time.',
    'Solo':         'Cafes, museum visits, local neighborhoods, photography spots, safe evening activities, co-working spots.',
  };
  const travelTypeRules = rulesMap[filters.travelType] || 'Balance activities across culture, food, and sightseeing.';

  const rainDays = weather.filter((w: any) => ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.condition)).map((w: any) => w.date);
  const rainRule = rainDays.length > 0
    ? `IMPORTANT WEATHER AWARENESS: On rainy days (${rainDays.join(', ')}), you MUST strictly avoid outdoor activities (such as beaches, parks, outdoor viewpoints, and open-air trekking). Substitute them entirely with indoor attractions (such as museums, indoor shopping centers, historic indoor temples/churches/monuments, covered activities, and art galleries).`
    : 'Weather looks generally good for outdoor activities.';

  const prompt = `You are a world-class AI travel planner with expertise in real-time itinerary creation.

TRIP OVERVIEW:
- From: ${filters.source}
- To: ${filters.destination}
- Dates: ${filters.startDate} to ${filters.endDate} (${days} days)
- Budget: ₹${filters.budget.toLocaleString()} total for ${filters.travelers} traveler(s)
- Travel Type: ${filters.travelType}
- Style: ${travelTypeRules}

LIVE WEATHER FORECAST:
${weatherSummary}
${rainRule}

REAL ATTRACTIONS AVAILABLE (use these exact names in activity_name):
${attractionsList}

REAL RESTAURANTS AVAILABLE (use these exact names in restaurant_name):
${restaurantsList}

REAL HOTELS AVAILABLE (use these exact names in hotel_name):
${hotelsList}

INSTRUCTIONS:
1. Create a ${days}-day itinerary using ONLY the real attractions, restaurants, and hotels listed above.
2. Schedule a complete 4-slot day structure for EVERY day:
   - Morning (08:00 AM – 11:00 AM)
   - Afternoon (11:00 AM – 03:00 PM)
   - Evening (03:00 PM – 07:00 PM)
   - Night (07:00 PM – 10:00 PM)
3. CRITICAL: Never repeat attractions, activities, restaurants, or hotels within the same day or across the whole trip. Every single time slot (morning, afternoon, evening, night, lunch, dinner) across the entire trip MUST contain a DIFFERENT place. Uniqueness is mandatory.
4. On rainy days, replace outdoor attractions with indoor ones.
5. Add a Lunch Recommendation between Afternoon activities (using highly rated nearby restaurants from the list).
6. Add a Dinner Recommendation before the Night activity (using highly rated nearby restaurants from the list).
7. Select a single, best-matching hotel from the hotels list for accommodation, and use it consistently for all days of the trip.
8. Group nearby attractions together to minimize travel times (geographically cluster them).
9. Add a travel time section between every activity slot:
   - travel_morning_to_afternoon
   - travel_afternoon_to_evening
   - travel_evening_to_night
   Include duration_minutes (realistic estimation), distance_km (realistic estimation), and mode (auto, taxi, or walk).
10. For each slot/item, specify reviews_count, rating, estimated_cost, visit_duration_hours, and tips. Copy photo_reference exactly from the lists.

Return ONLY a valid JSON object with this exact schema (no markdown, no explanation):
{
  "title": "string - catchy trip name",
  "tagline": "string - 1 sentence description",
  "total_cost_estimate": number,
  "cost_breakdown": {
    "transport": number,
    "accommodation": number,
    "food": number,
    "activities": number,
    "miscellaneous": number
  },
  "weather_summary": "string - 1-2 sentences about overall weather",
  "days": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "theme": "string - creative day theme",
      "weather": {
        "condition": "string",
        "temp_max": number,
        "temp_min": number,
        "rain_chance": number,
        "icon": "string - openweather icon code like 01d"
      },
      "morning": {
        "time": "08:00 AM",
        "activity_name": "string - exact place name from attractions list",
        "description": "string - 2 sentences",
        "location_name": "string",
        "vicinity": "string - area/neighborhood",
        "google_maps_link": "https://maps.google.com/?q=...",
        "estimated_cost": number,
        "visit_duration_hours": number,
        "rating": number,
        "reviews_count": number,
        "tips": "string",
        "best_time_to_visit": "string",
        "photo_reference": "string or null"
      },
      "travel_morning_to_afternoon": {
        "duration_minutes": number,
        "distance_km": number,
        "mode": "auto/taxi/walk"
      },
      "afternoon": {
        "time": "11:00 AM",
        "activity_name": "string - exact place name from attractions list",
        "description": "string",
        "location_name": "string",
        "vicinity": "string",
        "google_maps_link": "string",
        "estimated_cost": number,
        "visit_duration_hours": number,
        "rating": number,
        "reviews_count": number,
        "tips": "string",
        "photo_reference": "string or null"
      },
      "lunch": {
        "restaurant_name": "string - from restaurants list",
        "cuisine": "string",
        "price_range": "string like ₹200-400 per person",
        "must_try_dish": "string",
        "address": "string",
        "rating": number,
        "reviews_count": number,
        "photo_reference": "string or null"
      },
      "travel_afternoon_to_evening": {
        "duration_minutes": number,
        "distance_km": number,
        "mode": "string"
      },
      "evening": {
        "time": "03:00 PM",
        "activity_name": "string - exact place name from attractions list",
        "description": "string",
        "location_name": "string",
        "vicinity": "string",
        "google_maps_link": "string",
        "estimated_cost": number,
        "visit_duration_hours": number,
        "rating": number,
        "reviews_count": number,
        "tips": "string",
        "photo_reference": "string or null"
      },
      "dinner": {
        "restaurant_name": "string - from restaurants list",
        "cuisine": "string",
        "price_range": "string",
        "must_try_dish": "string",
        "address": "string",
        "rating": number,
        "reviews_count": number,
        "photo_reference": "string or null"
      },
      "travel_evening_to_night": {
        "duration_minutes": number,
        "distance_km": number,
        "mode": "string"
      },
      "night": {
        "time": "07:00 PM",
        "activity_name": "string - exact place name from attractions list",
        "description": "string",
        "location_name": "string",
        "vicinity": "string",
        "google_maps_link": "string",
        "estimated_cost": number,
        "visit_duration_hours": number,
        "rating": number,
        "reviews_count": number,
        "tips": "string",
        "photo_reference": "string or null"
      },
      "accommodation": {
        "hotel_name": "string - from hotels list",
        "stars": number,
        "location": "string",
        "price_per_night": number,
        "amenities": ["string"],
        "photo_reference": "string or null",
        "booking_url": "string"
      },
      "total_day_cost": number
    }
  ],
  "recommended_transport": {
    "type": "Flight|Train|Bus",
    "from": "string",
    "to": "string",
    "suggested_option_name": "string",
    "estimated_cost": number,
    "duration": "string",
    "booking_url": "string"
  },
  "packing_tips": ["string"],
  "local_phrases": [{"phrase": "string", "meaning": "string"}],
  "emergency_contacts": {"police": "string", "ambulance": "string", "tourist_helpline": "string"},
  "nearby_hidden_gems": ["string"],
  "instagram_worthy_spots": [{"spot": "string", "best_time": "string"}],
  "dos_and_donts": {"dos": ["string"], "donts": ["string"]}
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    };
    const res = await axios.post(url, payload, { timeout: 90000 });
    const candidate = res.data?.candidates?.[0];
    let text = candidate?.content?.parts?.[0]?.text || '';
    
    // Write diagnostic log
    const fs = require('fs');
    fs.writeFileSync('gemini-debug.log', `finishReason: ${candidate?.finishReason}\ntextLength: ${text.length}\nfirst500: ${text.substring(0, 500)}\n`);
    
    if (!text) {
      return buildFallbackFromLiveData(ctx);
    }
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message);
      console.error('Raw text (first 500 chars):', text.substring(0, 500));
      return buildFallbackFromLiveData(ctx);
    }
    
    // Validate the parsed structure has days
    if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      console.error('Gemini returned invalid structure, missing days array. Keys:', Object.keys(parsed || {}));
      return buildFallbackFromLiveData(ctx);
    }
    
    console.log('Gemini success! Generated', parsed.days.length, 'days');
    return enrichWithPhotoUrls(parsed, ctx);
  } catch (e: any) {
    console.error('Gemini realtime itinerary failed:', e?.response?.data?.error || e?.message || e);
    try {
      return buildFallbackFromLiveData(ctx);
    } catch (fallbackErr: any) {
      console.error('Fallback also failed:', fallbackErr?.message || fallbackErr);
      throw fallbackErr;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 9. Enrich parsed itinerary with resolved photo URLs
// ──────────────────────────────────────────────────────────────
function enrichWithPhotoUrls(itinerary: any, ctx: any): any {
  if (!itinerary.days) return itinerary;
  
  // Build lookup: place name → photo_reference and photo_url
  const photoLookup: Record<string, { photo_reference: string | null, photo_url: string | null }> = {};
  for (const place of [...ctx.attractions, ...ctx.restaurants, ...ctx.hotels]) {
    if (place && place.name) {
      photoLookup[place.name.toLowerCase()] = {
        photo_reference: place.photo_reference || null,
        photo_url: place.photo_url || null
      };
    }
  }

  itinerary.days = itinerary.days.map((day: any) => {
    const enrichSlot = (slot: any) => {
      if (!slot) return slot;
      
      const key = (slot.activity_name || slot.restaurant_name || slot.hotel_name || '').toLowerCase();
      
      let matchedPhotoRef: string | null = slot.photo_reference || null;
      let matchedPhotoUrl: string | null = slot.photo_url || null;

      // Lookup in context items if not already resolved
      if (!matchedPhotoUrl && !matchedPhotoRef) {
        for (const [name, info] of Object.entries(photoLookup)) {
          if (key.includes(name) || name.includes(key) || key.includes(name.split(' ')[0])) {
            matchedPhotoRef = info.photo_reference;
            matchedPhotoUrl = info.photo_url;
            break;
          }
        }
      }

      if (matchedPhotoUrl) {
        slot.photo_url = matchedPhotoUrl;
      } else if (matchedPhotoRef) {
        slot.photo_reference = matchedPhotoRef;
        slot.photo_url = getPlacePhotoUrl(matchedPhotoRef);
      } else {
        const name = slot.activity_name || slot.restaurant_name || slot.hotel_name || 'travel';
        slot.photo_url = `https://picsum.photos/seed/${encodeURIComponent(name)}/800/500`;
      }
      return slot;
    };

    return {
      ...day,
      morning: enrichSlot(day.morning),
      afternoon: enrichSlot(day.afternoon),
      evening: enrichSlot(day.evening),
      night: enrichSlot(day.night),
      lunch: enrichSlot(day.lunch),
      dinner: enrichSlot(day.dinner),
      accommodation: enrichSlot(day.accommodation),
    };
  });

  return itinerary;
}

// ──────────────────────────────────────────────────────────────
// 10. Fallback builder using live Google Places + Curated data (no AI)
// ──────────────────────────────────────────────────────────────
function buildFallbackFromLiveData(ctx: any): any {
  const { filters, days, weather, attractions, restaurants, hotels } = ctx;
  
  // Clean arrays
  const cleanAttractions = (attractions || []).filter((p: any) => p && p.name);
  const cleanRestaurants = (restaurants || []).filter((r: any) => r && r.name);
  const cleanHotels = (hotels || []).filter((h: any) => h && h.name);
  
  // Ensure we have sufficient unique items with unique details to prevent duplicates
  while (cleanAttractions.length < 30) {
    const idx = cleanAttractions.length + 1;
    cleanAttractions.push({
      name: `${filters.destination} Sightseeing Point ${idx}`,
      description: `Explore the beautiful sights, rich history, and local activities at ${filters.destination} Sightseeing Point ${idx}, a highly recommended spot.`,
      vicinity: `Local Area ${idx}, ${filters.destination}`,
      rating: Math.round((4.0 + (idx % 9) / 10) * 10) / 10,
      user_ratings_total: 100 + idx * 15,
      price_level: (idx % 3) + 1,
      photo_url: `https://picsum.photos/seed/attr-${filters.destination.toLowerCase()}-${idx}/800/500`,
      outdoor: idx % 2 === 0,
      types: idx % 2 === 0 ? ['park', 'natural_feature'] : ['museum', 'point_of_interest']
    });
  }

  while (cleanRestaurants.length < 12) {
    const idx = cleanRestaurants.length + 1;
    cleanRestaurants.push({
      name: `${filters.destination} Restaurant ${idx}`,
      cuisine: idx % 2 === 0 ? 'Local Specialties' : 'Multi-Cuisine Delights',
      address: `Street ${idx}, ${filters.destination}`,
      rating: Math.round((4.0 + (idx % 9) / 10) * 10) / 10,
      reviews_count: 50 + idx * 20,
      photo_url: `https://picsum.photos/seed/rest-${filters.destination.toLowerCase()}-${idx}/800/500`,
      price_range: idx % 2 === 0 ? '₹200-400 per person' : '₹500-1000 per person',
      must_try_dish: `Chef's Special ${idx}`
    });
  }

  const DEFAULT_RESTAURANT = {
    name: 'Popular Local Eatery',
    cuisine: 'Multi-Cuisine Delights',
    address: filters.destination,
    rating: 4.3,
    user_ratings_total: 250,
    photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    price_range: '₹300-600 per person',
    must_try_dish: "Chef's Special"
  };

  const DEFAULT_HOTEL = {
    name: `${filters.destination} Premium Stay`,
    stars: 4,
    location: 'City Center',
    price_per_night: 4500,
    amenities: ['WiFi', 'AC', 'Room Service'],
    photo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
  };
  if (cleanHotels.length === 0) {
    cleanHotels.push(DEFAULT_HOTEL);
  }

  // Sort hotels and pick one to stay at for the entire trip
  const budgetPerDay = Math.round(filters.budget / days);
  let sortedHotels = [...cleanHotels];
  if (filters.accommodation === 'Budget' || filters.budget < 10000) {
    sortedHotels.sort((a, b) => (a.price_level || a.price_per_night || 0) - (b.price_level || b.price_per_night || 0));
  } else {
    sortedHotels.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  const selectedHotel = sortedHotels[0] || DEFAULT_HOTEL;

  // Set up day themes based on coastal vs landlocked
  const hasBeaches = cleanAttractions.some((a: any) =>
    (a.name || '').toLowerCase().includes('beach') ||
    (a.types || []).includes('beach') ||
    (a.types || []).includes('natural_feature') && (a.name || '').toLowerCase().includes('water')
  );

  const dayThemes = [
    'Heritage, Culture & Historical Landmarks',
    hasBeaches ? 'Golden Beaches & Coastal Sightseeing' : 'Nature Trails, Scenic Lakes & Greenery',
    'Adventure Sports, Outdoors & Scenic Views',
    'Local Street Markets, Malls & Entertainment',
    'Relaxation, Hidden Gems & Sunset Points'
  ];

  const usedAttractionNames = new Set<string>();
  const daysArray = [];

  const getDistanceBetween = (p1: any, p2: any) => {
    const lat1 = p1?.geometry?.location?.lat;
    const lng1 = p1?.geometry?.location?.lng;
    const lat2 = p2?.geometry?.location?.lat;
    const lng2 = p2?.geometry?.location?.lng;
    
    let distanceKm = 2.5;
    if (lat1 !== undefined && lng1 !== undefined && lat2 !== undefined && lng2 !== undefined) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distanceKm = Math.round((R * c) * 10) / 10;
    }
    if (distanceKm < 0.1) distanceKm = 0.5;
    
    const durationMinutes = Math.max(5, Math.round(distanceKm * 4.5));
    let mode = 'taxi';
    if (distanceKm <= 1.2) {
      mode = 'walk';
    } else if (distanceKm <= 5.0) {
      mode = 'auto';
    }
    return { duration_minutes: durationMinutes, distance_km: distanceKm, mode };
  };

  const getCuratedDescription = (place: any) => {
    if (place.description) return place.description;
    return `Discover the incredible sights and unique atmosphere of ${place.name || 'this scenic spot'}. It is highly rated by visitors for its rich local charm and photo opportunities.`;
  };

  const makeSlot = (place: any, time: string) => {
    const name = place?.name || 'Sightseeing';
    const tips = place?.tips || 'Plan your visit ahead and carry water/sun protection.';
    const best_time = place?.best_time_to_visit || (time === '08:00 AM' ? 'Morning hours' : time === '03:00 PM' ? 'Afternoon hours' : 'Evening hours');
    return {
      time,
      activity_name: name,
      description: getCuratedDescription(place),
      location_name: name,
      vicinity: place?.vicinity || filters.destination,
      google_maps_link: `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + filters.destination)}`,
      estimated_cost: place?.estimated_cost || (place?.price_level ? place.price_level * 150 : 100),
      visit_duration_hours: place?.visit_duration_hours || (time === '08:00 AM' || time === '03:00 PM' ? 2.0 : 1.5),
      rating: place?.rating || 4.5,
      reviews_count: place?.user_ratings_total || place?.reviews_count || 120,
      tips,
      best_time_to_visit: best_time,
      photo_reference: place?.photo_reference || null,
      photo_url: place?.photo_url || (place?.photo_reference ? getPlacePhotoUrl(place.photo_reference) : `https://picsum.photos/seed/${encodeURIComponent(name)}/800/500`),
    };
  };

  // Split restaurants to ensure zero overlap between lunch and dinner pools
  const lunchPool = cleanRestaurants.slice(0, 6);
  const dinnerPool = cleanRestaurants.slice(6, 12);

  for (let d = 0; d < days; d++) {
    const dayWeather = weather[d] || { condition: 'Clear', temp_max: 30, temp_min: 22, rain_chance: 10, icon: '01d' };
    const isRainy = ['Rain', 'Drizzle', 'Thunderstorm'].includes(dayWeather.condition);
    const dayTheme = dayThemes[d % dayThemes.length];

    // Weather-aware filtering: prioritize indoor places if raining
    let weatherSafeCandidates = cleanAttractions;
    if (isRainy) {
      weatherSafeCandidates = cleanAttractions.filter((p: any) => !isOutdoorPlace(p));
      
      // If we don't have enough unused indoor places left for this and remaining days,
      // mix in unused outdoor places so we NEVER repeat attractions.
      const unusedIndoorCount = weatherSafeCandidates.filter((p: any) => !usedAttractionNames.has(p.name)).length;
      const slotsNeeded = (days - d) * 4;
      if (unusedIndoorCount < slotsNeeded) {
        const unusedOutdoor = cleanAttractions.filter((p: any) => isOutdoorPlace(p) && !usedAttractionNames.has(p.name));
        weatherSafeCandidates = [...weatherSafeCandidates, ...unusedOutdoor];
      }
    }

    // Try to filter candidates matching the day theme keywords
    let themeKeywords: string[] = [];
    if (dayTheme.includes('Heritage') || dayTheme.includes('History')) {
      themeKeywords = ['heritage', 'temple', 'church', 'palace', 'museum', 'monument', 'fort', 'history', 'cathedral'];
    } else if (dayTheme.includes('Beaches') || dayTheme.includes('Nature')) {
      themeKeywords = ['beach', 'lake', 'waterfall', 'park', 'garden', 'sanctuary', 'zoo', 'scenic'];
    } else if (dayTheme.includes('Adventure')) {
      themeKeywords = ['trek', 'hike', 'sports', 'adventure', 'falls', 'activity', 'climb', 'parasailing'];
    } else if (dayTheme.includes('Markets') || dayTheme.includes('Shopping')) {
      themeKeywords = ['market', 'mall', 'bazaar', 'food', 'street', 'shopping', 'plaza', 'casino'];
    } else {
      themeKeywords = ['viewpoint', 'sunset', 'overlook', 'bay', 'hidden', 'relax', 'island', 'spa', 'lighthouse'];
    }

    // Unused candidates pool
    const dayUnusedCandidates = weatherSafeCandidates.filter((p: any) => !usedAttractionNames.has(p.name));
    
    // Pick 4 slots for this day
    const selectedToday: any[] = [];
    let currentPlace: any = null;

    for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
      let bestCandidate: any = null;
      let bestIndex = -1;

      // Filter unused items for theme keywords
      const themeMatches = dayUnusedCandidates.filter((p: any) => {
        const nameLower = (p.name || '').toLowerCase();
        const typesStr = (p.types || []).join(' ').toLowerCase();
        const vicinityLower = (p.vicinity || '').toLowerCase();
        return themeKeywords.some(kw => nameLower.includes(kw) || typesStr.includes(kw) || vicinityLower.includes(kw));
      });

      const searchPool = themeMatches.length > 0 ? themeMatches : dayUnusedCandidates;

      if (searchPool.length > 0) {
        if (!currentPlace) {
          bestCandidate = searchPool[0];
          for (const cand of searchPool) {
            if (cand.rating > bestCandidate.rating) bestCandidate = cand;
          }
          bestIndex = dayUnusedCandidates.indexOf(bestCandidate);
        } else {
          let minDistance = Infinity;
          for (let i = 0; i < searchPool.length; i++) {
            const cand = searchPool[i];
            const dist = getDistance(currentPlace, cand);
            if (dist < minDistance) {
              minDistance = dist;
              bestCandidate = cand;
            }
          }
          bestIndex = dayUnusedCandidates.indexOf(bestCandidate);
        }
      }

      if (bestIndex === -1 || !bestCandidate) {
        // Fallback: take any unused attraction left in cleanAttractions
        const absoluteUnused = cleanAttractions.filter((p: any) => !usedAttractionNames.has(p.name));
        if (absoluteUnused.length > 0) {
          bestCandidate = absoluteUnused[0];
        } else {
          // Absolute last resort (should not happen since we padded cleanAttractions to 30)
          bestCandidate = cleanAttractions[slotIdx % cleanAttractions.length];
        }
      } else {
        dayUnusedCandidates.splice(bestIndex, 1);
      }

      selectedToday.push(bestCandidate);
      usedAttractionNames.add(bestCandidate.name);
      currentPlace = bestCandidate;
    }

    const morning = selectedToday[0];
    const afternoon = selectedToday[1];
    const evening = selectedToday[2];
    const night = selectedToday[3];

    // Restaurants for lunch and dinner
    const lunchRest = lunchPool[d % lunchPool.length] || DEFAULT_RESTAURANT;
    const dinnerRest = dinnerPool[d % dinnerPool.length] || DEFAULT_RESTAURANT;

    const dateObj = new Date(filters.startDate);
    dateObj.setDate(dateObj.getDate() + d);
    const date = dateObj.toISOString().split('T')[0];

    daysArray.push({
      day_number: d + 1,
      date,
      theme: `Day ${d + 1}: ${dayTheme}`,
      weather: {
        condition: dayWeather.condition,
        temp_max: dayWeather.temp_max,
        temp_min: dayWeather.temp_min,
        rain_chance: dayWeather.rain_chance,
        icon: dayWeather.icon
      },
      morning: makeSlot(morning, '08:00 AM'),
      travel_morning_to_afternoon: getDistanceBetween(morning, afternoon),
      afternoon: makeSlot(afternoon, '11:00 AM'),
      lunch: {
        restaurant_name: lunchRest.name,
        cuisine: lunchRest.cuisine || 'Local Specialties',
        price_range: lunchRest.price_range || (filters.budget < 10000 ? '₹150-300 per person' : filters.budget > 40000 ? '₹800-1500 per person' : '₹300-600 per person'),
        must_try_dish: lunchRest.must_try_dish || "Chef's Special",
        address: lunchRest.address || lunchRest.vicinity || filters.destination,
        rating: lunchRest.rating || 4.2,
        reviews_count: lunchRest.reviews_count || lunchRest.user_ratings_total || 250,
        photo_reference: lunchRest.photo_reference || null,
        photo_url: lunchRest.photo_url || (lunchRest.photo_reference ? getPlacePhotoUrl(lunchRest.photo_reference) : `https://picsum.photos/seed/${encodeURIComponent(lunchRest.name)}/800/500`),
      },
      travel_afternoon_to_evening: getDistanceBetween(afternoon, evening),
      evening: makeSlot(evening, '03:00 PM'),
      dinner: {
        restaurant_name: dinnerRest.name,
        cuisine: dinnerRest.cuisine || 'Local Special Cuisine',
        price_range: dinnerRest.price_range || (filters.budget < 10000 ? '₹200-400 per person' : filters.budget > 40000 ? '₹1000-2500 per person' : '₹400-800 per person'),
        must_try_dish: dinnerRest.must_try_dish || "Signature Dish",
        address: dinnerRest.address || dinnerRest.vicinity || filters.destination,
        rating: dinnerRest.rating || 4.3,
        reviews_count: dinnerRest.reviews_count || dinnerRest.user_ratings_total || 340,
        photo_reference: dinnerRest.photo_reference || null,
        photo_url: dinnerRest.photo_url || (dinnerRest.photo_reference ? getPlacePhotoUrl(dinnerRest.photo_reference) : `https://picsum.photos/seed/${encodeURIComponent(dinnerRest.name)}/800/500`),
      },
      travel_evening_to_night: getDistanceBetween(evening, night),
      night: makeSlot(night, '07:00 PM'),
      accommodation: {
        hotel_name: selectedHotel.name || `${filters.destination} Luxury Stay`,
        stars: selectedHotel.stars || selectedHotel.rating ? Math.round(selectedHotel.rating || selectedHotel.stars) : 4,
        location: selectedHotel.location || selectedHotel.vicinity || 'City Center',
        price_per_night: selectedHotel.price_per_night || Math.round(budgetPerDay * 0.35),
        amenities: selectedHotel.amenities || ['WiFi', 'AC', 'Breakfast', 'Room Service'],
        photo_reference: selectedHotel.photo_reference || null,
        photo_url: selectedHotel.photo_url || (selectedHotel.photo_reference ? getPlacePhotoUrl(selectedHotel.photo_reference) : `https://picsum.photos/seed/${encodeURIComponent(selectedHotel.name)}/800/500`),
        booking_url: `https://www.google.com/travel/hotels/${encodeURIComponent(filters.destination)}`,
      },
      total_day_cost: budgetPerDay,
    });
  }

  // Cost breakdown calculation
  const totalCost = filters.budget;
  const recommendedTransportPrice = Math.round(totalCost * 0.3);
  const accommodationPrice = Math.round(selectedHotel.price_per_night || (budgetPerDay * 0.35)) * days;
  const foodPrice = Math.round(totalCost * 0.2);
  const activitiesPrice = Math.round(totalCost * 0.15);
  const miscPrice = totalCost - (recommendedTransportPrice + accommodationPrice + foodPrice + activitiesPrice);

  return {
    title: ctx.curatedData?.title || `${filters.destination} ${filters.travelType} Gateway Expedition`,
    tagline: ctx.curatedData?.tagline || `A custom-themed ${days}-day itinerary through ${filters.destination} designed for a perfect ${filters.travelType.toLowerCase()} experience.`,
    total_cost_estimate: totalCost,
    cost_breakdown: {
      transport: recommendedTransportPrice,
      accommodation: accommodationPrice,
      food: foodPrice,
      activities: activitiesPrice,
      miscellaneous: Math.max(0, miscPrice)
    },
    weather_summary: weather.length > 0
      ? `Forecast is mostly ${weather.map((w: any) => w.condition).filter((v: string, i: number, self: string[]) => self.indexOf(v) === i).join(', ')} with temperatures from ${Math.min(...weather.map((w: any) => w.temp_min))}°C to ${Math.max(...weather.map((w: any) => w.temp_max))}°C.`
      : 'Pleasant weather expected, check updates before traveling.',
    days: daysArray,
    recommended_transport: {
      type: 'Flight',
      from: filters.source,
      to: filters.destination,
      suggested_option_name: filters.budget > 40000 ? 'Premium Express Direct' : 'Economy Comfort Flight',
      estimated_cost: recommendedTransportPrice,
      duration: '2 hours standard flight',
      booking_url: `https://www.makemytrip.com/flights/${filters.source.toLowerCase()}-to-${filters.destination.toLowerCase()}/`,
    },
    packing_tips: ctx.curatedData?.packing_tips || ['Comfortable cotton outfits', 'Walking shoes', 'Sunscreen', 'Umbrella'],
    local_phrases: ctx.curatedData?.local_phrases || [
      { phrase: 'Namaste / Hello', meaning: 'Standard local welcome greeting' },
      { phrase: 'Dhanyavaad / Thank you', meaning: 'Expression of gratitude' }
    ],
    emergency_contacts: ctx.curatedData?.emergency_contacts || { police: '100', ambulance: '102', tourist_helpline: '1363' },
    nearby_hidden_gems: ctx.curatedData?.nearby_hidden_gems || ['Quiet viewpoints off the main highway'],
    instagram_worthy_spots: ctx.curatedData?.instagram_worthy_spots || [
      { spot: 'Local landmarks', best_time: 'Golden hour (5 PM - 6 PM)' }
    ],
    dos_and_donts: ctx.curatedData?.dos_and_donts || {
      dos: ['Respect local traditions', 'Keep emergency numbers handy'],
      donts: ['Do not litter at sites', 'Avoid poorly lit areas at night']
    },
  };
}
