import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { 
  User as UserIcon, Settings as SettingsIcon, Shield, 
  Users, Info, Check, Trash, Plus, Save
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
  const { user } = auth;

  // Active section tab: 'profile' | 'passengers' | 'about'
  const [activeSec, setActiveSec] = useState<'profile' | 'passengers' | 'about'>('profile');

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [homeCity, setHomeCity] = useState(user?.home_city || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_photo_url || '');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(user?.travel_preferences || []);
  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Passengers list states
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [pGender, setPGender] = useState('Male');

  useEffect(() => {
    // Load passengers from local storage
    const passengers = localStorage.getItem('ww_saved_passengers');
    if (passengers) {
      setSavedPassengers(JSON.parse(passengers));
    }
  }, []);

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

  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Left nav panel */}
      <div className="space-y-2 md:col-span-1">
        <button 
          onClick={() => setActiveSec('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${activeSec === 'profile' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-transparent'}`}
        >
          <UserIcon size={16} /> Edit Profile
        </button>
        <button 
          onClick={() => setActiveSec('passengers')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${activeSec === 'passengers' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-transparent'}`}
        >
          <Users size={16} /> Saved Travelers
        </button>
        <button 
          onClick={() => setActiveSec('about')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${activeSec === 'about' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-transparent'}`}
        >
          <Info size={16} /> App Info
        </button>
      </div>

      {/* Right Content panel */}
      <div className="md:col-span-3">
        {successMsg && (
          <div className="mb-4 p-3 bg-success/15 border border-success/30 text-success text-xs rounded-2xl text-center">
            {successMsg}
          </div>
        )}

        {/* 1. EDIT PROFILE */}
        {activeSec === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800">Edit Profile Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="label text-slate-600">Full Name</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field" required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="label text-slate-600">Home City</label>
                <input 
                  type="text" value={homeCity} onChange={(e) => setHomeCity(e.target.value)}
                  className="input-field" required 
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="label text-slate-600">Bio Description</label>
              <textarea 
                value={bio} onChange={(e) => setBio(e.target.value)}
                className="input-field resize-none" rows={3} 
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="label text-slate-600">Profile Photo URL</label>
              <input 
                type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                className="input-field font-mono" 
              />
            </div>

            {/* Travel Theme selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 block">Personalized Travel Themes</label>
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
                          ? 'bg-brand-50 border-brand-500 text-brand-700' 
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
              className="btn btn-primary btn-md font-bold"
            >
              <Save size={14} /> {savingProfile ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* 2. SAVED PASSENGERS */}
        {activeSec === 'passengers' && (
          <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800">Frequently Saved Travelers</h2>
            
            {/* Passenger list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {savedPassengers.length === 0 ? (
                <p className="text-xs text-slate-500">No travelers registered yet.</p>
              ) : (
                savedPassengers.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-slate-500 text-[10px]">Age: {p.age} | Gender: {p.gender}</p>
                    </div>
                    <button onClick={() => handleDeletePassenger(p.id)} className="text-red-500 hover:text-red-600 transition-colors">
                      <Trash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Passenger additions form */}
            <form onSubmit={handleAddPassenger} className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <h3 className="font-bold text-slate-800">Add New Traveler Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text" placeholder="Full Name" value={pName} onChange={(e) => setPName(e.target.value)}
                  className="input-field py-2 text-xs" required
                />
                <input 
                  type="number" placeholder="Age" value={pAge} onChange={(e) => setPAge(e.target.value)}
                  className="input-field py-2 text-xs" required
                />
                <select 
                  value={pGender} onChange={(e) => setPGender(e.target.value)}
                  className="select-field py-2 text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary py-2 px-4 text-xs font-bold">
                <Plus size={14} /> Save Traveler
              </button>
            </form>
          </div>
        )}

        {/* 3. APP INFO */}
        {activeSec === 'about' && (
          <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4 text-xs text-slate-600">
            <h2 className="text-base font-bold text-slate-800">WanderWise System Info</h2>
            <div className="space-y-2 border-b border-slate-100 pb-4 font-mono text-slate-500">
              <p><strong>App Version:</strong> 1.0.0-Beta</p>
              <p><strong>Database:</strong> MongoDB Atlas Search Active</p>
              <p><strong>API Version:</strong> /api/v1/ Express TS</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-2">Changelog Updates:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
                <li>Integrated AI Travel planner timeline generators.</li>
                <li>Simulated IRCTC berths selectors & RedBus decks maps.</li>
                <li>Razorpay checkout verifies sandbox responses natively.</li>
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
