import { Router } from 'express';
import axios from 'axios';
import { Post } from '../models/Post';
import { searchDestinationsAndPosts } from '../services/search';
import { enrichAttraction } from '../services/attraction';
import { resolveDestinationImage } from '../services/destinationImage';

const router = Router();

// Universal Search (Algolia or local database fallback)
router.get('/destinations/search/query', async (req, res) => {
  const query = req.query.q ? String(req.query.q) : '';
  try {
    const results = await searchDestinationsAndPosts(query);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Resolve destination image with fallbacks, Cloudinary caching, and Firestore saving
router.get('/destinations/image/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const imageUrl = await resolveDestinationImage(name);
    return res.json({ success: true, imageUrl });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const DESTINATIONS_DB: Record<string, any> = {
  jaipur: {
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    slideshow: [
      'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=800',
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
      'https://images.unsplash.com/photo-1506461883276-594a12b11db3?w=800'
    ],
    best_season: 'October to March',
    avg_temp: '22°C',
    avg_cost_3d: '₹7,500',
    unesco_sites_count: 2,
    attractions: [
      { name: 'Hawa Mahal', fee: '₹50', duration: '1.5 hrs', photo: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=300' },
      { name: 'Amer Fort', fee: '₹100', duration: '3 hrs', photo: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=300' },
      { name: 'City Palace', fee: '₹200', duration: '2 hrs', photo: 'https://images.unsplash.com/photo-1590050752117-238cb0612b1b?w=300' }
    ],
    restaurants: [
      { name: 'LMB Laxmi Mishthan Bhandar', cuisine: 'Rajasthani Veg', price: '₹₹', rating: 4.3 },
      { name: 'Chokhi Dhani', cuisine: 'Rajasthani Folk Buffet', price: '₹₹₹', rating: 4.5 },
      { name: 'Peacock Rooftop Restaurant', cuisine: 'Indian & Multi-Cuisine', price: '₹₹', rating: 4.4 },
      { name: 'Baradari', cuisine: 'Contemporary Fine Dine', price: '₹₹₹', rating: 4.6 },
      { name: 'Tapri Central', cuisine: 'Tea & Snacks cafe', price: '₹', rating: 4.7 }
    ],
    hotels: {
      budget: { name: 'Zostel Jaipur', price: '₹600/night' },
      mid_range: { name: 'Umaid Bhawan Hotel', price: '₹2,500/night' },
      luxury: { name: 'The Raj Palace', price: '₹18,000/night' }
    },
    transit: [
      { type: 'Flight', duration: '2h 10m', price: '₹4,500' },
      { type: 'Train', duration: '5h 30m', price: '₹850' },
      { type: 'Bus', duration: '6h 15m', price: '₹600' }
    ],
    tips: [
      'Hire authorized guides at Amer Fort to learn the history.',
      'Shop for textiles and blue pottery in Johri Bazar and Bapu Bazar.',
      'Stay hydrated and carry sunglasses.'
    ],
    similar: ['Udaipur', 'Jodhpur', 'Agra']
  },
  goa: {
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    slideshow: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800'
    ],
    best_season: 'November to February',
    avg_temp: '28°C',
    avg_cost_3d: '₹10,500',
    unesco_sites_count: 1,
    attractions: [
      { name: 'Basilica of Bom Jesus', fee: 'Free', duration: '1 hr', photo: 'https://images.unsplash.com/photo-1547983600-959143b4da52?w=300' },
      { name: 'Cabo de Rama Fort cliff', fee: 'Free', duration: '2 hrs', photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300' },
      { name: 'Dudhsagar Waterfalls', fee: '₹400', duration: '5 hrs', photo: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=300' }
    ],
    restaurants: [
      { name: 'Fisherman’s Wharf', cuisine: 'Goan Coastal Seafood', price: '₹₹', rating: 4.4 },
      { name: 'Gunpowder', cuisine: 'South Indian Coastal', price: '₹₹', rating: 4.5 },
      { name: 'Curlies Beach Shack', cuisine: 'Multi-cuisine Beach bites', price: '₹₹', rating: 4.1 },
      { name: 'Thalassa', cuisine: 'Greek / Mediterranean', price: '₹₹₹', rating: 4.5 },
      { name: 'Vinayak Family Restaurant', cuisine: 'Local Goan Thali', price: '₹', rating: 4.6 }
    ],
    hotels: {
      budget: { name: 'Zostel Morjim', price: '₹800/night' },
      mid_range: { name: 'Resort Rio Arpora', price: '₹4,000/night' },
      luxury: { name: 'Taj Exotica Resort & Spa', price: '₹22,000/night' }
    },
    transit: [
      { type: 'Flight', duration: '2h 30m', price: '₹5,500' },
      { type: 'Train', duration: '15h 10m', price: '₹1,200' },
      { type: 'Bus', duration: '16h 00m', price: '₹950' }
    ],
    tips: [
      'Rent a two-wheeler to explore beaches easily.',
      'Check out South Goa beaches for clean, peaceful vibes.',
      'Beware of heavy currents during monsoon months.'
    ],
    similar: ['Pondicherry', 'Gokarna', 'Kovalam']
  }
};

router.get('/destinations/:name', async (req, res) => {
  const destName = req.params.name.toLowerCase().trim();
  
  const destData = DESTINATIONS_DB[destName] || {
    name: req.params.name,
    state: 'India',
    country: 'India',
    slideshow: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800'
    ],
    best_season: 'October to March',
    avg_temp: '24°C',
    avg_cost_3d: '₹8,000',
    unesco_sites_count: 0,
    attractions: [
      { name: 'Town Central Square', fee: 'Free', duration: '1.5 hrs', photo: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300' }
    ],
    restaurants: [
      { name: 'The Local Kitchen', cuisine: 'Traditional', price: '₹₹', rating: 4.2 }
    ],
    hotels: {
      budget: { name: 'Zostel Hostels', price: '₹700/night' },
      mid_range: { name: 'Comfort Executive Plaza', price: '₹2,500/night' },
      luxury: { name: 'Grand Heritage Palace', price: '₹12,000/night' }
    },
    transit: [
      { type: 'Train', duration: '8h 00m', price: '₹750' },
      { type: 'Bus', duration: '9h 15m', price: '₹550' }
    ],
    tips: ['Carry local currency.', 'Explore early morning.'],
    similar: ['Jaipur', 'Goa']
  };

  // Weather forecast helper using OpenWeather API
  let weather_forecast = [
    { day: 'Mon', temp: '26°C', condition: 'Sunny' },
    { day: 'Tue', temp: '25°C', condition: 'Sunny' },
    { day: 'Wed', temp: '27°C', condition: 'Partly Cloudy' },
    { day: 'Thu', temp: '24°C', condition: 'Light Rain' },
    { day: 'Fri', temp: '25°C', condition: 'Sunny' },
    { day: 'Sat', temp: '26°C', condition: 'Clear' },
    { day: 'Sun', temp: '28°C', condition: 'Clear' }
  ];

  const weatherApiKey = process.env.OPENWEATHER_API_KEY;
  if (weatherApiKey) {
    try {
      console.log(`[OpenWeather API] Querying 7-day forecast for ${destData.name}`);
      const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          q: destData.name,
          units: 'metric',
          appid: weatherApiKey
        }
      });
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
      if (dailyForecasts.length > 0) {
        weather_forecast = dailyForecasts;
      }
    } catch (err: any) {
      console.warn('[OpenWeather API] Request failed, using standard weather simulation:', err.response?.data || err.message);
    }
  }

  try {
    const imageUrl = await resolveDestinationImage(destData.name);
    if (imageUrl && destData.slideshow && destData.slideshow.length > 0) {
      destData.slideshow[0] = imageUrl;
    }

    // Collect related posts from database
    const posts = await Post.find({ destination_tag: { $regex: destData.name, $options: 'i' } })
      .populate('user_id', 'name profile_photo_url')
      .sort({ likes_count: -1 })
      .limit(10);

    const enrichedAttractions = await Promise.all(
      destData.attractions.map(async (a: any) => {
        try {
          return await enrichAttraction(a.name, destData.name, destData.state || 'India', destData.country || 'India', a);
        } catch (err) {
          console.error(`Failed to enrich attraction ${a.name}:`, err);
          return {
            ...a,
            location: `${destData.name}, India`,
            rating: 4.5,
            opening_hours: '9:00 AM - 6:00 PM',
            best_time: destData.name.toLowerCase() === 'goa' ? 'November - February' : 'October - March',
            category: 'Historical Site',
            photo: a.photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'
          };
        }
      })
    );

    return res.json({
      success: true,
      data: {
        ...destData,
        attractions: enrichedAttractions,
        weather_forecast,
        posts
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
