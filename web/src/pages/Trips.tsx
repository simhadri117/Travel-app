import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import PlacePhoto from '../components/PlacePhoto';
import DestinationImage from '../components/DestinationImage';
import { 
  Map, Calendar, Plus, DollarSign, Download, 
  CheckSquare, Square, Trash, Edit, Check, ChevronRight, FileSpreadsheet,
  Compass, Send, Building, Utensils, Star, Camera, Briefcase, Clock,
  Navigation, Plane, Train, Bus, User, Film, BookOpen, ChevronUp, ChevronDown, Sparkles,
  RefreshCw, MapPin, Share2, HelpCircle, Shield, CreditCard
} from 'lucide-react';

export default function Trips() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [activeDetailTab, setActiveDetailTab] = useState<'itinerary' | 'bookings' | 'expenses' | 'checklist' | 'chat'>('itinerary');
  const [activeTimelineDay, setActiveTimelineDay] = useState<number>(1);

  // List states
  const [tripsList, setTripsList] = useState<any>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(false);

  // Creation form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Active detailed trip state
  const [activeDetailedTrip, setActiveDetailedTrip] = useState<any>(null);
  const [activeDetailedTripBookings, setActiveDetailedTripBookings] = useState<any[]>([]);
  const [activeDetailedTripItinerary, setActiveDetailedTripItinerary] = useState<any>(null);

  // Expense logger inputs
  const [expCategory, setExpCategory] = useState('transport');
  const [expAmount, setExpAmount] = useState('');
  const [expNote, setExpNote] = useState('');

  // Checklist input
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Journal inputs
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');

  // Collaborative invites & chat & shared splitting
  const [inviteEmailOrPhone, setInviteEmailOrPhone] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [balances, setBalances] = useState<any[]>([]);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitDesc, setSplitDesc] = useState('');

  const fetchTrips = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/trips');
      if (res.data.success) {
        setTripsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    }
  }, [isAuthenticated]);

  // 1. Create Trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName || !destination || !startDate || !endDate) return;
    setCreating(true);
    try {
      const res = await api.post('/trips', {
        name: tripName,
        destination,
        start_date: startDate,
        end_date: endDate
      });
      if (res.data.success) {
        setShowCreateModal(false);
        setTripName('');
        setDestination('');
        setStartDate('');
        setEndDate('');
        fetchTrips();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // 2. Open detailed view
  const fetchBalancesAndChat = async (tripId: string) => {
    try {
      const msgRes = await api.get(`/trips/${tripId}/messages`);
      if (msgRes.data.success) setChatMessages(msgRes.data.data);

      const balRes = await api.get(`/trips/${tripId}/balances`);
      if (balRes.data.success) setBalances(balRes.data.data.balances);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetailedView = async (tripId: string) => {
    try {
      const res = await api.get(`/trips/${tripId}`);
      if (res.data.success) {
        setActiveDetailedTrip(res.data.data.trip);
        setActiveDetailedTripBookings(res.data.data.bookings);
        setActiveDetailedTripItinerary(res.data.data.itinerary);
        await fetchBalancesAndChat(tripId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailOrPhone || !activeDetailedTrip) return;
    try {
      const res = await api.post(`/trips/${activeDetailedTrip._id}/invite`, { emailOrPhone: inviteEmailOrPhone });
      if (res.data.success) {
        alert('Friend added to trip successfully!');
        setInviteEmailOrPhone('');
        handleOpenDetailedView(activeDetailedTrip._id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invite.');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeDetailedTrip) return;
    try {
      const res = await api.post(`/trips/${activeDetailedTrip._id}/messages`, { message: chatInput });
      if (res.data.success) {
        setChatMessages([...chatMessages, res.data.data]);
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSharedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitAmount || !splitDesc || !activeDetailedTrip) return;

    const membersList = [activeDetailedTrip.user_id, ...(activeDetailedTrip.members || [])];
    const splitShare = Number(splitAmount) / membersList.length;
    const participants = membersList.map(memberId => ({
      user_id: memberId,
      share: splitShare
    }));

    try {
      const res = await api.post(`/trips/${activeDetailedTrip._id}/shared-expenses`, {
        amount: Number(splitAmount),
        description: splitDesc,
        participants
      });
      if (res.data.success) {
        setSplitAmount('');
        setSplitDesc('');
        const balRes = await api.get(`/trips/${activeDetailedTrip._id}/balances`);
        if (balRes.data.success) setBalances(balRes.data.data.balances);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Log Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !activeDetailedTrip) return;

    try {
      const res = await api.post(`/trips/${activeDetailedTrip._id}/expenses`, {
        category: expCategory,
        amount: Number(expAmount),
        date: new Date(),
        note: expNote
      });
      if (res.data.success) {
        setActiveDetailedTrip({ ...activeDetailedTrip, expense_logs: res.data.data });
        setExpAmount('');
        setExpNote('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Delete Expense
  const handleDeleteExpense = async (expId: string) => {
    if (!activeDetailedTrip) return;
    try {
      const res = await api.delete(`/trips/${activeDetailedTrip._id}/expenses/${expId}`);
      if (res.data.success) {
        setActiveDetailedTrip({ ...activeDetailedTrip, expense_logs: res.data.data });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Toggle packing checkmark
  const handleToggleChecklist = async (itemId: string, checkedState: boolean) => {
    if (!activeDetailedTrip) return;
    try {
      const res = await api.put(`/trips/${activeDetailedTrip._id}/checklist`, {
        itemId,
        checked: checkedState
      });
      if (res.data.success) {
        setActiveDetailedTrip({ ...activeDetailedTrip, packing_list: res.data.data });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Add Custom checklist item
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !activeDetailedTrip) return;

    try {
      const res = await api.put(`/trips/${activeDetailedTrip._id}/checklist`, {
        item: newChecklistItem
      });
      if (res.data.success) {
        setActiveDetailedTrip({ ...activeDetailedTrip, packing_list: res.data.data });
        setNewChecklistItem('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Add journal diary entry
  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !activeDetailedTrip) return;

    try {
      const res = await api.put(`/trips/${activeDetailedTrip._id}/journal`, {
        title: journalTitle,
        content: journalContent,
        date: new Date()
      });
      if (res.data.success) {
        setActiveDetailedTrip({ ...activeDetailedTrip, journal_entries: res.data.data });
        setJournalTitle('');
        setJournalContent('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotalExpenses = () => {
    if (!activeDetailedTrip) return 0;
    return activeDetailedTrip.expense_logs.reduce((acc: number, item: any) => acc + item.amount, 0);
  };

  return (
    <div className="space-y-6 max-w-container-max mx-auto px-4 pb-12">
      
      {/* ── TAB CONTROLS (TRIPS LIST VIEW) ───────────────────── */}
      {!activeDetailedTrip && (
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`text-sm font-bold pb-2 transition-all relative ${
                activeTab === 'upcoming' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-500 hover:text-slate-600'
              }`}
            >
              Upcoming Trips
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`text-sm font-bold pb-2 transition-all relative ${
                activeTab === 'past' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-500 hover:text-slate-600'
              }`}
            >
              Past Journeys
            </button>
          </div>
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal({
                  title: 'Create a New Trip',
                  subtitle: 'Sign in to name your trip, set your travel dates, and collaborate with friends.',
                  onSuccess: () => {
                    setShowCreateModal(true);
                  }
                });
                return;
              }
              setShowCreateModal(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus size={14} /> New Trip
          </button>
        </div>
      )}

      {/* ═════════════════ TAB VIEW: TRIPS LIST ═════════════════ */}
      {!activeDetailedTrip && (
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-16 px-6 bg-white border border-slate-100 rounded-[28px] space-y-6 max-w-xl mx-auto shadow-[0px_10px_30px_rgba(15,23,42,0.05)]">
              <div className="w-16 h-16 bg-primary/5 text-primary rounded-[20px] flex items-center justify-center mx-auto mb-2">
                <Map size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Your Travel Dashboard</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Sign in to create customized trips, invite travel buddies, log shared expenses, keep journals, and download travel tickets.
                </p>
              </div>
              <button
                onClick={() => openAuthModal({
                  title: 'Access Your Trips',
                  subtitle: 'Sign in to create, edit, and access your trips and collaborative features.'
                })}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
              >
                Sign In to Start Planning
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="animate-spin text-primary mb-2" size={24} />
              <p className="text-xs text-slate-400 font-bold">Loading your dashboard...</p>
            </div>
          ) : (tripsList[activeTab] || []).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] max-w-xl mx-auto space-y-4">
              <Compass size={40} className="text-slate-300 mx-auto" />
              <p className="text-sm text-slate-800 font-bold">No trips registered</p>
              <p className="text-xs text-slate-400">Tap "New Trip" to plan your next venture!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(tripsList[activeTab] || []).map((trip: any) => (
                <div 
                  key={trip._id} 
                  onClick={() => handleOpenDetailedView(trip._id)}
                  className="bg-white rounded-[24px] p-5 border border-slate-100 hover:border-slate-200 transition-all flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md group"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-800 group-hover:text-primary transition-colors truncate text-sm sm:text-base">{trip.name}</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium"><MapPin size={13} className="text-primary" /> {trip.destination}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-semibold">
                        <Calendar size={12} className="text-slate-400" /> {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors ml-4 flex-shrink-0">
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════ DETAILED VIEW SCREEN ═════════════════ */}
      {activeDetailedTrip && (
        <div className="space-y-6">
          {/* Header breadcrumb bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <button onClick={() => setActiveDetailedTrip(null)} className="hover:text-primary underline">My Trips</button>
              <ChevronRight size={12} />
              <span className="text-primary font-bold">{activeDetailedTrip.name}</span>
            </div>
            <button 
              onClick={() => setActiveDetailedTrip(null)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold py-1.5 px-4 rounded-xl transition-all shadow-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Banner cover photo container */}
          <div className="relative h-56 rounded-[28px] overflow-hidden border border-slate-100 shadow-md">
            <img src={activeDetailedTrip.cover_photo_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"} alt="Cover" className="w-full h-full object-cover brightness-[0.45]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black text-white/95 bg-primary/80 px-2 py-0.5 rounded-full w-fit mb-2 uppercase tracking-widest shadow-sm">Premium Route</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{activeDetailedTrip.name}</h1>
              <p className="text-xs text-slate-200 font-semibold flex items-center gap-1.5 mt-1.5">
                <MapPin size={12} className="text-primary-fixed-dim" /> {activeDetailedTrip.destination}
                <span className="text-slate-500">•</span>
                <Calendar size={12} className="text-primary-fixed-dim" /> {new Date(activeDetailedTrip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(activeDetailedTrip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Sub Navigation tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar pt-2">
            {[
              { id: 'itinerary', label: 'Itinerary Timeline', icon: Sparkles },
              { id: 'bookings', label: 'Bookings & Logs', icon: BookOpen },
              { id: 'expenses', label: 'Split Ledger & Expenses', icon: DollarSign },
              { id: 'checklist', label: 'Packing Checklist', icon: CheckSquare },
              { id: 'chat', label: 'Planning Chat & Invites', icon: Compass },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap -mb-px ${
                    isActive 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TabIcon size={14} className={isActive ? 'text-primary' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Render Active Tab Panel */}

          {/* ───────────────── TAB: ITINERARY TIMELINE ───────────────── */}
          {activeDetailTab === 'itinerary' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left sidebar: Day Picker */}
              <aside className="lg:col-span-3 flex flex-col gap-2 sticky top-4 h-fit">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-1">Trip Days</p>
                {activeDetailedTripItinerary && activeDetailedTripItinerary.days ? (
                  <div className="space-y-2">
                    {activeDetailedTripItinerary.days.map((day: any) => (
                      <button
                        key={day.day_number}
                        onClick={() => setActiveTimelineDay(day.day_number)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left border transform hover:scale-[1.01] ${
                          activeTimelineDay === day.day_number
                            ? 'bg-primary text-white border-primary shadow-md font-bold'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black">Day {day.day_number}</span>
                          <span className={`text-[10px] truncate max-w-[150px] mt-0.5 font-medium ${activeTimelineDay === day.day_number ? 'text-white/80' : 'text-slate-450'}`}>
                            {day.theme || 'Exploration'}
                          </span>
                        </div>
                        <ChevronRight size={14} className={activeTimelineDay === day.day_number ? 'text-white' : 'text-slate-400'} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 font-semibold">
                    No itinerary linked to this trip. Use the AI Trip Planner to create one.
                  </div>
                )}
                <button
                  onClick={() => alert('Add Day feature: AI will recalculate and extend your timeline dates.')}
                  className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 border border-dashed border-slate-200 text-primary hover:bg-primary/5 text-xs font-black rounded-2xl transition-all"
                >
                  <Plus size={14} /> Add Day
                </button>
              </aside>

              {/* Center timeline column */}
              <section className="lg:col-span-6 space-y-6">
                {activeDetailedTripItinerary && activeDetailedTripItinerary.days ? (
                  (() => {
                    const day = activeDetailedTripItinerary.days.find((d: any) => d.day_number === activeTimelineDay) || activeDetailedTripItinerary.days[0];
                    if (!day) return null;

                    return (
                      <div className="relative pl-6 animate-slide-up space-y-6">
                        <div className="absolute left-1.5 top-4 bottom-0 w-[2px] bg-slate-100 timeline-line" />

                        {/* Morning */}
                        {day.morning && (
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm border-2 border-white">
                                <span className="text-[10px]">🌅</span>
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm ml-4">Morning</h3>
                              <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">08:00 - 12:00</span>
                            </div>
                            <div className="ml-4 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all p-3 flex gap-4">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden relative border border-slate-50">
                                <PlacePhoto
                                  photoReference={day.morning.photo_reference}
                                  photoUrl={day.morning.photo_url}
                                  placeName={day.morning.activity_name}
                                  destination={activeDetailedTrip.destination}
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                  <span className="text-[9px] text-primary font-black uppercase tracking-wider">Top Attraction</span>
                                  <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate mt-0.5">{day.morning.activity_name}</h4>
                                  <p className="text-[11px] text-slate-450 line-clamp-2 mt-1 leading-relaxed">{day.morning.description}</p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2 flex-wrap gap-2">
                                  <span className="font-bold text-primary flex items-center gap-0.5"><Clock size={12} /> {day.morning.visit_duration_hours || 2} Hours</span>
                                  {day.morning.rating && (
                                    <span className="font-bold text-amber-500 flex items-center gap-0.5"><Star size={11} fill="currentColor" /> {day.morning.rating}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {day.travel_morning_to_afternoon && (
                              <div className="ml-4 py-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold italic">
                                <Navigation size={10} className="text-slate-450" />
                                <span>{day.travel_morning_to_afternoon.duration_minutes} min via {day.travel_morning_to_afternoon.mode} to next spot</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Afternoon */}
                        {day.afternoon && (
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white z-10 shadow-sm border-2 border-white">
                                <span className="text-[10px]">☀️</span>
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm ml-4">Afternoon</h3>
                              <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">12:00 - 17:00</span>
                            </div>
                            <div className="ml-4 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all p-3 flex gap-4">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden relative border border-slate-50">
                                <PlacePhoto
                                  photoReference={day.afternoon.photo_reference}
                                  photoUrl={day.afternoon.photo_url}
                                  placeName={day.afternoon.activity_name}
                                  destination={activeDetailedTrip.destination}
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                  <span className="text-[9px] text-secondary font-black uppercase tracking-wider">Mid-day Exploration</span>
                                  <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate mt-0.5">{day.afternoon.activity_name}</h4>
                                  <p className="text-[11px] text-slate-450 line-clamp-2 mt-1 leading-relaxed">{day.afternoon.description}</p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2 flex-wrap gap-2">
                                  <span className="font-bold text-secondary flex items-center gap-0.5"><Clock size={12} /> {day.afternoon.visit_duration_hours || 2} Hours</span>
                                  {day.afternoon.rating && (
                                    <span className="font-bold text-amber-500 flex items-center gap-0.5"><Star size={11} fill="currentColor" /> {day.afternoon.rating}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {day.travel_afternoon_to_evening && (
                              <div className="ml-4 py-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold italic">
                                <Navigation size={10} className="text-slate-450" />
                                <span>{day.travel_afternoon_to_evening.duration_minutes} min via {day.travel_afternoon_to_evening.mode} to next spot</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Evening */}
                        {day.evening && (
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white z-10 shadow-sm border-2 border-white">
                                <span className="text-[10px]">🌇</span>
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm ml-4">Evening</h3>
                              <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">17:00 - 21:00</span>
                            </div>
                            <div className="ml-4 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all p-3 flex gap-4">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden relative border border-slate-50">
                                <PlacePhoto
                                  photoReference={day.evening.photo_reference}
                                  photoUrl={day.evening.photo_url}
                                  placeName={day.evening.activity_name}
                                  destination={activeDetailedTrip.destination}
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                  <span className="text-[9px] text-slate-900 font-black uppercase tracking-wider">Sunset &amp; Nightlife</span>
                                  <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate mt-0.5">{day.evening.activity_name}</h4>
                                  <p className="text-[11px] text-slate-450 line-clamp-2 mt-1 leading-relaxed">{day.evening.description}</p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2 flex-wrap gap-2">
                                  <span className="font-bold text-slate-800 flex items-center gap-0.5"><Clock size={12} /> {day.evening.visit_duration_hours || 2.5} Hours</span>
                                  {day.evening.rating && (
                                    <span className="font-bold text-amber-500 flex items-center gap-0.5"><Star size={11} fill="currentColor" /> {day.evening.rating}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Lunch & Stay Row */}
                        <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {day.lunch && (
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 flex gap-2.5 items-center">
                              <span className="text-xl flex-shrink-0">🍱</span>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Lunch Suggestion</span>
                                <h5 className="font-bold text-slate-800 text-xs truncate leading-tight mt-0.5">{day.lunch.restaurant_name}</h5>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{day.lunch.cuisine}</p>
                              </div>
                            </div>
                          )}
                          {day.accommodation && (
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 flex gap-2.5 items-center">
                              <span className="text-xl flex-shrink-0">🏨</span>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Hotel Stay</span>
                                <h5 className="font-bold text-slate-800 text-xs truncate leading-tight mt-0.5">{day.accommodation.hotel_name}</h5>
                                <p className="text-[10px] font-bold text-primary mt-0.5">₹{day.accommodation.price_per_night?.toLocaleString('en-IN')}/night</p>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                    <Sparkles className="animate-bounce text-primary mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-400 font-bold">Select another tab to log expenses or chat with friends</p>
                  </div>
                )}
              </section>

              {/* Right column: Map & Sphere AI Chat */}
              <aside className="lg:col-span-3 flex flex-col gap-4">
                {/* Map Mini Frame */}
                <div className="bg-slate-100 border border-slate-200 rounded-[24px] overflow-hidden aspect-[4/3] relative shadow-sm group">
                  <iframe
                     title="Detailed Trip Map"
                     src={`https://maps.google.com/maps?q=${encodeURIComponent(activeDetailedTrip.destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                     className="w-full h-full border-0"
                     loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm">
                     📍 {activeDetailedTrip.destination}
                  </div>
                </div>

                {/* Sphere AI Micro chat card */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 flex flex-col justify-between h-[300px]">
                  <div className="border-b border-slate-50 pb-2 flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary" /> Sphere AI Planner
                    </span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  
                  {/* Messages stream list */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[11px]">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-slate-400 py-12">Ask Sphere AI to optimize routes or recommend meals!</p>
                    ) : (
                      chatMessages.slice(-4).map((m) => (
                        <div key={m._id} className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-primary">{m.sender_id?.name || 'Explorer'}: </span>
                          <span className="text-slate-700">{m.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-1.5 pt-2 border-t border-slate-50">
                    <input
                      type="text"
                      placeholder="Ask AI..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-50 border-0 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-400"
                    />
                    <button type="submit" className="bg-primary text-white p-2 rounded-xl hover:bg-primary/95 transition-colors">
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          )}

          {/* ───────────────── TAB: BOOKINGS & LOGS ───────────────── */}
          {activeDetailTab === 'bookings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 animate-slide-up">
              <div className="lg:col-span-2 space-y-6">
                {/* Bookings */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Bookings & Travel Tickets</h3>
                  {activeDetailedTripBookings.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-bold border border-slate-100">
                      No bookings logged under this trip.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeDetailedTripBookings.map((b) => (
                        <div key={b._id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center text-xs text-slate-700 hover:shadow-sm transition-all">
                          <div className="space-y-1">
                            <p className="font-black text-slate-800 uppercase flex items-center gap-1.5">
                              {b.booking_type === 'flight' ? <Plane size={14} className="text-primary" /> : b.booking_type === 'train' ? <Train size={14} className="text-primary" /> : <Bus size={14} className="text-primary" />}
                              {b.booking_type} Registered
                            </p>
                            <p className="text-slate-500 font-semibold">{b.journey_details.source} &rarr; {b.journey_details.destination}</p>
                            <p className="text-[10px] text-slate-400">Date: {b.journey_details.date}</p>
                          </div>
                          <a 
                            href={`http://127.0.0.1:5002/api/v1/tickets/download/${b._id}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 transition-all flex items-center gap-1"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Journal entry notes */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={16} className="text-primary" /> Journal &amp; Memories
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Keep a log of your favorite stories, meals, and thoughts from the road</p>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {activeDetailedTrip.journal_entries?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No diary notes logged yet. Capture your memories below!</p>
                    ) : (
                      activeDetailedTrip.journal_entries?.map((j: any) => (
                        <div key={j.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <h4 className="font-bold text-slate-800">{j.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(j.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{j.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddJournal} className="space-y-3 pt-4 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Title (e.g., Shibuya crossing at sunset)"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      required
                    />
                    <textarea
                      placeholder="Write your story..."
                      value={journalContent}
                      onChange={(e) => setJournalContent(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 text-slate-800 font-medium placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs resize-none"
                      required
                    />
                    <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                      Save Log
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── TAB: EXPENSES & SPLITS ───────────────── */}
          {activeDetailTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 animate-slide-up">
              {/* Left column: logs & splitting ledger */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Ledger balances splits */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Group Split Billing Ledger</h3>
                  <div className="space-y-2 text-xs">
                    {balances.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No shared expenses logged yet. Member balances will render here.</p>
                    ) : (
                      balances.map((b) => (
                        <div key={b.user_id} className="flex justify-between py-2.5 border-b border-slate-50 font-mono text-slate-700 items-center">
                          <span className="font-sans text-slate-700 font-bold text-xs">{b.name}</span>
                          <span className={`text-xs font-black ${b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {b.balance >= 0 ? `+₹${b.balance.toLocaleString('en-IN')}` : `-₹${Math.abs(b.balance).toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddSharedExpense} className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                    <p className="font-black text-slate-800 uppercase text-[10px]">Add Shared Group Expense (splits equally):</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dinner, Taxi, Entry ticket..."
                        value={splitDesc}
                        onChange={(e) => setSplitDesc(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Total Cost (₹)"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
                      Split Bill Equally
                    </button>
                  </form>
                </div>

                {/* Expense List Tracker */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Personal Expense Log</h3>
                    <a 
                      href={`http://127.0.0.1:5002/api/v1/trips/${activeDetailedTrip._id}/expenses/export`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-primary flex items-center gap-1 hover:underline font-bold"
                    >
                      <FileSpreadsheet size={13} /> Export CSV
                    </a>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex justify-between text-xs font-bold text-slate-700">
                    <span>Total Expense:</span>
                    <span className="text-primary font-black text-sm">₹{calculateTotalExpenses().toLocaleString('en-IN')}</span>
                  </div>

                  {/* List */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activeDetailedTrip.expense_logs?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No manual expenses logged yet.</p>
                    ) : (
                      activeDetailedTrip.expense_logs?.map((e: any) => (
                        <div key={e.id} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 border border-slate-50 p-2.5 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-800 capitalize">{e.category}</p>
                            {e.note && <p className="text-[10px] text-slate-500 italic mt-0.5">{e.note}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-850">₹{e.amount}</span>
                            <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:text-red-650 p-1">
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddExpense} className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <p className="font-black text-slate-800 uppercase text-[10px]">Log Personal Expense:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 font-bold px-4 py-2 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      >
                        <option value="transport">Transit</option>
                        <option value="accommodation">Hotel</option>
                        <option value="food">Food</option>
                        <option value="activities">Sights</option>
                        <option value="misc">Misc</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Note details..."
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    />
                    <button type="submit" className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
                      Log Expense
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* ───────────────── TAB: CHECKLIST ───────────────── */}
          {activeDetailTab === 'checklist' && (
            <div className="max-w-xl pt-2 animate-slide-up mx-auto">
              <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={16} className="text-primary" /> Packing Checklist
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Mark things off as you assemble your bag</p>
                </div>
                
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {activeDetailedTrip.packing_list?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No checklist items. Add one below!</p>
                  ) : (
                    activeDetailedTrip.packing_list?.map((p: any) => (
                      <div 
                        key={p.id}
                        onClick={() => handleToggleChecklist(p.id, !p.checked)}
                        className="flex items-center gap-3 text-xs cursor-pointer hover:text-primary transition-all text-slate-700 font-bold py-2 border-b border-slate-50"
                      >
                        {p.checked ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-slate-350" />}
                        <span className={p.checked ? 'line-through text-slate-400 font-medium' : ''}>{p.item}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-4 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Add custom checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="flex-grow bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    required
                  />
                  <button type="submit" className="border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm">
                    Add Item
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ───────────────── TAB: CHAT & INVITES ───────────────── */}
          {activeDetailTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 animate-slide-up">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Chat Frame */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] flex flex-col h-[420px]">
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Compass size={16} className="text-primary" /> Group Coordination Chat
                  </h3>
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-xs text-slate-700 custom-scrollbar mb-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 font-bold">
                        No messages in chat. Type below to say hello and start planning!
                      </div>
                    ) : (
                      chatMessages.map((m) => (
                        <div key={m._id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                            <span>{m.sender_id?.name || 'Explorer'}</span>
                            <span className="text-[8px] text-slate-400 font-semibold">{new Date(m.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-700 font-semibold text-xs leading-relaxed">{m.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Type planning notes..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-grow bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      required
                    />
                    <button type="submit" className="bg-primary text-white rounded-xl px-5 py-2 text-xs font-bold shadow-sm transition-all hover:bg-primary/95">
                      Send message
                    </button>
                  </form>
                </div>

                {/* Invite members */}
                <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Invite Travel Buddies</h3>
                  <form onSubmit={handleInviteMember} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter friend's email or phone number..."
                      value={inviteEmailOrPhone}
                      onChange={(e) => setInviteEmailOrPhone(e.target.value)}
                      className="flex-grow bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                      required
                    />
                    <button type="submit" className="bg-primary text-white rounded-xl px-5 py-2.5 text-xs font-bold whitespace-nowrap shadow-sm transition-all hover:bg-primary/95">
                      Send Invitation
                    </button>
                  </form>
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <p className="font-black text-slate-800 uppercase text-[10px]">Trip Members:</p>
                    <div className="flex items-center gap-2.5 text-slate-700 font-bold py-1">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/10">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div className="flex flex-col">
                        <span>{user?.name || 'Lead Organizer'}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Host Organizer</span>
                      </div>
                    </div>
                    {activeDetailedTrip.members && activeDetailedTrip.members.length > 0 && (
                      activeDetailedTrip.members?.map((mId: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2.5 text-slate-700 font-bold py-1">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] border border-slate-200">
                            M
                          </div>
                          <span>Guest Traveler {idx + 1}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ═════════════════ CREATE TRIP MODAL ═════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateTrip} className="w-full max-w-md bg-white border border-slate-100 rounded-[28px] p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-wider">Create a New Trip</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Trip Name</label>
                <input
                  type="text"
                  placeholder="e.g., Goa Golden Coast holiday"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Destination</label>
                <input
                  type="text"
                  placeholder="e.g., Goa, India"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 font-bold px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-black rounded-2xl text-xs shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.15)] disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              {creating ? 'Creating...' : 'Create Trip'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
