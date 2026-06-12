import axios from 'axios';

export interface ItineraryFilters {
  source: string;
  destination: string;
  days: number;
  budget: number;
  themes: string[];
  month: string;
  year: number;
  transportPreference: string;
  travelers: { adults: number; children: number };
  accommodation: string; // 'Budget' | 'Mid-range' | 'Premium' | 'Luxury'
  mealPreference: string; // 'Veg Only' | 'Non-Veg' | 'Both'
  specialNeeds?: string;
}

// Fallback dataset for popular Indian destinations
const DESTINATION_FALLBACKS: Record<string, any> = {
  jaipur: {
    title: "Jaipur Royal Heritage Expedition",
    tagline: "Explore the majestic forts, grand palaces, and colorful bazaars of the Pink City.",
    best_time_note: "October to March is ideal as the weather is pleasant and cool.",
    weather_expected: "Warm sunny days around 26°C with cool evenings of 14°C.",
    packing_tips: ["Light cotton clothing", "Comfortable walking shoes", "Sunscreen and sunglasses", "A hat or cap"],
    local_phrases: [
      { phrase: "Khamma Ghani", meaning: "A traditional Rajasthani greeting (Hello)" },
      { phrase: "Aap kaise ho?", meaning: "How are you?" },
      { phrase: "Kitne ka hai?", meaning: "How much is this?" }
    ],
    emergency_contacts: { police: "100", ambulance: "102", tourist_helpline: "0141-2822822" },
    nearby_hidden_gems: ["Panna Meena ka Kund stepwell", "Galta Ji Monkey Temple", "Abhaneri Stepwell"],
    instagram_worthy_spots: [
      { spot: "Hawa Mahal facade", best_time: "Early morning for golden light" },
      { spot: "Patrika Gate", best_time: "Late afternoon" },
      { spot: "Amer Fort Sheesh Mahal", best_time: "11:00 AM when sun hits the mirrors" },
      { spot: "Jal Mahal viewpoint", best_time: "Sunset" },
      { spot: "Nahargarh Fort sunset point", best_time: "5:30 PM" }
    ],
    attractions: [
      { name: "Hawa Mahal", entry: "₹50", time: "1 hour" },
      { name: "Amer Fort", entry: "₹100", time: "3 hours" },
      { name: "City Palace", entry: "₹200", time: "2 hours" },
      { name: "Jantar Mantar", entry: "₹50", time: "1.5 hours" }
    ],
    restaurants: [
      { name: "LMB (Laxmi Mishthan Bhandar)", cuisine: "Rajasthani Veg", price: "₹₹", dish: "Rajasthani Thali / Pyaaz Kachori", address: "Johri Bazar, Jaipur" },
      { name: "Chokhi Dhani", cuisine: "Rajasthani", price: "₹₹₹", dish: "Dal Baati Churma", address: "Tonk Road, Jaipur" },
      { name: "The Peacock Rooftop", cuisine: "Multi-cuisine", price: "₹₹", dish: "Laal Maas (Non-Veg)", address: "Hathroi Fort, Jaipur" }
    ]
  },
  goa: {
    title: "Goa Beach & Spice Paradise Trail",
    tagline: "Unwind on golden sands, dive into water sports, and explore old Portuguese quarters.",
    best_time_note: "November to February is the peak season with lively festivals and cool beach breezes.",
    weather_expected: "Tropical weather, sunny days around 30°C and humid evenings.",
    packing_tips: ["Swimwear", "Flip-flops", "Sunblock", "Breathable linen shirts", "Insect repellent"],
    local_phrases: [
      { phrase: "Dev Borem Karum", meaning: "Thank you (Konkani)" },
      { phrase: "Tum koso asa?", meaning: "How are you?" },
      { phrase: "Maka naka", meaning: "I don't want" }
    ],
    emergency_contacts: { police: "100", ambulance: "108", tourist_helpline: "0832-2437037" },
    nearby_hidden_gems: ["Netravali Bubble Lake", "Cola Beach Lagoon", "Chorao Island Bird Sanctuary"],
    instagram_worthy_spots: [
      { spot: "Parra Road (Coconut tree lined road)", best_time: "Sunrise" },
      { spot: "Fontainhas Latin Quarter lanes", best_time: "10:00 AM for bright colors" },
      { spot: "Cabo de Rama Fort cliff", best_time: "Sunset" },
      { spot: "Chapora Fort ruins", best_time: "5:00 PM" },
      { spot: "Arambol Sweet Water Lake", best_time: "Late afternoon" }
    ],
    attractions: [
      { name: "Basilica of Bom Jesus", entry: "Free", time: "1 hour" },
      { name: "Dudhsagar Waterfalls", entry: "₹400 for jeep", time: "5 hours" },
      { name: "Anjuna Beach Flea Market", entry: "Free", time: "3 hours" },
      { name: "Sahakari Spice Farm", entry: "₹500", time: "2 hours" }
    ],
    restaurants: [
      { name: "Fisherman's Wharf", cuisine: "Goan Seafood", price: "₹₹", dish: "Prawn Balchao / Fish Curry", address: "Cavelossim, Goa" },
      { name: "Gunpowder", cuisine: "Coastal South Indian", price: "₹₹", dish: "Kerala Porotta & Beef Fry / Mushroom Curry", address: "Assagao, Goa" },
      { name: "Curlies", cuisine: "Multi-cuisine", price: "₹₹", dish: "Woodfired Pizza", address: "Anjuna Beach, Goa" }
    ]
  }
};

