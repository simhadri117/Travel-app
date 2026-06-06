import axios from 'axios';
import { getAmadeusToken } from './flight'; // reuse token helper from flight service

export interface HotelSearchQuery {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

// City name to 3-letter IATA code mapper
const CITY_TO_IATA: Record<string, string> = {
  'delhi': 'DEL',
  'mumbai': 'BOM',
  'bangalore': 'BLR',
  'goa': 'GOI',
  'jaipur': 'JAI',
  'agra': 'AGR',
  'udaipur': 'UDR',
  'jodhpur': 'JDH',
  'manali': 'IXC', // Chandigarh as gateway airport
  'paris': 'PAR',
  'london': 'LON',
  'new york': 'NYC',
  'dubai': 'DXB',
  'singapore': 'SIN'
};

export async function searchHotels(query: HotelSearchQuery) {
  const { city, checkIn, checkOut, guests } = query;
  const normalizedCity = city.toLowerCase().trim();
  const cityCode = CITY_TO_IATA[normalizedCity] || normalizedCity.substring(0, 3).toUpperCase();

  // 1. Try Amadeus search
  const token = await getAmadeusToken();
  if (token && cityCode.length === 3) {
    try {
      console.log(`[Amadeus Hotel API] Fetching hotel list for city code: ${cityCode}`);
      // Find hotels by city code
      const listResponse = await axios.get('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city', {
        params: { cityCode },
        headers: { Authorization: `Bearer ${token}` }
      });

      const hotelsData = listResponse.data?.data || [];
      if (hotelsData.length > 0) {
        // Extract up to 3 hotel IDs for detailed offers lookup
        const hotelIds = hotelsData.slice(0, 3).map((h: any) => h.hotelId).join(',');
        
        console.log(`[Amadeus Hotel API] Fetching offers for hotel IDs: ${hotelIds}`);
        const offersResponse = await axios.get('https://test.api.amadeus.com/v3/shopping/hotel-offers', {
          params: {
            hotelIds,
            adults: guests,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            bestRateOnly: 'true'
          },
          headers: { Authorization: `Bearer ${token}` }
        });

        const offers = offersResponse.data?.data || [];
        if (offers.length > 0) {
          return offers.map((offer: any) => {
            const h = offer.hotel;
            const rates = offer.offers?.[0] || {};
            const price = Math.round(parseFloat(rates.price?.total || '4500'));
            
            return {
              id: h.hotelId || `amadeus_h_${Math.random().toString(36).substring(2, 7)}`,
              name: h.name || 'Grand Heritage Stay',
              rating: h.rating || 4,
              reviews_count: Math.floor(Math.random() * 400) + 50,
              price_per_night: price,
              amenities: h.amenities || ['WiFi', 'AC', 'Room Service'],
              photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'],
              description: `A premium hotel offer powered by Amadeus. Enjoy standard room options with professional hospitality.`
            };
          });
        }
      }
    } catch (err: any) {
      console.warn('[Amadeus Hotel API] Search failed, using simulated hotels fallback:', err.response?.data || err.message);
    }
  }

  // 2. Fallback to mock catalog
  return [
    {
      id: 'hotel_1',
      name: `${city} Ocean Palms Resort`,
      rating: 4,
      reviews_count: 128,
      price_per_night: 4200,
      amenities: ['WiFi', 'Pool', 'Breakfast Included', 'AC'],
      photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'],
      description: 'A luxurious resort located close to the main beach with gorgeous views.'
    },
    {
      id: 'hotel_2',
      name: `${city} Grand Heritage Inn`,
      rating: 5,
      reviews_count: 320,
      price_per_night: 8500,
      amenities: ['WiFi', 'Gym', 'Bar', 'Spa', 'AC'],
      photos: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500'],
      description: 'Experience colonial heritage combined with state-of-the-art modern luxuries.'
    },
    {
      id: 'hotel_3',
      name: `${city} Cozy Budget Comforts`,
      rating: 3,
      reviews_count: 54,
      price_per_night: 1800,
      amenities: ['WiFi', 'AC', 'Parking'],
      photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500'],
      description: 'Simple, clean rooms for budget-oriented travelers.'
    }
  ];
}
