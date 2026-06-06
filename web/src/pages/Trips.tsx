import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { 
  Map, Calendar, Plus, DollarSign, Download, 
  CheckSquare, Square, Trash, Edit, Check, ChevronRight, FileSpreadsheet,
  Compass, Send
} from 'lucide-react';

export default function Trips() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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
    <div className="space-y-6">
      
      {/* Tab controls */}
      {!activeDetailedTrip && (
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`text-sm font-bold pb-2 transition-all ${activeTab === 'upcoming' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Upcoming Trips
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`text-sm font-bold pb-2 transition-all ${activeTab === 'past' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
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
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 px-4 rounded-2xl flex items-center gap-1 transition-all shadow-sm"
          >
            <Plus size={14} /> New Trip
          </button>
        </div>
      )}

      {/* ================= TAB VIEW: TRIPS LIST ================= */}
      {!activeDetailedTrip && (
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-16 px-6 card rounded-3xl space-y-6 border border-slate-100 bg-white max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <Map size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 font-sans">Your Travel Dashboard</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Sign in to create customized trips, invite travel buddies, log shared expenses, keep journals, and download travel tickets.
                </p>
              </div>
              <button
                onClick={() => openAuthModal({
                  title: 'Access Your Trips',
                  subtitle: 'Sign in to create, edit, and access your trips and collaborative features.'
                })}
                className="btn btn-primary btn-md w-full sm:w-auto font-bold mx-auto"
              >
                Sign In to Start Planning
              </button>
            </div>
          ) : loading ? (
            <p className="text-center text-xs text-gray-500 py-10">Loading your dashboard...</p>
          ) : (tripsList[activeTab] || []).length === 0 ? (
            <div className="text-center py-10 card border-slate-100 text-slate-500 text-xs">
              No trips registered under this category. Tap "New Trip" to plan manually!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(tripsList[activeTab] || []).map((trip: any) => (
                <div 
                  key={trip._id} 
                  onClick={() => handleOpenDetailedView(trip._id)}
                  className="card p-5 border border-slate-100 hover:border-slate-200 transition-all flex justify-between items-center cursor-pointer bg-white shadow-sm hover:shadow-md"
                >
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-800">{trip.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5"><Map size={12} /> {trip.destination}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Calendar size={10} /> {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= DETAILED VIEW SCREEN ================= */}
      {activeDetailedTrip && (
        <div className="space-y-6">
          {/* Back button */}
          <button 
            onClick={() => setActiveDetailedTrip(null)}
            className="btn btn-outline btn-sm font-bold text-xs"
          >
            ← Back to Dash
          </button>

          {/* Banner header info */}
          <div className="relative h-48 rounded-3xl overflow-hidden border border-slate-100 shadow-md">
            <img src={activeDetailedTrip.cover_photo_url} alt="Cover" className="w-full h-full object-cover brightness-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h1 className="text-2xl font-black text-white">{activeDetailedTrip.name}</h1>
              <p className="text-xs text-slate-200 italic">{activeDetailedTrip.destination}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Booking Timeline & AI Itineraries */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Timeline bookings */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bookings Timeline</h3>
                {activeDetailedTripBookings.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">No bookings linked to these trip dates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activeDetailedTripBookings.map((b) => (
                      <div key={b._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs text-slate-700">
                        <div>
                          <p className="font-extrabold text-slate-850 uppercase">{b.booking_type} Confirmed</p>
                          <p className="text-slate-500">{b.journey_details.source} &rarr; {b.journey_details.destination}</p>
                          <p className="text-[10px] text-slate-400">Date: {b.journey_details.date}</p>
                        </div>
                        <a 
                          href={`http://127.0.0.1:5001/api/v1/tickets/download/${b._id}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-outline btn-sm py-1.5 text-[10px]"
                        >
                          Ticket PDF
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Journal Notes entries */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Trip Journal Logs</h3>
                
                {/* Journal logs list */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activeDetailedTrip.journal_entries?.length === 0 ? (
                    <p className="text-xs text-gray-500">Write your first daily log below!</p>
                  ) : (
                    activeDetailedTrip.journal_entries?.map((j: any) => (
                      <div key={j.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <h4 className="font-bold text-slate-800">{j.title}</h4>
                          <span className="text-[10px] text-slate-400">{new Date(j.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{j.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Log Entry form */}
                <form onSubmit={handleAddJournal} className="space-y-3 pt-4 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Log title (e.g. Day 1: Exploring Forts)"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    className="input-field text-xs py-2"
                    required
                  />
                  <textarea
                    placeholder="Write details of your experience today..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    rows={3}
                    className="input-field text-xs py-2 resize-none"
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm font-bold">
                    Save Diary Note
                  </button>
                </form>
              </div>

              {/* Collaborative Friend Invites */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invite Travel Buddies</h3>
                <form onSubmit={handleInviteMember} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Email or Phone Number..."
                    value={inviteEmailOrPhone}
                    onChange={(e) => setInviteEmailOrPhone(e.target.value)}
                    className="flex-1 input-field text-xs py-2"
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Invite
                  </button>
                </form>
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <p className="font-bold text-slate-800 uppercase text-[10px]">Trip Members:</p>
                  <p className="flex items-center gap-2">• Owner (Lead Organizer)</p>
                  {activeDetailedTrip.members && activeDetailedTrip.members.length === 0 ? (
                    <p className="text-[10px] text-gray-500">No members invited yet. Add your buddies!</p>
                  ) : (
                    activeDetailedTrip.members?.map((mId: string, idx: number) => (
                      <p key={idx} className="flex items-center gap-2">• Guest Traveler {idx + 1}</p>
                    ))
                  )}
                </div>
              </div>

              {/* Group Chat Messages */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4 flex flex-col h-[300px]">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Group Planning Chat</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-700">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 py-10 font-sans">No messages in chat. Type below to say hello!</p>
                  ) : (
                    chatMessages.map((m) => (
                      <div key={m._id} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-brand-600">
                          <span>{m.sender_id?.name || 'Explorer'}</span>
                          <span className="text-[8px] text-slate-400">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-700">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 input-field text-xs py-1.5"
                    required
                  />
                  <button type="submit" className="btn btn-primary px-4 text-xs">
                    Send
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Packing Checklist & Expenses */}
            <div className="space-y-6">
              
              {/* Checklist */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Packing Checklist</h3>
                
                {/* Packing items list */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeDetailedTrip.packing_list?.map((p: any) => (
                    <div 
                      key={p.id}
                      onClick={() => handleToggleChecklist(p.id, !p.checked)}
                      className="flex items-center gap-3 text-xs cursor-pointer hover:text-brand-650 transition-all text-slate-600 font-medium"
                    >
                      {p.checked ? <CheckSquare size={16} className="text-success" /> : <Square size={16} />}
                      <span className={p.checked ? 'line-through text-slate-400' : ''}>{p.item}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Add custom item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="flex-1 input-field text-xs py-1.5"
                    required
                  />
                  <button type="submit" className="btn btn-outline px-3 text-xs">
                    Add
                  </button>
                </form>
              </div>

              {/* Expense Tracker */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-1">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Expenses</h3>
                  <a 
                    href={`http://127.0.0.1:5001/api/v1/trips/${activeDetailedTrip._id}/expenses/export`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-brand-600 flex items-center gap-1 hover:underline"
                  >
                    <FileSpreadsheet size={12} /> Export CSV
                  </a>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between text-xs font-bold mb-2 text-slate-700">
                  <span>Logged Expense:</span>
                  <span className="text-brand-600 font-extrabold">₹{calculateTotalExpenses()}</span>
                </div>

                {/* Expense logs list */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {activeDetailedTrip.expense_logs?.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center text-xs text-slate-650 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{e.category}</p>
                        {e.note && <p className="text-[10px] text-slate-400 italic">{e.note}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">₹{e.amount}</span>
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-brand-500 hover:text-brand-600">
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expense addition form */}
                <form onSubmit={handleAddExpense} className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="select-field text-xs py-1.5"
                    >
                      <option value="transport" className="bg-white">Transit</option>
                      <option value="accommodation" className="bg-white">Hotel</option>
                      <option value="food" className="bg-white">Food</option>
                      <option value="activities" className="bg-white">Sights</option>
                      <option value="misc" className="bg-white">Misc</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="input-field text-xs py-1.5"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Short description note"
                    value={expNote}
                    onChange={(e) => setExpNote(e.target.value)}
                    className="input-field text-xs py-1.5"
                  />
                  <button type="submit" className="btn btn-primary btn-md w-full font-bold">
                    Log Expense
                  </button>
                </form>
              </div>

              {/* Shared Expense Splits Billing Ledger */}
              <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Shared Split Bills</h3>
                
                {/* Ledger balances */}
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-650 uppercase text-[10px]">Net Member Balances:</p>
                  {balances.map((b) => (
                    <div key={b.user_id} className="flex justify-between py-1 border-b border-slate-100 font-mono text-slate-700">
                      <span className="font-sans text-slate-500">{b.name}</span>
                      <span className={b.balance >= 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {b.balance >= 0 ? `+₹${b.balance}` : `-₹${Math.abs(b.balance)}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Split Bill Form */}
                <form onSubmit={handleAddSharedExpense} className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <p className="font-bold text-slate-650 uppercase text-[10px]">Log Shared Expense (Splits Equally):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Dinner, Cab, Sights..."
                      value={splitDesc}
                      onChange={(e) => setSplitDesc(e.target.value)}
                      className="input-field text-xs py-1.5"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Amount"
                      value={splitAmount}
                      onChange={(e) => setSplitAmount(e.target.value)}
                      className="input-field text-xs py-1.5"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-md w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                    Split Bill Equally
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= CREATE TRIP MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateTrip} className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-800 text-lg">Create a New Trip</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="label">Trip Name</label>
                <input
                  type="text"
                  placeholder="Jaipur Cultural Explorer"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="label">Destination</label>
                <input
                  type="text"
                  placeholder="Jaipur, Rajasthan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn btn-lg btn-primary w-full disabled:opacity-50 text-xs"
            >
              Create Trip
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
