import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import DestinationImage from '../components/DestinationImage';
import {
  Search, Plane, Train, Bus, Building, Sparkles, Map,
  ArrowRight, Star, Heart, TrendingUp, MapPin, Film,
  Home as HomeIcon, Award, X, ChevronRight, Compass, Calendar
} from 'lucide-react';

const DEST_CHIPS = ['Goa', 'Bali', 'Dubai', 'Paris', 'Thailand', 'Maldives', 'Manali', 'Jaipur', 'Ooty'];

const CATEGORIES = [
  { icon: Plane, label: 'Flights', path: '/flights', color: 'bg-blue-50 text-blue-600', emoji: '✈️' },
  { icon: Train, label: 'Trains', path: '/trains', color: 'bg-violet-50 text-violet-600', emoji: '🚆' },
  { icon: Bus, label: 'Buses', path: '/buses', color: 'bg-green-50 text-green-600', emoji: '🚌' },
  { icon: Building, label: 'Hotels', path: '/hotels', color: 'bg-amber-50 text-amber-600', emoji: '🏨' },
  { icon: HomeIcon, label: 'Homestays', path: '/homestays', color: 'bg-pink-50 text-pink-600', emoji: '🏡' },
  { icon: Map, label: 'Activities', path: '/maps', color: 'bg-teal-50 text-teal-600', emoji: '🎫' },
  { icon: Sparkles, label: 'AI Planner', path: '/planner', color: 'bg-brand-50 text-brand-600', emoji: '🤖' },
  { icon: Award, label: 'Packages', path: '/trips', color: 'bg-orange-50 text-orange-600', emoji: '🗺️' },
];
const TRENDING = [
  {
    name: 'Goa, India',
    desc: 'Sun-kissed beaches & vibrant nightlife',
    cost: '₹8,500',
    temp: '29°C',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    tag: 'Trending'
  },
  {
    name: 'Jaipur, Rajasthan',
    desc: 'Pink city of royal palaces & culture',
    cost: '₹7,200',
    temp: '26°C',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=800&auto=format&fit=crop&q=80',
    tag: 'Popular'
  },
  {
    name: 'Manali, Himachal',
    desc: 'Snow-capped peaks & adventure trails',
    cost: '₹9,000',
    temp: '14°C',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80',
    tag: 'Season Pick'
  },
  {
    name: 'Kerala Backwaters',
    desc: 'Tranquil houseboat stays & spice gardens',
    cost: '₹11,500',
    temp: '28°C',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80',
    tag: 'Editor Pick'
  },
];
const DEALS = [
  { type: 'flight', from: 'Delhi', to: 'Mumbai', discount: '18% OFF', price: '₹3,899', provider: 'IndiGo', logo: '🛫' },
  { type: 'hotel', dest: 'Goa', discount: '25% OFF', price: '₹2,499/night', provider: 'Taj Hotels', logo: '🏨' },
  { type: 'bus', from: 'Bangalore', to: 'Chennai', discount: '20% OFF', price: '₹549', provider: 'Orange Travels', logo: '🚌' },
];

