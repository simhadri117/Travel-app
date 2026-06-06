import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { 
  Train, Calendar, Users, Briefcase, Search, 
  MapPin, CheckCircle, Clock, AlertTriangle, Download, Mic
} from 'lucide-react';

interface Station {
  code: string;
  name: string;
  city: string;
  popular?: boolean;
}

const STATIONS: Station[] = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi', popular: true },
  { code: 'DLI', name: 'Delhi Junction', city: 'Delhi' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', popular: true },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', popular: true },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad' },
  { code: 'KCG', name: 'Kacheguda', city: 'Hyderabad' },
  { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bangalore', popular: true },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bangalore' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', popular: true },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai' },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', popular: true },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', popular: true },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', popular: true },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', popular: true },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Goa', popular: true },
  { code: 'VSG', name: 'Vasco Da Gama', city: 'Goa' }
];

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Pune'];

const getStationName = (code: string) => {
  if (!code) return '';
  const st = STATIONS.find(s => s.code === code.toUpperCase());
  return st ? st.name : code;
};

export default function Trains() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  
  // Tab control: 'book' | 'pnr' | 'status'
  const [activeTab, setActiveTab] = useState<'book' | 'pnr' | 'status'>('book');
  const [step, setStep] = useState<'search' | 'results' | 'berths' | 'checkout' | 'ticket'>('search');

  // Search parameters
  const [source, setSource] = useState('NDLS');
  const [destination, setDestination] = useState('CSMT');
  const [sourceSearch, setSourceSearch] = useState('New Delhi Railway Station');
  const [destinationSearch, setDestinationSearch] = useState('Chhatrapati Shivaji Maharaj Terminus');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<'source' | 'destination' | null>(null);

  const getSuggestions = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIONS;
    return STATIONS.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  };

  const startVoiceSearch = (target: 'source' | 'destination') => {
    setListeningTarget(target);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        handleVoiceInput(target, speechResult);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      setIsListening(true);
      setTimeout(() => {
        const sampleQueries = ['Delhi', 'Mumbai', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Goa'];
        const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
        handleVoiceInput(target, randomQuery);
        setIsListening(false);
      }, 2000);
    }
  };

  const handleVoiceInput = (target: 'source' | 'destination', text: string) => {
    const matched = STATIONS.find(s => 
      s.name.toLowerCase().includes(text.toLowerCase()) || 
      s.city.toLowerCase().includes(text.toLowerCase()) ||
      s.code.toLowerCase() === text.toLowerCase()
    ) || STATIONS.find(s => s.city.toLowerCase() === 'delhi' && s.popular);
    
    if (matched) {
      if (target === 'source') {
        setSource(matched.code);
        setSourceSearch(matched.name);
      } else {
        setDestination(matched.code);
        setDestinationSearch(matched.name);
      }
    }
  };

  const handlePopularCityClick = (city: string) => {
    const popularStation = STATIONS.find(s => s.city.toLowerCase() === city.toLowerCase() && s.popular);
    if (!popularStation) return;
    
    if (activeInput === 'destination') {
      setDestination(popularStation.code);
      setDestinationSearch(popularStation.name);
      setShowDestinationDropdown(false);
    } else if (activeInput === 'source') {
      setSource(popularStation.code);
      setSourceSearch(popularStation.name);
      setShowSourceDropdown(false);
    } else {
      // Default auto-fill order
      if (!source || source === 'NDLS' && sourceSearch === 'New Delhi Railway Station') {
        setSource(popularStation.code);
        setSourceSearch(popularStation.name);
      } else {
        setDestination(popularStation.code);
        setDestinationSearch(popularStation.name);
      }
    }
  };

  const [date, setDate] = useState('2026-06-15');
  const [quota, setQuota] = useState('General');
  const [passengersCount, setPassengersCount] = useState(1);
  const [trainsList, setTrainsList] = useState<any[]>([]);

  // Selection states
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [berthPreference, setBerthPreference] = useState('Lower');
  const [passengersDetails, setPassengersDetails] = useState<any[]>([{ name: '', age: '', gender: 'Male', berth_preference: 'Lower' }]);

  // Result state
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  // PNR lookup state
  const [pnrQuery, setPnrQuery] = useState('');
  const [pnrResult, setPnrResult] = useState<any>(null);

  // Train Running Status lookup state
  const [trainNoQuery, setTrainNoQuery] = useState('');
  const [runningStatusResult, setRunningStatusResult] = useState<any>(null);

  // 1. Search Trains
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('results');
    try {
      const res = await api.get('/trains/search', {
        params: { source, destination, date, quota }
      });
      if (res.data.success) {
        setTrainsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Select Train & Class
  const handleSelectClass = (train: any, cls: any) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Book Your Train',
        subtitle: 'Sign in to configure passenger details, select berth preferences, and book your tickets.',
        onSuccess: () => {
          handleSelectClass(train, cls);
        }
      });
      return;
    }
    setSelectedTrain(train);
    setSelectedClass(cls);
    setStep('berths');
  };

  // 3. Finalize Checkout & Razorpay
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = selectedClass.price * passengersCount;

    try {
      const resIntent = await api.post('/payment/stripe-intent', { amount: totalPrice });
      if (resIntent.data.success) {
        const intentData = resIntent.data.data;
        const resBook = await api.post('/trains/book', {
          train_details: {
            ...selectedTrain,
            class_name: selectedClass.class_name,
            total_price: totalPrice,
            date
          },
          passengers: passengersDetails,
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

  // 4. PNR check
  const handleCheckPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrQuery) return;
    try {
      const res = await api.get(`/trains/pnr/${pnrQuery}`);
      if (res.data.success) {
        setPnrResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Running status check
  const handleCheckRunningStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainNoQuery) return;
    try {
      const res = await api.get(`/trains/running-status`, { params: { train_number: trainNoQuery } });
      if (res.data.success) {
        setRunningStatusResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button 
          onClick={() => { setActiveTab('book'); setStep('search'); }}
          className={`pb-2 text-sm font-bold transition-all ${activeTab === 'book' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Book Train Tickets
        </button>
        <button 
          onClick={() => setActiveTab('pnr')}
          className={`pb-2 text-sm font-bold transition-all ${activeTab === 'pnr' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          PNR Status Check
        </button>
        <button 
          onClick={() => setActiveTab('status')}
          className={`pb-2 text-sm font-bold transition-all ${activeTab === 'status' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Live Train Running Status
        </button>
      </div>

      {/* ================= TAB 1: BOOK TRAINS ================= */}
      {activeTab === 'book' && (
        <>
          {/* STEP 1: SEARCH SCREEN */}
          {step === 'search' && (
            <form onSubmit={handleSearch} className="card p-6 space-y-6 bg-white border-slate-100">
              {/* Voice search active banner */}
              {isListening && (
                <div className="flex items-center justify-center gap-2 p-3 bg-brand-50 text-brand-700 text-xs font-semibold rounded-2xl border border-brand-100 animate-pulse">
                  <div className="w-2.5 h-2.5 bg-brand-600 rounded-full animate-ping" />
                  Listening for voice input for {listeningTarget === 'source' ? 'From' : 'To'}... Speak city or station name.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FROM STATION AUTOCOMPLETE */}
                <div className="relative space-y-2">
                  <label className="label">From</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search from city or station..."
                      value={sourceSearch}
                      onChange={(e) => {
                        setSourceSearch(e.target.value);
                        setShowSourceDropdown(true);
                      }}
                      onFocus={() => {
                        setShowSourceDropdown(true);
                        setActiveInput('source');
                      }}
                      onBlur={() => setTimeout(() => setShowSourceDropdown(false), 250)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => startVoiceSearch('source')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-200/50 transition-colors ${
                        isListening && listeningTarget === 'source' ? 'text-red-500 animate-pulse bg-red-100' : 'text-slate-400'
                      }`}
                      title="Voice Search"
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                  
                  {showSourceDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {getSuggestions(sourceSearch).length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 text-center">No stations found</div>
                      ) : (
                        getSuggestions(sourceSearch).map((station) => (
                          <div
                            key={station.code}
                            onMouseDown={() => {
                              setSource(station.code);
                              setSourceSearch(station.name);
                              setShowSourceDropdown(false);
                            }}
                            className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <div className="text-brand-500 mt-0.5">
                              <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-bold text-slate-900 truncate">{station.name}</p>
                              <p className="text-xs text-slate-500">{station.city}</p>
                            </div>
                            <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                              {station.code}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* TO STATION AUTOCOMPLETE */}
                <div className="relative space-y-2">
                  <label className="label">To</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search destination city or station..."
                      value={destinationSearch}
                      onChange={(e) => {
                        setDestinationSearch(e.target.value);
                        setShowDestinationDropdown(true);
                      }}
                      onFocus={() => {
                        setShowDestinationDropdown(true);
                        setActiveInput('destination');
                      }}
                      onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 250)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => startVoiceSearch('destination')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-200/50 transition-colors ${
                        isListening && listeningTarget === 'destination' ? 'text-red-500 animate-pulse bg-red-100' : 'text-slate-400'
                      }`}
                      title="Voice Search"
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                  
                  {showDestinationDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {getSuggestions(destinationSearch).length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 text-center">No stations found</div>
                      ) : (
                        getSuggestions(destinationSearch).map((station) => (
                          <div
                            key={station.code}
                            onMouseDown={() => {
                              setDestination(station.code);
                              setDestinationSearch(station.name);
                              setShowDestinationDropdown(false);
                            }}
                            className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <div className="text-brand-500 mt-0.5">
                              <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-bold text-slate-900 truncate">{station.name}</p>
                              <p className="text-xs text-slate-500">{station.city}</p>
                            </div>
                            <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                              {station.code}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* POPULAR CITIES CHIPS */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Cities</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handlePopularCityClick(city)}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-full text-xs font-medium text-slate-700 hover:text-brand-600 transition-all active:scale-95 flex items-center gap-1"
                    >
                      📍 {city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="label">Date of Journey</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Quota Type</label>
                  <select
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none select-field"
                  >
                    <option value="General">General</option>
                    <option value="Ladies">Ladies Quota</option>
                    <option value="Tatkal">Tatkal</option>
                    <option value="Premium Tatkal">Premium Tatkal</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Passengers Count</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={passengersCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPassengersCount(val);
                      const arr = Array.from({ length: val }, (_, i) => passengersDetails[i] || { name: '', age: '', gender: 'Male', berth_preference: 'Lower' });
                      setPassengersDetails(arr);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-sm"
              >
                Find Available Trains
              </button>
            </form>
          )}

          {/* STEP 2: RESULTS */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Available Trains on {date}</h3>
                <button onClick={() => setStep('search')} className="text-xs text-brand-600 font-bold hover:underline">Modify Search</button>
              </div>

              {trainsList.map((train) => (
                <div key={train.train_id} className="card p-5 border border-slate-100 space-y-4 bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{train.train_name}</h4>
                      <p className="text-xs text-slate-500">Train #{train.train_number}</p>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-700">
                      <div>
                        <p className="font-extrabold text-slate-900">{train.departure_time}</p>
                        <p className="text-[10px] text-slate-700 font-semibold">{getStationName(train.source)}</p>
                        <p className="text-[9px] text-slate-400">({train.source})</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">{train.duration}</p>
                        <div className="w-12 h-[1px] bg-slate-200 my-0.5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{train.arrival_time}</p>
                        <p className="text-[10px] text-slate-700 font-semibold">{getStationName(train.destination)}</p>
                        <p className="text-[9px] text-slate-400">({train.destination})</p>
                      </div>
                    </div>

                    <div className="flex gap-1 text-[10px]">
                      {weekdays.map((w, idx) => {
                        const runs = train.runs_on.includes(idx);
                        return (
                          <span 
                            key={idx} 
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${runs ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Classes tags */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                    {train.classes.map((cls: any) => (
                      <button
                        key={cls.class_name}
                        onClick={() => handleSelectClass(train, cls)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3.5 text-left w-32 flex flex-col justify-between transition-all"
                      >
                        <span className="text-xs font-bold text-brand-600">{cls.class_name}</span>
                        <span className="text-[10px] text-success font-semibold mt-1">{cls.available_seats}</span>
                        <span className="text-sm font-black text-slate-900 mt-1">₹{cls.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: BERTH SELECTION */}
          {step === 'berths' && selectedTrain && (
            <form onSubmit={handleCheckout} className="card p-6 space-y-6 bg-white border-slate-100">
              <div className="text-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Configure Passenger Details & Berths</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Train: {selectedTrain.train_name} | Route: {getStationName(selectedTrain.source)} → {getStationName(selectedTrain.destination)} | Class: {selectedClass.class_name}
                </p>
              </div>

              {passengersDetails.map((details, idx) => (
                <div key={idx} className="space-y-4 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  <p className="text-xs font-bold text-brand-600">Passenger #{idx + 1}</p>
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
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Age"
                        value={details.age}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].age = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2.5 text-xs text-slate-900 col-span-1 focus:outline-none"
                        required
                      />
                      <select
                        value={details.gender}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].gender = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2.5 text-xs text-slate-900 focus:outline-none select-field"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <select
                        value={details.berth_preference}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].berth_preference = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2.5 text-xs text-slate-900 focus:outline-none select-field"
                      >
                        <option value="Lower">Lower</option>
                        <option value="Middle">Middle</option>
                        <option value="Upper">Upper</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Aadhaar or Passport Number"
                      value={details.id_number}
                      onChange={(e) => {
                        const copy = [...passengersDetails];
                        copy[idx].id_number = e.target.value;
                        setPassengersDetails(copy);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">Total Price ({passengersCount} Ticket(s)):</span>
                <span className="text-lg font-black text-brand-600">₹{selectedClass.price * passengersCount}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-sm"
              >
                Proceed & Pay
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS TICKET */}
          {step === 'ticket' && bookingConfirmation && (
            <div className="max-w-xl mx-auto card p-8 rounded-3xl space-y-6 text-center border-2 border-success/30 bg-white">
              <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={36} />
              </div>
              
              <h2 className="text-2xl font-heading font-black text-slate-900">Train Ticket Booked!</h2>
              <p className="text-sm text-slate-500">Your IRCTC simulated ticket has been successfully registered.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2 font-mono text-slate-700">
                <p><strong>PNR Reference:</strong> <span className="text-brand-600 font-bold">{bookingConfirmation.booking_reference}</span></p>
                <p><strong>Train:</strong> {bookingConfirmation.journey_details.train_name} (#{bookingConfirmation.journey_details.train_number})</p>
                <p><strong>Route:</strong> {getStationName(bookingConfirmation.journey_details.source)} ({bookingConfirmation.journey_details.source}) → {getStationName(bookingConfirmation.journey_details.destination)} ({bookingConfirmation.journey_details.destination})</p>
                <p><strong>Journey Date:</strong> {bookingConfirmation.journey_details.date}</p>
                <p><strong>Class & Quota:</strong> {bookingConfirmation.journey_details.class_name} | {bookingConfirmation.journey_details.quota}</p>
                <p><strong>Seat Berth Assignments:</strong></p>
                <ul className="list-disc pl-5">
                  {bookingConfirmation.passengers.map((p: any, idx: number) => (
                    <li key={idx}>{p.name}: {p.seat_number} ({p.berth_preference})</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4">
                <a 
                  href={`http://127.0.0.1:5001/api/v1/tickets/download/${bookingConfirmation._id}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Download Ticket PDF
                </a>
                <button 
                  onClick={() => navigate('/trips')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
                >
                  View In My Trips
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: PNR CHECK ================= */}
      {activeTab === 'pnr' && (
        <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Check Indian Railways PNR Status</h2>
          <form onSubmit={handleCheckPnr} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter 10-Digit PNR"
              value={pnrQuery}
              onChange={(e) => setPnrQuery(e.target.value)}
              className="flex-1 input-field font-mono"
              required
            />
            <button type="submit" className="btn btn-primary px-6">
              Get Status
            </button>
          </form>

          {pnrResult && (
            <div className="border-t border-slate-100 pt-4 space-y-4 text-xs font-mono text-slate-700">
              <div className="flex justify-between items-center">
                <span>PNR Number: {pnrResult.pnr}</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  {pnrResult.chart_status}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <p><strong>Train:</strong> {pnrResult.train_name} ({pnrResult.train_number})</p>
                <p><strong>Date:</strong> {pnrResult.date}</p>
                <p className="mt-4 font-bold border-b border-slate-200 pb-1 text-slate-800">Passenger Statuses</p>
                {pnrResult.passengers.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-slate-500">
                    <span>{p.name}</span>
                    <span>{p.seat} ({p.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: RUNNING STATUS ================= */}
      {activeTab === 'status' && (
        <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Live Train Running Status</h2>
          <form onSubmit={handleCheckRunningStatus} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter 5-Digit Train Number (e.g. 12952)"
              value={trainNoQuery}
              onChange={(e) => setTrainNoQuery(e.target.value)}
              className="flex-1 input-field font-mono"
              required
            />
            <button type="submit" className="btn btn-primary px-6">
              Track Train
            </button>
          </form>

          {runningStatusResult && (
            <div className="border-t border-slate-100 pt-4 space-y-4 text-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span>Train: {runningStatusResult.train_number}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${runningStatusResult.delay_minutes > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {runningStatusResult.status} ({runningStatusResult.delay_minutes}m delay)
                </span>
              </div>

              <div className="relative pl-6 border-l border-slate-200 space-y-6 text-xs mt-4">
                <div className="relative">
                  <span className="absolute left-[-29px] top-0 w-3 h-3 rounded-full bg-brand-600 flex items-center justify-center text-[8px] text-white">✓</span>
                  <p className="font-bold text-slate-800">Last Station: {runningStatusResult.current_station}</p>
                  <p className="text-slate-400 text-[10px]">{runningStatusResult.last_updated}</p>
                </div>
                {runningStatusResult.upcoming_stations.map((s: any, i: number) => (
                  <div key={i} className="relative">
                    <span className="absolute left-[-29px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <p className="font-bold text-slate-700">Upcoming: {s.name}</p>
                    <p className="text-slate-400 text-[10px]">ETA: {s.ETA} | Distance: {s.distance_km} km</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
