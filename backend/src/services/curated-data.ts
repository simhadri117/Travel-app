export interface CuratedAttraction {
  name: string;
  description: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  estimated_cost: number;
  visit_duration_hours: number;
  tips: string;
  best_time_to_visit: string;
  outdoor: boolean;
  photo_url: string;
  types?: string[];
}

export interface CuratedRestaurant {
  name: string;
  cuisine: string;
  price_range: string;
  must_try_dish: string;
  address: string;
  rating: number;
  reviews_count: number;
  photo_url: string;
}

export interface CuratedHotel {
  name: string;
  stars: number;
  location: string;
  price_per_night: number;
  amenities: string[];
  photo_url: string;
}

export interface CuratedDestination {
  title: string;
  tagline: string;
  weather_summary: string;
  packing_tips: string[];
  local_phrases: { phrase: string; meaning: string }[];
  emergency_contacts: { police: string; ambulance: string; tourist_helpline: string };
  nearby_hidden_gems: string[];
  instagram_worthy_spots: { spot: string; best_time: string }[];
  dos_and_donts: { dos: string[]; donts: string[] };
  attractions: CuratedAttraction[];
  restaurants: CuratedRestaurant[];
  hotels: CuratedHotel[];
}

export const CURATED_DESTINATIONS: Record<string, CuratedDestination> = {
  goa: {
    title: "Goa Beach & Heritage Paradise",
    tagline: "Unwind on golden sands, dive into water sports, and explore old Portuguese quarters.",
    weather_summary: "Tropical climate. Sunny days around 30°C and humid sea breezes in the evening.",
    packing_tips: ["Light swimwear", "Flip-flops and sandals", "High SPF sunscreen", "Cotton clothing", "Insect repellent"],
    local_phrases: [
      { phrase: "Dev Borem Karum", meaning: "Thank you (Konkani)" },
      { phrase: "Tum koso asa?", meaning: "How are you?" },
      { phrase: "Maka naka", meaning: "I don't want" }
    ],
    emergency_contacts: { police: "100", ambulance: "108", tourist_helpline: "0832-2437037" },
    nearby_hidden_gems: ["Netravali Bubble Lake", "Cola Beach Lagoon", "Chorao Island Bird Sanctuary", "Harvalem Caves"],
    instagram_worthy_spots: [
      { spot: "Parra Road (Coconut Tree Lined Road)", best_time: "Sunrise (6:00 AM)" },
      { spot: "Fontainhas Latin Quarter", best_time: "Late Morning (10:00 AM)" },
      { spot: "Cabo de Rama Fort Cliff", best_time: "Sunset (5:30 PM)" }
    ],
    dos_and_donts: {
      dos: ["Respect local beach dress codes", "Keep hydration levels high", "Try traditional Feni and seafood"],
      donts: ["Do not litter on beaches", "Avoid driving rented scooters without a helmet", "Do not take photos of locals without permission"]
    },
    attractions: [
      {
        name: "Basilica of Bom Jesus",
        description: "A UNESCO World Heritage site holding the mortal remains of St. Francis Xavier, showcasing elegant baroque architecture.",
        vicinity: "Old Goa, Panaji",
        rating: 4.7,
        user_ratings_total: 12450,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Dress modestly covering shoulders and knees. Photography is permitted but maintain silence.",
        best_time_to_visit: "09:00 AM - 11:00 AM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800"
      },
      {
        name: "Se Cathedral",
        description: "One of the largest churches in Asia, built in Portuguese-Gothic style dedicated to St. Catherine.",
        vicinity: "Old Goa, Panaji",
        rating: 4.6,
        user_ratings_total: 8900,
        estimated_cost: 0,
        visit_duration_hours: 1.0,
        tips: "Observe the majestic Golden Bell which is the largest in Goa.",
        best_time_to_visit: "11:00 AM - 01:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?w=800"
      },
      {
        name: "Fontainhas Latin Quarter",
        description: "A vibrant neighborhood in Panaji famous for its narrow winding streets and brightly colored Portuguese houses.",
        vicinity: "Panaji",
        rating: 4.5,
        user_ratings_total: 6200,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "A walking tour is best. Respect residents' privacy while taking photos.",
        best_time_to_visit: "03:30 PM - 05:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1587922448981-d11893c52402?w=800"
      },
      {
        name: "Mandovi River Cruise",
        description: "A scenic evening boat cruise on the Mandovi River featuring traditional Goan folk dances and DJ music.",
        vicinity: "Patto Plaza, Panaji",
        rating: 4.1,
        user_ratings_total: 14500,
        estimated_cost: 500,
        visit_duration_hours: 1.5,
        tips: "Book the sunset cruise in advance to secure the best deck seats.",
        best_time_to_visit: "06:00 PM - 07:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"
      },
      {
        name: "Calangute Beach",
        description: "The largest and most popular beach in North Goa, packed with sunbeds, seafood shacks, and water sports.",
        vicinity: "Calangute, North Goa",
        rating: 4.3,
        user_ratings_total: 35000,
        estimated_cost: 0,
        visit_duration_hours: 3.0,
        tips: "Keep a look out for high tide warnings. Shacks offer free sunbeds if you order food.",
        best_time_to_visit: "08:00 AM - 11:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"
      },
      {
        name: "Baga Beach",
        description: "A buzzing coastal stretch famous for its lively beach shacks, water sports, and energetic atmosphere.",
        vicinity: "Baga, North Goa",
        rating: 4.4,
        user_ratings_total: 28400,
        estimated_cost: 0,
        visit_duration_hours: 2.5,
        tips: "Great for banana boat rides, jet skiing, and parasailing.",
        best_time_to_visit: "02:00 PM - 05:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
      },
      {
        name: "Candolim Beach",
        description: "A cleaner, quieter beach ideal for relaxation, sunset walks, and enjoying peaceful beach shacks.",
        vicinity: "Candolim, North Goa",
        rating: 4.5,
        user_ratings_total: 19500,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Visit the beach shacks for local Goan fish curry rice.",
        best_time_to_visit: "04:30 PM - 06:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800"
      },
      {
        name: "Tito's Lane Nightlife",
        description: "The absolute epicentre of Goan nightlife, lined with iconic clubs like Club Tito's and Café Mambo.",
        vicinity: "Baga, North Goa",
        rating: 4.2,
        user_ratings_total: 11000,
        estimated_cost: 1500,
        visit_duration_hours: 3.0,
        tips: "Couples get discounted entries. Dress up nicely as dress codes apply.",
        best_time_to_visit: "09:00 PM - 12:00 AM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800"
      },
      {
        name: "Dudhsagar Waterfalls",
        description: "A spectacular four-tiered waterfall rushing down the Western Ghats, resembling a sea of milk.",
        vicinity: "Sanguem Taluka, South Goa",
        rating: 4.6,
        user_ratings_total: 16200,
        estimated_cost: 600,
        visit_duration_hours: 5.0,
        tips: "Requires a jeep safari through the jungle. Wear life jackets at the waterfall pool.",
        best_time_to_visit: "07:30 AM - 01:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1627894006066-b45b4c5b7b9d?w=800"
      },
      {
        name: "Sahakari Spice Farm",
        description: "A tropical spice plantation offering guided educational walks, elephant bathing, and a traditional Goan buffet lunch.",
        vicinity: "Ponda, Central Goa",
        rating: 4.4,
        user_ratings_total: 5100,
        estimated_cost: 500,
        visit_duration_hours: 2.5,
        tips: "Buffet lunch is included in the ticket. Try the local lemon grass tea.",
        best_time_to_visit: "11:30 AM - 02:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800"
      },
      {
        name: "Calangute Parasailing Experience",
        description: "A high-flying adventure activity offering panoramic views of the Arabian Sea and North Goa coastline.",
        vicinity: "Calangute, North Goa",
        rating: 4.5,
        user_ratings_total: 3200,
        estimated_cost: 800,
        visit_duration_hours: 1.0,
        tips: "Always check safety harnesses and do not carry phones or loose items.",
        best_time_to_visit: "03:00 PM - 04:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800"
      },
      {
        name: "Curlies Beach Shack Anjuna",
        description: "A legendary beach restaurant at the southern end of Anjuna beach, known for its laid-back vibes and sunset drinks.",
        vicinity: "Anjuna, North Goa",
        rating: 4.2,
        user_ratings_total: 9800,
        estimated_cost: 600,
        visit_duration_hours: 2.0,
        tips: "Head to the rooftop seating for the ultimate sunset view.",
        best_time_to_visit: "05:00 PM - 07:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1563186930-f87b28dbcc75?w=800"
      },
      {
        name: "Anjuna Flea Market",
        description: "A historic weekly market started by hippies in the 1970s, offering handicrafts, jewelry, and clothing.",
        vicinity: "Anjuna, North Goa",
        rating: 4.1,
        user_ratings_total: 7500,
        estimated_cost: 0,
        visit_duration_hours: 2.5,
        tips: "Only operates on Wednesdays. Bargaining is essential; start at 50% of the quote.",
        best_time_to_visit: "09:00 AM - 12:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800"
      },
      {
        name: "Mall De Goa",
        description: "The largest indoor shopping mall in Goa, featuring national brands, a food court, and movie theatres.",
        vicinity: "Porvorim",
        rating: 4.3,
        user_ratings_total: 12200,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Ideal place to escape during a hot afternoon or a rainy day.",
        best_time_to_visit: "01:00 PM - 03:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
      },
      {
        name: "Panaji Street Food Tour",
        description: "An evening food tour tasting local Goan snacks like Chorizo Pav, Cutlet Bread, and Portuguese desserts.",
        vicinity: "Municipal Garden, Panaji",
        rating: 4.6,
        user_ratings_total: 1800,
        estimated_cost: 400,
        visit_duration_hours: 2.0,
        tips: "Keep an empty stomach. Try the local bebinca at traditional bakeries.",
        best_time_to_visit: "05:00 PM - 07:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800"
      },
      {
        name: "Casino Pride Mandovi",
        description: "A grand floating casino on the Mandovi River offering international games, live shows, and unlimited buffet.",
        vicinity: "Captain of Ports Jetty, Panaji",
        rating: 4.0,
        user_ratings_total: 21000,
        estimated_cost: 2000,
        visit_duration_hours: 3.5,
        tips: "Smart casual clothing is mandatory. Entry fee includes playing chips and buffet dinner.",
        best_time_to_visit: "08:00 PM - 12:00 AM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800"
      },
      {
        name: "Dona Paula View Point",
        description: "A scenic rocky hammerhead overlook offering spectacular views of the Mormugao harbor and Zuari river confluence.",
        vicinity: "Dona Paula, Panaji",
        rating: 4.2,
        user_ratings_total: 13800,
        estimated_cost: 50,
        visit_duration_hours: 1.0,
        tips: "Popular for speedboats and viewing the 'Image of India' statue.",
        best_time_to_visit: "08:00 AM - 09:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800"
      },
      {
        name: "Miramar Beach Panjim",
        description: "A beautiful, wide sandy beach located where the Mandovi River meets the Arabian Sea.",
        vicinity: "Miramar, Panaji",
        rating: 4.3,
        user_ratings_total: 15400,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Walk along the newly renovated promenade path.",
        best_time_to_visit: "04:30 PM - 06:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800"
      },
      {
        name: "Chapora Fort Ruins",
        description: "The iconic cliffside fort ruins overlooking Vagator beach, popularized in Bollywood cinema.",
        vicinity: "Vagator, North Goa",
        rating: 4.4,
        user_ratings_total: 18600,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Climb up the steep stone path. Best photographed at sunset.",
        best_time_to_visit: "05:00 PM - 06:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800"
      },
      {
        name: "Aguada Fort & Lighthouse",
        description: "A 17th-century Portuguese coastal fort featuring a massive freshwater storage cistern and a vintage lighthouse.",
        vicinity: "Sinquerim, Candolim",
        rating: 4.5,
        user_ratings_total: 24200,
        estimated_cost: 50,
        visit_duration_hours: 1.5,
        tips: "Explore the lower fort walls that touch the beach.",
        best_time_to_visit: "08:00 AM - 10:00 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"
      }
    ],
    restaurants: [
      {
        name: "Gunpowder",
        cuisine: "Coastal South Indian",
        price_range: "₹400-800 per person",
        must_try_dish: "Kerala Porotta with Mutton Pepper Fry",
        address: "Anjuna-Mapusa Road, Assagao",
        rating: 4.5,
        reviews_count: 3800,
        photo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
      },
      {
        name: "Fisherman's Wharf",
        cuisine: "Goan Seafood & Continental",
        price_range: "₹600-1200 per person",
        must_try_dish: "Goan Crab Masala & Butter Garlic Prawns",
        address: "Panaji Waterfront, Panaji",
        rating: 4.4,
        reviews_count: 5200,
        photo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
      },
      {
        name: "Mum's Kitchen",
        cuisine: "Traditional Goan",
        price_range: "₹500-1000 per person",
        must_try_dish: "Fish Curry Rice & Pork Vindaloo",
        address: "D. B. Road, Panaji",
        rating: 4.3,
        reviews_count: 2400,
        photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
      },
      {
        name: "Thalassa Siolim",
        cuisine: "Greek & Mediterranean",
        price_range: "₹800-1800 per person",
        must_try_dish: "Greek Souvlaki & Spinach Pie",
        address: "Vaddy, Siolim",
        rating: 4.3,
        reviews_count: 9400,
        photo_url: "https://images.unsplash.com/photo-1502301197279-669b95141c0e?w=800"
      },
      {
        name: "Artjuna Garden Cafe",
        cuisine: "Organic, Mediterranean & Cafe",
        price_range: "₹300-600 per person",
        must_try_dish: "Hummus Platter & Fresh Smoothies",
        address: "Vagator beach road, Anjuna",
        rating: 4.5,
        reviews_count: 3100,
        photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
      },
      {
        name: "Vinayak Family Restaurant",
        cuisine: "Local Goan Thali",
        price_range: "₹200-400 per person",
        must_try_dish: "Special Fish Thali",
        address: "Assagao, near Mapusa",
        rating: 4.6,
        reviews_count: 4700,
        photo_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
      },
      {
        name: "Burger Factory Anjuna",
        cuisine: "Gourmet Burgers & Shakes",
        price_range: "₹350-700 per person",
        must_try_dish: "Double Gourmet Beef/Veg Burger with Blue Cheese",
        address: "Anjuna Beach Road",
        rating: 4.5,
        reviews_count: 2100,
        photo_url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800"
      },
      {
        name: "Brittos Restaurant",
        cuisine: "Goan Seafood & Grill",
        price_range: "₹500-1000 per person",
        must_try_dish: "Baked Crab & Seafood Platter",
        address: "Baga Beach Road",
        rating: 4.1,
        reviews_count: 14200,
        photo_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
      },
      {
        name: "Olive Bar & Kitchen Vagator",
        cuisine: "Italian & Mediterranean",
        price_range: "₹1000-2500 per person",
        must_try_dish: "Wood-fired Pizza & Sangria",
        address: "Vagator Cliff, Vagator",
        rating: 4.4,
        reviews_count: 1800,
        photo_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800"
      },
      {
        name: "Martin's Corner",
        cuisine: "Goan Delicacies & Seafood",
        price_range: "₹600-1500 per person",
        must_try_dish: "Pork Sorpotel & Butter Garlic Crab",
        address: "Betalbatim, South Goa",
        rating: 4.5,
        reviews_count: 8500,
        photo_url: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800"
      }
    ],
    hotels: [
      {
        name: "W Goa Resort",
        stars: 5,
        location: "Vagator Beach, North Goa",
        price_per_night: 15000,
        amenities: ["Swimming Pool", "Spa", "Private Beach Access", "Bar", "Fitness Center"],
        photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
      },
      {
        name: "Taj Exotica Resort & Spa",
        stars: 5,
        location: "Benaulim, South Goa",
        price_per_night: 18000,
        amenities: ["Golf Course", "Spa", "Kids Play Area", "Ocean Views", "Fine Dining"],
        photo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"
      },
      {
        name: "Fairfield by Marriott Baga",
        stars: 4,
        location: "Baga, North Goa",
        price_per_night: 6000,
        amenities: ["Pool", "Gym", "Restaurant", "WiFi", "Bar"],
        photo_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800"
      },
      {
        name: "Lemon Tree Amarante Beach Resort",
        stars: 4,
        location: "Candolim, North Goa",
        price_per_night: 5500,
        amenities: ["Spa", "Pool", "Free Breakfast", "Historic Architecture", "AC"],
        photo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a304?w=800"
      },
      {
        name: "Zostel Goa Morjim",
        stars: 2,
        location: "Morjim, North Goa",
        price_per_night: 1200,
        amenities: ["Backpacker Hostels", "AC Dorms", "WiFi", "Social Lounge", "Kitchenette"],
        photo_url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
      }
    ]
  },
  chennai: {
    title: "Chennai Culture & Coast Trail",
    tagline: "Immerse in the legacy of temples, long sandy beaches, and traditional South Indian filter coffee.",
    weather_summary: "Humid and warm coastal weather, with temperatures around 32°C. Evening beach strolls provide cool reliefs.",
    packing_tips: ["Lightweight cotton shirts", "Sun protection accessories", "Modest temple wear", "Comfortable walking sandals"],
    local_phrases: [
      { phrase: "Vanakkam", meaning: "Hello (Tamil)" },
      { phrase: "Nandri", meaning: "Thank you" },
      { phrase: "Yenna vilai?", meaning: "What is the price?" }
    ],
    emergency_contacts: { police: "100", ambulance: "108", tourist_helpline: "044-25380583" },
    nearby_hidden_gems: ["Covelong Surf Village", "Theosophical Society gardens", "Pulicat Lake Bird Sanctuary"],
    instagram_worthy_spots: [
      { spot: "Kapaleeshwarar Temple Gopuram", best_time: "Late Afternoon (4:30 PM)" },
      { spot: "Shore Temple Mahabalipuram", best_time: "Sunrise (6:00 AM)" },
      { spot: "Marina Beach Lighthouse View", best_time: "Sunset (5:30 PM)" }
    ],
    dos_and_donts: {
      dos: ["Remove footwear before entering temples", "Drink lots of fresh coconut water", "Eat meals on banana leaves"],
      donts: ["Do not wear revealing clothes in sacred temples", "Avoid walking alone on deserted beach stretches at night", "Do not hesitate to ask for directions"]
    },
    attractions: [
      {
        name: "Marina Beach Walk",
        description: "The second longest natural sandy beach in the world, filled with street vendors, local foods, and historical monuments.",
        vicinity: "Mylapore, Chennai",
        rating: 4.5,
        user_ratings_total: 42000,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Visit the lighthouse for a bird's-eye view of the entire beach line.",
        best_time_to_visit: "04:30 PM - 06:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800"
      },
      {
        name: "Kapaleeshwarar Temple",
        description: "A 7th-century shrine dedicated to Lord Shiva, displaying magnificent Dravidian architecture with a massive colorful Gopuram.",
        vicinity: "Mylapore, Chennai",
        rating: 4.7,
        user_ratings_total: 18200,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Remove your shoes outside. Recommended to go during the evening pooja rituals.",
        best_time_to_visit: "08:00 AM - 10:00 AM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800"
      },
      {
        name: "Express Avenue Mall",
        description: "A premier shopping destination featuring international brands, a large food court, and multiplexes.",
        vicinity: "Royapettah, Chennai",
        rating: 4.4,
        user_ratings_total: 31000,
        estimated_cost: 0,
        visit_duration_hours: 2.5,
        tips: "Has the largest gaming zone in South India, perfect for family entertainment.",
        best_time_to_visit: "01:00 PM - 03:30 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
      },
      {
        name: "East Coast Road Night Drive",
        description: "A scenic coastal highway drive from Chennai to Mahabalipuram, offering seaside cafes and calm ocean views.",
        vicinity: "ECR Road, Chennai",
        rating: 4.6,
        user_ratings_total: 4500,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Ideal for a late night drive or evening coffee stop at beachside spots.",
        best_time_to_visit: "08:00 PM - 10:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"
      },
      {
        name: "Government Museum Chennai",
        description: "A treasure trove of human history and culture, featuring a world-famous Bronze Gallery of Chola artifacts.",
        vicinity: "Egmore, Chennai",
        rating: 4.3,
        user_ratings_total: 11200,
        estimated_cost: 20,
        visit_duration_hours: 3.0,
        tips: "The Art Gallery and the massive skeleton of the Blue Whale are must-see displays.",
        best_time_to_visit: "10:30 AM - 01:30 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800"
      },
      {
        name: "Valluvar Kottam monument",
        description: "A unique chariot-shaped heritage monument built to honor the legendary Tamil poet and saint Thiruvalluvar.",
        vicinity: "Nungambakkam, Chennai",
        rating: 4.2,
        user_ratings_total: 8200,
        estimated_cost: 10,
        visit_duration_hours: 1.0,
        tips: "Examine the 133 chapters of Thirukkural inscribed on the stone pillars.",
        best_time_to_visit: "03:30 PM - 05:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"
      },
      {
        name: "Phoenix Marketcity Velachery",
        description: "One of the largest shopping malls in India, offering premium boutiques, fine dining, and an IMAX theater.",
        vicinity: "Velachery, Chennai",
        rating: 4.5,
        user_ratings_total: 48000,
        estimated_cost: 0,
        visit_duration_hours: 3.0,
        tips: "Escape the hot midday sun here. Great selection of craft beverage spots.",
        best_time_to_visit: "11:00 AM - 02:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
      },
      {
        name: "Mylapore Cultural Walking Tour",
        description: "A heritage walking exploration through old bazaar lanes, local flower markets, and historic houses of Mylapore.",
        vicinity: "Mylapore, Chennai",
        rating: 4.6,
        user_ratings_total: 1500,
        estimated_cost: 150,
        visit_duration_hours: 2.0,
        tips: "Drink traditional filter coffee served in brass tumblers at local shops.",
        best_time_to_visit: "07:00 AM - 09:00 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800"
      },
      {
        name: "Mahabalipuram Heritage Site",
        description: "A collection of 7th and 8th-century rock-cut monuments, famous for its grand shore temples and intricate stone carvings.",
        vicinity: "Mahabalipuram, East Coast Road",
        rating: 4.7,
        user_ratings_total: 21500,
        estimated_cost: 40,
        visit_duration_hours: 4.0,
        tips: "Hire an official local guide to explain 'Arjuna's Penance' and other carvings.",
        best_time_to_visit: "08:00 AM - 12:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"
      },
      {
        name: "Shore Temple",
        description: "An iconic structural stone temple built on the shores of the Bay of Bengal, reflecting Pallava dynasty architectural peak.",
        vicinity: "Mahabalipuram",
        rating: 4.7,
        user_ratings_total: 19800,
        estimated_cost: 40,
        visit_duration_hours: 1.5,
        tips: "Visit during sunrise for a breathtaking backdrop of the temple silhouette.",
        best_time_to_visit: "06:00 AM - 07:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800"
      },
      {
        name: "Covelong Beach Walk",
        description: "A lively coastal beach famous for surfing, seafood shacks, and sandy beach walks.",
        vicinity: "Kovalam (Covelong), ECR Road",
        rating: 4.4,
        user_ratings_total: 9200,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Excellent spot to take surfing lessons or eat local fish fry by the shore.",
        best_time_to_visit: "04:00 PM - 06:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
      },
      {
        name: "VGP Marine Kingdom",
        description: "India's first under-water aquarium featuring a 70-meter acrylic walk-through tunnel with sharks and rays.",
        vicinity: "Injambakkam, East Coast Road",
        rating: 4.3,
        user_ratings_total: 18500,
        estimated_cost: 650,
        visit_duration_hours: 2.5,
        tips: "Plan around scheduled fish feeding times for the best show.",
        best_time_to_visit: "10:30 AM - 01:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800"
      },
      {
        name: "Pondy Bazaar Market",
        description: "A major commercial street market in T. Nagar offering traditional silk sarees, jewelry, and daily wear items.",
        vicinity: "T. Nagar, Chennai",
        rating: 4.2,
        user_ratings_total: 16500,
        estimated_cost: 0,
        visit_duration_hours: 2.5,
        tips: "Bargain with pavement vendors. Great place to purchase souvenirs.",
        best_time_to_visit: "04:30 PM - 07:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800"
      },
      {
        name: "ECR Adventure & Surf Sports",
        description: "An outdoor hub offering stand-up paddleboarding, sea kayaking, and paramotoring activities.",
        vicinity: "Kovalam Beach Road, ECR",
        rating: 4.5,
        user_ratings_total: 2100,
        estimated_cost: 1200,
        visit_duration_hours: 2.0,
        tips: "Prior reservations are recommended for sunrise surf tours.",
        best_time_to_visit: "06:30 AM - 08:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800"
      },
      {
        name: "Writer's Cafe Gopalapuram",
        description: "A pleasant bookcafe and restaurant offering artisan bakery products, books, and peaceful workspace.",
        vicinity: "Gopalapuram, Chennai",
        rating: 4.4,
        user_ratings_total: 5400,
        estimated_cost: 300,
        visit_duration_hours: 2.0,
        tips: "Try their Swiss roll dessert. The café supports rehabilitation of burn survivors.",
        best_time_to_visit: "08:30 PM - 10:30 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
      },
      {
        name: "Cholamandal Artists' Village",
        description: "The largest artists' commune in India, displaying contemporary art paintings and bronze sculptures.",
        vicinity: "Palavakkam, East Coast Road",
        rating: 4.2,
        user_ratings_total: 3200,
        estimated_cost: 20,
        visit_duration_hours: 1.5,
        tips: "Explore the outdoor sculpture garden and speak to resident artists.",
        best_time_to_visit: "02:30 PM - 04:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"
      },
      {
        name: "Semmozhi Poonga Botanical Garden",
        description: "A tranquil horticultural garden in the center of the city with exotic plants, vertical gardens, and water ponds.",
        vicinity: "Cathedral Road, Chennai",
        rating: 4.2,
        user_ratings_total: 10400,
        estimated_cost: 15,
        visit_duration_hours: 1.5,
        tips: "Perfect escape for peaceful morning walks and bird watching.",
        best_time_to_visit: "07:30 AM - 09:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"
      },
      {
        name: "DakshinaChitra Museum",
        description: "A living museum showcasing the heritage, crafts, and lifestyles of the South Indian states.",
        vicinity: "Muttukadu, East Coast Road",
        rating: 4.5,
        user_ratings_total: 9600,
        estimated_cost: 130,
        visit_duration_hours: 3.0,
        tips: "Participate in local craft workshops like pottery or basket weaving.",
        best_time_to_visit: "11:00 AM - 02:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800"
      },
      {
        name: "Guindy National Park & Snake Park",
        description: "One of the only national parks located entirely within a city, featuring deer, rare birds, and a snake farm.",
        vicinity: "Guindy, Chennai",
        rating: 4.1,
        user_ratings_total: 14200,
        estimated_cost: 20,
        visit_duration_hours: 2.0,
        tips: "Perfect for family and children outings. Avoid feeding the deer.",
        best_time_to_visit: "08:30 AM - 10:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800"
      },
      {
        name: "Elliot's Beach Besant Nagar",
        description: "A peaceful sandy beach in Besant Nagar featuring the famous Schmidt Memorial and seaside eateries.",
        vicinity: "Besant Nagar, Chennai",
        rating: 4.4,
        user_ratings_total: 29500,
        estimated_cost: 0,
        visit_duration_hours: 2.0,
        tips: "Popular local hangout. Eat fresh roasted corn on the cob.",
        best_time_to_visit: "04:30 PM - 06:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800"
      }
    ],
    restaurants: [
      {
        name: "Dakshin Restaurant",
        cuisine: "South Indian Fine Dining",
        price_range: "₹1200-2500 per person",
        must_try_dish: "Dakshin Fried Fish & Appam with Stew",
        address: "Crowne Plaza Adyar, Alwarpet",
        rating: 4.6,
        reviews_count: 1400,
        photo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
      },
      {
        name: "Hotel Saravana Bhavan",
        cuisine: "Traditional South Indian Vegetarian",
        price_range: "₹150-300 per person",
        must_try_dish: "Special Ghee Roast Dosa & Filter Coffee",
        address: "Pondy Bazaar, T. Nagar",
        rating: 4.2,
        reviews_count: 12500,
        photo_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
      },
      {
        name: "Annalakshmi Restaurant",
        cuisine: "Vegetarian Thali & South Indian",
        price_range: "₹450-800 per person",
        must_try_dish: "Annalakshmi Special Meals",
        address: "Spur Tank Road, Egmore",
        rating: 4.5,
        reviews_count: 3100,
        photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
      },
      {
        name: "Amethyst Cafe",
        cuisine: "Continental & Café",
        price_range: "₹400-800 per person",
        must_try_dish: "Pasta Carbonara & Cold Brew Coffee",
        address: "Whites Road, Royapettah",
        rating: 4.4,
        reviews_count: 4800,
        photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
      },
      {
        name: "Nair Mess Triplicane",
        cuisine: "Local Seafood & Meals",
        price_range: "₹150-300 per person",
        must_try_dish: "Fish Meals & Spicy Fish Fry",
        address: "Mohammed Abdullah Sahib Street, Triplicane",
        rating: 4.3,
        reviews_count: 5100,
        photo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
      },
      {
        name: "Coastal Hub Seafood",
        cuisine: "Coastal Tamil Nadu & Seafood",
        price_range: "₹300-600 per person",
        must_try_dish: "Nandu Masala (Crab) & Prawn Thokku",
        address: "East Coast Road, Injambakkam",
        rating: 4.4,
        reviews_count: 1200,
        photo_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800"
      },
      {
        name: "Sandy's Chocolate Laboratory",
        cuisine: "Continental & Desserts",
        price_range: "₹400-900 per person",
        must_try_dish: "Sandy's Tiny Chocolate Cake",
        address: "Wallace Garden, Nungambakkam",
        rating: 4.4,
        reviews_count: 2800,
        photo_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
      },
      {
        name: "Kaidi Kitchen",
        cuisine: "Multi-Cuisine Vegetarian (Prison Theme)",
        price_range: "₹400-700 per person",
        must_try_dish: "Paneer Tikka & Mexican Quesadilla",
        address: "Bishop Wallers Avenue, Mylapore",
        rating: 4.1,
        reviews_count: 3400,
        photo_url: "https://images.unsplash.com/photo-1502301197279-669b95141c0e?w=800"
      },
      {
        name: "Murugan Idli Shop",
        cuisine: "Traditional Tamil Breakfast",
        price_range: "₹100-250 per person",
        must_try_dish: "Podi Idli with Onion Uthappam & Chutney",
        address: "GN Chetty Road, T. Nagar",
        rating: 4.3,
        reviews_count: 11500,
        photo_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
      },
      {
        name: "The Flying Elephant",
        cuisine: "Multi-Cuisine Premium Dining",
        price_range: "₹1500-3500 per person",
        must_try_dish: "Charcoal Grills & Wood-fired Pizzas",
        address: "Park Hyatt, Guindy",
        rating: 4.6,
        reviews_count: 2100,
        photo_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800"
      }
    ],
    hotels: [
      {
        name: "The Leela Palace Chennai",
        stars: 5,
        location: "Adyar Seaface, MRC Nagar",
        price_per_night: 14000,
        amenities: ["Sea-facing Rooms", "Infinity Pool", "Luxury Spa", "3 Restaurants", "Bar"],
        photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
      },
      {
        name: "Taj Coromandel",
        stars: 5,
        location: "Nungambakkam, Chennai",
        price_per_night: 12000,
        amenities: ["Outdoor Pool", "Fitness Center", "Steam & Sauna", "Boutique Shops", "Chauffeur Service"],
        photo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"
      },
      {
        name: "ITC Grand Chola",
        stars: 5,
        location: "Mount Road, Guindy",
        price_per_night: 13500,
        amenities: ["Palatial Design", "3 Pools", "Helipad", "Luxury Retail", "Award-winning Dining"],
        photo_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800"
      },
      {
        name: "Courtyard by Marriott",
        stars: 4,
        location: "Anna Salai, Teynampet",
        price_per_night: 6500,
        amenities: ["City Views", "24h Coffee Shop", "Gym", "Business Lounge", "AC Rooms"],
        photo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a304?w=800"
      },
      {
        name: "Hotel Savera Mylapore",
        stars: 4,
        location: "Dr. Radhakrishnan Salai, Mylapore",
        price_per_night: 4800,
        amenities: ["Outdoor Pool", "Aura Bar", "Free Parking", "Veg Restaurant", "AC"],
        photo_url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
      }
    ]
  },
  delhi: {
    title: "Delhi Sultanate & Modern Capital Trail",
    tagline: "Explore the ancient fort ruins, grand Mughal architecture, and sprawling shopping avenues of Delhi.",
    weather_summary: "Subtropical climate. Summer can be hot (38°C), winter is cold and pleasant (18°C max / 8°C min).",
    packing_tips: ["Sunhat and sunglasses", "Comfortable walking sneakers", "Modest outfits for monuments", "Light sweater if traveling Nov-Feb"],
    local_phrases: [
      { phrase: "Namaste / Sasriyakaal", meaning: "Greetings / Welcome" },
      { phrase: "Aap kaise hain?", meaning: "How are you?" },
      { phrase: "Bhaiya, theek rate lagao", meaning: "Brother, give a fair price" }
    ],
    emergency_contacts: { police: "100", ambulance: "102", tourist_helpline: "1363" },
    nearby_hidden_gems: ["Sunder Nursery heritage park", "Sanjay Van forest trail", "Agrasen ki Baoli stepwell"],
    instagram_worthy_spots: [
      { spot: "Qutub Minar from the lawns", best_time: "Golden Hour (5:00 PM)" },
      { spot: "Humayun's Tomb gardens", best_time: "Sunrise (6:30 AM)" },
      { spot: "India Gate canopy", best_time: "Night (8:00 PM)" }
    ],
    dos_and_donts: {
      dos: ["Travel by Delhi Metro to save time", "Bargain well at Sarojini Nagar and Janpath", "Respect security checks at monuments"],
      donts: ["Do not wander in isolated parks after dark", "Avoid tap water, prefer sealed drinking water", "Avoid visiting crowded markets on Mondays (many closed)"]
    },
    attractions: [
      {
        name: "Red Fort (Lal Qila)",
        description: "The historic Mughal fortress in Old Delhi built from red sandstone, which served as the empire's ruling seat.",
        vicinity: "Chandni Chowk, Old Delhi",
        rating: 4.6,
        user_ratings_total: 68000,
        estimated_cost: 50,
        visit_duration_hours: 2.5,
        tips: "Don't miss the evening Sound & Light Show narration of Delhi's history.",
        best_time_to_visit: "09:00 AM - 11:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800"
      },
      {
        name: "Qutub Minar complex",
        description: "A majestic 73-meter victory tower built in 1193 by Qutb-ud-din Aibak, surrounded by historic ruins.",
        vicinity: "Mehrauli, South Delhi",
        rating: 4.7,
        user_ratings_total: 54000,
        estimated_cost: 40,
        visit_duration_hours: 2.0,
        tips: "Look at the 4th-century rust-resistant Iron Pillar in the courtyard.",
        best_time_to_visit: "03:00 PM - 05:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800"
      },
      {
        name: "Humayun's Tomb",
        description: "The spectacular red sandstone garden tomb of Emperor Humayun, which inspired the design of the Taj Mahal.",
        vicinity: "Nizamuddin East, Delhi",
        rating: 4.7,
        user_ratings_total: 39000,
        estimated_cost: 40,
        visit_duration_hours: 2.0,
        tips: "Ideal place for photography. Walk the surrounding Persian-style Charbagh gardens.",
        best_time_to_visit: "07:30 AM - 10:00 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"
      },
      {
        name: "India Gate Promenade",
        description: "A towering war memorial arch honoring Indian soldiers, surrounded by lush green lawns and fountains.",
        vicinity: "Rajpath, Central Delhi",
        rating: 4.6,
        user_ratings_total: 92000,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Beautifully lit at night. Perfect for street side ice cream walks.",
        best_time_to_visit: "06:00 PM - 08:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800"
      },
      {
        name: "Lotus Temple (Bahai House)",
        description: "A unique lotus-shaped temple dedicated to quiet meditation and unity of all religions.",
        vicinity: "Kalkaji, South Delhi",
        rating: 4.5,
        user_ratings_total: 61000,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Main hall requires absolute silence. Photography is prohibited inside the hall.",
        best_time_to_visit: "09:00 AM - 11:00 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800"
      },
      {
        name: "Akshardham Temple Exhibition",
        description: "A massive modern Hindu temple complex presenting India's ancient culture and spirituality through exhibits.",
        vicinity: "Noida Mor, East Delhi",
        rating: 4.7,
        user_ratings_total: 78000,
        estimated_cost: 250,
        visit_duration_hours: 4.0,
        tips: "Mobile phones and bags are strictly banned. Store them at the free cloakroom.",
        best_time_to_visit: "02:00 PM - 06:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800"
      },
      {
        name: "Chandni Chowk Old Delhi Walk",
        description: "One of Delhi's oldest and busiest markets, filled with narrow lanes, spice markets, and street food.",
        vicinity: "Old Delhi",
        rating: 4.3,
        user_ratings_total: 18500,
        estimated_cost: 0,
        visit_duration_hours: 3.0,
        tips: "Hire a cycle rickshaw to navigate the extremely crowded streets.",
        best_time_to_visit: "10:30 AM - 01:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800"
      },
      {
        name: "Connaught Place Shopping",
        description: "The colonial-style circular central business district of Delhi, full of showrooms, cafes, and underground shops.",
        vicinity: "Connaught Place, Central Delhi",
        rating: 4.5,
        user_ratings_total: 41000,
        estimated_cost: 0,
        visit_duration_hours: 2.5,
        tips: "Visit the underground Palika Bazaar for budget apparel shopping.",
        best_time_to_visit: "04:30 PM - 07:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
      },
      {
        name: "Lodhi Gardens Park",
        description: "A gorgeous city park containing the tombs of Sayyid and Lodi dynastic rulers within green lawns.",
        vicinity: "Lodhi Road, New Delhi",
        rating: 4.6,
        user_ratings_total: 19400,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Ideal spot for a peaceful morning jog or family picnic.",
        best_time_to_visit: "07:00 AM - 09:00 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"
      },
      {
        name: "Dilli Haat Craft Bazaar",
        description: "An open-air food and crafts market displaying handloom products and regional food stalls from all Indian states.",
        vicinity: "Kidwai Nagar, INA",
        rating: 4.4,
        user_ratings_total: 24000,
        estimated_cost: 30,
        visit_duration_hours: 2.0,
        tips: "Great place to try foods from Sikkim (momo) to Rajasthan (dal baati) in one place.",
        best_time_to_visit: "05:00 PM - 07:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800"
      },
      {
        name: "Hauz Khas Village Pub Street",
        description: "A trendy urban enclave mixing historic 14th-century ruins and lakes with modern pubs and art cafes.",
        vicinity: "Hauz Khas, South Delhi",
        rating: 4.3,
        user_ratings_total: 15600,
        estimated_cost: 0,
        visit_duration_hours: 3.0,
        tips: "Visit the fort ruins for sunset, then head to the village street for dinner.",
        best_time_to_visit: "04:00 PM - 08:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800"
      },
      {
        name: "Gurudwara Bangla Sahib",
        description: "A majestic Sikh house of worship, known for its beautiful golden dome, large holy pool, and communal kitchen.",
        vicinity: "Baba Kharak Singh Marg, CP",
        rating: 4.8,
        user_ratings_total: 38000,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Cover your head (headscarves provided) and wash hands/feet before entering.",
        best_time_to_visit: "08:00 AM - 10:00 AM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1548625361-155de0c7f546?w=800"
      },
      {
        name: "National Museum Delhi",
        description: "One of the largest museums in India, holding bronze sculptures, relics, and manuscripts spanning 5,000 years.",
        vicinity: "Janpath, Central Delhi",
        rating: 4.4,
        user_ratings_total: 7500,
        estimated_cost: 20,
        visit_duration_hours: 3.0,
        tips: "Take the audio guide to fully appreciate the Harappan and Buddhist galleries.",
        best_time_to_visit: "10:30 AM - 01:30 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800"
      },
      {
        name: "Sarojini Nagar Market",
        description: "A famous bargain market offering fashion apparel, exports, and accessories at cheap prices.",
        vicinity: "Sarojini Nagar, South Delhi",
        rating: 4.2,
        user_ratings_total: 19800,
        estimated_cost: 0,
        visit_duration_hours: 3.0,
        tips: "Avoid weekends if you dislike massive crowds. Carry cash.",
        best_time_to_visit: "11:00 AM - 02:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800"
      },
      {
        name: "National Gallery of Modern Art",
        description: "An art museum displaying modern and contemporary art inside the former palace of the Maharaja of Jaipur.",
        vicinity: "India Gate circle, Delhi",
        rating: 4.5,
        user_ratings_total: 3900,
        estimated_cost: 20,
        visit_duration_hours: 2.0,
        tips: "Check out the permanent exhibition of legendary painter Raja Ravi Varma.",
        best_time_to_visit: "02:00 PM - 04:00 PM",
        outdoor: false,
        photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"
      },
      {
        name: "Waste to Wonder Theme Park",
        description: "A creative theme park featuring replicas of the Seven Wonders of the World created from scrap metal.",
        vicinity: "Sarai Kale Khan, Delhi",
        rating: 4.1,
        user_ratings_total: 16500,
        estimated_cost: 50,
        visit_duration_hours: 2.0,
        tips: "Beautifully illuminated at dusk. Best visited in the late evening.",
        best_time_to_visit: "06:00 PM - 08:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800"
      },
      {
        name: "Garden of Five Senses",
        description: "A 20-acre landscaped garden featuring sculpture displays, musical fountains, and dining spots.",
        vicinity: "Said-ul-Ajaib, Saket",
        rating: 4.0,
        user_ratings_total: 9100,
        estimated_cost: 35,
        visit_duration_hours: 1.5,
        tips: "Perfect place to relax under the shade of trees away from central city noise.",
        best_time_to_visit: "04:00 PM - 05:30 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800"
      },
      {
        name: "Safdarjung Tomb Monument",
        description: "The last monumental garden tomb of the Mughal empire built in 1754 for statesman Safdarjung.",
        vicinity: "Lodi Road, Delhi",
        rating: 4.5,
        user_ratings_total: 10200,
        estimated_cost: 25,
        visit_duration_hours: 1.5,
        tips: "Much less crowded than Humayun's Tomb, allowing peace for photography.",
        best_time_to_visit: "08:00 AM - 09:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"
      },
      {
        name: "Agrasen ki Baoli Stepwell",
        description: "An ancient 60-meter long historical stepwell featuring 103 stone steps, hidden amidst CP highrises.",
        vicinity: "Hailey Road, CP",
        rating: 4.3,
        user_ratings_total: 13500,
        estimated_cost: 0,
        visit_duration_hours: 1.0,
        tips: "Known for its eerie atmosphere and gothic stone arches.",
        best_time_to_visit: "10:00 AM - 11:30 AM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800"
      },
      {
        name: "Chandni Chowk Spice Market Walk",
        description: "Explore Khari Baoli, Asia's largest wholesale spice market dating back to the 17th century.",
        vicinity: "Fatehpuri, Old Delhi",
        rating: 4.4,
        user_ratings_total: 5100,
        estimated_cost: 0,
        visit_duration_hours: 1.5,
        tips: "Cover your nose/mouth with a scarf due to the strong spicy air aroma.",
        best_time_to_visit: "11:30 AM - 01:00 PM",
        outdoor: true,
        photo_url: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800"
      }
    ],
    restaurants: [
      {
        name: "Karim's Old Delhi",
        cuisine: "Traditional Mughlai Non-Veg",
        price_range: "₹350-700 per person",
        must_try_dish: "Mutton Korma & Khamiri Roti",
        address: "Gali Kababian, Jama Masjid",
        rating: 4.3,
        reviews_count: 18200,
        photo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
      },
      {
        name: "Bukhara",
        cuisine: "North Indian Tandoori Fine Dining",
        price_range: "₹2500-5000 per person",
        must_try_dish: "Dal Bukhara & Sikandari Raan",
        address: "ITC Maurya, Chanakyapuri",
        rating: 4.7,
        reviews_count: 5800,
        photo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
      },
      {
        name: "Indian Accent",
        cuisine: "Modern Indian Fusion Fine Dining",
        price_range: "₹2000-4500 per person",
        must_try_dish: "Blue Cheese Naan & Soy Keema",
        address: "The Lodhi, Lodhi Road",
        rating: 4.6,
        reviews_count: 3100,
        photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
      },
      {
        name: "Saravana Bhavan CP",
        cuisine: "South Indian Vegetarian",
        price_range: "₹150-300 per person",
        must_try_dish: "Rava Onion Dosa & Filter Coffee",
        address: "Connaught Place, New Delhi",
        rating: 4.3,
        reviews_count: 14200,
        photo_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
      },
      {
        name: "Wenger's Deli CP",
        cuisine: "Cafe & Swiss Bakery",
        price_range: "₹200-450 per person",
        must_try_dish: "Chicken Patty & Pineapple Pastry",
        address: "A-Block, Connaught Place",
        rating: 4.4,
        reviews_count: 8900,
        photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"
      },
      {
        name: "Kake Di Hatti CP",
        cuisine: "North Indian Vegetarian Dhaba style",
        price_range: "₹150-350 per person",
        must_try_dish: "Kake Naan & Dal Makhani",
        address: "Outer Circle, Connaught Place",
        rating: 4.2,
        reviews_count: 6500,
        photo_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
      },
      {
        name: "Diggin Chanakyapuri",
        cuisine: "Italian & Café",
        price_range: "₹450-900 per person",
        must_try_dish: "Diggin Special Pizza & Baked Penne Pasta",
        address: "Santushti Shopping Complex, Chanakyapuri",
        rating: 4.5,
        reviews_count: 5100,
        photo_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
      },
      {
        name: "Social Hauz Khas",
        cuisine: "Multi-Cuisine Pub & Bar",
        price_range: "₹600-1200 per person",
        must_try_dish: "China Box & L.I.I.T Cocktails",
        address: "Hauz Khas Village",
        rating: 4.4,
        reviews_count: 11200,
        photo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800"
      },
      {
        name: "Gulati Pandara Road",
        cuisine: "North Indian Mughlai specialties",
        price_range: "₹600-1200 per person",
        must_try_dish: "Butter Chicken & Paneer Lababdar",
        address: "Pandara Road Market, Central Delhi",
        rating: 4.5,
        reviews_count: 9400,
        photo_url: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800"
      },
      {
        name: "United Coffee House UCH",
        cuisine: "Multi-Cuisine heritage dining",
        price_range: "₹600-1500 per person",
        must_try_dish: "UCH Club Sandwich & Keema Samosa",
        address: "E-Block, Connaught Place",
        rating: 4.3,
        reviews_count: 4200,
        photo_url: "https://images.unsplash.com/photo-1502301197279-669b95141c0e?w=800"
      }
    ],
    hotels: [
      {
        name: "The Taj Mahal Hotel New Delhi",
        stars: 5,
        location: "Mansingh Road, Central Delhi",
        price_per_night: 16000,
        amenities: ["Swimming Pool", "Spa", "Fitness Center", "Fine Dining", "Lounge"],
        photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
      },
      {
        name: "The Leela Palace New Delhi",
        stars: 5,
        location: "Chanakyapuri, New Delhi",
        price_per_night: 18000,
        amenities: ["Rooftop Pool", "Spa", "Luxury Dining", "WiFi", "AC"],
        photo_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"
      },
      {
        name: "Radisson Blu Marina CP",
        stars: 4,
        location: "Connaught Place, New Delhi",
        price_per_night: 7500,
        amenities: ["City Center Location", "Gym", "Spa", "Restaurant", "WiFi"],
        photo_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800"
      },
      {
        name: "Bloomrooms @ Link Road",
        stars: 3,
        location: "Link Road, near Hazrat Nizamuddin",
        price_per_night: 3500,
        amenities: ["Modern Design", "AC", "Breakfast", "Lounge Cafe", "WiFi"],
        photo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a304?w=800"
      },
      {
        name: "Zostel Delhi",
        stars: 2,
        location: "Pahar Ganj, near New Delhi Rly Stn",
        price_per_night: 1100,
        amenities: ["Backpacker Hostel", "Social Rooftop", "WiFi", "AC Dorms", "Shared Kitchen"],
        photo_url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
      }
    ]
  }
};
