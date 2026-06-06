import { Booking } from '../../models/Booking';
import { v4 as uuidv4 } from 'uuid';

export interface TrainSearchQuery {
  source: string;
  destination: string;
  date: string;
  quota: string;
}

const STATION_MAPPINGS: Record<string, string> = {
  // Cities to primary station code
  'delhi': 'NDLS',
  'mumbai': 'CSMT',
  'hyderabad': 'HYB',
  'bangalore': 'SBC',
  'bengaluru': 'SBC',
  'chennai': 'MAS',
  'kolkata': 'HWH',
  'pune': 'PUNE',
  'goa': 'MAO',
  'vijayawada': 'BZA',
  'visakhapatnam': 'VSKP',

  // Names/substrings to station code
  'new delhi': 'NDLS',
  'new delhi railway station': 'NDLS',
  'delhi junction': 'DLI',
  'hazrat nizamuddin': 'NZM',
  'chhatrapati shivaji': 'CSMT',
  'mumbai csmt': 'CSMT',
  'mumbai central': 'MMCT',
  'lokmanya tilak': 'LTT',
  'hyderabad deccan': 'HYB',
  'secunderabad': 'SC',
  'secunderabad junction': 'SC',
  'kacheguda': 'KCG',
  'ksr bengaluru': 'SBC',
  'yesvantpur': 'YPR',
  'chennai central': 'MAS',
  'chennai egmore': 'MS',
  'vijayawada junction': 'BZA',
  'visakhapatnam junction': 'VSKP',
  'howrah': 'HWH',
  'howrah junction': 'HWH',
  'sealdah': 'SDAH',
  'pune junction': 'PUNE',
  'madgaon': 'MAO',
  'madgaon junction': 'MAO',
  'vasco da gama': 'VSG'
};

export function getStationCode(input: string): string {
  if (!input) return 'NDLS';
  const cleanInput = input.trim().toLowerCase();
  
  // 1. If it's already an exact code (3-4 letters uppercase)
  const upper = cleanInput.toUpperCase();
  const codes = ['NDLS', 'DLI', 'NZM', 'CSMT', 'MMCT', 'LTT', 'HYB', 'SC', 'KCG', 'SBC', 'YPR', 'MAS', 'MS', 'BZA', 'VSKP', 'HWH', 'SDAH', 'PUNE', 'MAO', 'VSG'];
  if (codes.includes(upper)) {
    return upper;
  }
  
  // 2. Direct mapping lookup
  if (STATION_MAPPINGS[cleanInput]) {
    return STATION_MAPPINGS[cleanInput];
  }
  
  // 3. Substring match
  for (const [key, code] of Object.entries(STATION_MAPPINGS)) {
    if (cleanInput.includes(key) || key.includes(cleanInput)) {
      return code;
    }
  }
  
  return upper; // fallback
}

