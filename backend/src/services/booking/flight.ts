import { Booking } from '../../models/Booking';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface FlightSearchQuery {
  source: string;
  destination: string;
  date: string;
  cabinClass: string;
  passengers: number;
}

// Simulated flight catalog database
const AIRLINES = [
  { name: 'IndiGo', code: '6E', basePrice: 4200, logo: 'https://pics.avs.io/al/100/6E.png' },
  { name: 'Air India', code: 'AI', basePrice: 5500, logo: 'https://pics.avs.io/al/100/AI.png' },
  { name: 'SpiceJet', code: 'SG', basePrice: 3800, logo: 'https://pics.avs.io/al/100/SG.png' },
  { name: 'Vistara', code: 'UK', basePrice: 6000, logo: 'https://pics.avs.io/al/100/UK.png' }
];

// Amadeus token caching variables
let amadeusToken: string | null = null;
let amadeusTokenExpiry: number = 0;

export async function getAmadeusToken(): Promise<string | null> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (amadeusToken && Date.now() < amadeusTokenExpiry - 10000) {
    return amadeusToken;
  }

  try {
    const response = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (response.data && response.data.access_token) {
      amadeusToken = response.data.access_token;
      amadeusTokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return amadeusToken;
    }
    return null;
  } catch (error: any) {
    console.error('Amadeus OAuth token exchange failed:', error.response?.data || error.message);
    return null;
  }
}

function parseDuration(ptStr: string): string {
  const match = ptStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const hours = match?.[1] ? `${match[1]}h` : '';
  const mins = match?.[2] ? `${match[2]}m` : '';
  return `${hours} ${mins}`.trim() || '2h';
}

function getCarrierName(code: string): string {
  const carrierMap: Record<string, string> = {
    '6E': 'IndiGo',
    'AI': 'Air India',
    'SG': 'SpiceJet',
    'UK': 'Vistara',
    'G8': 'Go First',
    'QP': 'Akasa Air'
  };
  return carrierMap[code] || `${code} Air`;
}