const STORIES = [
  { id: 1, name: 'Ananya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { id: 2, name: 'Kabir', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=800' },
  { id: 3, name: 'Priya', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800' },
  { id: 4, name: 'Rohan', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800' },
  { id: 5, name: 'Meera', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTab, setSearchTab] = useState<'explore' | 'flights' | 'hotels' | 'planner'>('explore');
  
  // Tab states
  const [search, setSearch] = useState('');
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [hotelGuests, setHotelGuests] = useState('2 Guests');
  const [plannerDest, setPlannerDest] = useState('');
  const [plannerDays, setPlannerDays] = useState('3 Days');

  const [activeStory, setActiveStory] = useState<any>(null);
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [socialPreview, setSocialPreview] = useState<any[]>([]);

  useEffect(() => {
    api.get('/posts/feed?limit=3').then(res => {
      if (res.data.success) setSocialPreview(res.data.data);
    }).catch(() => {});
  }, []);

  const toggleSave = (name: string) => {
    setSavedCards(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === 'explore' && search.trim()) {
      navigate(`/destination/${encodeURIComponent(search.toLowerCase())}`);
    } else if (searchTab === 'flights') {
      navigate(`/flights?from=${encodeURIComponent(flightFrom)}&to=${encodeURIComponent(flightTo)}&date=${flightDate}`);
    } else if (searchTab === 'hotels') {
      navigate(`/hotels?city=${encodeURIComponent(hotelCity)}`);
    } else if (searchTab === 'planner') {
      navigate(`/planner?dest=${encodeURIComponent(plannerDest)}&days=${plannerDays.split(' ')[0]}`);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-gutter pb-xl">
      {/* ── HERO & INTEGRATED SEARCH CONTAINER ──────────────── */}
      <section className="relative h-[480px] w-full overflow-hidden rounded-3xl shadow-2xl">
        <img
          alt="Coastal Paradise"
          className="w-full h-full object-cover brightness-[0.85]"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFiABQJ6gcUMPRm0gdRcxlbLphttNTf_SbwXYdKWaIendp0g__MkANuxPrgU4ECSMSZiqOmB3BWQBApzDwoJCqeBL_Tob6ngn81smx40NG7JDiS8J9ih5snN6BTUKfYx7XT-gRxxv-efzR5knoSgnkvIv_xcNpX2ZHqJZruFe8uk-TQ3RM907gCvV68yS7JalnmZwl_-ZdL-msAECr44e-dTJ2R3otzzz-f_caHKWiAZdTwbtGOqvHB0LQRJ3IxAwTuqEiRtIhQbg"
        />
        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center text-white px-md">
          <p className="text-sm font-semibold text-primary-fixed uppercase tracking-wider mb-2 drop-shadow">
            {greeting()}, {user?.name?.split(' ')[0] || 'Explorer'} 👋
          </p>
          <h1 className="font-display-lg text-white text-4xl md:text-5xl text-center mb-lg drop-shadow-lg font-bold leading-tight max-w-2xl">
            Where will AI take you today?
          </h1>

          {/* Integrated Search Card */}
          <div className="w-full max-w-4xl bg-white rounded-[28px] p-2 flex flex-col shadow-[0px_10px_30px_rgba(15,23,42,0.12)] text-slate-800">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-100 px-4 pt-1 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'explore', label: 'Explore', icon: Compass },
                { id: 'flights', label: 'Flights', icon: Plane },
                { id: 'hotels', label: 'Hotels', icon: Building },
                { id: 'planner', label: 'AI Planner', icon: Sparkles },
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = searchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSearchTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap -mb-px ${
                      isActive 
                        ? 'border-brand-600 text-brand-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <TabIcon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSearch} className="p-2">
              {searchTab === 'explore' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-100">
                    <MapPin className="text-brand-600 mr-3 flex-shrink-0" size={20} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Where to?</span>
                      <input
                        type="text"
                        placeholder="Search destinations"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold placeholder:text-slate-300 w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-brand-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-brand-700 transition-all active:scale-90 flex-shrink-0">
                    <Search size={20} />
                  </button>
                </div>
              )}

              {searchTab === 'flights' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-100">
                    <MapPin className="text-brand-600 mr-2 flex-shrink-0" size={16} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From</span>
                      <input
                        type="text"
                        placeholder="From City"
                        value={flightFrom}
                        onChange={e => setFlightFrom(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold placeholder:text-slate-300 w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-100">
                    <MapPin className="text-brand-600 mr-2 flex-shrink-0" size={16} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To</span>
                      <input
                        type="text"
                        placeholder="To City"
                        value={flightTo}
                        onChange={e => setFlightTo(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold placeholder:text-slate-300 w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full flex items-center px-4 py-2">
                    <Calendar className="text-brand-600 mr-2 flex-shrink-0" size={16} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                      <input
                        type="date"
                        value={flightDate}
                        onChange={e => setFlightDate(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-brand-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-brand-700 transition-all active:scale-90 flex-shrink-0">
                    <Search size={20} />
                  </button>
                </div>
              )}

              {searchTab === 'hotels' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-100">
                    <Building className="text-brand-600 mr-2 flex-shrink-0" size={16} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staying at</span>
                      <input
                        type="text"
                        placeholder="Where are you staying?"
                        value={hotelCity}
                        onChange={e => setHotelCity(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold placeholder:text-slate-300 w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full flex items-center px-4 py-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Guests:</span>
                    <select
                      value={hotelGuests}
                      onChange={e => setHotelGuests(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option>1 Guest</option>
                      <option>2 Guests</option>
                      <option>3 Guests</option>
                      <option>4+ Guests</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-brand-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-brand-700 transition-all active:scale-90 flex-shrink-0">
                    <Search size={20} />
                  </button>
                </div>
              )}

              {searchTab === 'planner' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-100">
                    <Sparkles className="text-brand-600 mr-2 flex-shrink-0" size={16} />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</span>
                      <input
                        type="text"
                        placeholder="Enter destination (e.g. Bali)"
                        value={plannerDest}
                        onChange={e => setPlannerDest(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold placeholder:text-slate-300 w-full text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full flex items-center px-4 py-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Duration:</span>
                    <select
                      value={plannerDays}
                      onChange={e => setPlannerDays(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option>2 Days</option>
                      <option>3 Days</option>
                      <option>5 Days</option>
                      <option>7 Days</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-brand-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-brand-700 transition-all active:scale-90 flex-shrink-0">
                    <Search size={20} />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Quick Destination Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Popular:</span>
        {DEST_CHIPS.map(dest => (
          <button
            key={dest}
            type="button"
            onClick={() => navigate(`/destination/${dest.toLowerCase()}`)}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-xs font-medium text-slate-600 transition-all flex-shrink-0"
          >
            {dest}
          </button>
        ))}
      </div>

      {/* ── BOOK & PLAN SHORTCUTS ────────────────────────────── */}
      <section className="px-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Book & Plan</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => navigate(cat.path)}
                className="flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                  <CatIcon size={20} className="stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── TRAVEL STORIES ───────────────────────────────────── */}
      <section className="px-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Travel Stories</h2>
          <button
            onClick={() => navigate('/reels')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-1">
          {STORIES.map(story => (
            <button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-brand-500 to-pink-505 shadow-md group-hover:scale-105 transition-all duration-300">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                {story.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── TRENDING DESTINATIONS (Airbnb Style) ──────────────── */}
      <section className="px-2">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Popular Destinations</h2>
            <p className="text-xs text-slate-400">Handpicked by our AI based on global travel trends.</p>
          </div>
          <button
            onClick={() => navigate('/social')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-0.5"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {TRENDING.map(dest => (
            <div
              key={dest.name}
              onClick={() => navigate(`/destination/${dest.name.split(',')[0].toLowerCase()}`)}
              className="group cursor-pointer space-y-2"
            >
              {/* Image box */}
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-card transition-all group-hover:shadow-card-hover">
                <DestinationImage
                  name={dest.name}
                  imageUrl={dest.image}
                  height="100%"
                  borderRadius="0px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Save button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleSave(dest.name);
                  }}
                  className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all"
                >
                  <Heart
                    size={16}
                    className={savedCards.includes(dest.name) ? 'fill-red-500 text-red-500' : 'text-white'}
                  />
                </button>
                {/* Tag */}
                <span className="absolute top-4 left-4 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <TrendingUp size={10} /> {dest.tag}
                </span>
              </div>

              {/* Description under image */}
              <div className="flex justify-between items-start pt-1">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{dest.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{dest.desc}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Oct 12 - 17</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-700">{dest.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEALS OF THE DAY ─────────────────────────────────── */}
      <section className="px-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Deals of the Day</h2>
          <span className="badge badge-red text-[10px] py-1 px-2.5">🔥 Limited Time</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEALS.map((deal, idx) => (
            <div
              key={idx}
              onClick={() => navigate(deal.type === 'flight' ? '/flights' : deal.type === 'hotel' ? '/hotels' : '/buses')}
              className="card card-hover cursor-pointer p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {deal.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge badge-green text-[10px]">{deal.discount}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {deal.type === 'flight' ? `${deal.from} → ${deal.to}` : deal.type === 'hotel' ? `${deal.dest} Stay` : `${(deal as any).from} → ${(deal as any).to}`}
                </p>
                <p className="text-[11px] text-slate-400">via {deal.provider}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-slate-900">{deal.price}</p>
                <p className="text-[10px] text-slate-400">per person</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI PLANNER PROMO ─────────────────────────────────── */}
      <section className="px-2">
        <div
          onClick={() => navigate('/planner')}
          className="relative overflow-hidden rounded-3xl bg-brand-600 p-8 cursor-pointer group hover:bg-brand-700 transition-colors shadow-lg"
        >
          <div className="relative z-10 max-w-xl">
            <span className="badge bg-white/20 text-white text-[10px] mb-3 inline-flex">✨ AI Powered</span>
            <h2 className="text-2xl font-bold text-white mb-2">Plan Your Perfect Trip</h2>
            <p className="text-brand-100 text-sm mb-6 leading-relaxed">
              Tell us your budget & preferences. Our AI builds a complete day-wise itinerary in seconds with weather checks and hotel stays.
            </p>
            <button className="btn btn-md bg-white text-brand-700 hover:bg-brand-50 rounded-2xl font-semibold text-sm flex items-center gap-2 group-hover:shadow-md transition-all">
              <Sparkles size={14} /> Start Planning Free
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -right-4 -bottom-12 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute right-24 -top-4 w-20 h-20 bg-white/5 rounded-full" />
        </div>
      </section>

      {/* ── STORY VIEWER OVERLAY ─────────────────────────────── */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 modal-overlay"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="w-full max-w-sm h-[75vh] relative rounded-3xl overflow-hidden modal-content"
            onClick={e => e.stopPropagation()}
          >
            {/* Story progress bar */}
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/30 rounded-full overflow-hidden z-20">
              <div className="h-full bg-white rounded-full animate-[progress_5s_linear_forwards]" style={{ width: '60%' }} />
            </div>

            {/* Header */}
            <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <img src={activeStory.avatar} alt={activeStory.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                <span className="text-xs font-bold text-white">{activeStory.name}</span>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-1 text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <img src={activeStory.image} alt="Story" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}
