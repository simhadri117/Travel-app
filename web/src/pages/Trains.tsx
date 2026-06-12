import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { createBooking } from '../services/firestore';
import { 
  Train, Calendar, Users, Briefcase, Search, 
  MapPin, CheckCircle, Clock, AlertTriangle, Download, Mic, ArrowLeftRight, Plane, Building, Bus, Star, Check
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

  // 3. Finalize Checkout & Stripe
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
          // Sync train booking to Firestore
          try {
            await createBooking({
              booking_type: 'train',
              booking_reference: resBook.data.data.booking_reference,
              amount_paid: resBook.data.data.amount_paid || totalPrice,
              journey_details: resBook.data.data.journey_details || { ...selectedTrain, class_name: selectedClass.class_name, date },
              status: 'confirmed'
            });
          } catch (fsErr) {
            console.error('[Firestore Train Booking Sync Failed]:', fsErr);
          }

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
    <div className="max-w-4xl mx-auto space-y-6 pb-xl">
      {/* Page Title */}
      <div>
        <h1 className="font-display-lg text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Train className="text-primary" /> Booking Hub
        </h1>
        <p className="text-slate-400 text-xs mt-1">AI-powered train ticket reservations with Indian Railways APIs</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-4 border-b border-slate-100 pb-2.5 text-xs font-bold">
        <button 
          onClick={() => { setActiveTab('book'); setStep('search'); }}
          className={`pb-2 transition-all ${activeTab === 'book' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-600'}`}
        >
          Book Train Tickets
        </button>
        <button 
          onClick={() => setActiveTab('pnr')}
          className={`pb-2 transition-all ${activeTab === 'pnr' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-600'}`}
        >
          PNR Status Check
        </button>
        <button 
          onClick={() => setActiveTab('status')}
          className={`pb-2 transition-all ${activeTab === 'status' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-600'}`}
        >
          Live Train Running Status
        </button>
      </div>

      {/* ================= TAB 1: BOOK TRAINS ================= */}
      {activeTab === 'book' && (
        <>
          {/* STEP 1: SEARCH SCREEN */}
          {step === 'search' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] p-5">
                {renderBookingHubHeader('trains')}

                <form onSubmit={handleSearch} className="space-y-4">
                  {/* Voice search indicator */}
                  {isListening && (
                    <div className="flex items-center justify-center gap-2 p-2.5 bg-primary/5 text-primary text-[11px] font-bold rounded-xl border border-primary/15 animate-pulse">
                      <Mic size={14} className="text-red-500 animate-ping" />
                      Listening for voice input for {listeningTarget === 'source' ? 'From' : 'To'}... Speak now.
                    </div>
                  )}

                  {/* Route block */}
                  <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center text-left">
                    {/* From station box */}
                    <div className="md:col-span-4 relative flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/80 transition-colors group cursor-pointer">
                      <MapPin size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col flex-grow min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">From Station</span>
                        <input
                          type="text"
                          placeholder="Search city or station..."
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
                          className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => startVoiceSearch('source')}
                        className={`p-1.5 rounded-full hover:bg-slate-200/50 transition-colors flex-shrink-0 ${
                          isListening && listeningTarget === 'source' ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400'
                        }`}
                      >
                        <Mic size={14} />
                      </button>

                      {showSourceDropdown && (
                        <div className="absolute z-50 left-0 right-0 top-14 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                          {getSuggestions(sourceSearch).length === 0 ? (
                            <div className="p-3 text-[10px] text-slate-400 text-center font-bold">No stations found</div>
                          ) : (
                            getSuggestions(sourceSearch).map((station) => (
                              <div
                                key={station.code}
                                onMouseDown={() => {
                                  setSource(station.code);
                                  setSourceSearch(station.name);
                                  setShowSourceDropdown(false);
                                }}
                                className="flex items-start justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate leading-tight">{station.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{station.city}</p>
                                </div>
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">{station.code}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Swap indicator */}
                    <div className="md:col-span-1 flex justify-center">
                      <button 
                        type="button" 
                        onClick={() => {
                          const tempCode = source; const tempSearch = sourceSearch;
                          setSource(destination); setSourceSearch(destinationSearch);
                          setDestination(tempCode); setDestinationSearch(tempSearch);
                        }}
                        className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center transition-all text-slate-500 active:scale-90"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>

                    {/* To station box */}
                    <div className="md:col-span-4 relative flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/80 transition-colors group cursor-pointer">
                      <MapPin size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col flex-grow min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">To Station</span>
                        <input
                          type="text"
                          placeholder="Search destination..."
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
                          className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => startVoiceSearch('destination')}
                        className={`p-1.5 rounded-full hover:bg-slate-200/50 transition-colors flex-shrink-0 ${
                          isListening && listeningTarget === 'destination' ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400'
                        }`}
                      >
                        <Mic size={14} />
                      </button>

                      {showDestinationDropdown && (
                        <div className="absolute z-50 left-0 right-0 top-14 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                          {getSuggestions(destinationSearch).length === 0 ? (
                            <div className="p-3 text-[10px] text-slate-400 text-center font-bold">No stations found</div>
                          ) : (
                            getSuggestions(destinationSearch).map((station) => (
                              <div
                                key={station.code}
                                onMouseDown={() => {
                                  setDestination(station.code);
                                  setDestinationSearch(station.name);
                                  setShowDestinationDropdown(false);
                                }}
                                className="flex items-start justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate leading-tight">{station.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{station.city}</p>
                                </div>
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">{station.code}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Popular Cities Chips */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Popular Hubs</label>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_CITIES.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handlePopularCityClick(city)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-0.5 active:scale-95"
                        >
                          📍 {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date, Quota, Passengers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                    {/* Date */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                      <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col flex-grow">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date of Journey</span>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    {/* Quota */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                      <Briefcase size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col flex-grow">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quota Type</span>
                        <select
                          value={quota}
                          onChange={(e) => setQuota(e.target.value)}
                          className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full cursor-pointer"
                        >
                          <option value="General">General</option>
                          <option value="Ladies">Ladies Quota</option>
                          <option value="Tatkal">Tatkal</option>
                          <option value="Premium Tatkal">Premium Tatkal</option>
                          <option value="Senior Citizen">Senior Citizen</option>
                        </select>
                      </div>
                    </div>

                    {/* Passengers */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl hover:bg-slate-100/80 border border-slate-100 transition-colors group">
                      <Users size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col flex-grow">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Passengers Count</span>
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
                          className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-800 w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Search CTA */}
                  <button
                    type="submit"
                    className="w-full h-12 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-98"
                  >
                    <Search size={15} /> Find Available Trains
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2: RESULTS */}
          {step === 'results' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase">Available Trains</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{getStationName(source)} ({source}) → {getStationName(destination)} ({destination}) · {date}</p>
                </div>
                <button 
                  onClick={() => setStep('search')} 
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 transition-all"
                >
                  Modify Search
                </button>
              </div>

              {trainsList.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-100">
                  <Train size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs font-medium">No available trains found on this route and date.</p>
                  <button onClick={() => setStep('search')} className="btn btn-sm btn-primary mt-4 font-bold">Modify Cities</button>
                </div>
              ) : (
                trainsList.map((train) => (
                  <div key={train.train_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 hover:shadow-card transition-all group">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Train Title */}
                      <div className="sm:w-1/4">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors leading-tight">{train.train_name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Train #{train.train_number}</p>
                      </div>

                      {/* Travel Details Route */}
                      <div className="flex items-center gap-6 text-xs text-slate-700 flex-1 w-full">
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">{train.departure_time}</p>
                          <p className="text-[10px] text-slate-550 font-bold mt-0.5">{getStationName(train.source)}</p>
                          <p className="text-[9px] text-slate-400">({train.source})</p>
                        </div>
                        <div className="flex-grow flex flex-col items-center">
                          <span className="text-[9px] text-slate-400 font-semibold">{train.duration}</span>
                          <div className="w-full flex items-center gap-1 my-0.5">
                            <div className="flex-grow h-[1px] bg-slate-100" />
                            <Train size={11} className="text-slate-300 group-hover:text-primary transition-colors" />
                            <div className="flex-grow h-[1px] bg-slate-100" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-900 leading-tight">{train.arrival_time}</p>
                          <p className="text-[10px] text-slate-550 font-bold mt-0.5">{getStationName(train.destination)}</p>
                          <p className="text-[9px] text-slate-400">({train.destination})</p>
                        </div>
                      </div>

                      {/* Weekdays calendar */}
                      <div className="flex gap-1 text-[9px] flex-shrink-0">
                        {weekdays.map((w, idx) => {
                          const runs = train.runs_on.includes(idx);
                          return (
                            <span 
                              key={idx} 
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                                runs 
                                  ? 'bg-primary/5 text-primary border border-primary/10' 
                                  : 'bg-slate-50 border border-slate-200 text-slate-350'
                              }`}
                            >
                              {w}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Classes options */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                      {train.classes.map((cls: any) => (
                        <button
                          key={cls.class_name}
                          onClick={() => handleSelectClass(train, cls)}
                          className="bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl p-3 text-left w-28 flex flex-col justify-between transition-colors cursor-pointer group/btn"
                        >
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{cls.class_name}</span>
                          <span className="text-[9px] text-emerald-600 font-bold mt-1">{cls.available_seats} left</span>
                          <span className="text-xs font-extrabold text-slate-900 mt-1.5">₹{cls.price?.toLocaleString('en-IN')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STEP 3: BERTH SELECTION */}
          {step === 'berths' && selectedTrain && (
            <form onSubmit={handleCheckout} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm max-w-xl mx-auto space-y-6 animate-slide-up text-left">
              <div className="text-center border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Configure Passenger Details & Berths</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Train: {selectedTrain.train_name} (#{selectedTrain.train_number}) | Class: {selectedClass.class_name}
                </p>
              </div>

              {passengersDetails.map((details, idx) => (
                <div key={idx} className="space-y-3 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                  <span className="inline-block bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Passenger #{idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Passenger Name"
                      value={details.name}
                      onChange={(e) => {
                        const copy = [...passengersDetails];
                        copy[idx].name = e.target.value;
                        setPassengersDetails(copy);
                      }}
                      className="input-field py-2"
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
                        className="input-field py-2"
                        required
                      />
                      <select
                        value={details.gender}
                        onChange={(e) => {
                          const copy = [...passengersDetails];
                          copy[idx].gender = e.target.value;
                          setPassengersDetails(copy);
                        }}
                        className="select-field py-2"
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
                        className="select-field py-2 font-semibold"
                      >
                        <option value="Lower">Lower</option>
                        <option value="Middle">Middle</option>
                        <option value="Upper">Upper</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Aadhaar or Passport Number"
                      value={details.id_number}
                      onChange={(e) => {
                        const copy = [...passengersDetails];
                        copy[idx].id_number = e.target.value;
                        setPassengersDetails(copy);
                      }}
                      className="input-field py-2 font-semibold"
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Price ({passengersCount} Ticket(s)):</span>
                <span className="text-sm font-extrabold text-primary">₹{(selectedClass.price * passengersCount)?.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                Proceed & Pay
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS TICKET */}
          {step === 'ticket' && bookingConfirmation && (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.05)] text-center space-y-5 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={32} />
              </div>
              
              <div>
                <h2 className="text-lg font-bold text-slate-900">Train Ticket Booked!</h2>
                <p className="text-slate-500 text-xs mt-1">Your IRCTC simulated ticket has been successfully registered.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans font-semibold">PNR Reference</span>
                  <span className="text-primary font-extrabold">{bookingConfirmation.booking_reference}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span className="text-slate-400 font-sans font-semibold">Train</span>
                  <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details.train_name} (#{bookingConfirmation.journey_details.train_number})</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span className="text-slate-400 font-sans font-semibold">Route</span>
                  <span className="text-slate-900 font-bold">{getStationName(bookingConfirmation.journey_details.source)} ({bookingConfirmation.journey_details.source}) → {getStationName(bookingConfirmation.journey_details.destination)} ({bookingConfirmation.journey_details.destination})</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span className="text-slate-400 font-sans font-semibold">Journey Date</span>
                  <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details.date}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span className="text-slate-400 font-sans font-semibold">Class / Quota</span>
                  <span className="text-slate-900 font-bold">{bookingConfirmation.journey_details.class_name} | {bookingConfirmation.journey_details.quota}</span>
                </div>
                <div className="border-t border-slate-200/50 pt-1.5">
                  <span className="text-slate-400 font-sans font-semibold block mb-1">Berth Assignments</span>
                  <ul className="space-y-1 font-sans text-[11px] font-semibold text-slate-600 pl-2">
                    {bookingConfirmation.passengers.map((p: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>Passenger {idx + 1}: {p.name}</span>
                        <span className="text-primary">{p.seat_number} ({p.berth_preference})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <a 
                  href={`http://127.0.0.1:5002/api/v1/tickets/download/${bookingConfirmation._id}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-grow h-10 bg-primary text-white hover:bg-on-primary-fixed-variant rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
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
        </>
      )}

      {/* ================= TAB 2: PNR CHECK ================= */}
      {activeTab === 'pnr' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-left animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Check Indian Railways PNR Status</h2>
            <p className="text-xs text-slate-400 mt-1">Check charts preparations and berth status inputs</p>
          </div>
          
          <form onSubmit={handleCheckPnr} className="flex gap-3 text-xs">
            <input
              type="text"
              placeholder="Enter 10-Digit PNR"
              value={pnrQuery}
              onChange={(e) => setPnrQuery(e.target.value)}
              className="flex-grow input-field font-mono font-bold"
              required
            />
            <button type="submit" className="bg-primary text-white hover:bg-on-primary-fixed-variant px-6 font-bold rounded-xl shadow-sm transition-colors">
              Get Status
            </button>
          </form>

          {pnrResult && (
            <div className="border-t border-slate-100 pt-4 space-y-4 text-xs font-mono text-slate-700">
              <div className="flex justify-between items-center text-sans font-bold text-slate-800">
                <span>PNR Number: {pnrResult.pnr}</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">
                  {pnrResult.chart_status}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-sans text-xs">
                <p><strong>Train Name:</strong> {pnrResult.train_name} ({pnrResult.train_number})</p>
                <p><strong>Journey Date:</strong> {pnrResult.date}</p>
                <p className="mt-4 font-bold border-t border-slate-200/50 pt-2 text-slate-800 uppercase tracking-wider text-[9px]">Passenger Booked Statuses</p>
                {pnrResult.passengers.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-slate-600 font-semibold py-1 border-b border-slate-100/50 last:border-0">
                    <span>{p.name}</span>
                    <span className="text-primary">{p.seat} ({p.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: RUNNING STATUS ================= */}
      {activeTab === 'status' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 text-left animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Train Running Status</h2>
            <p className="text-xs text-slate-400 mt-1">Locate active trains positions and schedules</p>
          </div>
          
          <form onSubmit={handleCheckRunningStatus} className="flex gap-3 text-xs">
            <input
              type="text"
              placeholder="Enter 5-Digit Train Number (e.g. 12952)"
              value={trainNoQuery}
              onChange={(e) => setTrainNoQuery(e.target.value)}
              className="flex-grow input-field font-mono font-bold"
              required
            />
            <button type="submit" className="bg-primary text-white hover:bg-on-primary-fixed-variant px-6 font-bold rounded-xl shadow-sm transition-colors">
              Track Train
            </button>
          </form>

          {runningStatusResult && (
            <div className="border-t border-slate-100 pt-4 space-y-4 text-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold">Train: {runningStatusResult.train_number}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${runningStatusResult.delay_minutes > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-250'}`}>
                  {runningStatusResult.status} ({runningStatusResult.delay_minutes}m delay)
                </span>
              </div>

              <div className="relative pl-6 border-l border-slate-200 space-y-6 text-xs mt-4">
                <div className="relative">
                  <span className="absolute left-[-29px] top-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center text-[7px] text-white font-black">✓</span>
                  <p className="font-extrabold text-slate-800">Last Station: {runningStatusResult.current_station}</p>
                  <p className="text-slate-400 text-[10px] font-semibold mt-0.5">{runningStatusResult.last_updated}</p>
                </div>
                {runningStatusResult.upcoming_stations.map((s: any, i: number) => (
                  <div key={i} className="relative">
                    <span className="absolute left-[-29px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 border border-white" />
                    <p className="font-bold text-slate-700">Upcoming: {s.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">ETA: {s.ETA} | Distance: {s.distance_km} km</p>
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