export async function searchFlights(query: FlightSearchQuery) {
  const { source, destination, date, cabinClass, passengers } = query;
  
  // 1. Attempt Amadeus Live Search if credentials are configured
  const token = await getAmadeusToken();
  if (token) {
    try {
      console.log(`[Amadeus API] Searching flights from ${source} to ${destination} on ${date}`);
      const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        params: {
          originLocationCode: source.toUpperCase(),
          destinationLocationCode: destination.toUpperCase(),
          departureDate: date,
          adults: passengers,
          travelClass: cabinClass === 'Business' ? 'BUSINESS' : cabinClass === 'First' ? 'FIRST' : 'ECONOMY',
          max: 10
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const offers = response.data?.data || [];
      if (offers.length > 0) {
        const marker = process.env.TRAVELPAYOUTS_MARKER || '12345';
        
        return offers.map((offer: any, idx: number) => {
          const itinerary = offer.itineraries?.[0];
          const segments = itinerary?.segments || [];
          const firstSegment = segments[0];
          const lastSegment = segments[segments.length - 1];
          const carrier = firstSegment?.carrierCode || 'AI';
          
          const depTime = firstSegment?.departure?.at ? firstSegment.departure.at.split('T')[1].substring(0, 5) : '08:00';
          const arrTime = lastSegment?.arrival?.at ? lastSegment.arrival.at.split('T')[1].substring(0, 5) : '10:30';
          const duration = itinerary?.duration ? parseDuration(itinerary.duration) : '2h 30m';
          const price = Math.round(parseFloat(offer.price?.grandTotal || offer.price?.total || '4500'));

          return {
            flight_id: offer.id || `amadeus_${idx}`,
            airline_name: getCarrierName(carrier),
            airline_logo: `https://pics.avs.io/al/100/${carrier}.png`,
            flight_number: `${carrier}-${firstSegment?.number || '101'}`,
            source: source.toUpperCase(),
            destination: destination.toUpperCase(),
            departure_time: depTime,
            arrival_time: arrTime,
            duration,
            stops: segments.length === 1 ? 'Direct' : `${segments.length - 1} Stop`,
            layover: segments.length > 1 ? { airport: segments[0].arrival.iataCode, duration: '1h 15m' } : null,
            price_per_adult: price,
            cabin_class: cabinClass,
            booking_affiliate_link: `https://c111.travelpayouts.com/click?shmarker=${marker}&promo_id=3249&source_type=link&type=click&trs=2026&destination=${destination}&origin=${source}&depart_date=${date}`
          };
        });
      }
    } catch (err: any) {
      console.warn('[Amadeus API] Flight search failed, using fallback database:', err.response?.data || err.message);
    }
  }

  // 2. Fallback local simulated search
  const codeSum = (source.charCodeAt(0) + destination.charCodeAt(0)) % 5;
  const distanceMultiplier = 1 + (codeSum * 0.2);

  const results = AIRLINES.map((airline, idx) => {
    const flightNo = `${airline.code}-${300 + idx * 115}`;
    const price = Math.round(airline.basePrice * distanceMultiplier * (cabinClass === 'Business' ? 2.5 : cabinClass === 'First' ? 4 : 1));
    
    const depHour = (6 + idx * 4) % 24;
    const depTime = `${depHour.toString().padStart(2, '0')}:30`;
    const durationMin = 90 + (codeSum * 25);
    const durationHours = Math.floor(durationMin / 60);
    const durationMins = durationMin % 60;
    const duration = `${durationHours}h ${durationMins}m`;

    const arrHour = (depHour + durationHours) % 24;
    const arrMin = (30 + durationMins) % 60;
    const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;

    return {
      flight_id: `${flightNo}_${date.replace(/-/g, '')}`,
      airline_name: airline.name,
      airline_logo: airline.logo,
      flight_number: flightNo,
      source: source.toUpperCase(),
      destination: destination.toUpperCase(),
      departure_time: depTime,
      arrival_time: arrTime,
      duration,
      stops: idx % 3 === 0 ? 'Direct' : idx % 3 === 1 ? '1 Stop' : '2 Stops',
      layover: idx % 3 === 0 ? null : { airport: 'BOM', duration: '1h 15m' },
      price_per_adult: price,
      cabin_class: cabinClass
    };
  });

  return results.sort((a, b) => a.price_per_adult - b.price_per_adult);
}

export function generateSeatMap(flightId: string) {
  const rows = 30;
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatMap = [];

  for (let r = 1; r <= rows; r++) {
    const isExitRow = r === 12 || r === 13;
    const isExtraLegroom = r <= 5;
    
    for (const c of cols) {
      // Deterministic occupancy based on seat coordinates
      const isOccupied = (r * c.charCodeAt(0)) % 7 === 0 || (r * c.charCodeAt(0)) % 5 === 0;
      let extraCharge = 0;
      let type = 'Standard';

      if (isExtraLegroom) {
        extraCharge = 1200;
        type = 'Extra Legroom';
      } else if (isExitRow) {
        extraCharge = 1500;
        type = 'Exit Row';
      }

      seatMap.push({
        seat_number: `${r}${c}`,
        type,
        status: isOccupied ? 'occupied' : 'available',
        extra_cost: extraCharge
      });
    }
  }

  return seatMap;
}

export async function createFlightBooking(
  userId: string,
  flightDetails: any,
  passengers: any[],
  seats: string[],
  amountPaid: number,
  paymentId: string
) {
  const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const providerBookingId = `WW-FLT-${uuidv4().substring(0, 8).toUpperCase()}`;

  const booking = new Booking({
    user_id: userId,
    booking_type: 'flight',
    status: 'confirmed',
    booking_reference: pnr,
    provider_booking_id: providerBookingId,
    amount_paid: amountPaid,
    payment_id: paymentId,
    journey_details: {
      airline_name: flightDetails.airline_name,
      flight_number: flightDetails.flight_number,
      source: flightDetails.source,
      destination: flightDetails.destination,
      departure_time: flightDetails.departure_time,
      arrival_time: flightDetails.arrival_time,
      duration: flightDetails.duration,
      date: flightDetails.date,
      cabin_class: flightDetails.cabin_class
    },
    passengers: passengers.map((p, idx) => ({
      name: p.name,
      age: p.age,
      gender: p.gender,
      seat_number: seats[idx] || 'Pending',
      id_type: p.id_type,
      id_number: p.id_number
    }))
  });

  await booking.save();
  return booking;
}
