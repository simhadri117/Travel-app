import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Home, Search, Star, MapPin, Plus, List, Loader, User, CheckCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Homestays() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'explore' | 'host'>('explore');

  // Search & Catalog
  const [city, setCity] = useState('Goa');
  const [homestays, setHomestays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Booking Form Modal
  const [selectedHomestay, setSelectedHomestay] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('2026-06-15');
  const [checkOut, setCheckOut] = useState('2026-06-18');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Host Dashboard states
  const [hostProperties, setHostProperties] = useState<any[]>([]);
  const [hostBookings, setHostBookings] = useState<any[]>([]);
  const [loadingHost, setLoadingHost] = useState(false);

  // Property creation form
  const [propName, setPropName] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propAddr, setPropAddr] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propPrice, setPropPrice] = useState('');
  const [propAmenities, setPropAmenities] = useState<string[]>([]);
  const [creatingProperty, setCreatingProperty] = useState(false);

  const AMENITIES_LIST = ['WiFi', 'Kitchen', 'Pool', 'AC', 'Parking', 'Washing Machine', 'Gym'];

  const fetchHomestays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/homestays/search', { params: { city } });
      if (res.data.success) {
        setHomestays(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostDashboard = async () => {
    setLoadingHost(true);
    try {
      const resProp = await api.get('/homestays/host-list');
      if (resProp.data.success) {
        setHostProperties(resProp.data.data);
      }
      
      // Load all homestay bookings (simulating booking requests for host properties)
      const resB = await api.get('/my-bookings');
      if (resB.data.success) {
        setHostBookings(resB.data.data.filter((b: any) => b.booking_type === 'homestay'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHost(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchHomestays();
    } else {
      fetchHostDashboard();
    }
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHomestays();
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propAddr || !propCity || !propPrice) return;
    setCreatingProperty(true);
    try {
      const res = await api.post('/homestays/create', {
        name: propName,
        description: propDesc,
        address: propAddr,
        city: propCity,
        price_per_night: Number(propPrice),
        amenities: propAmenities
      });
      if (res.data.success) {
        alert('Homestay property listed successfully!');
        setPropName('');
        setPropDesc('');
        setPropAddr('');
        setPropCity('');
        setPropPrice('');
        setPropAmenities([]);
        fetchHostDashboard();
      }
    } catch (err) {
      alert('Failed to submit listing. Please try again.');
    } finally {
      setCreatingProperty(false);
    }
  };

  const handleBookHomestay = async () => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Book Homestay',
        subtitle: 'Sign in to request booking, message the host, and manage your reservation.',
        onSuccess: () => {
          handleBookHomestay();
        }
      });
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/payment/stripe-intent', { amount: selectedHomestay.price_per_night * 3 });
      const res = await api.post('/homestays/book', {
        homestay_details: selectedHomestay,
        passengers: [{ name: user?.name || 'Lead Guest', age: 25, gender: 'Male' }],
        check_in: checkIn,
        check_out: checkOut,
        amount_paid: selectedHomestay.price_per_night * 3,
        payment_id: `pay_hms_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });
      if (res.data.success) {
        setBookingSuccess(res.data.data);
        confetti({ particleCount: 120, spread: 80 });
      }
    } catch (err) {
      alert('Booking request failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleAmenity = (item: string) => {
    if (propAmenities.includes(item)) {
      setPropAmenities(propAmenities.filter(a => a !== item));
    } else {
      setPropAmenities([...propAmenities, item]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Headers */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h1 className="text-3xl font-heading font-black text-slate-900 flex items-center gap-2">
          <Home className="text-brand-600" /> Homestays & Villas
        </h1>
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('explore')}
            className={`py-1.5 px-4 rounded-xl transition-all ${activeTab === 'explore' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Explore Stays
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal({
                  title: 'Access Host Dashboard',
                  subtitle: 'Sign in to list your properties, manage reservations, and track your host earnings.',
                  onSuccess: () => {
                    setActiveTab('host');
                  }
                });
                return;
              }
              setActiveTab('host');
            }}
            className={`py-1.5 px-4 rounded-xl transition-all ${activeTab === 'host' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Host Dashboard
          </button>
        </div>
      </div>

      {/* ================= TAB 1: EXPLORE STAYS ================= */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 border-slate-100">
            <div className="space-y-1.5 sm:col-span-3">
              <label className="label">Search City</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5">
                <MapPin size={14} className="text-slate-400 mr-2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 focus:outline-none w-full"
                  placeholder="Where do you want to stay? (e.g. Goa, Udaipur...)"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Search size={14} /> Search Properties
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader className="animate-spin text-brand-600 mb-3" size={32} />
              <p className="text-xs text-slate-500">Finding local homes...</p>
            </div>
          ) : homestays.length === 0 ? (
            <div className="text-center py-12 card text-slate-500 text-xs">
              No private homestays listed in "{city}". Try listing your own home under the Host Dashboard!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {homestays.map((home) => (
                <div
                  key={home._id}
                  onClick={() => setSelectedHomestay(home)}
                  className="card overflow-hidden group cursor-pointer card-interactive bg-white border-slate-100"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={home.photos?.[0] || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500'}
                      alt={home.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] text-brand-600 font-bold flex items-center gap-0.5 shadow-sm">
                      🏡 Guest House
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">{home.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><MapPin size={10} /> {home.city}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {home.amenities.slice(0, 3).map((am: string) => (
                        <span key={am} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {am}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <span className="text-[10px] text-slate-400">Host: {home.host_id?.name || 'Local'}</span>
                      <p className="text-sm font-black text-brand-600">₹{home.price_per_night} <span className="text-[10px] font-normal text-slate-400">/ night</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: HOST DASHBOARD ================= */}
      {activeTab === 'host' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Add Property Form */}
          <div className="lg:col-span-1 card p-6 space-y-6 bg-white border-slate-100 h-max">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">List Your Property</h3>
            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Listing Name</label>
                <input
                  type="text"
                  placeholder="Cozy Beachfront Villa"
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Description</label>
                <textarea
                  placeholder="Describe your rooms, gardens, distance to sights..."
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 resize-none focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">City</label>
                  <input
                    type="text"
                    placeholder="Goa"
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">Price/Night (₹)</label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Address Details</label>
                <input
                  type="text"
                  placeholder="Baga Beach Lane, Calangute"
                  value={propAddr}
                  onChange={(e) => setPropAddr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Amenities checkboxes */}
              <div className="space-y-2">
                <label className="text-slate-500 font-semibold block">Select Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITIES_LIST.map((am) => {
                    const selected = propAmenities.includes(am);
                    return (
                      <button
                        type="button"
                        key={am}
                        onClick={() => toggleAmenity(am)}
                        className={`px-2.5 py-1 border text-[10px] rounded-xl transition-all ${selected ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                      >
                        {am}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingProperty}
                className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {creatingProperty ? <Loader className="animate-spin" size={12} /> : <Plus size={14} />} Publish Listing
              </button>
            </form>
          </div>

          {/* Right panel: Active listings and requests logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Listings */}
            <div className="card p-6 space-y-4 bg-white border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <List size={16} className="text-brand-600" /> My Active Properties ({hostProperties.length})
              </h3>
              {loadingHost ? (
                <p className="text-xs text-slate-500">Loading listings...</p>
              ) : hostProperties.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">You haven't listed any properties yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {hostProperties.map((p) => (
                    <div key={p._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
                      <img src={p.photos?.[0]} alt="" className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.city} • ₹{p.price_per_night}/night</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Bookings Log */}
            <div className="card p-6 space-y-4 bg-white border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-success" /> Active Booking Requests
              </h3>
              {loadingHost ? (
                <p className="text-xs text-slate-500">Loading requests...</p>
              ) : hostBookings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No active reservation requests logged yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {hostBookings.map((b) => (
                    <div key={b._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{b.journey_details.homestay_name}</p>
                        <p className="text-[10px] text-slate-500">Check-in: {b.journey_details.check_in} | PNR: {b.booking_reference}</p>
                        <p className="text-brand-600 font-bold mt-1">Earnings: ₹{b.amount_paid}</p>
                      </div>
                      <span className="text-[10px] bg-success/15 border border-success/30 text-success py-1 px-3 rounded-xl font-bold uppercase">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Dialog Modal */}
      {selectedHomestay && !bookingSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <button onClick={() => setSelectedHomestay(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            <h3 className="font-heading font-black text-lg text-slate-900">Book Homestay Stay</h3>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900">{selectedHomestay.name}</p>
                <p className="text-slate-500 mt-0.5">{selectedHomestay.address}, {selectedHomestay.city}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">Check-In</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">Check-Out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <div>
                  <p className="text-slate-400 text-[10px]">Estimated Price (3 Nights)</p>
                  <p className="text-base font-black text-brand-600">₹{selectedHomestay.price_per_night * 3}</p>
                </div>
                <button
                  onClick={handleBookHomestay}
                  disabled={bookingLoading}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-xl"
                >
                  {bookingLoading ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success confirmation */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
            <span className="text-4xl inline-block animate-bounce">🏠</span>
            <div className="space-y-1">
              <h2 className="text-lg font-heading font-black text-slate-900">Booking Request Confirmed!</h2>
              <p className="text-xs text-slate-500">The host will review your dates shortly.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl text-xs text-left font-semibold space-y-1 border border-slate-100 text-slate-700">
              <p><strong>Property:</strong> {bookingSuccess.journey_details?.homestay_name}</p>
              <p><strong>Reference PNR:</strong> <span className="font-mono text-brand-600">{bookingSuccess.booking_reference}</span></p>
            </div>
            <button
              onClick={() => { setSelectedHomestay(null); setBookingSuccess(null); }}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
