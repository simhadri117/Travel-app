import { Booking } from '../../models/Booking';
import { v4 as uuidv4 } from 'uuid';

export interface BusSearchQuery {
  source: string;
  destination: string;
  date: string;
}

const OPERATORS = [
  { name: 'Orange Tours & Travels', type: 'Volvo AC Multi-Axle Sleeper', basePrice: 1200, rating: 4.6, reviews: 840, amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'GPS Tracked'] },
  { name: 'VRL Travels', type: 'AC Sleeper (2+1)', basePrice: 950, rating: 4.2, reviews: 1250, amenities: ['Charging Point', 'Blanket', 'Water Bottle', 'GPS Tracked'] },
  { name: 'SRS Travels', type: 'Non-AC Sleeper (2+1)', basePrice: 650, rating: 3.8, reviews: 920, amenities: ['Charging Point', 'Blanket'] },
  { name: 'Zingbus', type: 'Premium AC Seater (2+2)', basePrice: 800, rating: 4.5, reviews: 450, amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'GPS Tracked'] },
  { name: 'National Travels', type: 'Mercedes AC Sleeper', basePrice: 1400, rating: 4.7, reviews: 290, amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Movie', 'GPS Tracked'] }
];

export async function searchBuses(query: BusSearchQuery) {
  const { source, destination, date } = query;
  
  const results = OPERATORS.map((op, idx) => {
    const depHour = (18 + idx) % 24;
    const depTime = `${depHour.toString().padStart(2, '0')}:30`;
    const durMin = 480 + (idx * 45);
    const durHrs = Math.floor(durMin / 60);
    const durMins = durMin % 60;
    const duration = `${durHrs}h ${durMins}m`;

    const arrHour = (depHour + durHrs) % 24;
    const arrMin = (30 + durMins) % 60;
    const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;

    const price = Math.round(op.basePrice * (1 + (source.length % 3) * 0.1));

    // Boarding & Dropping Points
    const boardingPoints = [
      { name: 'Majestic Metro Station', time: depTime, address: 'Platform 3, Majestic, Bangalore', landmark: 'Opposite Railway Station' },
      { name: 'Anand Rao Circle', time: `${(depHour + 1) % 24}:00`, address: 'VRL Office, Anand Rao Circle, Bangalore', landmark: 'Below Flyover' }
    ];

    const droppingPoints = [
      { name: 'Koyambedu Bus Terminus', time: arrTime, address: 'Gate 2, Koyambedu, Chennai', landmark: 'Near Metro Station' },
      { name: 'Guindy National Park', time: `${(arrHour + 1) % 24}:15`, address: 'Guindy Flyover, Chennai', landmark: 'Opposite Forest Office' }
    ];

    return {
      bus_id: `${op.name.replace(/\s+/g, '')}_${idx}_${date.replace(/-/g, '')}`,
      operator_name: op.name,
      bus_type: op.type,
      departure_time: depTime,
      arrival_time: arrTime,
      duration,
      rating: op.rating,
      reviews_count: op.reviews,
      amenities: op.amenities,
      available_seats_count: 10 + (idx * 7) % 20,
      price,
      boarding_points: boardingPoints,
      dropping_points: droppingPoints
    };
  });

  return results;
}

export function generateBusSeats(busId: string) {
  const seats = [];
  const decks = ['Lower', 'Upper'];

  for (const deck of decks) {
    // Sleeper buses have lower & upper deck, standard seating has only lower
    const isSleeper = busId.toLowerCase().includes('sleeper');
    if (!isSleeper && deck === 'Upper') continue;

    const rows = 10;
    const cols = ['L', 'M', 'R']; // Left, Middle, Right for sleeper layout

    for (let r = 1; r <= rows; r++) {
      for (const c of cols) {
        const seatNo = `${deck === 'Upper' ? 'U' : 'L'}-${r}${c}`;
        const isOccupied = (r * c.charCodeAt(0)) % 4 === 0;
        const isLadiesOnly = !isOccupied && (r * c.charCodeAt(0)) % 7 === 0;

        seats.push({
          seat_number: seatNo,
          deck,
          status: isOccupied ? 'occupied' : 'available',
          gender_restriction: isLadiesOnly ? 'female' : 'none'
        });
      }
    }
  }

  return seats;
}

export async function createBusBooking(
  userId: string,
  busDetails: any,
  passengers: any[],
  seats: string[],
  boardingPoint: any,
  droppingPoint: any,
  paymentId: string
) {
  const pnr = `BUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const providerBookingId = `WW-BUS-${uuidv4().substring(0, 8).toUpperCase()}`;

  const booking = new Booking({
    user_id: userId,
    booking_type: 'bus',
    status: 'confirmed',
    booking_reference: pnr,
    provider_booking_id: providerBookingId,
    amount_paid: busDetails.total_price,
    payment_id: paymentId,
    journey_details: {
      operator_name: busDetails.operator_name,
      bus_type: busDetails.bus_type,
      source: busDetails.source,
      destination: busDetails.destination,
      departure_time: busDetails.departure_time,
      arrival_time: busDetails.arrival_time,
      duration: busDetails.duration,
      date: busDetails.date,
      boarding_point: boardingPoint,
      dropping_point: droppingPoint
    },
    passengers: passengers.map((p, idx) => ({
      name: p.name,
      age: p.age,
      gender: p.gender,
      seat_number: seats[idx] || 'Pending'
    }))
  });

  await booking.save();
  return booking;
}
