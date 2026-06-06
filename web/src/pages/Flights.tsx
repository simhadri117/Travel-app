import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import {
  Plane, Calendar, Users, ArrowRight, ArrowLeftRight,
  ShieldCheck, CheckCircle, Download, ChevronDown, ChevronUp,
  Clock, Wifi, Zap, Star
} from 'lucide-react';

const AIRPORTS: Record<string, string> = {
  DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bengaluru', HYD: 'Hyderabad',
  MAA: 'Chennai', CCU: 'Kolkata', GOI: 'Goa', JAI: 'Jaipur', COK: 'Kochi',
};

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('results');
    try {
      const res = await api.get('/flights/search', { params: { source, destination, date, cabin_class: cabin, passengers: passengersCount } });
      if (res.data.success) setFlightsList(res.data.data);
    } catch {} finally { setLoading(false); }
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
        if (resBook.data.success) { setBookingConfirmation(resBook.data.data); setStep('ticket'); }
      }
    } catch {}
  };

  const swap = () => { const t = source; setSource(destination); setDestination(t); };

  return (
    <div className="page-container">
      <div>
        <h1 className="page-title flex items-center gap-2"><Plane size={22} className="text-brand-600" /> Flights</h1>
        <p className="text-slate-400 text-sm mt-1">Search and book domestic & international flights</p>
      </div>

      {/* ── STEP 1: SEARCH ─── */}
      {step === 'search' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          {/* Trip type tabs */}
          <div className="flex gap-2">
            {(['oneway', 'roundtrip'] as const).map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className={`btn btn-sm ${tripType === t ? 'btn-primary' : 'btn-outline'}`}>
                {t === 'oneway' ? 'One Way' : 'Round Trip'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="space-y-5">
            {/* From / To */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="label">From</label>
                <div className="relative">
                  <Plane size={14} className="absolute left-4 top-3.5 text-slate-400 rotate-45" />
                  <select value={source} onChange={e => setSource(e.target.value)} className="select-field pl-9">
                    {Object.entries(AIRPORTS).map(([code, city]) => (
                      <option key={code} value={code}>{city} ({code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" onClick={swap}
                className="btn btn-sm btn-ghost w-10 h-10 p-0 rounded-2xl mb-1 border border-slate-200 flex-shrink-0">
                <ArrowLeftRight size={16} />
              </button>

              <div className="flex-1 space-y-1.5">
                <label className="label">To</label>
                <div className="relative">
                  <Plane size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <select value={destination} onChange={e => setDestination(e.target.value)} className="select-field pl-9">
                    {Object.entries(AIRPORTS).map(([code, city]) => (
                      <option key={code} value={code}>{city} ({code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date / Class / Pax */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="label">Departure Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label">Cabin Class</label>
                <select value={cabin} onChange={e => setCabin(e.target.value)} className="select-field">
                  <option>Economy</option><option>Business</option><option>First</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="label">Passengers</label>
                <div className="relative">
                  <Users size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input type="number" min={1} max={9} value={passengersCount}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setPassengersCount(val);
                      setPassengersDetails(Array.from({ length: val }, (_, i) => passengersDetails[i] || { name: '', age: '', gender: 'Male', id_type: 'Aadhaar', id_number: '' }));
                    }}
                    className="input-field pl-9" required />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-lg btn-primary w-full">
              <Plane size={16} /> Search Flights
            </button>
          </form>
        </div>
      )}

      {/* ── STEP 2: RESULTS ─── */}
      {step === 'results' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{AIRPORTS[source]} → {AIRPORTS[destination]}</p>
              <p className="text-xs text-slate-400">{date} · {passengersCount} passenger(s) · {cabin}</p>
            </div>
            <button onClick={() => setStep('search')} className="btn btn-sm btn-outline">Modify</button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 skeleton" />)}
            </div>
          ) : flightsList.length === 0 ? (
            <div className="card p-12 text-center">
              <Plane size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No flights found. Try different dates.</p>
              <button onClick={() => setStep('search')} className="btn btn-md btn-primary mt-4">Modify Search</button>
            </div>
          ) : (
            flightsList.map(flight => (
              <div key={flight.flight_id} className="card overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Airline */}
                  <div className="flex items-center gap-3 min-w-0 sm:w-40">
                    <img src={flight.airline_logo} alt={flight.airline_name} className="w-10 h-10 rounded-2xl object-cover bg-slate-100 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{flight.airline_name}</p>
                      <p className="text-xs text-slate-400">{flight.flight_number}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{flight.departure_time}</p>
                      <p className="text-xs text-slate-400">{flight.source}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] text-slate-400 font-medium">{flight.duration}</p>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="flex-1 h-px bg-slate-200" />
                        <Plane size={12} className="text-brand-400" />
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold">{flight.stops}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{flight.arrival_time}</p>
                      <p className="text-xs text-slate-400">{flight.destination}</p>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div>
                      <p className="text-xs text-slate-400">from</p>
                      <p className="text-xl font-bold text-brand-600">₹{flight.price_per_adult}</p>
                      <p className="text-[10px] text-slate-400">per adult</p>
                    </div>
                    <button onClick={() => handleSelectFlight(flight)} className="btn btn-md btn-primary flex-shrink-0">
                      Select <ArrowRight size={14} />
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
        <div className="card p-6 space-y-6 animate-slide-up">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">Choose Your Seats</h2>
            <p className="text-sm text-slate-400 mt-0.5">Select {passengersCount} seat(s) · {selectedFlight.airline_name} {selectedFlight.flight_number}</p>
          </div>

          {/* Seat grid */}
          <div className="max-w-xs mx-auto border border-slate-100 rounded-3xl p-4 bg-slate-50 max-h-72 overflow-y-auto">
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-3">🚀 Front of Plane</p>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
              <span className="text-slate-400 font-bold text-[9px]">Row</span>
              <span className="text-slate-400 font-bold text-[9px]">A</span>
              <span className="text-slate-400 font-bold text-[9px]">B</span>
              <span className="text-slate-400 font-bold text-[9px]">C</span>
              <span />
              <span className="text-slate-400 font-bold text-[9px]">D</span>
              <span className="text-slate-400 font-bold text-[9px]">E</span>

              {Array.from({ length: 15 }).map((_, rIdx) => {
                const r = rIdx + 1;
                return (
                  <React.Fragment key={r}>
                    <span className="text-slate-300 font-bold text-[9px] self-center">{r}</span>
                    {['A','B','C'].map(c => {
                      const sNo = `${r}${c}`;
                      const obj = seatDetailsMap.find(i => i.seat_number === sNo) || { status: 'occupied', extra_cost: 0 };
                      const sel = selectedSeats.includes(sNo);
                      let cls = 'bg-emerald-50 border border-emerald-200 text-emerald-700';
                      if (obj.status === 'occupied') cls = 'bg-slate-200 border border-slate-200 text-slate-400 cursor-not-allowed';
                      if (sel) cls = 'bg-brand-600 border border-brand-600 text-white';
                      if (obj.extra_cost > 0 && obj.status !== 'occupied' && !sel) cls = 'bg-amber-50 border border-amber-200 text-amber-700';
                      return (
                        <button key={c} type="button" disabled={obj.status === 'occupied'}
                          onClick={() => handleSeatClick(sNo, obj.status)}
                          className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all duration-150 ${cls}`}>
                          {c}
                        </button>
                      );
                    })}
                    <span />
                    {['D','E','F'].slice(0,2).map(c => {
                      const sNo = `${r}${c}`;
                      const obj = seatDetailsMap.find(i => i.seat_number === sNo) || { status: 'occupied', extra_cost: 0 };
                      const sel = selectedSeats.includes(sNo);
                      let cls = 'bg-emerald-50 border border-emerald-200 text-emerald-700';
                      if (obj.status === 'occupied') cls = 'bg-slate-200 border border-slate-200 text-slate-400 cursor-not-allowed';
                      if (sel) cls = 'bg-brand-600 border border-brand-600 text-white';
                      return (
                        <button key={c} type="button" disabled={obj.status === 'occupied'}
                          onClick={() => handleSeatClick(sNo, obj.status)}
                          className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all duration-150 ${cls}`}>
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
          <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" /> Extra Legroom</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-600" /> Selected</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" /> Occupied</span>
          </div>

          <button onClick={() => setStep('addons')} disabled={selectedSeats.length !== passengersCount}
            className="btn btn-lg btn-primary w-full disabled:opacity-50">
            Confirm Seats — {selectedSeats.join(', ')} <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 4: ADD-ONS ─── */}
      {step === 'addons' && (
        <div className="card p-6 space-y-5 animate-slide-up">
          <h2 className="text-lg font-bold text-slate-900">Customize Your Flight</h2>

          {/* Baggage */}
          <div>
            <label className="label mb-3">Checked Baggage</label>
            <div className="grid grid-cols-3 gap-3">
              {[{ kg: 15, label: '15 kg', sub: 'Included', extra: 0 }, { kg: 20, label: '20 kg', sub: '+₹800', extra: 800 }, { kg: 25, label: '25 kg', sub: '+₹1,500', extra: 1500 }].map(opt => (
                <button key={opt.kg} type="button" onClick={() => setBaggage(opt.kg)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${baggage === opt.kg ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${opt.extra === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Meal */}
          <div>
            <label className="label">In-Flight Meal</label>
            <select value={meal} onChange={e => setMeal(e.target.value)} className="select-field">
              <option value="No Meal">No Meal (Free)</option>
              <option value="Veg Meal">Vegetarian (+₹350)</option>
              <option value="Non-Veg Meal">Non-Vegetarian (+₹350)</option>
              <option value="Jain Meal">Jain Meal (+₹350)</option>
            </select>
          </div>

          {/* Insurance */}
          <label className="card p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Travel Protection</p>
                <p className="text-xs text-slate-400">Covers delays, medical & baggage loss</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-600">₹299/pax</span>
              <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} className="w-4 h-4" />
            </div>
          </label>

          <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Estimated Total</span>
            <span className="text-xl font-bold text-brand-600">₹{calculateTotal().toLocaleString('en-IN')}</span>
          </div>

          <button onClick={() => setStep('checkout')} className="btn btn-lg btn-primary w-full">
            Review & Pay <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 5: CHECKOUT ─── */}
      {step === 'checkout' && selectedFlight && (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Passenger forms */}
          <div className="lg:col-span-2 card p-6 space-y-5">
            <h3 className="font-bold text-slate-900">Passenger Details</h3>
            {passengersDetails.map((pax, idx) => (
              <div key={idx} className="space-y-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                <p className="badge badge-blue">Passenger #{idx + 1}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name (as per ID)" value={pax.name}
                    onChange={e => { const c = [...passengersDetails]; c[idx].name = e.target.value; setPassengersDetails(c); }}
                    className="input-field" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Age" value={pax.age}
                      onChange={e => { const c = [...passengersDetails]; c[idx].age = e.target.value; setPassengersDetails(c); }}
                      className="input-field" required />
                    <select value={pax.gender} onChange={e => { const c = [...passengersDetails]; c[idx].gender = e.target.value; setPassengersDetails(c); }} className="select-field">
                      <option>Male</option><option>Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={pax.id_type} onChange={e => { const c = [...passengersDetails]; c[idx].id_type = e.target.value; setPassengersDetails(c); }} className="select-field">
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                  <input type="text" placeholder="ID Number" value={pax.id_number}
                    onChange={e => { const c = [...passengersDetails]; c[idx].id_number = e.target.value; setPassengersDetails(c); }}
                    className="input-field" required />
                </div>
              </div>
            ))}
          </div>

          {/* Fare summary */}
          <div className="card p-6 space-y-4 h-fit sticky top-24">
            <h3 className="font-bold text-slate-900 pb-3 border-b border-slate-100">Fare Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Base fare ({passengersCount} pax)</span>
                <span className="text-slate-900">₹{selectedFlight.price_per_adult * passengersCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Seats ({selectedSeats.join(', ')})</span>
                <span className="text-slate-900">₹{selectedSeats.reduce((a, s) => a + (seatDetailsMap.find(i => i.seat_number === s)?.extra_cost || 0), 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Baggage ({baggage} kg)</span>
                <span className="text-slate-900">₹{baggage === 15 ? 0 : baggage === 20 ? 800 : 1500}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Meal</span>
                <span className="text-slate-900">₹{meal === 'No Meal' ? 0 : 350}</span>
              </div>
              {insurance && (
                <div className="flex justify-between text-slate-500">
                  <span>Insurance</span>
                  <span className="text-slate-900">₹{299 * passengersCount}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-slate-900">
                <span>Total</span>
                <span className="text-brand-600 text-lg">₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button type="submit" className="btn btn-lg btn-primary w-full">Pay Securely</button>
            <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> 256-bit SSL secured payment
            </p>
          </div>
        </form>
      )}

      {/* ── STEP 6: E-TICKET ─── */}
      {step === 'ticket' && bookingConfirmation && (
        <div className="max-w-lg mx-auto card p-8 text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle size={40} strokeWidth={1.5} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h2>
            <p className="text-slate-400 text-sm mt-1">Your e-ticket has been generated successfully.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-2 text-sm font-mono border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">PNR</span>
              <span className="font-bold text-brand-600">{bookingConfirmation.booking_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Flight</span>
              <span className="text-slate-900">{bookingConfirmation.journey_details?.airline_name} {bookingConfirmation.journey_details?.flight_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Route</span>
              <span className="text-slate-900">{bookingConfirmation.journey_details?.source} → {bookingConfirmation.journey_details?.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="text-slate-900">{bookingConfirmation.journey_details?.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seats</span>
              <span className="text-slate-900">{bookingConfirmation.passengers?.map((p: any) => p.seat_number).join(', ')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`http://127.0.0.1:5001/api/v1/tickets/download/${bookingConfirmation._id}`}
              target="_blank" rel="noreferrer"
              className="btn btn-md btn-primary flex-1">
              <Download size={14} /> Download PDF
            </a>
            <button onClick={() => navigate('/trips')} className="btn btn-md btn-outline flex-1">
              View Trips
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
