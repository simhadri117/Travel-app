import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import PlacePhoto from '../components/PlacePhoto';
import WeatherBadge from '../components/WeatherBadge';
import DestinationImage from '../components/DestinationImage';
import {
  Sparkles, MapPin, Calendar, Users, DollarSign, ArrowRight,
  RefreshCw, Bookmark, Share2, ChevronDown, ChevronUp, Check,
  Utensils, Building, Star, Camera, Briefcase, AlertTriangle,
  Clock, Navigation, Plus, Trash2, GripVertical, Download,
  Plane, Train, Bus, ExternalLink, Mic, X, Search
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TRAVEL_TYPES = [
  { id: 'Solo',       emoji: '🧍', label: 'Solo' },
  { id: 'Couple',     emoji: '💑', label: 'Couple' },
  { id: 'Family',     emoji: '👨‍👩‍👧', label: 'Family' },
  { id: 'Friends',    emoji: '👫', label: 'Friends' },
  { id: 'Adventure',  emoji: '🧗', label: 'Adventure' },
  { id: 'Luxury',     emoji: '💎', label: 'Luxury' },
  { id: 'Backpacking',emoji: '🎒', label: 'Backpacking' },
  { id: 'Business',   emoji: '💼', label: 'Business' },
];

const POPULAR_DESTINATIONS = [
  { name: 'Goa', emoji: '🏖️' },
  { name: 'Jaipur', emoji: '🏰' },
  { name: 'Manali', emoji: '🏔️' },
  { name: 'Kerala', emoji: '🌴' },
  { name: 'Agra', emoji: '🕌' },
  { name: 'Udaipur', emoji: '🛶' },
  { name: 'Varanasi', emoji: '🙏' },
  { name: 'Coorg', emoji: '☕' },
];

const STEPS = ['Destination', 'Dates & Travelers', 'Budget & Style', 'Generate'];

const DESTINATION_HERO_IMAGES: Record<string, string> = {
  'goa':         'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85',
  'jaipur':      'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=1200&q=85',
  'manali':      'https://images.unsplash.com/photo-1626392339560-487d25135507?w=1200&q=85',
  'kerala':      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85',
  'agra':        'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85',
  'delhi':       'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=85',
  'mumbai':      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=85',
  'udaipur':     'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85',
  'varanasi':    'https://images.unsplash.com/photo-1561361058-c24e02f58f48?w=1200&q=85',
  'ladakh':      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200&q=85',
  'andaman':     'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=85',
  'shimla':      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
  'chennai':     'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=85',
};

const getHeroImage = (dest: string) => {
  const key = (dest || '').toLowerCase().trim();
  if (DESTINATION_HERO_IMAGES[key]) return DESTINATION_HERO_IMAGES[key];
  const partial = Object.keys(DESTINATION_HERO_IMAGES).find(k => key.includes(k) || k.includes(key));
  return partial ? DESTINATION_HERO_IMAGES[partial] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=85';
};

const API_BASE = 'http://localhost:5001/api/v1';

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function Planner() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  // Wizard state
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState<'wizard' | 'loading' | 'result'>('wizard');

  // Form fields
  const [source, setSource] = useState(() => localStorage.getItem('ww_guest_home_city') || 'New Delhi');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 11);
    return d.toISOString().split('T')[0];
  });
  const [travelers, setTravelers] = useState(2);
  const [travelType, setTravelType] = useState('Friends');
  const [budget, setBudget] = useState(20000);
  const [accommodation, setAccommodation] = useState('Mid-range');
  const [mealPref, setMealPref] = useState('Both');
  const [specialNeeds, setSpecialNeeds] = useState('');

  // Loading SSE state
  const [loadingSteps, setLoadingSteps] = useState<Array<{ msg: string; progress: number; done: boolean }>>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Result state
  const [itinerary, setItinerary] = useState<any>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [draggedDay, setDraggedDay] = useState<number | null>(null);

  // Add attraction modal
  const [addAttractionDay, setAddAttractionDay] = useState<number | null>(null);
  const [attractionSearch, setAttractionSearch] = useState('');
  const [removedSlots, setRemovedSlots] = useState<Set<string>>(new Set());

  // PDF ref
  const itineraryRef = useRef<HTMLDivElement>(null);

  const days = itinerary ? Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1 : 0;

  useEffect(() => {
    if (user?.home_city) setSource(user.home_city);
  }, [user]);

  // ── Generate via SSE ──
  const handleGenerate = useCallback(async () => {
    if (!isAuthenticated) {
      const count = parseInt(localStorage.getItem('ts_gen_count') || '0', 10);
      if (count >= 3) {
        openAuthModal({
          title: 'Plan Limit Reached',
          subtitle: 'Guests can generate up to 3 itineraries. Sign in for unlimited plans.',
          onSuccess: handleGenerate
        });
        return;
      }
    }

    setScreen('loading');
    setLoadingSteps([]);
    setLoadingProgress(0);

    const token = localStorage.getItem('ts_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/itinerary/generate-realtime`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source, destination, startDate, endDate, budget,
          travelers, travelType, accommodation, mealPreference: mealPref, specialNeeds
        })
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.substring(6));
            if (data.step === 'progress' || data.step === 'start') {
              setLoadingProgress(data.progress || 0);
              setLoadingSteps(prev => [...prev, { msg: data.message, progress: data.progress, done: false }]);
            } else if (data.step === 'done') {
              setLoadingProgress(100);
              setItinerary(data.itinerary);
              setItineraryId(data.itinerary_id);
              setExpandedDay(1);
              setScreen('result');
              setRemovedSlots(new Set());
              confetti({ particleCount: 130, spread: 90, origin: { y: 0.55 } });
              if (!isAuthenticated) {
                const c = parseInt(localStorage.getItem('ts_gen_count') || '0', 10);
                localStorage.setItem('ts_gen_count', (c + 1).toString());
              }
            } else if (data.step === 'error') {
              throw new Error(data.message);
            }
          } catch (err) {
            console.error('Failed to parse SSE line:', trimmed, err);
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.substring(6));
            if (data.step === 'done') {
              setLoadingProgress(100);
              setItinerary(data.itinerary);
              setItineraryId(data.itinerary_id);
              setExpandedDay(1);
              setScreen('result');
              setRemovedSlots(new Set());
              confetti({ particleCount: 130, spread: 90, origin: { y: 0.55 } });
              if (!isAuthenticated) {
                const c = parseInt(localStorage.getItem('ts_gen_count') || '0', 10);
                localStorage.setItem('ts_gen_count', (c + 1).toString());
              }
            } else if (data.step === 'error') {
              throw new Error(data.message);
            }
          } catch (err) {
            console.error('Failed to parse trailing SSE line:', trimmed, err);
          }
        }
      }
    } catch (err: any) {
      // Fallback to old endpoint
      try {
        const numDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const res = await api.post('/itinerary/generate', {
          source, destination, days: numDays, budget, themes: [travelType.toLowerCase()],
          month: new Date(startDate).toLocaleString('en', { month: 'long' }), year: 2026,
          accommodation, mealPreference: mealPref, specialNeeds, travelers
        });
        if (res.data.success) {
          setItinerary(res.data.data.content);
          setItineraryId(res.data.data.itinerary_id);
          setExpandedDay(1);
          setScreen('result');
          confetti({ particleCount: 100, spread: 70 });
        }
      } catch {
        setScreen('wizard');
      }
    }
  }, [source, destination, startDate, endDate, budget, travelers, travelType, accommodation, mealPref, specialNeeds, isAuthenticated]);

  // ── Save ──
  const handleSave = async () => {
    if (!itineraryId) return;
    if (!isAuthenticated) {
      openAuthModal({ title: 'Save Itinerary', subtitle: 'Sign in to save this plan.', onSuccess: handleSave });
      return;
    }
    try {
      await api.post('/itinerary/save', { itinerary_id: itineraryId });
      alert('Itinerary saved!');
    } catch {}
  };

  // ── Export PDF ──
  const handleExportPDF = async () => {
    if (!isAuthenticated) {
      openAuthModal({ title: 'Export PDF', subtitle: 'Sign in to export your itinerary as PDF.', onSuccess: handleExportPDF });
      return;
    }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!itineraryRef.current) return;
      const canvas = await html2canvas(itineraryRef.current, { scale: 1.5, useCORS: true });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let pos = 0;
      const pageH = 297;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, pos, imgW, imgH);
      while (imgH - Math.abs(pos) > pageH) {
        pos -= pageH;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, pos, imgW, imgH);
      }
      pdf.save(`TravelSphere-${destination}-Itinerary.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  // ── Drag & drop days ──
  const handleDragStart = (dayNum: number) => setDraggedDay(dayNum);
  const handleDragOver = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    if (draggedDay === null || draggedDay === targetDay || !itinerary) return;
    const days = [...itinerary.days];
    const fromIdx = days.findIndex(d => d.day_number === draggedDay);
    const toIdx = days.findIndex(d => d.day_number === targetDay);
    const [moved] = days.splice(fromIdx, 1);
    days.splice(toIdx, 0, moved);
    const renumbered = days.map((d, i) => ({ ...d, day_number: i + 1 }));
    setItinerary({ ...itinerary, days: renumbered });
    setDraggedDay(targetDay);
  };
  const handleDragEnd = () => setDraggedDay(null);

  // ── Remove slot ──
  const removeSlot = (dayNum: number, slotKey: string) => {
    setRemovedSlots(prev => new Set([...prev, `${dayNum}-${slotKey}`]));
  };
  const isRemoved = (dayNum: number, slotKey: string) => removedSlots.has(`${dayNum}-${slotKey}`);

  // ── Budget helper ──
  const numDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 || 4;
  const budgetPerDay = Math.round(budget / numDays);

  // ──────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ──────────────────────────────────────────────────────────
  if (screen === 'loading') return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-md">
        {/* Animated orb */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-violet-600 animate-pulse shadow-2xl shadow-brand-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={32} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute -inset-2 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Building your real-time plan</h2>
        <p className="text-slate-400 text-sm text-center mb-6">{destination} · {numDays} days · {travelType}</p>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        {/* Live steps */}
        <div className="space-y-2">
          {[
            { icon: '🗺️', label: 'Fetching attractions from Google Places' },
            { icon: '☁️', label: 'Getting live weather forecast' },
            { icon: '📍', label: 'Calculating distances & routes' },
            { icon: '🤖', label: 'Gemini AI crafting your itinerary' },
            { icon: '✅', label: 'Finalizing & enriching with photos' },
          ].map((s, i) => {
            const progressThreshold = (i + 1) * 20;
            const isActive = loadingProgress >= progressThreshold - 15 && loadingProgress < progressThreshold + 5;
            const isDone = loadingProgress >= progressThreshold;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 ${
                isDone ? 'bg-emerald-50 border border-emerald-200' :
                isActive ? 'bg-brand-50 border border-brand-200 animate-pulse' :
                'bg-slate-50 border border-slate-100 opacity-40'
              }`}>
                <span className="text-lg">{s.icon}</span>
                <span className={`text-sm font-medium flex-1 ${isDone ? 'text-emerald-700' : isActive ? 'text-brand-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {isDone && <Check size={14} className="text-emerald-600" />}
                {isActive && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Powered by Gemini AI + Google Places + OpenWeather · ~15 seconds</p>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ──────────────────────────────────────────────────────────
  if (screen === 'result' && itinerary) return (
    <div className="page-container animate-slide-up space-y-6" ref={itineraryRef}>

      {/* ── HERO ── */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl">
        <DestinationImage
          name={destination}
          imageUrl={DESTINATION_HERO_IMAGES[destination.toLowerCase().trim()]}
          height="100%"
          borderRadius="0px"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2 no-print">
          <button onClick={handleSave} className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-2 rounded-full hover:bg-white/30 transition-all">
            <Bookmark size={13} /> Save
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-2 rounded-full hover:bg-white/30 transition-all">
            <Download size={13} /> PDF
          </button>
          <button onClick={() => alert(`Share: http://localhost:8080/#/share/${itineraryId}`)} className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-2 rounded-full hover:bg-white/30 transition-all">
            <Share2 size={13} /> Share
          </button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="inline-flex items-center gap-1 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3">
            <Sparkles size={9} /> AI Real-Time Plan
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-xl">{itinerary.title}</h1>
          <p className="text-white/80 text-sm mt-1.5 max-w-2xl">{itinerary.tagline}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {itinerary.weather_summary && (
              <span className="text-xs bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                🌤️ {itinerary.weather_summary}
              </span>
            )}
            <span className="text-xs bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
              {TRAVEL_TYPES.find(t => t.id === travelType)?.emoji} {travelType} Trip
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Duration', value: `${numDays} Days`, icon: '🗓️', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-100' },
          { label: 'Total Budget', value: `₹${budget.toLocaleString('en-IN')}`, icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Travelers', value: `${travelers} Person(s)`, icon: '👥', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Travel Type', value: travelType, icon: TRAVEL_TYPES.find(t => t.id === travelType)?.emoji || '✈️', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className={`font-bold text-base mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TRANSPORT ── */}
      {itinerary.recommended_transport && (
        <div className="card p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl">
                {itinerary.recommended_transport.type === 'Flight' ? '✈️' : itinerary.recommended_transport.type === 'Train' ? '🚂' : '🚌'}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Recommended Onward Journey</p>
                <p className="font-bold text-slate-900">{itinerary.recommended_transport.suggested_option_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{itinerary.recommended_transport.from} → {itinerary.recommended_transport.to}</p>
                {itinerary.recommended_transport.duration && (
                  <p className="text-xs text-slate-400 mt-0.5">⏱️ {itinerary.recommended_transport.duration}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-600">₹{itinerary.recommended_transport.estimated_cost?.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-400">estimated</p>
              <a
                href={itinerary.recommended_transport.booking_url ||
                  `https://www.makemytrip.com/flights/${(source || '').toLowerCase()}-to-${destination.toLowerCase()}/`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-white bg-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-700 transition-colors"
              >
                Book Now <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── COST BREAKDOWN ── */}
      {itinerary.cost_breakdown && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <DollarSign size={16} className="text-emerald-500" /> Budget Breakdown
          </h2>
          <div className="space-y-2.5">
            {[
              { label: '✈️ Transport', val: itinerary.cost_breakdown.transport, color: 'bg-blue-500', pct: 35 },
              { label: '🏨 Accommodation', val: itinerary.cost_breakdown.accommodation, color: 'bg-violet-500', pct: 30 },
              { label: '🍔 Food & Dining', val: itinerary.cost_breakdown.food, color: 'bg-amber-500', pct: 15 },
              { label: '🎫 Activities', val: itinerary.cost_breakdown.activities, color: 'bg-emerald-500', pct: 12 },
              { label: '💼 Miscellaneous', val: itinerary.cost_breakdown.miscellaneous, color: 'bg-slate-400', pct: 8 },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-36 flex-shrink-0">{b.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className={`${b.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-20 text-right">₹{b.val?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DAY-BY-DAY ITINERARY ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-brand-600" /> Day-by-Day Itinerary
          </h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Drag to reorder</span>
        </div>

        <div className="space-y-4">
          {(itinerary.days || []).map((day: any) => {
            const isOpen = expandedDay === day.day_number;
            const isDragging = draggedDay === day.day_number;
            const rainWarning = day.weather && ['Rain', 'Drizzle', 'Thunderstorm'].includes(day.weather.condition);

            return (
              <div
                key={day.day_number}
                draggable
                onDragStart={() => handleDragStart(day.day_number)}
                onDragOver={(e) => handleDragOver(e, day.day_number)}
                onDragEnd={handleDragEnd}
                className={`card overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all ${isDragging ? 'opacity-50 scale-95' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 text-slate-300 cursor-grab active:cursor-grabbing no-print">
                    <GripVertical size={18} />
                  </div>
                  <button
                    onClick={() => setExpandedDay(isOpen ? null : day.day_number)}
                    className="flex-1 flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-violet-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
                        {day.day_number}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{day.theme}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {day.date && <span className="text-[10px] text-slate-400">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                          <span className="text-xs text-emerald-600 font-semibold">₹{day.total_day_cost?.toLocaleString('en-IN')}</span>
                          {day.weather && (
                            <WeatherBadge
                              condition={day.weather.condition}
                              tempMax={day.weather.temp_max}
                              rainChance={day.weather.rain_chance || 0}
                              compact
                            />
                          )}
                          {rainWarning && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              🌧️ Indoor alternatives scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 animate-slide-up">

                    {/* Weather full panel */}
                    {day.weather && (
                      <div className="px-5 pt-4">
                        <WeatherBadge
                          condition={day.weather.condition}
                          tempMax={day.weather.temp_max}
                          tempMin={day.weather.temp_min}
                          rainChance={day.weather.rain_chance || 0}
                          date={day.date}
                        />
                      </div>
                    )}

                    {/* Activity slots */}
                    <div className="p-5 space-y-3">
                      {[
                        { key: 'morning', data: day.morning, icon: '🌅', label: 'Morning', color: 'from-amber-50 to-orange-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
                        { key: 'afternoon', data: day.afternoon, icon: '☀️', label: 'Afternoon', color: 'from-sky-50 to-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
                        { key: 'evening', data: day.evening, icon: '🌇', label: 'Evening', color: 'from-violet-50 to-purple-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
                        { key: 'night', data: day.night, icon: '🌙', label: 'Night', color: 'from-rose-50 to-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
                      ].filter(s => s.data && !isRemoved(day.day_number, s.key)).map((item, i) => (
                        <div key={item.key}>
                          <div className={`rounded-2xl border ${item.border} bg-gradient-to-r ${item.color} overflow-hidden`}>
                            <div className="flex">
                              {/* Place Photo */}
                              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative">
                                <PlacePhoto
                                  photoReference={item.data.photo_reference}
                                  photoUrl={item.data.photo_url}
                                  placeName={item.data.activity_name}
                                  destination={destination}
                                  className="w-full h-full object-cover"
                                  fallbackCategory="attraction"
                                />
                              </div>
                              {/* Content */}
                              <div className="flex-1 p-3 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badge}`}>{item.icon} {item.label}</span>
                                    <span className="text-[10px] text-slate-500">🕐 {item.data.time}</span>
                                    {item.data.rating && (
                                      <span className="text-[10px] font-bold text-amber-600">
                                        ⭐ {item.data.rating}
                                        {(item.data.reviews_count !== undefined || item.data.user_ratings_total !== undefined) && (
                                          <span className="text-[9px] text-slate-400 font-normal ml-0.5">
                                            ({(item.data.reviews_count ?? item.data.user_ratings_total).toLocaleString()})
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeSlot(day.day_number, item.key)}
                                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 no-print"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mt-1 leading-tight">{item.data.activity_name}</h3>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.data.description}</p>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {item.data.visit_duration_hours && (
                                    <span className="text-[10px] text-slate-500">
                                      <Clock size={9} className="inline mr-1" />{item.data.visit_duration_hours}h visit
                                    </span>
                                  )}
                                  {item.data.estimated_cost > 0 && (
                                    <span className="text-[10px] font-bold text-slate-600">₹{item.data.estimated_cost} entry</span>
                                  )}
                                  {item.data.google_maps_link && (
                                    <a href={item.data.google_maps_link} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-brand-600 font-semibold flex items-center gap-0.5 hover:underline">
                                      <MapPin size={9} /> Maps
                                    </a>
                                  )}
                                </div>
                                {item.data.tips && (
                                  <div className="mt-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                                    💡 {item.data.tips}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Travel time between slots */}
                          {i === 0 && day.travel_morning_to_afternoon && !isRemoved(day.day_number, 'afternoon') && (
                            <div className="flex items-center gap-2 px-3 py-1.5">
                              <div className="flex-1 h-px bg-slate-200" />
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Navigation size={8} className="inline mr-1" />
                                {day.travel_morning_to_afternoon.duration_minutes} min · {day.travel_morning_to_afternoon.distance_km} km by {day.travel_morning_to_afternoon.mode}
                              </span>
                              <div className="flex-1 h-px bg-slate-200" />
                            </div>
                          )}
                          {i === 1 && day.travel_afternoon_to_evening && !isRemoved(day.day_number, 'evening') && (
                            <div className="flex items-center gap-2 px-3 py-1.5">
                              <div className="flex-1 h-px bg-slate-200" />
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Navigation size={8} className="inline mr-1" />
                                {day.travel_afternoon_to_evening.duration_minutes} min · {day.travel_afternoon_to_evening.distance_km} km by {day.travel_afternoon_to_evening.mode}
                              </span>
                              <div className="flex-1 h-px bg-slate-200" />
                            </div>
                          )}
                          {i === 2 && day.travel_evening_to_night && !isRemoved(day.day_number, 'night') && (
                            <div className="flex items-center gap-2 px-3 py-1.5">
                              <div className="flex-1 h-px bg-slate-200" />
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Navigation size={8} className="inline mr-1" />
                                {day.travel_evening_to_night.duration_minutes} min · {day.travel_evening_to_night.distance_km} km by {day.travel_evening_to_night.mode}
                              </span>
                              <div className="flex-1 h-px bg-slate-200" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Attraction button */}
                      <button
                        onClick={() => { setAddAttractionDay(day.day_number); setAttractionSearch(''); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 text-xs font-semibold rounded-2xl hover:border-brand-400 hover:text-brand-600 transition-all no-print"
                      >
                        <Plus size={14} /> Add Attraction to Day {day.day_number}
                      </button>
                    </div>

                    {/* Lunch + Dinner + Hotel grid */}
                    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Lunch */}
                      {day.lunch && !isRemoved(day.day_number, 'lunch') && (
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl overflow-hidden">
                          <div className="h-20 relative">
                            <PlacePhoto
                              photoReference={day.lunch.photo_reference}
                              photoUrl={day.lunch.photo_url}
                              placeName={day.lunch.restaurant_name}
                              destination={destination}
                              className="w-full h-full object-cover"
                              fallbackCategory="restaurant"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-2 left-3">
                              <span className="text-[10px] font-bold text-white">🍱 LUNCH</span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-slate-900 text-xs leading-tight">{day.lunch.restaurant_name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{day.lunch.cuisine}</p>
                            {day.lunch.rating && (
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                ⭐ {day.lunch.rating}
                                {(day.lunch.reviews_count !== undefined || day.lunch.user_ratings_total !== undefined) && (
                                  <span className="text-[9px] text-slate-400 font-normal ml-0.5">
                                    ({(day.lunch.reviews_count ?? day.lunch.user_ratings_total).toLocaleString()})
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">{day.lunch.price_range}</p>
                            {day.lunch.must_try_dish && <p className="text-[10px] text-slate-600 mt-1 font-medium">Try: {day.lunch.must_try_dish}</p>}
                          </div>
                        </div>
                      )}

                      {/* Dinner */}
                      {day.dinner && !isRemoved(day.day_number, 'dinner') && (
                        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl overflow-hidden">
                          <div className="h-20 relative">
                            <PlacePhoto
                              photoReference={day.dinner.photo_reference}
                              photoUrl={day.dinner.photo_url}
                              placeName={day.dinner.restaurant_name}
                              destination={destination}
                              className="w-full h-full object-cover"
                              fallbackCategory="restaurant"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-2 left-3">
                              <span className="text-[10px] font-bold text-white">🌙 DINNER</span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-slate-900 text-xs leading-tight">{day.dinner.restaurant_name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{day.dinner.cuisine}</p>
                            {day.dinner.rating && (
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                ⭐ {day.dinner.rating}
                                {(day.dinner.reviews_count !== undefined || day.dinner.user_ratings_total !== undefined) && (
                                  <span className="text-[9px] text-slate-400 font-normal ml-0.5">
                                    ({(day.dinner.reviews_count ?? day.dinner.user_ratings_total).toLocaleString()})
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">{day.dinner.price_range}</p>
                            {day.dinner.must_try_dish && <p className="text-[10px] text-rose-600 mt-1 font-medium">Must try: {day.dinner.must_try_dish}</p>}
                          </div>
                        </div>
                      )}

                      {/* Hotel */}
                      {day.accommodation && !isRemoved(day.day_number, 'accommodation') && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl overflow-hidden">
                          <div className="h-20 relative">
                            <PlacePhoto
                              photoReference={day.accommodation.photo_reference}
                              photoUrl={day.accommodation.photo_url}
                              placeName={day.accommodation.hotel_name}
                              destination={destination}
                              className="w-full h-full object-cover"
                              fallbackCategory="hotel"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-2 left-3">
                              <span className="text-[10px] font-bold text-white">🏨 STAY</span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-slate-900 text-xs leading-tight">{day.accommodation.hotel_name}</p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: day.accommodation.stars || 3 }).map((_, i) => (
                                <Star key={i} size={9} className="fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <p className="text-[10px] font-bold text-blue-700 mt-1">₹{day.accommodation.price_per_night?.toLocaleString('en-IN')}/night</p>
                            {day.accommodation.amenities?.length > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{day.accommodation.amenities.slice(0, 3).join(' · ')}</p>
                            )}
                            <a
                              href={day.accommodation.booking_url || `https://www.google.com/travel/hotels/${encodeURIComponent(destination)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Book <ExternalLink size={8} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── INSTAGRAM SPOTS ── */}
      {itinerary.instagram_worthy_spots?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Camera size={16} className="text-pink-500" /> 📸 Instagram-Worthy Spots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itinerary.instagram_worthy_spots.map((spot: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">{i + 1}</div>
                <div>
                  <p className="font-semibold text-slate-900 text-xs">{spot.spot}</p>
                  <p className="text-[10px] text-pink-600 font-medium mt-0.5">🕐 Best time: {spot.best_time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HIDDEN GEMS ── */}
      {itinerary.nearby_hidden_gems?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 text-sm">💎 Hidden Gems Nearby</h2>
          <div className="flex flex-wrap gap-2">
            {itinerary.nearby_hidden_gems.map((gem: string, i: number) => (
              <span key={i} className="text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full">✨ {gem}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── LOCAL PHRASES ── */}
      {itinerary.local_phrases?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 text-sm">💬 Useful Local Phrases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {itinerary.local_phrases.map((lp: any, i: number) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <p className="font-bold text-brand-600 text-sm">"{lp.phrase}"</p>
                <p className="text-xs text-slate-500 mt-1">{lp.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PACKING ── */}
      {itinerary.packing_tips?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Briefcase size={16} className="text-slate-500" /> 🧳 Packing Checklist
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {itinerary.packing_tips.map((tip: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-emerald-600" />
                </div>
                <span className="text-xs text-slate-700 font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DOS & DON'TS ── */}
      {itinerary.dos_and_donts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-bold text-emerald-700 text-sm mb-3">✅ Do's</h3>
            <ul className="space-y-1.5">
              {itinerary.dos_and_donts.dos?.map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="font-bold text-red-600 text-sm mb-3">❌ Don'ts</h3>
            <ul className="space-y-1.5">
              {itinerary.dos_and_donts.donts?.map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <X size={11} className="text-red-400 mt-0.5 flex-shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── EMERGENCY ── */}
      {itinerary.emergency_contacts && (
        <div className="card p-5 border border-red-100 bg-red-50/30">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-red-500" /> Emergency Contacts in {destination}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '🚓 Police', val: itinerary.emergency_contacts.police },
              { label: '🚑 Ambulance', val: itinerary.emergency_contacts.ambulance },
              { label: '📞 Tourist Help', val: itinerary.emergency_contacts.tourist_helpline },
            ].map(c => (
              <div key={c.label} className="text-center bg-white border border-red-100 rounded-2xl p-3">
                <p className="text-[10px] text-slate-400 font-medium">{c.label}</p>
                <a href={`tel:${c.val}`} className="text-sm font-bold text-red-600 hover:underline block mt-1">{c.val}</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="flex gap-3 flex-wrap pb-6 no-print">
        <button onClick={() => { setScreen('wizard'); setStep(0); }} className="btn btn-md btn-outline flex-1 sm:flex-none">
          <RefreshCw size={14} /> Re-plan
        </button>
        <button onClick={handleExportPDF} className="btn btn-md btn-secondary flex-1 sm:flex-none">
          <Download size={14} /> Export PDF
        </button>
        <button onClick={handleSave} className="btn btn-md btn-secondary flex-1 sm:flex-none">
          <Bookmark size={14} /> Save Plan
        </button>
        <button onClick={() => alert(`Share: http://localhost:8080/#/share/${itineraryId}`)} className="btn btn-md btn-primary flex-1 sm:flex-none">
          <Share2 size={14} /> Share Trip
        </button>
      </div>

      {/* ── Add Attraction Modal ── */}
      {addAttractionDay !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Attraction to Day {addAttractionDay}</h3>
              <button onClick={() => setAddAttractionDay(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={attractionSearch}
                onChange={(e) => setAttractionSearch(e.target.value)}
                placeholder={`Search places in ${destination}...`}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-500"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              {['Museum', 'Beach', 'Temple', 'Market', 'Park', 'Viewpoint', 'Cafe', 'Heritage Site'].map(type => (
                <button
                  key={type}
                  className="w-full flex items-center gap-3 p-3 text-left bg-slate-50 rounded-2xl hover:bg-brand-50 hover:border-brand-200 border border-slate-100 transition-all"
                  onClick={() => {
                    alert(`Added "${attractionSearch || type} in ${destination}" to Day ${addAttractionDay}! (AI will include it in your next regeneration)`);
                    setAddAttractionDay(null);
                  }}
                >
                  <span className="text-lg">
                    {type === 'Museum' ? '🏛️' : type === 'Beach' ? '🏖️' : type === 'Temple' ? '⛩️' : type === 'Market' ? '🛍️' : type === 'Park' ? '🌳' : type === 'Viewpoint' ? '🔭' : type === 'Cafe' ? '☕' : '🏰'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{attractionSearch ? `${attractionSearch}` : type}</p>
                    <p className="text-xs text-slate-400">{type} in {destination}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ──────────────────────────────────────────────────────────
  // WIZARD SCREEN
  // ──────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles size={22} className="text-brand-600" /> AI Trip Planner
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time itineraries powered by Google Places, OpenWeather & Gemini AI</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' :
                'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 0: Destination ── */}
      {step === 0 && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Where are you going?</h2>
            <p className="text-slate-400 text-sm mt-0.5">Choose your starting city and dream destination</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Starting From</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text" value={source}
                  onChange={e => { setSource(e.target.value); localStorage.setItem('ww_guest_home_city', e.target.value); }}
                  placeholder="Your city..." className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Destination</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text" value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Goa, Manali, Kerala..." className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Popular destinations */}
          <div>
            <p className="label mb-3">Popular Destinations</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {POPULAR_DESTINATIONS.map(d => (
                <button key={d.name} onClick={() => setDestination(d.name)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${
                    destination === d.name ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl">{d.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-700">{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Type */}
          <div>
            <p className="label mb-3">Travel Type</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {TRAVEL_TYPES.map(t => (
                <button key={t.id} onClick={() => setTravelType(t.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${
                    travelType === t.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(1)} disabled={!destination || !source}
            className="btn btn-lg btn-primary w-full disabled:opacity-50">
            Next: Dates & Travelers <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 1: Dates & Travelers ── */}
      {step === 1 && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <h2 className="text-lg font-bold text-slate-900">When & Who?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} className="input-field" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                min={startDate} className="input-field" />
            </div>
          </div>

          {startDate && endDate && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 text-sm text-brand-700 font-medium">
              📅 {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days · {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}

          <div>
            <label className="label">Number of Travelers</label>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="btn btn-sm btn-ghost w-8 h-8 p-0 rounded-xl font-bold text-lg">−</button>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{travelers}</p>
                <p className="text-xs text-slate-400">person{travelers > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setTravelers(Math.min(20, travelers + 1))} className="btn btn-sm btn-ghost w-8 h-8 p-0 rounded-xl font-bold text-lg">+</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn btn-lg btn-outline flex-1">← Back</button>
            <button onClick={() => setStep(2)} className="btn btn-lg btn-primary flex-1">Next: Budget <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Budget & Style ── */}
      {step === 2 && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <h2 className="text-lg font-bold text-slate-900">Budget & Preferences</h2>

          <div>
            <div className="flex justify-between mb-3">
              <label className="label mb-0">Total Budget</label>
              <span className="text-lg font-bold text-brand-600">₹{budget.toLocaleString('en-IN')}</span>
            </div>
            <input type="range" min={2000} max={500000} step={500} value={budget}
              onChange={e => setBudget(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹2K (Budget)</span>
              <span>₹{budgetPerDay.toLocaleString('en-IN')}/day</span>
              <span>₹5L (Ultra Luxury)</span>
            </div>
            {/* Budget breakdown bars */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[
                { label: '✈️ Travel', val: Math.round(budget * 0.35), color: 'text-blue-600' },
                { label: '🏨 Hotel', val: Math.round(budget * 0.30), color: 'text-violet-600' },
                { label: '🍔 Food', val: Math.round(budget * 0.15), color: 'text-amber-600' },
                { label: '🎫 Activities', val: Math.round(budget * 0.12), color: 'text-green-600' },
                { label: '💼 Other', val: Math.round(budget * 0.08), color: 'text-slate-500' },
              ].map(b => (
                <div key={b.label} className="text-center bg-slate-50 rounded-2xl p-2.5">
                  <p className="text-[10px] text-slate-400">{b.label}</p>
                  <p className={`text-xs font-bold ${b.color} mt-0.5`}>₹{(b.val / 1000).toFixed(1)}K</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Hotel Class</label>
              <select value={accommodation} onChange={e => setAccommodation(e.target.value)} className="select-field">
                <option value="Budget">Budget (OYO/Hostel)</option>
                <option value="Mid-range">Mid-range (3-Star)</option>
                <option value="Premium">Premium (4-Star)</option>
                <option value="Luxury">Luxury (5-Star)</option>
              </select>
            </div>
            <div>
              <label className="label">Meal Preference</label>
              <select value={mealPref} onChange={e => setMealPref(e.target.value)} className="select-field">
                <option>Both</option>
                <option>Veg Only</option>
                <option>Non-Veg</option>
                <option>Skip</option>
              </select>
            </div>
            <div>
              <label className="label">Special Needs</label>
              <input type="text" value={specialNeeds} onChange={e => setSpecialNeeds(e.target.value)}
                placeholder="Wheelchair, Vegan, Photography..." className="input-field" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn btn-lg btn-outline flex-1">← Back</button>
            <button onClick={() => setStep(3)} className="btn btn-lg btn-primary flex-1">Review & Generate <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review & Generate ── */}
      {step === 3 && (
        <div className="card p-6 space-y-6 animate-slide-up">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ready to generate!</h2>
            <p className="text-slate-400 text-sm mt-0.5">Gemini AI will fetch live data for your exact dates</p>
          </div>

          {/* Destination preview */}
          <div className="relative h-32 rounded-2xl overflow-hidden">
            <DestinationImage
              name={destination}
              imageUrl={DESTINATION_HERO_IMAGES[destination.toLowerCase().trim()]}
              height="100%"
              borderRadius="0px"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 flex items-center px-5">
              <div>
                <p className="text-white font-black text-2xl">{destination}</p>
                <p className="text-white/70 text-sm">{numDays} days · {travelType} · {travelers} traveler{travelers > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-sm">
            {[
              { label: '🛫 From', value: source },
              { label: '📍 To', value: destination },
              { label: '📅 Dates', value: `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` },
              { label: '👥 Travelers', value: `${travelers} person${travelers > 1 ? 's' : ''} · ${travelType}` },
              { label: '💰 Budget', value: `₹${budget.toLocaleString('en-IN')} total` },
              { label: '🏨 Stay', value: accommodation },
              { label: '🍽️ Meals', value: mealPref },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-slate-400">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
            <p className="text-xs text-brand-700 font-semibold mb-2">🤖 What AI will do for you:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-brand-600">
              {['Fetch real Google Places attractions', 'Check live weather forecast', 'Calculate distances between spots', 'Filter weather-incompatible activities', 'Suggest budget-matched hotels', 'Generate optimized daily schedule'].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <Check size={10} /> {f}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn btn-lg btn-outline flex-1">← Edit</button>
            <button onClick={handleGenerate} className="btn btn-lg btn-primary flex-1 gap-2">
              <Sparkles size={16} /> Generate Itinerary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
