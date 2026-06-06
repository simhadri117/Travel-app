import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Star, MapPin, Building, ShieldCheck, Check, Loader, User, CreditCard, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Hotels() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [city, setCity] = useState('Goa');
  const [checkIn, setCheckIn] = useState('2026-06-15');
  const [checkOut, setCheckOut] = useState('2026-06-18');
  const [guests, setGuests] = useState(1);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / Checkout states
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [passengers, setPassengers] = useState<any[]>([{ name: '', age: '', gender: 'Male' }]);
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'upi'>('stripe');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels/search', { params: { city } });
      if (res.data.success) {
        setHotels(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    // Load saved passengers
    const saved = localStorage.getItem('ww_saved_passengers');
    if (saved) {
      setSavedPassengers(JSON.parse(saved));
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHotels();
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Book Your Stay',
        subtitle: 'Sign in to reserve your room, select payment methods, and secure your booking.',
        onSuccess: () => {
          handleBook();
        }
      });
      return;
    }
    // Populate passenger name with user details or empty
    const saved = localStorage.getItem('ww_saved_passengers');
    if (saved && JSON.parse(saved).length > 0) {
      setPassengers([JSON.parse(saved)[0]]);
    } else {
      setPassengers([{ name: 'Lead Passenger', age: 28, gender: 'Male' }]);
    }
    setShowCheckout(true);
  };

  const executeBooking = async () => {
    setBookingLoading(true);
    try {
      // Simulate Stripe payment intent API
      if (paymentMethod === 'stripe') {
        await api.post('/payment/stripe-intent', { amount: selectedHotel.price_per_night * guests });
      }

      const res = await api.post('/hotels/book', {
        hotel_details: selectedHotel,
        passengers,
        check_in: checkIn,
        check_out: checkOut,
        amount_paid: selectedHotel.price_per_night * guests,
        payment_id: `pay_mock_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      });

      if (res.data.success) {
        setSuccessBooking(res.data.data);
        confetti({ particleCount: 100, spread: 60 });
      }
    } catch (err) {
      alert('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const closeAllModals = () => {
    setSelectedHotel(null);
    setShowCheckout(false);
    setSuccessBooking(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-900 flex items-center gap-2">
          <Building className="text-brand-600" /> Luxury Hotel Bookings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Book curated premium resorts and hotels worldwide with best rates guaranteed.</p>
      </div>

      {/* Search Header Form */}
      <form onSubmit={handleSearchSubmit} className="card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 border-slate-100">
        <div className="space-y-1.5">
          <label className="label">Destination</label>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5">
            <MapPin size={14} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-xs text-slate-900 focus:outline-none w-full"
              placeholder="E.g. Goa, Jaipur..."
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="label">Check-In</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Check-Out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Search size={14} /> Search Hotels
          </button>
        </div>
      </form>

      {/* Hotel Listings */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader className="animate-spin text-brand-600 mb-3" size={32} />
          <p className="text-xs text-slate-500">Searching the best rates...</p>
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-12 card text-slate-500 text-xs">
          No premium hotels found in "{city}". Try searching for popular cities like "Goa", "Jaipur", or "Delhi".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => setSelectedHotel(hotel)}
              className="card overflow-hidden group cursor-pointer card-interactive bg-white border-slate-100"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={hotel.photos?.[0]}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
                <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] text-brand-600 font-bold flex items-center gap-0.5 shadow-sm">
                  <Star size={10} fill="currentColor" /> {hotel.rating} Stars
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">{hotel.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><MapPin size={10} /> {city}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 3).map((am: string) => (
                    <span key={am} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {am}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400">{hotel.reviews_count} Verified Reviews</span>
                  <p className="text-sm font-black text-brand-600">₹{hotel.price_per_night} <span className="text-[10px] font-normal text-slate-400">/ night</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hotel Details Modal */}
      {selectedHotel && !showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedHotel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <div className="relative h-56 rounded-3xl overflow-hidden">
              <img src={selectedHotel.photos?.[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <h2 className="text-xl font-heading font-black text-white">{selectedHotel.name}</h2>
                <p className="text-xs text-gray-300 mt-0.5">{selectedHotel.reviews_count} guests rated this stay.</p>
              </div>
            </div>
            <div className="space-y-4 text-xs text-slate-600">
              <p>{selectedHotel.description}</p>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">What this place offers:</p>
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  {selectedHotel.amenities.map((am: string) => (
                    <span key={am} className="flex items-center gap-1.5 text-slate-600"><Check size={12} className="text-success" /> {am}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <div>
                  <p className="text-slate-400 text-[10px]">Nightly Price</p>
                  <p className="text-lg font-black text-brand-600">₹{selectedHotel.price_per_night}</p>
                </div>
                <button
                  onClick={handleBook}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-2xl text-xs shadow-sm"
                >
                  Book Stay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout bottom sheet/modal */}
      {showCheckout && !successBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Room Reservations Checkout</h2>

            <div className="space-y-4 text-xs">
              {/* Hotel Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900">{selectedHotel.name}</p>
                <p className="text-slate-500 mt-1">Check-in: {checkIn} | Check-out: {checkOut}</p>
                <p className="text-brand-600 font-bold mt-1.5">Total Stay Fare: ₹{selectedHotel.price_per_night * guests}</p>
              </div>

              {/* Guest Details */}
              <div className="space-y-2">
                <label className="font-bold text-slate-500">Lead Guest Details</label>
                <input
                  type="text"
                  placeholder="Guest Full Name"
                  value={passengers[0]?.name}
                  onChange={(e) => setPassengers([{ ...passengers[0], name: e.target.value }])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900"
                  required
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="font-bold text-slate-500 block">Select Payment Gateways</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-3 border rounded-xl font-semibold text-center transition-all ${paymentMethod === 'stripe' ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    Stripe Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 border rounded-xl font-semibold text-center transition-all ${paymentMethod === 'upi' ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    BHIM UPI
                  </button>
                </div>
              </div>

              {/* Stripe simulated inputs */}
              {paymentMethod === 'stripe' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CreditCard size={12} /> Secure Card Details (Stripe sandbox)
                  </p>
                  <input
                    type="text"
                    placeholder="Card Number (4242 4242 4242 4242)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      type="password"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* UPI simulated QR code */}
              {paymentMethod === 'upi' && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-[28px] inline-block">📱</span>
                  <p className="font-bold text-slate-900">Scan UPI QR / Open Mobile Application</p>
                  <p className="text-[10px] text-slate-500">BHIM, Google Pay, PhonePe, Paytm supported.</p>
                </div>
              )}

              <button
                onClick={executeBooking}
                disabled={bookingLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {bookingLoading ? <Loader className="animate-spin" size={14} /> : 'Pay & Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Booking confirmation Screen */}
      {successBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative">
            <span className="text-5xl inline-block animate-bounce">🎉</span>
            <div className="space-y-1">
              <h2 className="text-xl font-heading font-black text-slate-900">Stay Booked Successfully!</h2>
              <p className="text-xs text-slate-500">Your reservation details are confirmed.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2 text-slate-700">
              <p><strong>Hotel:</strong> {successBooking.journey_details?.hotel_name}</p>
              <p><strong>City:</strong> {successBooking.journey_details?.city}</p>
              <p><strong>PNR Reference:</strong> <span className="font-mono text-brand-600 font-bold">{successBooking.booking_reference}</span></p>
              <p><strong>Amount Paid:</strong> ₹{successBooking.amount_paid}</p>
            </div>

            <button
              onClick={closeAllModals}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-2xl text-xs"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
