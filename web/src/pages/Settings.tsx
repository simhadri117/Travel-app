import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { updateUserProfile, runFirebaseAudit, firestoreAuditStats, triggerSimulatedFailure } from '../services/firestore';
import { 
  User as UserIcon, Settings as SettingsIcon, Shield, 
  Users, Info, Check, Trash, Plus, Save, Compass,
  Star, Map, Heart, Award, Search, Building, Plane, MapPin, Globe, CreditCard
} from 'lucide-react';

const THEMES = [
  { id: 'beach', label: '🏖️ Beach' },
  { id: 'mountain', label: '🏔️ Mountain' },
  { id: 'culture', label: '🕌 Culture' },
  { id: 'adventure', label: '🧗 Adventure' },
  { id: 'spiritual', label: '📿 Spiritual' },
  { id: 'wildlife', label: '🦁 Wildlife' },
  { id: 'heritage', label: '🏰 Heritage' },
  { id: 'romantic', label: '💖 Romantic' },
  { id: 'family', label: '👨‍👩‍👧‍👦 Family' },
  { id: 'budget', label: '🪙 Budget' }
];

export default function Settings() {
  const auth = useAuthStore();
  const { user, openAuthModal, isAuthenticated } = auth;

  // Active section tab: 'passport' | 'profile' | 'passengers' | 'about' | 'firebase-report'
  const [activeSec, setActiveSec] = useState<'passport' | 'profile' | 'passengers' | 'about' | 'firebase-report'>('passport');

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [homeCity, setHomeCity] = useState(user?.home_city || 'Delhi');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_photo_url || '');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(user?.travel_preferences || []);
  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Passengers list states
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [pGender, setPGender] = useState('Male');

  // Firebase Audit diagnostic states
  const [auditData, setAuditData] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    // Load passengers from local storage
    const passengers = localStorage.getItem('ww_saved_passengers');
    if (passengers) {
      setSavedPassengers(JSON.parse(passengers));
    }
  }, []);

  useEffect(() => {
    if (activeSec === 'firebase-report') {
      const loadAudit = async () => {
        setLoadingAudit(true);
        try {
          const report = await runFirebaseAudit();
          setAuditData(report);
        } catch (err) {
          console.error('[Firebase Audit Run Failed]:', err);
        } finally {
          setLoadingAudit(false);
        }
      };
      loadAudit();
    }
  }, [activeSec]);

  const toggleTheme = (id: string) => {
    if (selectedThemes.includes(id)) {
      setSelectedThemes(selectedThemes.filter(t => t !== id));
    } else {
      setSelectedThemes([...selectedThemes, id]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMsg('');
    try {
      const res = await api.put('/profile', {
        name,
        bio,
        profile_photo_url: avatarUrl,
        home_city: homeCity,
        travel_preferences: selectedThemes
      });
      if (res.data.success) {
        // Sync profile update to Firestore
        try {
          await updateUserProfile({
            name,
            bio,
            profile_photo_url: avatarUrl,
            home_city: homeCity,
            travel_preferences: selectedThemes
          });
        } catch (fsErr) {
          console.error('[Firestore Profile Update Sync Failed]:', fsErr);
        }

        auth.updateUser(res.data.data);
        setSuccessMsg('Profile updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pAge) return;

    const list = [...savedPassengers, {
      id: Math.random().toString(),
      name: pName,
      age: pAge,
      gender: pGender
    }];

    setSavedPassengers(list);
    localStorage.setItem('ww_saved_passengers', JSON.stringify(list));
    
    setPName('');
    setPAge('');
  };

  const handleDeletePassenger = (id: string) => {
    const list = savedPassengers.filter(p => p.id !== id);
    setSavedPassengers(list);
    localStorage.setItem('ww_saved_passengers', JSON.stringify(list));
  };

  const pseudoPassportNo = user 
    ? `TS-${(user.name || 'EX').substring(0, 2).toUpperCase()}-${(user._id || '8842').substring(0, 4).toUpperCase()}`
    : 'TS-8842-AV';

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 pb-12">
      
      {/* Left Navigation Sidebar */}
      <div className="space-y-2 md:col-span-1">
        <button 
          onClick={() => setActiveSec('passport')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
            activeSec === 'passport' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
          }`}
        >
          <Globe size={16} /> Travel Passport
        </button>
        <button 
          onClick={() => setActiveSec('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
            activeSec === 'profile' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
          }`}
        >
          <UserIcon size={16} /> Edit Profile Settings
        </button>
        <button 
          onClick={() => setActiveSec('passengers')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
            activeSec === 'passengers' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
          }`}
        >
          <Users size={16} /> Saved Travelers
        </button>
        <button 
          onClick={() => setActiveSec('about')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
            activeSec === 'about' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
          }`}
        >
          <Info size={16} /> App Info
        </button>
        <button 
          onClick={() => setActiveSec('firebase-report')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
            activeSec === 'firebase-report' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
          }`}
        >
          <Shield size={16} /> Firebase Audit
        </button>
      </div>

      {/* Right Content panel */}
      <div className="md:col-span-3">
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl text-center">
            {successMsg}
          </div>
        )}

        {/* ================= 1. TRAVEL PASSPORT ================= */}
        {activeSec === 'passport' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pseudo Electronic Passport Card */}
            <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] flex flex-col md:flex-row min-h-[320px]">
              {/* Passport Left: Branding */}
              <div className="w-full md:w-1/3 bg-primary relative p-6 flex flex-col justify-between text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Globe size={120} />
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-85">Electronic Passport</div>
                  <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
                    {user?.name ? user.name.split(' ')[0] : 'Alexander'}<br/>
                    {user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : 'Vanguard'}
                  </h2>
                </div>
                <div className="z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                  <p className="text-[9px] font-bold uppercase tracking-wider">PASSPORT NO.</p>
                  <p className="font-mono text-sm sm:text-base font-bold tracking-widest mt-0.5">{pseudoPassportNo}</p>
                </div>
              </div>

              {/* Passport Right: Bio Details */}
              <div className="flex-1 p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-36 flex-shrink-0">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden grayscale contrast-125 border-4 border-slate-100 shadow-inner bg-slate-50">
                    <img 
                      alt="Passport Portrait" 
                      className="w-full h-full object-cover" 
                      src={user?.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                    />
                  </div>
                </div>
                <div className="flex-grow grid grid-cols-2 gap-y-4 gap-x-4 text-xs">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nationality</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">United World</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">14 MAY 1992</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Gender</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">M</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Authority</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">TRAVELSPHERE AI</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Passport Holder Signature</p>
                    <p className="font-serif italic text-base text-slate-600 mt-1">{user?.name || 'A. Vanguard'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Stats Bento Box */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] flex flex-col items-center justify-center">
                <Plane className="text-primary mb-1.5" size={20} />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total KM</p>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">142,500 <span className="text-[9px]">KM</span></p>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] flex flex-col items-center justify-center">
                <Building className="text-primary mb-1.5" size={20} />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nights Away</p>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">218</p>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] flex flex-col items-center justify-center">
                <Globe className="text-primary mb-1.5" size={20} />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Countries</p>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">34</p>
              </div>
            </div>

            {/* Countries Visited World Map Illustration */}
            <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-[0px_10px_30px_rgba(15,23,42,0.04)] relative">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Countries Visited</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Interactive tracker syncs from booking codes</p>
                </div>
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded">List View</span>
              </div>
              <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                <img 
                  alt="Global Map" 
                  className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcRaiodwJzwaKa0ld9U9N5vaiPNmVbe2-yt8S0j4oTO9psm_GM6x5Yk1jqzGRvsW7Q-mMcLd86BK6Eqi3wlIYF7ZYsBMtNPdfEPAn7w3TL3kZBVEwgZHWD-m1aOMWUe7QuJVhA_E7uDm4awm6D4GrcxwwnMPf-ZG8abAhGPjk2uMAtaUHwBcDINyfLbZJVhtHoDNR2iLq5xqa9eNDcgN4PzngpqfHRKTCEG1HUgDzaiJuAB3Zg7YvOdQv8vvTXy3nabMFZpE_kbBo"
                />
                <div className="relative z-10 flex gap-2 flex-wrap justify-center px-4 max-w-sm">
                  {['JP', 'CH', 'IT', 'NO', 'CA', 'NZ', 'IN', 'TH', 'ES'].map(c => (
                    <span key={c} className="w-9 h-6 rounded shadow-sm border border-slate-100 bg-white flex items-center justify-center font-bold text-[9px] text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Achievements Badge Milestones */}
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Milestone Badges</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Unlocked achievements based on travel logs</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {[
                  { title: 'Globe Trotter', desc: '5+ Continents', icon: Globe, color: 'text-primary bg-primary/10 border-primary/20', unlocked: true },
                  { title: 'Mountain Peak', desc: '10+ Hikes', icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', unlocked: true },
                  { title: 'Island Hopper', desc: 'Archipelagos', icon: Compass, color: 'text-amber-600 bg-amber-50 border-amber-100', unlocked: true },
                  { title: 'Lux Voyager', desc: '5-Star Elite', icon: Star, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', unlocked: true },
                  { title: 'Aurora Chaser', desc: 'Locked', icon: Shield, color: 'text-slate-350 bg-slate-50 border-slate-100 opacity-40', unlocked: false }
                ].map((a, i) => {
                  const BadgeIcon = a.icon;
                  return (
                    <div key={i} className="flex flex-col items-center p-3 rounded-2xl border text-center shadow-sm hover:scale-[1.03] transition-all bg-white">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${a.color}`}>
                        <BadgeIcon size={18} />
                      </div>
                      <p className="font-bold text-slate-800 text-[10px] truncate w-full">{a.title}</p>
                      <p className="text-[8px] text-slate-400 font-semibold mt-0.5">{a.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. EDIT PROFILE ================= */}
        {activeSec === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-6 animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Edit Profile Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs" required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Home City</label>
                <input 
                  type="text" value={homeCity} onChange={(e) => setHomeCity(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs" required 
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bio Description</label>
              <textarea 
                value={bio} onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-medium placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs resize-none" rows={3} 
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Profile Photo URL</label>
              <input 
                type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-mono placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs" 
              />
            </div>

            {/* Travel Theme selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Personalized Travel Themes</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => {
                  const selected = selectedThemes.includes(theme.id);
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => toggleTheme(theme.id)}
                      className={`py-1.5 px-3 text-[10px] rounded-full border font-semibold flex items-center gap-1 transition-all ${
                        selected 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" disabled={savingProfile}
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save size={14} /> {savingProfile ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* ================= 3. SAVED PASSENGERS ================= */}
        {activeSec === 'passengers' && (
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-6 animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Frequently Saved Travelers</h2>
            
            {/* Passenger list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {savedPassengers.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold pl-1 py-4">No travelers registered yet.</p>
              ) : (
                savedPassengers.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-slate-400 text-[10px] font-semibold">Age: {p.age} | Gender: {p.gender}</p>
                    </div>
                    <button onClick={() => handleDeletePassenger(p.id)} className="text-red-500 hover:text-red-600 transition-colors p-1">
                      <Trash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Passenger additions form */}
            <form onSubmit={handleAddPassenger} className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <h3 className="font-black text-slate-800 uppercase text-[10px]">Add New Traveler Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text" placeholder="Full Name" value={pName} onChange={(e) => setPName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs" required
                />
                <input 
                  type="number" placeholder="Age" value={pAge} onChange={(e) => setPAge(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 font-bold placeholder-slate-400 px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs" required
                />
                <select 
                  value={pGender} onChange={(e) => setPGender(e.target.value)}
                  className="w-full bg-slate-50 text-slate-850 font-bold px-4 py-2.5 rounded-xl border-0 focus:ring-1 focus:ring-primary focus:outline-none text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1">
                <Plus size={14} /> Save Traveler
              </button>
            </form>
          </div>
        )}

        {/* ================= 4. APP INFO ================= */}
        {activeSec === 'about' && (
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4 text-xs text-slate-500 font-medium animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">WanderWise System Info</h2>
            <div className="space-y-2 border-b border-slate-100 pb-4 font-mono text-[11px]">
              <p><strong>App Version:</strong> 1.0.0-Beta</p>
              <p><strong>Database:</strong> MongoDB Atlas Search Active</p>
              <p><strong>API Version:</strong> /api/v1/ Express TS</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Changelog Updates:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Integrated AI Travel planner timeline generators.</li>
                <li>Simulated IRCTC berths selectors &amp; RedBus decks maps.</li>
                <li>Razorpay checkout verifies sandbox responses natively.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSec === 'firebase-report' && (
          <div className="space-y-6 animate-fade-in text-xs font-medium">
            {/* Header / Diagnosis Pulse */}
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="text-primary" size={16} />
                  Firebase Persistence Diagnostics
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Real-time persistent state audit & CRUD logging console</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingAudit(true);
                    try {
                      const report = await runFirebaseAudit();
                      setAuditData(report);
                    } catch {} finally {
                      setLoadingAudit(false);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  disabled={loadingAudit}
                >
                  {loadingAudit ? 'Refreshing...' : 'Refresh Status'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerSimulatedFailure();
                    // trigger component state refresh to show new failure in the list
                    setAuditData({ ...auditData });
                  }}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl transition-all"
                >
                  Simulate Write Failure
                </button>
              </div>
            </div>

            {/* Service & Connection Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connected Services */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Connected Services</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Firebase Auth</span>
                    </div>
                    {auditData?.authConnected || firestoreAuditStats.connectedServices.auth ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-150 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">
                        Disconnected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Cloud Firestore</span>
                    </div>
                    {auditData?.firestoreConnected || firestoreAuditStats.connectedServices.firestore ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                        No Connection
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Operations metrics summary */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Audit Operations Analytics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Reads</p>
                    <p className="text-base font-black text-slate-800 mt-1">
                      {Object.values(firestoreAuditStats.collections).reduce((sum, c) => sum + c.reads, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Writes</p>
                    <p className="text-base font-black text-slate-800 mt-1">
                      {Object.values(firestoreAuditStats.collections).reduce((sum, c) => sum + c.writes, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Deletes</p>
                    <p className="text-base font-black text-slate-800 mt-1">
                      {Object.values(firestoreAuditStats.collections).reduce((sum, c) => sum + c.deletes, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Failures</p>
                    <p className="text-base font-black text-amber-700 mt-1">
                      {Object.values(firestoreAuditStats.collections).reduce((sum, c) => sum + c.failures, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection counts Checklist */}
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Collections Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {[
                  { name: 'users', count: auditData?.collectionCounts?.users ?? 0 },
                  { name: 'itineraries', count: auditData?.collectionCounts?.itineraries ?? 0 },
                  { name: 'bookings', count: auditData?.collectionCounts?.bookings ?? 0 },
                  { name: 'reels', count: auditData?.collectionCounts?.reels ?? 0 },
                  { name: 'favorites', count: auditData?.collectionCounts?.favorites ?? 0 }
                ].map((col) => {
                  const key = col.name as keyof typeof firestoreAuditStats.collections;
                  const stats = firestoreAuditStats.collections[key];
                  return (
                    <div key={col.name} className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1 text-center">
                      <p className="text-[10px] font-bold text-slate-800 capitalize">{col.name}</p>
                      <p className="text-lg font-black text-primary mt-1">{col.count} <span className="text-[9px] font-semibold text-slate-400">docs</span></p>
                      <div className="text-[8px] text-slate-400 font-bold mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                        <p>R: {stats?.reads ?? 0} | W: {stats?.writes ?? 0}</p>
                        <p>D: {stats?.deletes ?? 0} | F: {stats?.failures ?? 0}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Failed Writes List Console logs */}
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Failed Write Logs</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chronological record of failed mutations caught by try-catch wrappers</p>
                </div>
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {firestoreAuditStats.failedWritesList.length} Errors Caught
                </span>
              </div>

              {firestoreAuditStats.failedWritesList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold">
                  No failed writes detected. Persistence is fully operational.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-slate-700 text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Timestamp</th>
                        <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Collection</th>
                        <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Operation</th>
                        <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {firestoreAuditStats.failedWritesList.slice().reverse().map((log, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-400 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-3 font-bold text-slate-800 capitalize">{log.collection}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[9px]">{log.operation}</span></td>
                          <td className="p-3 font-semibold text-red-600 max-w-xs truncate" title={log.error}>{log.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
