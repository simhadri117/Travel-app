import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Phone, Shield, ArrowRight, Sparkles, Globe, Star, MapPin } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, setUserProfile } from '../services/firestore';

const FEATURES = [
  { icon: '✈️', text: 'Book flights, trains & buses' },
  { icon: '🏨', text: 'Hotels & unique homestays' },
  { icon: '🤖', text: 'AI-powered trip planner' },
  { icon: '🎥', text: 'Travel reels & community' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const res = await api.post('/auth/google', { idToken });
      
      if (res.data.success) {
        // Sync user profile to Firestore
        try {
          const profile = await getUserProfile(result.user.uid);
          if (!profile && res.data.data.user) {
            await setUserProfile({
              name: res.data.data.user.name || result.user.displayName || 'Traveler',
              email: res.data.data.user.email || result.user.email || '',
              phone: res.data.data.user.phone || result.user.phoneNumber || '',
              profile_photo_url: res.data.data.user.profile_photo_url || result.user.photoURL || '',
              bio: res.data.data.user.bio || '',
              home_city: res.data.data.user.home_city || 'Delhi',
              travel_preferences: res.data.data.user.travel_preferences || []
            });
          }
        } catch (fsErr) {
          console.error('[Firestore Login Profile Sync Failed]:', fsErr);
        }

        login(res.data.data.token, res.data.data.user);
        navigate(res.data.data.user?.name ? '/' : '/onboard');
      } else {
        setError(res.data.error || 'Google login failed');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.response?.data?.error || err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phone.length < 10) { setError('Please enter a valid phone number'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: `+91${phone}` });
      if (res.data.success) setStep('otp');
      else setError(res.data.error || 'Failed to send OTP');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone: `+91${phone}`, otp: otpStr });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate(res.data.data.user?.name ? '/' : '/onboard');
      } else setError(res.data.error || 'Invalid OTP');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── LEFT PANEL — Illustration ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg">✈</span>
          </div>
          <div>
            <p className="font-bold text-white text-lg tracking-tight">TravelSphere</p>
            <p className="text-brand-400 text-xs font-semibold tracking-widest uppercase">AI</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Your world-class<br />travel companion.
            </h1>
            <p className="text-slate-300 mt-3 text-lg leading-relaxed">
              Plan, book, and explore with the power of AI. Everything you need for the perfect trip.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-slate-200 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <div className="flex -space-x-2">
              {['photo-1494790108377-be9c29b29330', 'photo-1535713875002-d1d0cf377fde', 'photo-1438761681033-6461ffad8d80'].map((p, i) => (
                <img key={i} src={`https://images.unsplash.com/${p}?w=50`} className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} size={11} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-slate-300 text-xs mt-0.5">Loved by 2M+ travelers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg">✈</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">TravelSphere</p>
              <p className="text-brand-600 text-xs font-semibold tracking-widest uppercase">AI</p>
            </div>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1">Sign in to continue your travel journey</p>
              </div>

              <div className="space-y-2">
                <label className="label">Phone Number</label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-shrink-0">
                    <span className="text-sm">🇮🇳</span>
                    <span className="text-sm font-semibold text-slate-700">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="input-field flex-1"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="btn btn-lg btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight size={16} /></>
                )}
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-center text-xs text-slate-400 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="text-brand-600 hover:underline font-medium">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-brand-600 hover:underline font-medium">Privacy Policy</a>.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slide-up">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                  className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 font-medium"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enter OTP</h2>
                <p className="text-slate-400 text-sm mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-slate-700">+91 {phone}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="label">Verification Code</label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="tel"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      className={`w-12 h-14 text-center text-xl font-bold border rounded-2xl bg-slate-50 text-slate-900
                                 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 focus:bg-white
                                 transition-all ${digit ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="btn btn-lg btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify & Continue <Shield size={16} /></>
                )}
              </button>

              <div className="text-center text-sm text-slate-500">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as any)}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
