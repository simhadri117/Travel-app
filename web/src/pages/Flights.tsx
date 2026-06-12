import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { createBooking } from '../services/firestore';
import {
  Plane, Calendar, Users, ArrowRight, ArrowLeftRight,
  ShieldCheck, CheckCircle, Download, ChevronDown, ChevronUp,
  Clock, Wifi, Zap, Star, Building, Train, Bus
} from 'lucide-react';

const AIRPORTS: Record<string, string> = {
  DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bengaluru', HYD: 'Hyderabad',
  MAA: 'Chennai', CCU: 'Kolkata', GOI: 'Goa', JAI: 'Jaipur', COK: 'Kochi',
};

const DEALS = [
  { fromCode: 'DEL', toCode: 'BOM', fromCity: 'Delhi', toCity: 'Mumbai', price: '₹3,499', airline: 'IndiGo', logo: '🛫', type: 'Non-stop' },
  { fromCode: 'DEL', toCode: 'GOI', fromCity: 'Delhi', toCity: 'Goa', price: '₹4,899', airline: 'Air India', logo: '🛫', type: 'Non-stop' },
  { fromCode: 'BOM', toCode: 'BLR', fromCity: 'Mumbai', toCity: 'Bengaluru', price: '₹2,999', airline: 'Akasa Air', logo: '🛫', type: 'Non-stop' },
];

