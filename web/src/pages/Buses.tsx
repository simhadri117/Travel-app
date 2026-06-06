import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { 
  Bus, Calendar, Users, Star, MapPin, 
  CheckCircle, ArrowRight, Shield, RefreshCw, Download
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

  // 1. Search Buses
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setBookingConfirmation(resBook.data.data);
          setStep('ticket');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-container">
      
      {/* Title banner */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bus className="text-brand-600" size={28} /> Bus Booking Station
        </h1>
        <p className="text-sm text-slate-500">Search routes and reserve intercity luxury sleeper seats</p>
      </div>

      {/* ================= STEP 1: SEARCH SCREEN ================= */}
      {step === 'search' && (
        <form onSubmit={handleSearch} className="card p-6 space-y-6 border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label text-slate-700">From City</label>
              <input
                type="text"
                placeholder="Bangalore"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label text-slate-700">To City</label>
              <input
                type="text"
                placeholder="Chennai"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label text-slate-700">Travel Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label text-slate-700">Passengers Count</label>
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
                className="input-field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-lg btn-primary w-full shadow-md font-extrabold"
          >
            Find Bus Operators
          </button>
        </form>
      )}

      {/* ================= STEP 2: SEARCH RESULTS ================= */}
      {step === 'results' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Buses on {date}</h3>
            <button onClick={() => setStep('search')} className="text-xs text-brand-600 font-bold hover:underline">Modify Search</button>
          </div>

          {busesList.map((bus) => (
            <div key={bus.bus_id} className="card p-5 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-all bg-white shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-800">{bus.operator_name}</h4>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star size={10} fill="currentColor" /> {bus.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{bus.bus_type}</p>
                <p className="text-[10px] text-slate-400">Amenities: {bus.amenities.join(' • ')}</p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-700">
                <div>
                  <p className="font-extrabold">{bus.departure_time}</p>
                  <p className="text-[10px] text-slate-400">{source}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">{bus.duration}</p>
                  <div className="w-12 h-[1px] bg-slate-200 my-0.5" />
                </div>
                <div>
                  <p className="font-extrabold">{bus.arrival_time}</p>
                  <p className="text-[10px] text-slate-400">{destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div>
                  <p className="text-[10px] text-emerald-600 font-semibold">{bus.available_seats_count} Seats left</p>
                  <p className="text-base font-black text-brand-600">₹{bus.price}</p>
                </div>
                <button
                  onClick={() => handleSelectBus(bus)}
                  className="btn btn-primary btn-md text-xs font-bold"
                >
                  Select Seat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= STEP 3: SEAT SELECTION ================= */}
      {step === 'seats' && selectedBus && (
        <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 font-sans">Select Seats</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">Please choose {passengersCount} seats from lower or upper decks</p>
          </div>

          {/* Deck Toggles */}
          {selectedBus.bus_type.toLowerCase().includes('sleeper') && (
            <div className="flex justify-center gap-3">
              <button 
                type="button" 
                onClick={() => setActiveDeck('Lower')}
                className={`py-1.5 px-4 text-xs font-bold rounded-full border ${activeDeck === 'Lower' ? 'bg-brand-600 text-white border-brand-600' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Lower Deck
              </button>
              <button 
                type="button" 
                onClick={() => setActiveDeck('Upper')}
                className={`py-1.5 px-4 text-xs font-bold rounded-full border ${activeDeck === 'Upper' ? 'bg-brand-600 text-white border-brand-600' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Upper Deck
              </button>
            </div>
          )}

          {/* Bus Seat Layout */}
          <div className="max-w-xs mx-auto border border-slate-200 rounded-2xl p-4 bg-slate-50 max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <span className="text-slate-400 font-bold self-center">Driver</span>
              <span /><span /><span />

              {seatMap.filter(s => s.deck === activeDeck).map((seat) => {
                const isSelected = selectedSeats.includes(seat.seat_number);
                
                let bgClass = 'bg-emerald-50 border-emerald-300 text-emerald-700';
                if (seat.status === 'occupied') bgClass = 'bg-slate-200 border-transparent text-slate-400 cursor-not-allowed';
                if (isSelected) bgClass = 'bg-brand-600 text-white border-brand-600';
                if (seat.gender_restriction === 'female') bgClass = 'bg-pink-50 border-pink-200 text-pink-600';

                return (
                  <button
                    key={seat.seat_number}
                    type="button"
                    disabled={seat.status === 'occupied'}
                    onClick={() => handleSeatClick(seat.seat_number, seat.status)}
                    className={`h-8 rounded border flex items-center justify-center font-bold text-[9px] ${bgClass}`}
                  >
                    {seat.seat_number.split('-')[1]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-50 border border-pink-200" /> Ladies Only</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-600" /> Selected</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" /> Occupied</span>
          </div>

          <button
            onClick={() => setStep('points')}
            disabled={selectedSeats.length !== passengersCount}
            className="btn btn-lg btn-primary w-full disabled:opacity-50 transition-all font-extrabold"
          >
            Confirm Seats & Select Boarding Point
          </button>
        </div>
      )}

      {/* ================= STEP 4: BOARDING AND DROPPING SELECT ================= */}
      {step === 'points' && selectedBus && (
        <form onSubmit={handleSelectPoints} className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-center text-slate-800">Boarding & Dropping Locations</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="label text-slate-700 block">Select Boarding Point ({source})</label>
              <div className="space-y-3">
                {selectedBus.boarding_points.map((p: any) => (
                  <label 
                    key={p.name} 
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${selectedBoardingPoint?.name === p.name ? 'bg-brand-50 border-brand-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'}`}
                  >
                    <input 
                      type="radio" 
                      name="boarding" 
                      onChange={() => setSelectedBoardingPoint(p)}
                      className="mt-1 accent-brand-600" 
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">{p.name} — {p.time}</p>
                      <p className="text-slate-500 mt-0.5">{p.address}</p>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">Landmark: {p.landmark}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="label text-slate-700 block">Select Dropping Point ({destination})</label>
              <div className="space-y-3">
                {selectedBus.dropping_points.map((p: any) => (
                  <label 
                    key={p.name} 
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${selectedDroppingPoint?.name === p.name ? 'bg-brand-50 border-brand-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'}`}
                  >
                    <input 
                      type="radio" 
                      name="dropping" 
                      onChange={() => setSelectedDroppingPoint(p)}
                      className="mt-1 accent-brand-600" 
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">{p.name} — {p.time}</p>
                      <p className="text-slate-500 mt-0.5">{p.address}</p>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">Landmark: {p.landmark}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-lg btn-primary w-full font-extrabold"
          >
            Review Details
          </button>
        </form>
      )}

      {/* ================= STEP 5: REVIEW AND PAYMENTS ================= */}
      {step === 'checkout' && selectedBus && (
        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-800">Passenger Details</h3>
              {passengersDetails.map((details, idx) => (
                <div key={idx} className="space-y-4 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  <p className="text-xs font-bold text-brand-600">Passenger #{idx + 1} (Seat {selectedSeats[idx]})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Passenger Name"
                      value={details.name}
                      onChange={(e) => {
                        const copy = [...passengersDetails];
                        copy[idx].name = e.target.value;
                        setPassengersDetails(copy);
                      }}
                      className="input-field text-xs py-2"
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
                        className="input-field text-xs py-2"
                        required
                      />
                      <select
                        value={details.gender}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].gender = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="select-field text-xs py-2"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
              <h3 className="text-base font-bold pb-2 border-b border-slate-100 text-slate-800">Journey & Fare Summary</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <p><strong>Operator:</strong> {selectedBus.operator_name}</p>
                <p><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
                <p><strong>Boarding:</strong> {selectedBoardingPoint.name} ({selectedBoardingPoint.time})</p>
                <p><strong>Dropping:</strong> {selectedDroppingPoint.name} ({selectedDroppingPoint.time})</p>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-600 font-extrabold">₹{selectedBus.price * passengersCount}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-lg btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-md text-xs font-extrabold text-white"
              >
                Pay via Razorpay Sandbox
              </button>
            </div>
          </div>

        </form>
      )}

      {/* ================= STEP 6: E-TICKET & LIVE TRACKING ================= */}
      {step === 'ticket' && bookingConfirmation && (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="card p-8 bg-white border-2 border-emerald-500/20 shadow-lg space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={36} />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900">Bus Journey Registered!</h2>
            <p className="text-sm text-slate-500">Your e-ticket is confirmed. Boarding starts at {bookingConfirmation.journey_details.boarding_point?.time}.</p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2 font-mono text-slate-700">
              <p><strong>Ticket Reference:</strong> <span className="text-brand-600 font-bold">{bookingConfirmation.booking_reference}</span></p>
              <p><strong>Operator:</strong> {bookingConfirmation.journey_details.operator_name}</p>
              <p><strong>Seats:</strong> {bookingConfirmation.passengers.map((p: any) => p.seat_number).join(', ')}</p>
              <p><strong>Boarding Point:</strong> {bookingConfirmation.journey_details.boarding_point?.name}</p>
              <p><strong>Dropping Point:</strong> {bookingConfirmation.journey_details.dropping_point?.name}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowLiveTracking(!showLiveTracking)}
                className="btn btn-primary flex-1 py-3 text-xs font-bold"
              >
                {showLiveTracking ? 'Hide Live Map' : 'Track Bus Location'}
              </button>
              <a 
                href={`http://127.0.0.1:5001/api/v1/tickets/download/${bookingConfirmation._id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-outline btn-md px-4 flex items-center justify-center"
              >
                <Download size={14} />
              </a>
            </div>
          </div>

          {/* Simulated Live Bus Map */}
          {showLiveTracking && (
            <div className="card p-5 relative overflow-hidden h-64 border border-brand-500/20 bg-slate-50 shadow-sm">
              <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center p-4">
                <div className="text-center space-y-2 relative z-10">
                  <MapPin size={24} className="text-brand-600 animate-bounce mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Simulated GPS Live Tracking</p>
                  <p className="text-[10px] text-slate-500">Bus is currently near: <span className="text-slate-800 font-bold">Kolar Bypass (NH-75)</span></p>
                  <p className="text-[10px] text-brand-600 font-semibold">Estimated arrival in Majestic: 35 minutes</p>
                </div>
                {/* Decorative map lines */}
                <div className="absolute w-[200%] h-1 bg-slate-200 rotate-12 top-1/2 left-[-50%]" />
                <div className="absolute w-[200%] h-1 bg-slate-200 -rotate-45 top-1/3 left-[-50%]" />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