export async function generateItinerary(filters: ItineraryFilters): Promise<any> {
  const destKey = filters.destination.toLowerCase().trim();
  
  // 1. Try to invoke LLM API if key is present
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const response = await callLLM(filters, apiKey);
      if (response) return response;
    } catch (e) {
      console.warn("LLM API call failed, falling back to simulation engine", e);
    }
  }

  // 2. Fallback simulation builder
  // If destination matches our list, use specific details, else generate dynamic generic template
  const baseData = DESTINATION_FALLBACKS[destKey] || {
    title: `${filters.destination} Scenic Escape`,
    tagline: `An exciting custom getaway designed around your theme: ${filters.themes.join(', ') || 'Exploration'}.`,
    best_time_note: `The month of ${filters.month} offers a great atmosphere for exploring ${filters.destination}.`,
    weather_expected: "Pleasant seasonal conditions with comfortable sightseeing windows.",
    packing_tips: ["Comfortable outfits", "Sturdy footwear", "Reusable water bottle", "Camera"],
    local_phrases: [
      { phrase: "Namaste", meaning: "Hello / Greeting" },
      { phrase: "Dhanyawaad", meaning: "Thank you" },
      { phrase: "Yeh kitne ka hai?", meaning: "How much does this cost?" }
    ],
    emergency_contacts: { police: "100", ambulance: "102", tourist_helpline: "1363" },
    nearby_hidden_gems: ["Local countryside trails", "Old town artisanal shops", "Panoramic sunset ridge point"],
    instagram_worthy_spots: [
      { spot: "City center monument", best_time: "Morning" },
      { spot: "Scenic overlook view", best_time: "Sunset" },
      { spot: "Artisanal marketplace", best_time: "Afternoon" }
    ],
    attractions: [
      { name: "Main City Landmark", entry: "₹100", time: "2 hours" },
      { name: "Scenic Nature Park", entry: "₹50", time: "2 hours" },
      { name: "Heritage Cultural Museum", entry: "₹150", time: "1.5 hours" }
    ],
    restaurants: [
      { name: "Flavors of the Land", cuisine: "Local Specialties", price: "₹₹", dish: "Chef's Special Curry", address: "City Center" },
      { name: "The Green Bistro", cuisine: "Vegetarian / Continental", price: "₹₹", dish: "Farm Fresh Platter", address: "Rooftop lane" },
      { name: "Spice Route Grill", cuisine: "Tandoori / Fusion", price: "₹₹", dish: "Charcoal Grilled Kebabs", address: "Near Old Market" }
    ]
  };

  // Generate budget numbers
  const totalCost = filters.budget;
  const cost_breakdown = {
    transport: Math.round(totalCost * 0.35),
    accommodation: Math.round(totalCost * 0.30),
    food: Math.round(totalCost * 0.15),
    activities: Math.round(totalCost * 0.12),
    miscellaneous: Math.round(totalCost * 0.08)
  };

  // Build day cards
  const daysArray = [];
  const hotelBaseName = filters.accommodation === 'Budget' ? 'OYO / Zostel' :
                       filters.accommodation === 'Mid-range' ? '3-Star Plaza' :
                       filters.accommodation === 'Premium' ? 'Grand Regency 4-Star' : 'Grand Palace Resort & Spa';

  for (let d = 1; d <= filters.days; d++) {
    const attractionIndex = (d - 1) % baseData.attractions.length;
    const nextAttractionIndex = (d) % baseData.attractions.length;
    const restIndex = (d - 1) % baseData.restaurants.length;
    
    const morningAttr = baseData.attractions[attractionIndex];
    const afternoonAttr = baseData.attractions[nextAttractionIndex];
    const dinnerRest = baseData.restaurants[restIndex];

    daysArray.push({
      day_number: d,
      theme: `Day ${d}: Discovering Heritage & Local Sights`,
      morning: {
        time: "09:00 AM",
        activity_name: `Visit ${morningAttr.name}`,
        description: `Explore the gorgeous spaces of ${morningAttr.name}, marveling at the architecture and local vibes.`,
        location_name: morningAttr.name,
        google_maps_link: `https://maps.google.com/?q=${encodeURIComponent(morningAttr.name + ' ' + filters.destination)}`,
        estimated_cost: parseInt(morningAttr.entry.replace('₹', '')) || 50,
        tips: "Arrive early to beat the crowd and get great pictures."
      },
      afternoon: {
        time: "02:00 PM",
        activity_name: `Leisure Walk through ${afternoonAttr.name}`,
        description: `Experience the local surroundings, interact with artisans, and grab traditional local lunch.`,
        location_name: afternoonAttr.name,
        google_maps_link: `https://maps.google.com/?q=${encodeURIComponent(afternoonAttr.name + ' ' + filters.destination)}`,
        estimated_cost: parseInt(afternoonAttr.entry.replace('₹', '')) || 50,
        tips: "Wear comfortable walking shoes."
      },
      evening: {
        time: "06:00 PM",
        activity_name: "Local Bazaars & Shopping Walk",
        description: "Walk through regional markets. Check out local handicrafts, spices, and unique souvenirs.",
        location_name: "Central Town Square Market",
        google_maps_link: `https://maps.google.com/?q=${encodeURIComponent('market ' + filters.destination)}`,
        estimated_cost: 0,
        tips: "Don't hesitate to bargain politely."
      },
      dinner: {
        restaurant_name: dinnerRest.name,
        cuisine: dinnerRest.cuisine,
        price_range: dinnerRest.price,
        must_try_dish: dinnerRest.dish,
        address: dinnerRest.address
      },
      accommodation: {
        hotel_name: `${filters.destination} ${hotelBaseName}`,
        stars: filters.accommodation === 'Budget' ? 2 : filters.accommodation === 'Mid-range' ? 3 : filters.accommodation === 'Premium' ? 4 : 5,
        location: "City Center",
        price_per_night: Math.round(cost_breakdown.accommodation / filters.days),
        booking_platform: "TravelSphere AI Hotels"
      },
      total_day_cost: Math.round(totalCost / filters.days)
    });
  }

  const result = {
    title: baseData.title,
    tagline: baseData.tagline,
    total_cost_estimate: totalCost,
    cost_breakdown,
    best_time_note: baseData.best_time_note,
    weather_expected: baseData.weather_expected,
    days: daysArray,
    recommended_transport: {
      type: filters.transportPreference === 'No Preference' ? 'Flight' : filters.transportPreference,
      from: filters.source || "Home City",
      to: filters.destination,
      suggested_option_name: filters.transportPreference === 'Flight' ? 'Air India Direct Flight' :
                             filters.transportPreference === 'Train' ? 'Vande Bharat Express' : 'Intercity AC Sleeper Bus',
      estimated_cost: cost_breakdown.transport,
      booking_link_deep_link: `/book/${filters.transportPreference.toLowerCase() || 'flight'}?dest=${encodeURIComponent(filters.destination)}`
    },
    packing_tips: baseData.packing_tips,
    local_phrases: baseData.local_phrases,
    emergency_contacts: baseData.emergency_contacts,
    nearby_hidden_gems: baseData.nearby_hidden_gems,
    instagram_worthy_spots: baseData.instagram_worthy_spots
  };

  return result;
}