const TRAINS = [
  { name: 'Vande Bharat Express', number: '22436', basePrice: 1800, classes: ['CC', 'EC'], runsOn: [1, 2, 3, 4, 5, 6] },
  { name: 'Rajdhani Express', number: '12952', basePrice: 2200, classes: ['3A', '2A', '1A'], runsOn: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Shatabdi Express', number: '12002', basePrice: 1200, classes: ['CC', 'EC'], runsOn: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Gitanjali Express', number: '12859', basePrice: 650, classes: ['SL', '3A', '2A'], runsOn: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Duronto Express', number: '12260', basePrice: 1500, classes: ['SL', '3A', '2A', '1A'], runsOn: [1, 3, 5] }
];

export async function searchTrains(query: TrainSearchQuery) {
  const sourceCode = getStationCode(query.source);
  const destCode = getStationCode(query.destination);
  const { date, quota } = query;
  
  const results = TRAINS.map((train, idx) => {
    // Determine dynamic price multipliers based on source/dest strings
    const multiplier = 1 + ((sourceCode.length + destCode.length) % 4) * 0.15;
    
    const departureHour = (8 + idx * 3) % 24;
    const depTime = `${departureHour.toString().padStart(2, '0')}:15`;
    const durMin = 360 + (idx * 95);
    const durHrs = Math.floor(durMin / 60);
    const durMins = durMin % 60;
    const duration = `${durHrs}h ${durMins}m`;

    const arrHour = (departureHour + durHrs) % 24;
    const arrMin = (15 + durMins) % 60;
    const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;

    const classesData = train.classes.map(cls => {
      let clsPrice = Math.round(train.basePrice * multiplier);
      if (cls === '1A') clsPrice = Math.round(clsPrice * 2.8);
      if (cls === '2A') clsPrice = Math.round(clsPrice * 1.8);
      if (cls === '3A') clsPrice = Math.round(clsPrice * 1.3);
      if (cls === 'EC') clsPrice = Math.round(clsPrice * 2.2);
      if (cls === 'SL') clsPrice = Math.round(clsPrice * 0.4);

      if (quota === 'Tatkal') clsPrice = Math.round(clsPrice * 1.25);
      if (quota === 'Premium Tatkal') clsPrice = Math.round(clsPrice * 1.5);

      // Deterministic seat counts
      const availableSeats = (12 + (idx * cls.charCodeAt(0))) % 85;

      return {
        class_name: cls,
        price: clsPrice,
        available_seats: availableSeats === 0 ? 'WL/9' : `${availableSeats} Seats`,
        is_waitlist: availableSeats === 0
      };
    });

    return {
      train_id: `${train.number}_${date.replace(/-/g, '')}`,
      train_name: train.name,
      train_number: train.number,
      source: sourceCode,
      destination: destCode,
      departure_time: depTime,
      arrival_time: arrTime,
      duration,
      runs_on: train.runsOn, // 0 = Sun, 1 = Mon, etc.
      classes: classesData,
      quota
    };
  });

  return results;
}

export function generateCoachBerths(trainId: string, className: string) {
  // Simulates coach positions and berth configs (Lower/Middle/Upper/Side Lower/Side Upper)
  const totalBerths = className === 'SL' || className === '3A' ? 72 : className === '2A' ? 46 : 24;
  const berths = [];

  for (let b = 1; b <= totalBerths; b++) {
    // Determine berth type in standard Indian rail coach
    let type = 'Lower';
    const rem = b % 8;
    if (rem === 1 || rem === 4) type = 'Lower';
    else if (rem === 2 || rem === 5) type = 'Middle';
    else if (rem === 3 || rem === 6) type = 'Upper';
    else if (rem === 7) type = 'Side Lower';
    else type = 'Side Upper';

    // 2A and 1A don't have middle berths
    if ((className === '2A' || className === '1A') && type === 'Middle') {
      type = 'Upper';
    }

    const isBooked = (b * trainId.length) % 5 === 0;

    berths.push({
      berth_number: b,
      type,
      status: isBooked ? 'booked' : 'available'
    });
  }

  return berths;
}

export async function createTrainBooking(
  userId: string,
  trainDetails: any,
  passengers: any[],
  paymentId: string
) {
  const pnr = `TX-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const providerBookingId = `WW-TRN-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Assign deterministic coach/berth values
  const bookingsCount = await Booking.countDocuments();
  const coachNo = `${trainDetails.class_name}-${Math.floor(bookingsCount / 10) + 1}`;

  const booking = new Booking({
    user_id: userId,
    booking_type: 'train',
    status: 'confirmed',
    booking_reference: pnr,
    provider_booking_id: providerBookingId,
    amount_paid: trainDetails.total_price,
    payment_id: paymentId,
    journey_details: {
      train_name: trainDetails.train_name,
      train_number: trainDetails.train_number,
      source: trainDetails.source,
      destination: trainDetails.destination,
      departure_time: trainDetails.departure_time,
      arrival_time: trainDetails.arrival_time,
      duration: trainDetails.duration,
      date: trainDetails.date,
      class_name: trainDetails.class_name,
      quota: trainDetails.quota || 'General'
    },
    passengers: passengers.map((p, idx) => ({
      name: p.name,
      age: p.age,
      gender: p.gender,
      seat_number: `${coachNo}/Berth-${(idx + 5) * 3}`, // Simulated assignment
      berth_preference: p.berth_preference || 'No Preference',
      id_type: p.id_type,
      id_number: p.id_number
    }))
  });

  await booking.save();
  return booking;
}
