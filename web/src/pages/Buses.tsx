import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { createBooking } from '../services/firestore';
import { 
  Bus, Calendar, Users, Star, MapPin, 
  CheckCircle, ArrowRight, Shield, RefreshCw, Download,
  Plane, Building, Train, ChevronRight, CreditCard, Clock, ShieldCheck, Map
} from 'lucide-react';

export default function Buses() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [step, setStep] = useState<'search' | 'results' | 'seats' | 'points' | 'checkout' | 'ticket'>('search');

  // Search parameters
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState('2026-06-15');
  const [passengersCount, setPassengersCount] = useState(1);
  const [busesList, setBusesList] = useState<any[]>([]);

  // Selection states
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [activeDeck, setActiveDeck] = useState<'Lower' | 'Upper'>('Lower');

  // Boarding & dropping selections
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<any>(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState<any>(null);

  // Passenger names inputs
  const [passengersDetails, setPassengersDetails] = useState<any[]>([{ name: '', age: '', gender: 'Male' }]);
  
  // Result confirmation
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Search Buses
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('results');
    try {
      const res = await api.get('/buses/search', {
        params: { source, destination, date }
      });
      if (res.data.success) {
        setBusesList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Select Bus & fetch seats map
  const handleSelectBus = async (bus: any) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Book Your Bus',
        subtitle: 'Sign in to select seats, configure boarding options, and secure your booking.',
        onSuccess: () => {
          handleSelectBus(bus);
        }
      });
      return;
    }
    setSelectedBus(bus);
    setStep('seats');
    try {
      const res = await api.get('/buses/seats', { params: { bus_id: bus.bus_id } });
      if (res.data.success) {
        setSeatMap(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Toggle seat map selection
  const handleSeatClick = (seatNo: string, status: string) => {
    if (status === 'occupied') return;
    if (selectedSeats.includes(seatNo)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNo));
    } else {
      if (selectedSeats.length < passengersCount) {
        setSelectedSeats([...selectedSeats, seatNo]);
      } else {
        alert(`You can only select up to ${passengersCount} seats.`);
      }
    }
  };

  // 4. Select Boarding / Dropping points
  const handleSelectPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      alert('Please select boarding and dropping points');
      return;
    }
    setStep('checkout');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = selectedBus.price * passengersCount;
    setLoading(true);

    try {
      const resIntent = await api.post('/payment/stripe-intent', { amount: totalPrice });
      if (resIntent.data.success) {
        const intentData = resIntent.data.data;
        const resBook = await api.post('/buses/book', {
          bus_details: {
            ...selectedBus,
            total_price: totalPrice,
            date,
            source,
            destination
          },
          passengers: passengersDetails,
          seats: selectedSeats,
          boarding_point: selectedBoardingPoint,
          dropping_point: selectedDroppingPoint,
          payment_id: intentData.client_secret || `pay_stripe_${Math.random().toString(36).substring(2, 10)}`
        });

        if (resBook.data.success) {
          // Sync bus booking to Firestore
          try {
            await createBooking({
              booking_type: 'bus',
              booking_reference: resBook.data.data.booking_reference,
              amount_paid: resBook.data.data.amount_paid || totalPrice,
              journey_details: resBook.data.data.journey_details || {
                ...selectedBus,
                date,
                source,
                destination,
                boarding_point: selectedBoardingPoint,
                dropping_point: selectedDroppingPoint
              },
              status: 'confirmed'
            });
          } catch (fsErr) {
            console.error('[Firestore Bus Booking Sync Failed]:', fsErr);
          }

          setBookingConfirmation(resBook.data.data);
          setStep('ticket');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const swap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title banner */}
      <div>
        <h1 className="font-display-lg text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bus size={28} className="text-primary" /> Booking Hub
        </h1>
        <p className="text-slate-400 text-xs mt-1">AI-powered travel booking with standard APIs</p>
      </div>

      {/* ================= STEP 1: SEARCH SCREEN ================= */}
      {step === 'search' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] p-5">
            {/* Header Tabs */}
            {renderBookingHubHeader('buses')}

            <form onSubmit={handleSearch} className="space-y-4">
              {/* Route row */}
              <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center">
                {/* From Box */}
                <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
                  <Bus size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From City</span>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="bg-transparent border-0 p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none placeholder-slate-400 w-full"
                      required
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={swap}
                    className="p-2.5 rounded-full bg-white border border-slate-100 hover:border-slate-200 shadow-sm text-slate-500 hover:text-primary transition-all rotate-0 hover:rotate-180"
                  >
                    <ArrowRight size={14} className="transform rotate-90 md:rotate-0" />
                  </button>
                </div>

                {/* To Box */}
                <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
                  <MapPin size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To City</span>
                    <input
                      type="text"
                      placeholder="e.g. Chennai"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-transparent border-0 p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none placeholder-slate-400 w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date & Passenger row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <Calendar size={16} className="text-slate-400" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Travel Date</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent border-0 p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <Users size={16} className="text-slate-400" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passengers</span>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={passengersCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPassengersCount(val);
                        const arr = Array.from({ length: val }, (_, i) => passengersDetails[i] || { name: '', age: '', gender: 'Male' });
                        setPassengersDetails(arr);
                      }}
                      className="bg-transparent border-0 p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl transition-all shadow-[0_4px_12px_rgba(var(--primary-color-rgb,16,185,129),0.2)] text-sm disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {loading ? 'Searching...' : 'Find Bus Operators'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= STEP 2: SEARCH RESULTS ================= */}
      {step === 'results' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400">Routes showing for</p>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{source} → {destination}</h3>
            </div>
            <button 
              onClick={() => setStep('search')} 
              className="text-xs bg-slate-50 text-primary border border-slate-100 px-3 py-1.5 rounded-xl font-bold hover:bg-slate-100 transition-colors"
            >
              Modify Search
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin text-primary mx-auto mb-2" size={24} />
              <p className="text-xs text-slate-400 font-bold">Scanning top bus fleets...</p>
            </div>
          ) : busesList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Bus size={40} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-800 font-bold">No fleets found</p>
              <p className="text-xs text-slate-400">Try changing dates or search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {busesList.map((bus) => (
                <div 
                  key={bus.bus_id} 
                  className="bg-white rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all p-5 hover:shadow-[0px_8px_24px_rgba(15,23,42,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-800">{bus.operator_name}</h4>
                      <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star size={10} fill="currentColor" /> {bus.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{bus.bus_type}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bus.amenities.map((a: string, i: number) => (
                        <span key={i} className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="flex items-center gap-6 text-xs text-slate-700 w-full md:w-auto justify-between md:justify-start">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{bus.departure_time}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{source}</p>
                    </div>
                    <div className="flex flex-col items-center flex-1 md:flex-initial min-w-[70px]">
                      <span className="text-[9px] text-slate-400 font-semibold mb-0.5">{bus.duration}</span>
                      <div className="relative w-full flex items-center">
                        <div className="w-full h-[1.5px] bg-slate-100" />
                        <Bus size={10} className="absolute right-0 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{bus.arrival_time}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{destination}</p>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-50">
                    <div>
                      <p className="text-[10px] text-emerald-600 font-semibold">{bus.available_seats_count} Seats left</p>
                      <p className="text-lg font-black text-primary">₹{bus.price}</p>
                    </div>
                    <button
                      onClick={() => handleSelectBus(bus)}
                      className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Select Seat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 3: SEAT SELECTION ================= */}
      {step === 'seats' && selectedBus && (
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] space-y-6 max-w-xl mx-auto animate-fade-in">
          <div className="text-center">
            <h2 className="text-base font-black text-slate-800">Choose Seats</h2>
            <p className="text-xs text-slate-400 mt-1">Please select {passengersCount} seat{passengersCount > 1 ? 's' : ''} to continue</p>
          </div>

          {/* Deck Toggles */}
          {selectedBus.bus_type.toLowerCase().includes('sleeper') && (
            <div className="flex justify-center bg-slate-50 p-1 rounded-xl max-w-[240px] mx-auto">
              {(['Lower', 'Upper'] as const).map(deck => (
                <button 
                  key={deck}
                  type="button" 
                  onClick={() => setActiveDeck(deck)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeDeck === deck 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {deck} Deck
                </button>
              ))}
            </div>
          )}

          {/* Bus Seat Layout Dashboard */}
          <div className="border border-slate-100 rounded-3xl p-5 bg-slate-50/50 max-w-xs mx-auto relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeDeck} Deck Layout</span>
              <div className="w-6 h-6 border-2 border-slate-300 rounded-full flex items-center justify-center" title="Steering Wheel">
                <div className="w-1.5 h-3 bg-slate-400 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              {seatMap.filter(s => s.deck === activeDeck).map((seat) => {
                const isSelected = selectedSeats.includes(seat.seat_number);
                
                let bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
                if (seat.status === 'occupied') bgClass = 'bg-slate-200/80 border-transparent text-slate-400 cursor-not-allowed';
                if (isSelected) bgClass = 'bg-primary text-white border-primary shadow-sm';
                if (seat.gender_restriction === 'female' && !isSelected) bgClass = 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100';

                return (
                  <button
                    key={seat.seat_number}
                    type="button"
                    disabled={seat.status === 'occupied'}
                    onClick={() => handleSeatClick(seat.seat_number, seat.status)}
                    className={`h-9 rounded-xl border flex items-center justify-center font-bold text-[10px] transition-all ${bgClass}`}
                  >
                    {seat.seat_number.split('-')[1] || seat.seat_number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seat Map Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-500 font-semibold justify-center pt-2 max-w-sm mx-auto">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-lg bg-emerald-50 border border-emerald-200" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-lg bg-pink-50 border border-pink-200" /> Ladies Only</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-lg bg-primary" /> Selected</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-lg bg-slate-200" /> Occupied</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('results')}
              className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs transition-all border border-slate-100"
            >
              Back to Fleets
            </button>
            <button
              onClick={() => setStep('points')}
              disabled={selectedSeats.length !== passengersCount}
              className="flex-1.5 py-3 bg-primary hover:bg-primary/95 text-white disabled:opacity-50 font-bold rounded-2xl text-xs transition-all shadow-sm"
            >
              Select Points ({selectedSeats.length}/{passengersCount})
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: BOARDING AND DROPPING SELECT ================= */}
      {step === 'points' && selectedBus && (
        <form onSubmit={handleSelectPoints} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-base font-black text-slate-800">Boarding & Dropping Points</h2>
            <p className="text-xs text-slate-400 mt-1">Please pick locations along the route</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boarding Section */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Boarding Point ({source})</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedBus.boarding_points.map((p: any) => {
                  const isSelected = selectedBoardingPoint?.name === p.name;
                  return (
                    <label 
                      key={p.name} 
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="boarding" 
                        checked={isSelected}
                        onChange={() => setSelectedBoardingPoint(p)}
                        className="mt-1 accent-primary" 
                        required
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-[10px] text-primary font-black bg-primary/10 px-1 rounded">{p.time}</span>
                        </div>
                        <p className="text-slate-400 font-medium mt-1">{p.address}</p>
                        {p.landmark && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">Landmark: {p.landmark}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dropping Section */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Dropping Point ({destination})</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedBus.dropping_points.map((p: any) => {
                  const isSelected = selectedDroppingPoint?.name === p.name;
                  return (
                    <label 
                      key={p.name} 
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="dropping" 
                        checked={isSelected}
                        onChange={() => setSelectedDroppingPoint(p)}
                        className="mt-1 accent-primary" 
                        required
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-[10px] text-primary font-black bg-primary/10 px-1 rounded">{p.time}</span>
                        </div>
                        <p className="text-slate-400 font-medium mt-1">{p.address}</p>
                        {p.landmark && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">Landmark: {p.landmark}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('seats')}
              className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs transition-all border border-slate-100"
            >
              Back to Seats
            </button>
            <button
              type="submit"
              className="flex-1.5 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl text-xs transition-all shadow-sm"
            >
              Confirm and Review
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 5: REVIEW AND PAYMENTS ================= */}
      {step === 'checkout' && selectedBus && (
        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-800">Passenger Information</h3>
                <p className="text-xs text-slate-400 mt-1">Provide details exactly as printed on Government ID</p>
              </div>

              {passengersDetails.map((details, idx) => (
                <div key={idx} className="space-y-3 border-t border-slate-50 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-xs font-bold text-slate-800">Passenger #{idx + 1} (Seat {selectedSeats[idx]})</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Passenger Name"
                      value={details.name}
                      onChange={(e) => {
                        const copy = [...passengersDetails];
                        copy[idx].name = e.target.value;
                        setPassengersDetails(copy);
                      }}
                      className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Age"
                        value={details.age}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].age = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                        required
                      />
                      <select
                        value={details.gender}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].gender = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="w-full bg-slate-50 text-slate-800 font-bold px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sandbox Stripe Simulator Payment Card */}
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard size={18} className="text-primary" /> Sandbox Card Details
                </h3>
                <p className="text-xs text-slate-400 mt-1">Payments are simulated through Stripe Sandbox APIs</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card Number (4242 4242 4242 4242)"
                  defaultValue="4242424242424242"
                  className="w-full bg-slate-50 text-slate-800 font-mono font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/29"
                    className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs text-center"
                    required
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    defaultValue="123"
                    className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs text-center"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] space-y-6">
              <h3 className="text-sm font-black text-slate-800 pb-3 border-b border-slate-50 uppercase tracking-wider">Journey & Fare Summary</h3>
              <div className="space-y-3 text-xs text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Operator</span>
                  <span className="font-bold text-slate-800">{selectedBus.operator_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bus Type</span>
                  <span className="font-bold text-slate-800">{selectedBus.bus_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Seats</span>
                  <span className="font-bold text-slate-800">{selectedSeats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Boarding Point</span>
                  <span className="font-bold text-slate-800 text-right">{selectedBoardingPoint.name} ({selectedBoardingPoint.time})</span>
                </div>
                <div className="flex justify-between">
                  <span>Dropping Point</span>
                  <span className="font-bold text-slate-800 text-right">{selectedDroppingPoint.name} ({selectedDroppingPoint.time})</span>
                </div>

                <div className="flex justify-between border-t border-slate-50 pt-3 text-sm font-black text-slate-800">
                  <span>Grand Total</span>
                  <span className="text-primary font-black">₹{selectedBus.price * passengersCount}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('points')}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs transition-all border border-slate-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  {loading ? 'Processing...' : 'Pay with Stripe'}
                  <ShieldCheck size={14} />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= STEP 6: E-TICKET & LIVE TRACKING ================= */}
      {step === 'ticket' && bookingConfirmation && (
        <div className="max-w-md mx-auto space-y-6 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0px_16px_40px_rgba(15,23,42,0.08)] text-center relative overflow-hidden">
            {/* Success Confetti Effect Placeholder */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle size={32} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900">Booking Confirmed!</h2>
            <p className="text-xs text-slate-400 mt-1">Your e-ticket is registered. Boarding starts at {bookingConfirmation.journey_details.boarding_point?.time}.</p>

            <div className="my-6 border-t border-b border-dashed border-slate-100 py-4 text-xs text-left space-y-3 font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Ticket ID</span>
                <span className="font-bold text-primary font-mono">{bookingConfirmation.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Operator</span>
                <span className="font-bold text-slate-800">{bookingConfirmation.journey_details.operator_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Seats</span>
                <span className="font-bold text-slate-800">{bookingConfirmation.passengers.map((p: any) => p.seat_number).join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Boarding</span>
                <span className="font-bold text-slate-800">{bookingConfirmation.journey_details.boarding_point?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Dropping</span>
                <span className="font-bold text-slate-800">{bookingConfirmation.journey_details.dropping_point?.name}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowLiveTracking(!showLiveTracking)}
                className="flex-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-sm"
              >
                {showLiveTracking ? 'Hide Live Map' : 'Track Bus Location'}
              </button>
              <a 
                href={`http://127.0.0.1:5002/api/v1/tickets/download/${bookingConfirmation._id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center transition-all"
                title="Download PDF E-Ticket"
              >
                <Download size={16} />
              </a>
            </div>
          </div>

          {/* Simulated Live Bus Map Widget */}
          {showLiveTracking && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-5 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] relative overflow-hidden h-64 animate-fade-in">
              <div className="absolute inset-0 bg-slate-50 flex flex-col justify-between p-5 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Live Tracking</span>
                    <h4 className="text-sm font-black text-slate-800 mt-1">{bookingConfirmation.journey_details.operator_name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Estimated Arrival</span>
                    <span className="text-xs font-black text-primary">35 mins</span>
                  </div>
                </div>

                <div className="text-center my-auto">
                  <MapPin size={24} className="text-primary animate-bounce mx-auto" />
                  <p className="text-xs font-bold text-slate-800 mt-1">GPS Connection Online</p>
                  <p className="text-[10px] text-slate-400">Near: Kolar Bypass (NH-75)</p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3">
                  <Clock size={12} />
                  <span>Last updated: Just now</span>
                </div>
              </div>
              {/* Decorative map grids */}
              <div className="absolute w-[200%] h-1 bg-slate-200/50 rotate-12 top-1/2 left-[-50%]" />
              <div className="absolute w-[200%] h-1 bg-slate-200/50 -rotate-45 top-1/3 left-[-50%]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