export default function Flights() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [step, setStep] = useState<'search' | 'results' | 'seats' | 'addons' | 'checkout' | 'ticket'>('search');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');

  const [source, setSource] = useState('DEL');
  const [destination, setDestination] = useState('BOM');
  const [date, setDate] = useState('2026-06-15');
  const [cabin, setCabin] = useState('Economy');
  const [passengersCount, setPassengersCount] = useState(1);
  const [flightsList, setFlightsList] = useState<any[]>([]);

  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatDetailsMap, setSeatDetailsMap] = useState<any[]>([]);
  const [baggage, setBaggage] = useState(15);
  const [meal, setMeal] = useState('No Meal');
  const [insurance, setInsurance] = useState(false);
  const [passengersDetails, setPassengersDetails] = useState<any[]>([{ name: '', age: '', gender: 'Male', id_type: 'Aadhaar', id_number: '' }]);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStep('results');
    try {
      const res = await api.get('/flights/search', { params: { source, destination, date, cabin_class: cabin, passengers: passengersCount } });
      if (res.data.success) setFlightsList(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const triggerDealSearch = (fCode: string, tCode: string) => {
    setSource(fCode);
    setDestination(tCode);
    handleSearch();
  };

  const handleSelectFlight = async (flight: any) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Book Your Flight',
        subtitle: 'Sign in to select seats, customize your flight, and complete your booking.',
        onSuccess: () => {
          handleSelectFlight(flight);
        }
      });
      return;
    }
    setSelectedFlight(flight);
    setStep('seats');
    try {
      const res = await api.get('/flights/seats', { params: { flight_id: flight.flight_id } });
      if (res.data.success) setSeatDetailsMap(res.data.data);
    } catch {}
  };

  const handleSeatClick = (seatNo: string, status: string) => {
    if (status === 'occupied') return;
    if (selectedSeats.includes(seatNo)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNo));
    } else if (selectedSeats.length < passengersCount) {
      setSelectedSeats([...selectedSeats, seatNo]);
    } else {
      alert(`Select up to ${passengersCount} seat(s)`);
    }
  };

  const calculateTotal = () => {
    if (!selectedFlight) return 0;
    let base = selectedFlight.price_per_adult * passengersCount;
    selectedSeats.forEach(s => {
      const obj = seatDetailsMap.find(i => i.seat_number === s);
      if (obj) base += obj.extra_cost;
    });
    if (baggage === 20) base += 800;
    if (baggage === 25) base += 1500;
    if (meal !== 'No Meal') base += 350;
    if (insurance) base += 299 * passengersCount;
    return base;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal();
    try {
      const resIntent = await api.post('/payment/stripe-intent', { amount: totalAmount });
      if (resIntent.data.success) {
        const intentData = resIntent.data.data;
        const resBook = await api.post('/flights/book', {
          flight_details: { ...selectedFlight, date },
          passengers: passengersDetails,
          seats: selectedSeats,
          amount_paid: totalAmount,
          payment_id: intentData.client_secret || `pay_stripe_${Math.random().toString(36).substring(2, 10)}`
        });
        if (resBook.data.success) {
          // Sync flight booking to Firestore
          try {
            await createBooking({
              booking_type: 'flight',
              booking_reference: resBook.data.data.booking_reference,
              amount_paid: resBook.data.data.amount_paid || totalAmount,
              journey_details: resBook.data.data.journey_details || { ...selectedFlight, date },
              status: 'confirmed'
            });
          } catch (fsErr) {
            console.error('[Firestore Flight Booking Sync Failed]:', fsErr);
          }

          setBookingConfirmation(resBook.data.data);
          setStep('ticket');
        }
      }
    } catch {}
  };

  const swap = () => { const t = source; setSource(destination); setDestination(t); };

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
          <Plane size={28} className="text-primary" /> Booking Hub
        </h1>
        <p className="text-slate-400 text-xs mt-1">AI-powered travel booking with standard APIs</p>
      </div>

      {/* ── STEP 1: SEARCH ─── */}
      {step === 'search' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Search Panel */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] p-5">
            {/* Header Tabs */}
            {renderBookingHubHeader('flights')}

            {/* Trip type toggle */}
            <div className="flex gap-1.5 mb-4">
              {(['oneway', 'roundtrip'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    tripType === t 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t === 'oneway' ? 'One Way' : 'Round Trip'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              {/* Route row */}
              <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center">
                {/* From Box */}
                <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
                  <Plane size={16} className="text-slate-400 group-hover:text-primary transition-colors rotate-45" />
                  <div className="flex flex-col flex-grow text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                    <select 
                      value={source} 
                      onChange={e => setSource(e.target.value)} 
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                    >
                      {Object.entries(AIRPORTS).map(([code, city]) => (
                        <option key={code} value={code}>{city} ({code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swap button */}
                <div className="md:col-span-1 flex justify-center">
                  <button 
                    type="button" 
                    onClick={swap}
                    className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-all text-slate-500 active:scale-90"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                </div>

                {/* To Box */}
                <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group cursor-pointer">
                  <Plane size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex flex-col flex-grow text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                    <select 
                      value={destination} 
                      onChange={e => setDestination(e.target.value)} 
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                    >
                      {Object.entries(AIRPORTS).map(([code, city]) => (
                        <option key={code} value={code}>{city} ({code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date, Class, Pax row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Date */}
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                  <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex flex-col flex-grow text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-850 w-full cursor-pointer"
                      required 
                    />
                  </div>
                </div>

                {/* Cabin */}
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                  <Star size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex flex-col flex-grow text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cabin Class</span>
                    <select 
                      value={cabin} 
                      onChange={e => setCabin(e.target.value)} 
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                    >
                      <option>Economy</option>
                      <option>Business</option>
                      <option>First</option>
                    </select>
                  </div>
                </div>

                {/* Travelers */}
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                  <Users size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <div className="flex flex-col flex-grow text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Travelers</span>
                    <input 
                      type="number" 
                      min={1} 
                      max={9} 
                      value={passengersCount}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setPassengersCount(val);
                        setPassengersDetails(Array.from({ length: val }, (_, i) => passengersDetails[i] || { name: '', age: '', gender: 'Male', id_type: 'Aadhaar', id_number: '' }));
                      }}
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit" 
                className="w-full h-12 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <Plane size={16} /> Search Flights
              </button>
            </form>
          </div>

          {/* Trending Deals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Trending Flight Deals</h3>
            <div className="grid grid-cols-1 gap-2">
              {DEALS.map((deal, idx) => (
                <div 
                  key={idx}
                  onClick={() => triggerDealSearch(deal.fromCode, deal.toCode)}
                  className="group flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-primary/25 hover:shadow-card transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-lg">
                      {deal.logo}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{deal.fromCity} ({deal.fromCode}) → {deal.toCity} ({deal.toCode})</h4>
                      <p className="text-[10px] text-slate-500">{deal.airline} • {deal.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block leading-none">from</span>
                      <span className="text-xs font-extrabold text-primary">{deal.price}</span>
                    </div>
                    <button className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold group-hover:bg-primary group-hover:text-white transition-all">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: RESULTS ─── */}
      {step === 'results' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <p className="text-xs font-extrabold text-slate-900">{AIRPORTS[source]} → {AIRPORTS[destination]}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{date} · {passengersCount} passenger(s) · {cabin}</p>
            </div>
            <button onClick={() => setStep('search')} className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 transition-all">
              Modify
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : flightsList.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100">
              <Plane size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-medium">No flights found. Try different dates or cities.</p>
              <button onClick={() => setStep('search')} className="btn btn-sm btn-primary mt-4 font-bold">Modify Search</button>
            </div>
          ) : (
            flightsList.map(flight => (
              <div key={flight.flight_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-card transition-all overflow-hidden group">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Airline details */}
                  <div className="flex items-center gap-3 sm:w-1/4">
                    <img 
                      src={flight.airline_logo} 
                      alt={flight.airline_name} 
                      className="w-10 h-10 rounded-xl object-cover bg-slate-50 flex-shrink-0" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{flight.airline_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{flight.flight_number}</p>
                    </div>
                  </div>

                  {/* Flight Schedule Timeline */}
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="text-left">
                      <p className="text-sm font-extrabold text-slate-900">{flight.departure_time}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{flight.source}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 font-semibold">{flight.duration}</span>
                      <div className="w-full flex items-center gap-1.5 my-1">
                        <div className="flex-1 h-[2px] bg-slate-100" />
                        <Plane size={11} className="text-slate-300 group-hover:text-primary transition-colors rotate-45" />
                        <div className="flex-1 h-[2px] bg-slate-100" />
                      </div>
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">{flight.stops}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900">{flight.arrival_time}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{flight.destination}</p>
                    </div>
                  </div>

                  {/* Fare & Select */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] text-slate-400 block">from</span>
                      <span className="text-sm font-extrabold text-primary">₹{flight.price_per_adult?.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block leading-none">per adult</span>
                    </div>
                    <button 
                      onClick={() => handleSelectFlight(flight)} 
                      className="px-4 py-2 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── STEP 3: SEAT MAP ─── */}
      {step === 'seats' && selectedFlight && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 max-w-md mx-auto space-y-5 animate-slide-up">
          <div className="text-center pb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Choose Seats</h2>
            <p className="text-xs text-slate-400 mt-1">Select {passengersCount} seat(s) · {selectedFlight.airline_name} {selectedFlight.flight_number}</p>
          </div>

          {/* Seat Grid Frame */}
          <div className="max-w-xs mx-auto border border-slate-150 rounded-2xl p-4 bg-slate-50 max-h-72 overflow-y-auto custom-scrollbar">
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mb-3">🚀 Front of Cabin</p>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
              <span className="text-slate-400 font-bold text-[8px]">Row</span>
              <span className="text-slate-400 font-bold text-[8px]">A</span>
              <span className="text-slate-400 font-bold text-[8px]">B</span>
              <span className="text-slate-400 font-bold text-[8px]">C</span>
              <span />
              <span className="text-slate-400 font-bold text-[8px]">D</span>
              <span className="text-slate-400 font-bold text-[8px]">E</span>

              {Array.from({ length: 15 }).map((_, rIdx) => {
                const r = rIdx + 1;
                return (
                  <React.Fragment key={r}>
                    <span className="text-slate-300 font-bold text-[8px] self-center">{r}</span>
                    {['A','B','C'].map(c => {
                      const sNo = `${r}${c}`;
                      const obj = seatDetailsMap.find(i => i.seat_number === sNo) || { status: 'occupied', extra_cost: 0 };
                      const sel = selectedSeats.includes(sNo);
                      let cls = 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300';
                      if (obj.status === 'occupied') cls = 'bg-slate-200 border border-slate-200 text-slate-400 cursor-not-allowed';
                      if (sel) cls = 'bg-primary border border-primary text-white';
                      if (obj.extra_cost > 0 && obj.status !== 'occupied' && !sel) cls = 'bg-amber-50 border border-amber-250 text-amber-700 font-bold';
                      return (
                        <button 
                          key={c} 
                          type="button" 
                          disabled={obj.status === 'occupied'}
                          onClick={() => handleSeatClick(sNo, obj.status)}
                          className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all duration-150 flex items-center justify-center ${cls}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                    <span />
                    {['D','E'].map(c => {
                      const sNo = `${r}${c}`;
                      const obj = seatDetailsMap.find(i => i.seat_number === sNo) || { status: 'occupied', extra_cost: 0 };
                      const sel = selectedSeats.includes(sNo);
                      let cls = 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300';
                      if (obj.status === 'occupied') cls = 'bg-slate-200 border border-slate-200 text-slate-400 cursor-not-allowed';
                      if (sel) cls = 'bg-primary border border-primary text-white';
                      return (
                        <button 
                          key={c} 
                          type="button" 
                          disabled={obj.status === 'occupied'}
                          onClick={() => handleSeatClick(sNo, obj.status)}
                          className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all duration-150 flex items-center justify-center ${cls}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center text-[10px] text-slate-500 pt-2 border-t border-slate-50">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white border border-slate-200" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-250" /> Extra Legroom</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary" /> Selected</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200" /> Occupied</span>
          </div>

          <button 
            onClick={() => setStep('addons')} 
            disabled={selectedSeats.length !== passengersCount}
            className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 transition-all"
          >
            Confirm Seats ({selectedSeats.join(', ') || 'None'}) <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── STEP 4: ADD-ONS ─── */}
      {step === 'addons' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 max-w-md mx-auto space-y-5 animate-slide-up">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-center">Customize Your Flight</h2>

          {/* Baggage */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked Baggage</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { kg: 15, label: '15 kg', sub: 'Free', extra: 0 }, 
                { kg: 20, label: '20 kg', sub: '+₹800', extra: 800 }, 
                { kg: 25, label: '25 kg', sub: '+₹1,500', extra: 1500 }
              ].map(opt => (
                <button 
                  key={opt.kg} 
                  type="button" 
                  onClick={() => setBaggage(opt.kg)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    baggage === opt.kg 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className="font-extrabold text-xs text-slate-900">{opt.label}</p>
                  <p className={`text-[10px] mt-0.5 font-semibold ${opt.extra === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Meal */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In-Flight Meal</label>
            <select 
              value={meal} 
              onChange={e => setMeal(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="No Meal">No Meal (Free)</option>
              <option value="Veg Meal">Vegetarian (+₹350)</option>
              <option value="Non-Veg Meal">Non-Vegetarian (+₹350)</option>
              <option value="Jain Meal">Jain Meal (+₹350)</option>
            </select>
          </div>

          {/* Insurance */}
          <label className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between cursor-pointer border border-slate-100 hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Travel Protection</p>
                <p className="text-[9px] text-slate-500">Covers delays, loss & medical services</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-emerald-600">₹299/pax</span>
              <input 
                type="checkbox" 
                checked={insurance} 
                onChange={e => setInsurance(e.target.checked)} 
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer" 
              />
            </div>
          </label>

          <div className="bg-slate-50 rounded-xl p-3.5 flex justify-between items-center border border-slate-100 text-xs font-bold text-slate-700">
            <span>Estimated Total:</span>
            <span className="text-sm font-extrabold text-primary">₹{calculateTotal().toLocaleString('en-IN')}</span>
          </div>

          <button 
            onClick={() => setStep('checkout')} 
            className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
          >
            Review & Pay <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── STEP 5: CHECKOUT ─── */}
      {step === 'checkout' && selectedFlight && (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Passenger details */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-50">Passenger Details</h3>
            {passengersDetails.map((pax, idx) => (
              <div key={idx} className="space-y-3 pt-3 border-t border-slate-100 first:border-0 first:pt-0">
                <span className="inline-block bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Passenger #{idx + 1}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input 
                    type="text" 
                    placeholder="Full Name (as per ID)" 
                    value={pax.name}
                    onChange={e => { const c = [...passengersDetails]; c[idx].name = e.target.value; setPassengersDetails(c); }}
                    className="input-field" 
                    required 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      placeholder="Age" 
                      value={pax.age}
                      onChange={e => { const c = [...passengersDetails]; c[idx].age = e.target.value; setPassengersDetails(c); }}
                      className="input-field" 
                      required 
                    />
                    <select 
                      value={pax.gender} 
                      onChange={e => { const c = [...passengersDetails]; c[idx].gender = e.target.value; setPassengersDetails(c); }} 
                      className="select-field"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <select 
                    value={pax.id_type} 
                    onChange={e => { const c = [...passengersDetails]; c[idx].id_type = e.target.value; setPassengersDetails(c); }} 
                    className="select-field"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="ID Number" 
                    value={pax.id_number}
                    onChange={e => { const c = [...passengersDetails]; c[idx].id_number = e.target.value; setPassengersDetails(c); }}
                    className="input-field font-semibold" 
                    required 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Fare Summary */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm h-fit space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-50">Fare Summary</h3>
            <div className="space-y-2.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Base fare ({passengersCount} pax)</span>
                <span className="font-bold text-slate-800">₹{(selectedFlight.price_per_adult * passengersCount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Seats ({selectedSeats.join(', ')})</span>
                <span className="font-bold text-slate-800">₹{selectedSeats.reduce((a, s) => a + (seatDetailsMap.find(i => i.seat_number === s)?.extra_cost || 0), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Baggage ({baggage} kg)</span>
                <span className="font-bold text-slate-800">₹{(baggage === 15 ? 0 : baggage === 20 ? 800 : 1500).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Meal ({meal})</span>
                <span className="font-bold text-slate-800">₹{(meal === 'No Meal' ? 0 : 350).toLocaleString('en-IN')}</span>
              </div>
              {insurance && (
                <div className="flex justify-between">
                  <span>Insurance</span>
                  <span className="font-bold text-slate-800">₹{(299 * passengersCount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-primary text-base">₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all"
            >
              Pay Securely
            </button>
            <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 font-semibold leading-none">
              <ShieldCheck size={14} className="text-emerald-500" /> Secure 256-bit payment gateway
            </p>
          </div>
        </form>
      )}

      {/* ── STEP 6: E-TICKET ─── */}
      {step === 'ticket' && bookingConfirmation && (
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] text-center space-y-5 animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={32} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Booking Confirmed!</h2>
            <p className="text-slate-500 text-xs mt-1">Your e-ticket has been generated successfully.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs font-mono border border-slate-100 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold font-sans">PNR / Reference</span>
              <span className="font-extrabold text-primary">{bookingConfirmation.booking_reference}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
              <span className="text-slate-400 font-semibold font-sans">Flight</span>
              <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details?.airline_name} {bookingConfirmation.journey_details?.flight_number}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
              <span className="text-slate-400 font-semibold font-sans">Route</span>
              <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details?.source} → {bookingConfirmation.journey_details?.destination}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
              <span className="text-slate-400 font-semibold font-sans">Date</span>
              <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details?.date}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
              <span className="text-slate-400 font-semibold font-sans">Seats Assigned</span>
              <span className="text-slate-900 font-bold">{bookingConfirmation.passengers?.map((p: any) => p.seat_number).join(', ')}</span>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <a 
              href={`http://127.0.0.1:5002/api/v1/tickets/download/${bookingConfirmation._id}`}
              target="_blank" 
              rel="noreferrer"
              className="flex-grow h-10 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <Download size={13} /> Download Ticket
            </a>
            <button 
              onClick={() => navigate('/trips')} 
              className="flex-grow h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all"
            >
              View My Trips
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
