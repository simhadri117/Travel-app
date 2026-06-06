import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import {
  Compass, Plane, Train, Bus, Newspaper,
  Settings, LogOut, Bell, Search, X, Check,
  Building, Home, MessageSquare, Film, Award,
  Map, Sparkles, ChevronDown, User, Phone, Shield
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth } from '../services/firebase';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { name: 'Home', icon: Compass, path: '/' },
  { name: 'Plan Trip', icon: Sparkles, path: '/planner' },
  { name: 'Flights', icon: Plane, path: '/flights' },
  { name: 'Trains', icon: Train, path: '/trains' },
  { name: 'Buses', icon: Bus, path: '/buses' },
  { name: 'Hotels', icon: Building, path: '/hotels' },
  { name: 'Homestays', icon: Home, path: '/homestays' },
  { name: 'AI Assistant', icon: MessageSquare, path: '/assistant' },
  { name: 'Travel Reels', icon: Film, path: '/reels' },
  { name: 'Explore Map', icon: Map, path: '/maps' },
  { name: 'Rewards', icon: Award, path: '/rewards' },
  { name: 'Community', icon: Newspaper, path: '/social' },
  { name: 'My Trips', icon: Map, path: '/trips' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

const mobileNav = [
  { name: 'Home', icon: Compass, path: '/' },
  { name: 'Explore', icon: Plane, path: '/flights' },
  { name: 'Trips', icon: Map, path: '/trips' },
  { name: 'Reels', icon: Film, path: '/reels' },
  { name: 'Profile', icon: User, path: '/settings' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user, login, logout,
    isAuthModalOpen, authModalTitle, authModalSubtitle, authModalOnSuccess, closeAuthModal
  } = useAuthStore();

  // Modal local state
  const [modalView, setModalView] = useState<'options' | 'phone' | 'email'>('options');
  const [modalPhone, setModalPhone] = useState('');
  const [modalOtp, setModalOtp] = useState(['', '', '', '', '', '']);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhoneStep, setModalPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!isAuthModalOpen) {
      setModalView('options');
      setModalPhone('');
      setModalOtp(['', '', '', '', '', '']);
      setModalEmail('');
      setModalPhoneStep('phone');
      setModalError('');
      setModalLoading(false);
    }
  }, [isAuthModalOpen]);

  const handleModalGoogleSignIn = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const res = await api.post('/auth/google', { idToken });
      if (res.data.success) {
        await handleAuthSuccess(res.data.data.token, res.data.data.user);
      } else {
        setModalError(res.data.error || 'Google login failed');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setModalError(err.response?.data?.error || err.message || 'Google Sign-In failed.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (modalPhone.length < 10) { setModalError('Please enter a valid phone number'); return; }
    setModalLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: `+91${modalPhone}` });
      if (res.data.success) setModalPhoneStep('otp');
      else setModalError(res.data.error || 'Failed to send OTP');
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to send OTP.');
    } finally { setModalLoading(false); }
  };

  const handleModalVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = modalOtp.join('');
    if (otpStr.length < 6) { setModalError('Enter all 6 digits'); return; }
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone: `+91${modalPhone}`, otp: otpStr });
      if (res.data.success) {
        await handleAuthSuccess(res.data.data.token, res.data.data.user);
      } else setModalError(res.data.error || 'Invalid OTP');
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Verification failed.');
    } finally { setModalLoading(false); }
  };

  const handleModalEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim()) { setModalError('Email is required'); return; }
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api.post('/auth/email', { email: modalEmail.trim() });
      if (res.data.success) {
        await handleAuthSuccess(res.data.data.token, res.data.data.user);
      } else {
        setModalError(res.data.error || 'Email login failed');
      }
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Email login failed.');
    } finally { setModalLoading(false); }
  };

  const handleAuthSuccess = async (authToken: string, userData: any) => {
    login(authToken, userData);
    
    // Sync guest itineraries
    const drafts = JSON.parse(localStorage.getItem('ts_draft_itineraries') || '[]');
    if (drafts.length > 0) {
      try {
        await api.post('/itineraries/sync', { itinerary_ids: drafts }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        localStorage.removeItem('ts_draft_itineraries');
      } catch (err) {
        console.error('Failed to sync itineraries', err);
      }
    }
    
    if (authModalOnSuccess) {
      authModalOnSuccess();
    }
    closeAuthModal();
  };

  const handleModalOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...modalOtp];
    next[idx] = val.slice(-1);
    setModalOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`modal-otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleModalOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !modalOtp[idx] && idx > 0) {
      document.getElementById(`modal-otp-${idx - 1}`)?.focus();
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n: any) => !n.read).length);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try { await api.put('/notifications/read-all'); fetchNotifications(); } catch {}
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col md:flex-row">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 overflow-hidden flex-shrink-0">
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-6 py-5 border-b border-slate-50 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-700 transition-colors">
            <span className="text-white text-sm font-bold">✈</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm tracking-tight leading-none">TravelSphere</p>
            <p className="text-brand-600 text-[10px] font-semibold tracking-widest uppercase mt-0.5">AI</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`nav-item w-full text-left ${isActive(item.path) ? 'nav-item-active' : ''}`}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <span>{item.name}</span>
              {item.name === 'AI Assistant' && (
                <span className="ml-auto badge badge-blue text-[9px] py-0.5 px-1.5">AI</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Card */}
        {user ? (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={user.profile_photo_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user.name}`}
                alt={user.name || 'User'}
                className="w-9 h-9 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'Explorer'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email || user.phone}</p>
              </div>
              <ChevronDown size={14} className="text-slate-300 flex-shrink-0" />
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn btn-sm btn-ghost w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => useAuthStore.getState().openAuthModal({
                title: 'Sign In to TravelSphere',
                subtitle: 'Unlock custom trip plans, active booking history, and social sharing.'
              })}
              className="btn btn-md btn-primary w-full gap-2 rounded-2xl"
            >
              <User size={16} /> Sign in
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP HEADER ─────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          <div className="flex items-center gap-4 px-5 py-3.5">

            {/* Mobile Logo */}
            <div
              className="md:hidden flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="w-7 h-7 bg-brand-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-bold">✈</span>
              </div>
              <span className="font-bold text-slate-900 text-sm">TravelSphere</span>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className={`hidden sm:flex items-center gap-2 bg-slate-50 border rounded-2xl px-4 py-2.5 flex-1 max-w-sm
                         transition-all duration-200 ${searchFocused ? 'border-brand-400 bg-white ring-2 ring-brand-100' : 'border-slate-200'}`}
            >
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search destinations, hotels, flights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none flex-1"
              />
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-2xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-3xl shadow-panel p-4 z-50 max-h-96 overflow-y-auto animate-slide-up">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[11px] text-brand-600 font-semibold hover:underline">
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No new notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 rounded-2xl text-xs transition-all cursor-pointer ${
                              n.read ? 'bg-slate-50 text-slate-500' : 'bg-brand-50 border border-brand-100'
                            }`}
                          >
                            {!n.read && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full inline-block mr-2" />}
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <p className="text-slate-500 mt-0.5">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar / Sign In */}
              {user ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={user.profile_photo_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-xl object-cover bg-slate-100"
                  />
                  <span className="hidden md:block text-sm font-medium text-slate-700">
                    {user.name?.split(' ')[0] || 'Explorer'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => useAuthStore.getState().openAuthModal({
                    title: 'Sign In to TravelSphere',
                    subtitle: 'Unlock custom trip plans, active booking history, and social sharing.'
                  })}
                  className="btn btn-sm btn-outline gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                >
                  <User size={13} /> Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ──────────────────────────────────── */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── FLOATING AI BUTTON ──────────────────────────────── */}
      <div className="relative">
        <button
          onClick={() => setShowAIMenu(!showAIMenu)}
          className="ai-fab md:bottom-8 md:right-8 animate-bounce-soft"
          aria-label="AI Assistant"
        >
          <Sparkles size={22} />
        </button>

        {showAIMenu && (
          <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-50 bg-white border border-slate-100 rounded-3xl shadow-panel p-3 space-y-1 animate-slide-up w-48">
            <button onClick={() => { navigate('/planner'); setShowAIMenu(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
              <span className="text-base">🗺️</span> Plan a Trip
            </button>
            <button onClick={() => { navigate('/assistant'); setShowAIMenu(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
              <span className="text-base">💬</span> AI Assistant
            </button>
            <button onClick={() => { navigate('/flights'); setShowAIMenu(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
              <span className="text-base">✈️</span> Quick Search
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex items-center justify-around z-40 safe-bottom">
        {mobileNav.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                active ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className={`text-[10px] font-semibold ${active ? 'text-brand-600' : 'text-slate-400'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── AUTHENTICATION MODAL ─────────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[12px] p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-6 relative border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{authModalTitle}</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{authModalSubtitle}</p>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2.5 text-xs text-red-600">
                {modalError}
              </div>
            )}

            {/* View 1: Default Options */}
            {modalView === 'options' && (
              <div className="space-y-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleModalGoogleSignIn}
                  disabled={modalLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl shadow-sm transition-colors text-xs"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Phone */}
                <button
                  type="button"
                  onClick={() => setModalView('phone')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl transition-colors text-xs border border-slate-100"
                >
                  <Phone size={14} className="text-slate-500" />
                  <span>Continue with Phone</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={() => setModalView('email')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl transition-colors text-xs border border-slate-100"
                >
                  <span className="text-sm leading-none">✉️</span>
                  <span>Continue with Email</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => alert('Apple sign-in is not supported on this platform.')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl transition-colors text-xs border border-slate-100"
                >
                  <span className="text-base leading-none">🍎</span>
                  <span>Continue with Apple</span>
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            )}

            {/* View 2: Phone Input / OTP */}
            {modalView === 'phone' && (
              <div className="space-y-4">
                {modalPhoneStep === 'phone' ? (
                  <form onSubmit={handleModalSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="label text-[10px]">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex-shrink-0 text-xs">
                          <span>🇮🇳</span>
                          <span className="font-semibold text-slate-700">+91</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={modalPhone}
                          onChange={e => setModalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="input-field flex-1 text-xs py-2"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={modalLoading || modalPhone.length < 10}
                      className="btn btn-md btn-primary w-full disabled:opacity-50 text-xs"
                    >
                      {modalLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleModalVerifyOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="label text-[10px]">Verification Code (Use 123456)</label>
                      <div className="flex gap-2 justify-between">
                        {modalOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`modal-otp-${idx}`}
                            type="tel"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleModalOtpChange(e.target.value, idx)}
                            onKeyDown={e => handleModalOtpKeyDown(e, idx)}
                            className={`w-10 h-12 text-center text-lg font-bold border rounded-xl bg-slate-50 text-slate-900
                                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white
                                       transition-all ${digit ? 'border-brand-400 bg-brand-50' : 'border-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={modalLoading || modalOtp.join('').length < 6}
                      className="btn btn-md btn-primary w-full disabled:opacity-50 text-xs"
                    >
                      {modalLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => { setModalView('options'); setModalPhoneStep('phone'); setModalError(''); }}
                  className="w-full text-center text-xs font-semibold text-brand-600 hover:underline pt-2"
                >
                  &larr; Back to options
                </button>
              </div>
            )}

            {/* View 3: Email Input */}
            {modalView === 'email' && (
              <div className="space-y-4">
                <form onSubmit={handleModalEmailLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="label text-[10px]">Email Address</label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={modalEmail}
                      onChange={e => setModalEmail(e.target.value)}
                      className="input-field text-xs py-2"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={modalLoading || !modalEmail}
                    className="btn btn-md btn-primary w-full disabled:opacity-50 text-xs"
                  >
                    {modalLoading ? 'Signing in...' : 'Continue'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setModalView('options'); setModalError(''); }}
                  className="w-full text-center text-xs font-semibold text-brand-600 hover:underline pt-2"
                >
                  &larr; Back to options
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
