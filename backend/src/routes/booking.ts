import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../services/auth';
import { searchFlights, generateSeatMap, createFlightBooking } from '../services/booking/flight';
import { searchHotels } from '../services/booking/hotel';
import { searchTrains, generateCoachBerths, createTrainBooking } from '../services/booking/train';
import { searchBuses, generateBusSeats, createBusBooking } from '../services/booking/bus';
import { generateTicketPDF } from '../services/pdf';
import { Booking } from '../models/Booking';
import { Homestay } from '../models/Homestay';
import { sendNotification } from '../services/notification';
import { sendEmailNotification } from '../services/email';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const router = Router();


// Stripe Initialization (with fallback if keys are missing)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
let stripeInstance: any = null;

if (stripeSecretKey) {
  try {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any
    });
  } catch (err) {
    console.error('Stripe initialization failed:', err);
  }
}

// ---------------- FLIGHT BOOKINGS ----------------

// Flight search
router.get('/flights/search', async (req, res) => {
  const { source, destination, date, cabin_class, passengers } = req.query;
  try {
    const flights = await searchFlights({
      source: String(source || 'DEL'),
      destination: String(destination || 'BOM'),
      date: String(date || '2026-06-15'),
      cabinClass: String(cabin_class || 'Economy'),
      passengers: Number(passengers || 1)
    });
    return res.json({ success: true, data: flights });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Seat map
router.get('/flights/seats', async (req, res) => {
  const { flight_id } = req.query;
  try {
    const seats = generateSeatMap(String(flight_id || ''));
    return res.json({ success: true, data: seats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Flight book
router.post('/flights/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { flight_details, passengers, seats, amount_paid, payment_id } = req.body;

  try {
    const booking = await createFlightBooking(userId, flight_details, passengers, seats, amount_paid, payment_id);
    
    await sendNotification(
      userId,
      'Flight Confirmed! ✈️',
      `Your flight ${flight_details.flight_number} to ${flight_details.destination} is confirmed. PNR: ${booking.booking_reference}`,
      'booking_confirmation'
    );

    // Send email confirmation
    sendEmailNotification({
      toUserId: userId,
      subject: `Flight Confirmed! PNR: ${booking.booking_reference}`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563EB;">Your Flight Booking is Confirmed! ✈️</h2>
          <p>Hi there,</p>
          <p>Thank you for booking with <strong>TravelSphere AI</strong>. Your flight details are confirmed:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">PNR Reference</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${booking.booking_reference}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Flight Number</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${flight_details.flight_number}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Route</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${flight_details.source} to ${flight_details.destination}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Departure Time</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${flight_details.departure_time}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Amount Paid</td><td style="padding: 10px; border: 1px solid #e2e8f0;">INR ${amount_paid}</td></tr>
          </table>
          <p>Have a wonderful trip!</p>
          <p>Warm regards,<br/><strong>TravelSphere AI Team</strong></p>
        </div>
      `
    }).catch(err => console.error('Flight email notification failed:', err));

    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- TRAIN BOOKINGS ----------------

// Train search
router.get('/trains/search', async (req, res) => {
  const { source, destination, date, quota } = req.query;
  try {
    const trains = await searchTrains({
      source: String(source || 'NDLS'),
      destination: String(destination || 'CSMT'),
      date: String(date || '2026-06-15'),
      quota: String(quota || 'General')
    });
    return res.json({ success: true, data: trains });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Berth coach mapping
router.get('/trains/berths', async (req, res) => {
  const { train_id, class_name } = req.query;
  try {
    const berths = generateCoachBerths(String(train_id || ''), String(class_name || '3A'));
    return res.json({ success: true, data: berths });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Train book
router.post('/trains/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { train_details, passengers, payment_id } = req.body;

  try {
    const booking = await createTrainBooking(userId, train_details, passengers, payment_id);

    await sendNotification(
      userId,
      'Train Booking Confirmed! 🚄',
      `Your train ${train_details.train_number} ticket is booked. PNR: ${booking.booking_reference}`,
      'booking_confirmation'
    );

    // Send email confirmation
    sendEmailNotification({
      toUserId: userId,
      subject: `Train Booking Confirmed! PNR: ${booking.booking_reference}`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563EB;">Your Train Ticket is Confirmed! 🚄</h2>
          <p>Hi there,</p>
          <p>Your train ticket has been successfully booked via <strong>TravelSphere AI</strong>. Details below:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">PNR Reference</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${booking.booking_reference}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Train Name/No.</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${train_details.train_name} (${train_details.train_number})</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Route</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${train_details.source} to ${train_details.destination}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Class</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${train_details.class_name} (${train_details.quota || 'General'})</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Amount Paid</td><td style="padding: 10px; border: 1px solid #e2e8f0;">INR ${train_details.total_price || booking.amount_paid}</td></tr>
          </table>
          <p>Have a safe and comfortable rail journey!</p>
          <p>Warm regards,<br/><strong>TravelSphere AI Team</strong></p>
        </div>
      `
    }).catch(err => console.error('Train email notification failed:', err));

    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PNR Status lookup
router.get('/trains/pnr/:pnr', async (req, res) => {
  const { pnr } = req.params;
  // Simulated PNR Lookup
  return res.json({
    success: true,
    data: {
      pnr,
      chart_status: 'Chart Prepared',
      train_number: '12952',
      train_name: 'Mumbai Rajdhani',
      date: '2026-06-15',
      passengers: [
        { name: 'John Doe', seat: 'B2/Seat-18', status: 'CNF (Confirmed)' },
        { name: 'Jane Doe', seat: 'B2/Seat-20', status: 'CNF (Confirmed)' }
      ]
    }
  });
});

// Train running status
router.get('/trains/running-status', async (req, res) => {
  const { train_number } = req.query;
  return res.json({
    success: true,
    data: {
      train_number: train_number || '12952',
      current_station: 'Ratlam Jn (RTM)',
      delay_minutes: 10,
      status: 'On Time',
      last_updated: 'Just now',
      upcoming_stations: [
        { name: 'Vadodara Jn (BRC)', ETA: '19:40', distance_km: 120 },
        { name: 'Mumbai Central (MMCT)', ETA: '23:45', distance_km: 510 }
      ]
    }
  });
});

// ---------------- BUS BOOKINGS ----------------

// Bus Search
router.get('/buses/search', async (req, res) => {
  const { source, destination, date } = req.query;
  try {
    const buses = await searchBuses({
      source: String(source || 'Bangalore'),
      destination: String(destination || 'Chennai'),
      date: String(date || '2026-06-15')
    });
    return res.json({ success: true, data: buses });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Bus Seat layouts
router.get('/buses/seats', async (req, res) => {
  const { bus_id } = req.query;
  try {
    const seats = generateBusSeats(String(bus_id || ''));
    return res.json({ success: true, data: seats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Bus book
router.post('/buses/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { bus_details, passengers, seats, boarding_point, dropping_point, payment_id } = req.body;

  try {
    const booking = await createBusBooking(userId, bus_details, passengers, seats, boarding_point, dropping_point, payment_id);

    await sendNotification(
      userId,
      'Bus Confirmed! 🚌',
      `Your bus journey with ${bus_details.operator_name} is confirmed. Ticket ID: ${booking.booking_reference}`,
      'booking_confirmation'
    );

    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- PAYMENT INTEGRATION ----------------
// ---------------- TICKET DOWNLOADS ----------------

// PDF Ticket Download
router.get('/tickets/download/:id', async (req, res) => {
  const bookingId = req.params.id;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.booking_reference}.pdf`);

    generateTicketPDF(booking, res);
  } catch (error: any) {
    console.error('Error generating PDF ticket:', error);
    return res.status(500).send('Error generating PDF ticket');
  }
});

// ---------------- HOTEL BOOKINGS ----------------
// Hotel Search
router.get('/hotels/search', async (req, res) => {
  const { city, check_in, check_out, rating, guests } = req.query;
  try {
    const hotels = await searchHotels({
      city: String(city || 'Goa'),
      checkIn: String(check_in || '2026-06-15'),
      checkOut: String(check_out || '2026-06-18'),
      guests: Number(guests || 2)
    });
    return res.json({ success: true, data: hotels });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Hotel Book
router.post('/hotels/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { hotel_details, passengers, check_in, check_out, amount_paid, payment_id } = req.body;
  try {
    const booking = new Booking({
      user_id: userId,
      booking_type: 'hotel',
      booking_reference: `HTL${uuidv4().substring(0, 5).toUpperCase()}`,
      provider_booking_id: `EXP_${uuidv4().substring(0, 10).toUpperCase()}`,
      journey_details: {
        hotel_name: hotel_details.name,
        city: hotel_details.city || 'Goa',
        check_in,
        check_out,
        date: check_in
      },
      passengers,
      amount_paid,
      payment_id,
      status: 'confirmed'
    });
    await booking.save();
    await sendNotification(
      userId,
      'Hotel Booked! 🏨',
      `Your stay at ${hotel_details.name} is confirmed for PNR ${booking.booking_reference}.`,
      'booking_confirmation'
    );

    // Send email confirmation
    sendEmailNotification({
      toUserId: userId,
      subject: `Hotel Booking Confirmed! Ref: ${booking.booking_reference}`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563EB;">Your Hotel stay is Confirmed! 🏨</h2>
          <p>Hi there,</p>
          <p>Your hotel booking at <strong>${hotel_details.name}</strong> is confirmed. Booking details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Booking Reference</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${booking.booking_reference}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Hotel Name</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${hotel_details.name}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">City</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${hotel_details.city || 'Goa'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Check-In</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${check_in}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Check-Out</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${check_out}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Amount Paid</td><td style="padding: 10px; border: 1px solid #e2e8f0;">INR ${amount_paid}</td></tr>
          </table>
          <p>Enjoy your stay!</p>
          <p>Warm regards,<br/><strong>TravelSphere AI Team</strong></p>
        </div>
      `
    }).catch(err => console.error('Hotel email notification failed:', err));

    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- HOMESTAY BOOKINGS ----------------
// Search Homestays (fetches from db)
router.get('/homestays/search', async (req, res) => {
  const { city } = req.query;
  try {
    let filter: any = { status: 'approved' };
    if (city) {
      filter.city = { $regex: String(city), $options: 'i' };
    }
    const listings = await Homestay.find(filter).populate('host_id', 'name profile_photo_url');
    return res.json({ success: true, data: listings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Host listing creation
router.post('/homestays/create', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { name, description, address, city, price_per_night, photos, amenities } = req.body;
  if (!name || !address || !city || !price_per_night) {
    return res.status(400).json({ success: false, error: 'Name, address, city and price are required' });
  }
  try {
    const homestay = new Homestay({
      name,
      description,
      address,
      city,
      price_per_night: Number(price_per_night),
      photos: photos || ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500'],
      amenities: amenities || ['WiFi', 'Kitchen'],
      host_id: userId,
      status: 'approved'
    });
    await homestay.save();
    return res.status(201).json({ success: true, data: homestay });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get host properties
router.get('/homestays/host-list', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  try {
    const list = await Homestay.find({ host_id: userId });
    return res.json({ success: true, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Book Homestay
router.post('/homestays/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { homestay_details, passengers, check_in, check_out, amount_paid, payment_id } = req.body;
  try {
    const booking = new Booking({
      user_id: userId,
      booking_type: 'homestay',
      booking_reference: `HMS${uuidv4().substring(0, 5).toUpperCase()}`,
      provider_booking_id: `ABN_${uuidv4().substring(0, 10).toUpperCase()}`,
      journey_details: {
        homestay_name: homestay_details.name,
        address: homestay_details.address,
        city: homestay_details.city,
        check_in,
        check_out,
        date: check_in
      },
      passengers,
      amount_paid,
      payment_id,
      status: 'confirmed'
    });
    await booking.save();
    await sendNotification(
      userId,
      'Homestay Request Confirmed! 🏡',
      `Your stay at ${homestay_details.name} is booked. Reference: ${booking.booking_reference}.`,
      'booking_confirmation'
    );
    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- LOCAL ACTIVITIES / TOUR PACKAGES ----------------
router.get('/activities/search', async (req, res) => {
  const { query, city } = req.query;
  const list = [
    {
      id: 'act_1',
      name: `Full Day ${city || 'Goa'} Heritage Tour`,
      price: 1500,
      duration: '8 hours',
      rating: 4.8,
      photo: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500',
      description: 'Explore historical churches, local spice plantations, and old colonial streets.'
    },
    {
      id: 'act_2',
      name: 'Sunset Cruise and Dinner',
      price: 2500,
      duration: '3 hours',
      rating: 4.5,
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      description: 'Relax on a luxury catamaran cruise with delicious coastal buffet dinners.'
    },
    {
      id: 'act_3',
      name: 'Water Sports Adventure Pack',
      price: 3200,
      duration: '4 hours',
      rating: 4.9,
      photo: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=500',
      description: 'Experience jet ski, parasailing, and banana boat rides on the golden shores.'
    }
  ];
  return res.json({ success: true, data: list });
});

router.post('/packages/book', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { package_details, passengers, date, amount_paid, payment_id } = req.body;
  try {
    const booking = new Booking({
      user_id: userId,
      booking_type: 'package',
      booking_reference: `PKG${uuidv4().substring(0, 5).toUpperCase()}`,
      provider_booking_id: `ACT_${uuidv4().substring(0, 10).toUpperCase()}`,
      journey_details: {
        package_name: package_details.name,
        duration: package_details.duration,
        date
      },
      passengers,
      amount_paid,
      payment_id,
      status: 'confirmed'
    });
    await booking.save();
    await sendNotification(
      userId,
      'Activity Booked! 🎟️',
      `Your activity ${package_details.name} is booked. Reference: ${booking.booking_reference}.`,
      'booking_confirmation'
    );
    return res.json({ success: true, data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/payment/stripe-intent', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ success: false, error: 'Amount is required' });
  }

  if (stripeInstance) {
    try {
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'inr',
        payment_method_types: ['card'],
        description: 'TravelSphere AI Booking Payment',
      });
      return res.json({
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    } catch (err: any) {
      console.error('Stripe PaymentIntent creation failed:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    return res.json({
      success: true,
      data: {
        client_secret: `pi_mock_${uuidv4().substring(0, 16)}_secret_${uuidv4().substring(0, 8)}`,
        amount: amount * 100,
        currency: 'inr'
      }
    });
  }
});

// ---------------- CANCELLATION & REFUNDS ----------------
router.post('/bookings/:id/cancel', authMiddleware, async (req: AuthRequest, res) => {
  const bookingId = req.params.id;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    if (booking.user_id.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking' });
    }
    booking.status = 'cancelled';
    await booking.save();
    
    await sendNotification(
      booking.user_id,
      'Booking Cancelled 🔴',
      `Your booking ${booking.booking_reference} has been successfully cancelled and refund initiated.`,
      'booking_cancellation'
    );

    return res.json({ success: true, message: 'Booking cancelled and refund processed', data: booking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Bookings List
router.get('/my-bookings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.user?.id }).sort({ created_at: -1 });
    return res.json({ success: true, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
