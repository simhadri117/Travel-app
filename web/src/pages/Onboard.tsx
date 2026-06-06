import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Loader, Camera, Check } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
];

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

export default function Onboard() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [role, setRole] = useState('traveler');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTheme = (id: string) => {
    if (selectedThemes.includes(id)) {
      setSelectedThemes(selectedThemes.filter(t => t !== id));
    } else {
      setSelectedThemes([...selectedThemes, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !homeCity) {
      setError('Please fill in your name and home city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/onboard', {
        name,
        profile_photo_url: avatar,
        home_city: homeCity,
        travel_preferences: selectedThemes,
        role
      });

      if (res.data.success) {
        auth.updateUser(res.data.data);
        navigate('/');
      } else {
        setError(res.data.error || 'Failed to update onboarding info');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-brand-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800">Welcome to WanderWise!</h1>
          <p className="text-slate-500 text-sm">Let's set up your profile to customize your experience.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selector */}
          <div className="flex flex-col items-center gap-3">
            <label className="label text-slate-500">Choose Profile Photo</label>
            <div className="relative">
              <img src={avatar} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-2 border-brand-500" />
              <div className="absolute bottom-0 right-0 bg-brand-600 p-2 rounded-full border-2 border-white text-white">
                <Camera size={14} />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              {PRESET_AVATARS.map((url) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => setAvatar(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 ${avatar === url ? 'border-brand-500 scale-110' : 'border-transparent'} transition-all`}
                >
                  <img src={url} alt="preset avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="label text-slate-500">Your Full Name</label>
              <input
                type="text"
                placeholder="Rohan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label text-slate-500">Home City</label>
              <input
                type="text"
                placeholder="New Delhi"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label text-slate-500">Select Travel Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="select-field"
              >
                <option value="traveler">Traveler</option>
                <option value="influencer">Travel Influencer</option>
                <option value="guide">Tour Guide</option>
                <option value="agency">Travel Agency</option>
              </select>
            </div>
          </div>

          {/* Travel Theme multi-select */}
          <div className="space-y-3">
            <label className="label text-slate-500 block">Select Travel Themes You Enjoy</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {THEMES.map((theme) => {
                const selected = selectedThemes.includes(theme.id);
                return (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={`py-2 px-3 text-xs rounded-full border font-semibold flex items-center justify-center gap-1 transition-all ${
                      selected 
                        ? 'bg-brand-50 border-brand-500 text-brand-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {theme.label}
                    {selected && <Check size={12} className="text-brand-600 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-lg btn-primary w-full mt-6 shadow-md"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Complete Setup & Enter App'}
          </button>
        </form>
      </div>
    </div>
  );
}
