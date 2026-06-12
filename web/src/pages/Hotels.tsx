import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Star, MapPin, Building, ShieldCheck, Check, Loader, User, CreditCard, Sparkles, Calendar, Users, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Plane, Train, Bus } from 'lucide-react';

export default function Hotels() {
  const navigate = useNavigate();
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

  const renderBookingHubHeader = (activeId: string) => {
    const tabs = [
      { id: 'flights', label: 'Flights', path: '/flights', icon: Plane },
      { id: 'hotels', label: 'Hotels', path: '/hotels', icon: Building },
      { id: 'trains', label: 'Trains', path: '/trains', icon: Train },
      { id: 'buses', label: 'Buses', path: '/buses', icon: Bus },
    ];
    return (
      <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap -mb-px ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-xl">
      {/* Page Title */}
      <div>
        <h1 className="font-display-lg text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building className="text-primary" /> Booking Hub
        </h1>
        <p className="text-slate-400 text-xs mt-1">AI-powered luxury stays bookings with best rates guaranteed</p>
      </div>

      {/* Search Header Form */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] p-5">
        {renderBookingHubHeader('hotels')}

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            {/* Destination */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
              <MapPin size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              <div className="flex flex-col flex-grow text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Destination</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full"
                  placeholder="E.g. Goa, Jaipur..."
                  required
                />
              </div>
            </div>

            {/* Check-In */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
              <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              <div className="flex flex-col flex-grow text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check-In</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Check-Out */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
              <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              <div className="flex flex-col flex-grow text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check-Out</span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
              <Users size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              <div className="flex flex-col flex-grow text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Guests</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            <Search size={15} /> Search Hotels
          </button>
        </form>
      </div>

      {/* Hotel Listings */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader className="animate-spin text-primary mb-3" size={32} />
          <p className="text-xs text-slate-500 font-semibold">Searching the best rates...</p>
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
          No premium hotels found in "{city}". Try searching for popular cities like "Goa", "Jaipur", or "Delhi".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => setSelectedHotel(hotel)}
              className="group cursor-pointer space-y-2 text-left"
            >
              {/* Image box */}
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm transition-all group-hover:shadow-card-hover group-hover:-translate-y-1">
                <img
                  src={hotel.photos?.[0]}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500';
                  }}
                />
                {/* Rating badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm text-amber-500 font-bold">
                  <Star size={11} fill="currentColor" />
                  <span className="text-[10px] text-slate-800 font-extrabold">{hotel.rating?.toFixed(1) || '4.8'}</span>
                </div>
              </div>

              {/* Info under image */}
              <div className="pt-1">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors leading-tight truncate">{hotel.name}</h3>
                  <span className="text-xs font-extrabold text-primary flex-shrink-0">
                    ₹{hotel.price_per_night?.toLocaleString('en-IN')}
                    <span className="text-[9px] font-normal text-slate-400">/night</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 leading-none"><MapPin size={10} className="text-slate-300" /> {city}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hotel.amenities.slice(0, 2).map((am: string) => (
                    <span key={am} className="text-[8px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hotel Details Modal */}
      {selectedHotel && !showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setSelectedHotel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
            <div className="relative h-56 rounded-2xl overflow-hidden shadow-inner">
              <img src={selectedHotel.photos?.[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                <h2 className="text-lg font-bold text-white leading-tight">{selectedHotel.name}</h2>
                <p className="text-[10px] text-gray-300 font-semibold mt-1">Based on {selectedHotel.reviews_count || 120} verified traveler reviews.</p>
              </div>
            </div>
            <div className="space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed font-medium text-slate-500">{selectedHotel.description || 'Experience ultimate luxury and unparalleled comfort in this premium curated property, offering world-class amenities and stellar services.'}</p>
              
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[9px]">What this place offers:</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {selectedHotel.amenities.map((am: string) => (
                    <span key={am} className="flex items-center gap-1.5 text-slate-600 font-semibold">
                      <Check size={12} className="text-emerald-500 stroke-[3.0]" /> {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-55 pt-4">
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Nightly Price</p>
                  <p className="text-base font-extrabold text-primary">₹{selectedHotel.price_per_night?.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={handleBook}
                  className="bg-primary text-white hover:bg-on-primary-fixed-variant font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all"
                >
                  Book Stay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && !successBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-2">Room Reservation Checkout</h2>

            <div className="space-y-4 text-xs">
              {/* Hotel Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-slate-700">
                <p className="font-extrabold text-slate-800 leading-tight">{selectedHotel.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Check-in: {checkIn} | Check-out: {checkOut}</p>
                <p className="text-primary font-bold text-xs pt-1 border-t border-slate-200/50 mt-1">Total Stay Fare: ₹{(selectedHotel.price_per_night * guests).toLocaleString('en-IN')}</p>
              </div>

              {/* Guest Details */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Guest Details</label>
                <input
                  type="text"
                  placeholder="Guest Full Name"
                  value={passengers[0]?.name}
                  onChange={(e) => setPassengers([{ ...passengers[0], name: e.target.value }])}
                  className="input-field py-2.5"
                  required
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Payment Gateway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-3 border rounded-xl font-bold text-center text-xs transition-all ${
                      paymentMethod === 'stripe' 
                        ? 'bg-primary/5 border-primary text-primary' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Stripe Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 border rounded-xl font-bold text-center text-xs transition-all ${
                      paymentMethod === 'upi' 
                        ? 'bg-primary/5 border-primary text-primary' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    BHIM UPI
                  </button>
                </div>
              </div>

              {/* Stripe inputs */}
              {paymentMethod === 'stripe' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={13} className="text-slate-400" /> Secure Card Details (sandbox)
                  </p>
                  <input
                    type="text"
                    placeholder="Card Number (4242 4242 4242 4242)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                    <input
                      type="password"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* UPI QR */}
              {paymentMethod === 'upi' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-2">
                  <span className="text-3xl inline-block">📱</span>
                  <p className="font-extrabold text-slate-850">Scan UPI QR / Open Mobile Application</p>
                  <p className="text-[10px] text-slate-400 leading-normal">BHIM GPay, PhonePe, Paytm, or any banking app supported.</p>
                </div>
              )}

              <button
                onClick={executeBooking}
                disabled={bookingLoading}
                className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {bookingLoading ? <Loader className="animate-spin" size={14} /> : 'Pay & Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Booking confirmation */}
      {successBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check size={32} className="stroke-[3.0]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Stay Booked Successfully!</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Your reservation details are confirmed.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-left space-y-2 text-slate-700">
              <p><strong>Hotel Name:</strong> {successBooking.journey_details?.hotel_name}</p>
              <p><strong>Location:</strong> {successBooking.journey_details?.city}</p>
              <p><strong>Reservation PNR:</strong> <span className="font-mono text-primary font-bold">{successBooking.booking_reference}</span></p>
              <p><strong>Total Paid:</strong> ₹{successBooking.amount_paid?.toLocaleString('en-IN')}</p>
            </div>

            <button
              onClick={closeAllModals}
              className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