// Call LLM API (handles both OpenAI & Gemini endpoints depending on configuration)
async function callLLM(filters: ItineraryFilters, apiKey: string): Promise<any> {
  const isGemini = apiKey === process.env.GEMINI_API_KEY;
  
  const systemPrompt = `You are an expert travel planner. Create a highly detailed and budget-aligned itinerary. Make sure to consider the Starting Point (Source) for estimating transport recommendations.
Return a structured JSON object matching this TypeScript schema:
{
  title: string;
  tagline: string;
  total_cost_estimate: number;
  cost_breakdown: { transport: number; accommodation: number; food: number; activities: number; miscellaneous: number; };
  best_time_note: string;
  weather_expected: string;
  days: Array<{
    day_number: number;
    theme: string;
    morning: { time: string; activity_name: string; description: string; location_name: string; google_maps_link: string; estimated_cost: number; tips: string; };
    afternoon: { time: string; activity_name: string; description: string; location_name: string; google_maps_link: string; estimated_cost: number; tips: string; };
    evening: { time: string; activity_name: string; description: string; location_name: string; google_maps_link: string; estimated_cost: number; tips: string; };
    dinner: { restaurant_name: string; cuisine: string; price_range: string; must_try_dish: string; address: string; };
    accommodation: { hotel_name: string; stars: number; location: string; price_per_night: number; booking_platform: string; };
    total_day_cost: number;
  }>;
  recommended_transport: { type: string; from: string; to: string; suggested_option_name: string; estimated_cost: number; booking_link_deep_link: string; };
  packing_tips: string[];
  local_phrases: Array<{ phrase: string; meaning: string; }>;
  emergency_contacts: { police: string; ambulance: string; tourist_helpline: string; };
  nearby_hidden_gems: string[];
  instagram_worthy_spots: Array<{ spot: string; best_time: string; }>;
}
Filters:
- Starting Point (Source): ${filters.source}
- Destination: ${filters.destination}
- Duration: ${filters.days} days
- Budget: ${filters.budget} INR
- Month: ${filters.month}
- Accommodation: ${filters.accommodation}
- Meal Preference: ${filters.mealPreference}
- Themes: ${filters.themes.join(', ')}`;

  if (isGemini) {
    // Gemini API call (using gemini-2.5-flash-lite)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };
    const res = await axios.post(url, payload, { timeout: 90000 });
    let textResponse = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (textResponse.includes('```')) {
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(textResponse);
  } else {
    // OpenAI API call
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: systemPrompt }],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    let textResponse = res.data?.choices?.[0]?.message?.content || '';
    if (textResponse.includes('```')) {
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(textResponse);
  }
}
