import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Award, Gift, Copy, Check, Share2, Sparkles, Star, Users, Loader } from 'lucide-react';

export default function Gamification() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rewards/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopyLink = () => {
    if (!stats) return;
    const shareLink = `${window.location.origin}/#/register?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-900 flex items-center gap-2">
          <Award className="text-brand-600" /> Rewards & Achievements
        </h1>
        <p className="text-slate-550 text-sm mt-1">Unlock badges, earn travel points for bookings/feed posts, and claim premium rewards.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader className="animate-spin text-brand-600 mb-3" size={32} />
          <p className="text-xs text-slate-500">Syncing your stats...</p>
        </div>
      ) : !stats ? (
        <div className="card p-6 text-center border border-slate-100 bg-white shadow-sm text-slate-500 text-xs">
          Failed to load rewards stats. Please log in again.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Points Card and progress bar */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                    {stats.level}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 mt-3">Travel Sphere Points</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Earned</p>
                  <p className="text-3xl font-black text-brand-600">{stats.points} <span className="text-xs font-normal text-slate-400">PTS</span></p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Level Progress</span>
                  <span>{stats.progress_to_next}% to Next Tier</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stats.progress_to_next}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                  />
                </div>
              </div>

              {/* Point Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800">📸 Post a Reel</p>
                  <p className="mt-0.5 text-[10px] text-brand-600 font-semibold">+100 Points</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800">🏨 Confirm Stay</p>
                  <p className="mt-0.5 text-[10px] text-brand-600 font-semibold">+250 Points</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800">🌍 Invite Friends</p>
                  <p className="mt-0.5 text-[10px] text-brand-600 font-semibold">+500 Points</p>
                </div>
              </div>
            </div>

            {/* Badges Collection */}
            <div className="card p-6 border border-slate-100 bg-white shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Star size={16} className="text-brand-600" /> Unlocked Travel Badges ({stats.badges.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {stats.badges.map((badge: string) => (
                  <div key={badge} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-brand-300 transition-all">
                    <span className="text-3xl block filter drop-shadow">🏆</span>
                    <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{badge}</p>
                    <p className="text-[8px] text-success font-semibold">UNLOCKED</p>
                  </div>
                ))}
                {/* Locked placeholders */}
                <div className="bg-slate-50/50 border border-slate-200 border-dashed p-4 rounded-2xl space-y-2 opacity-50">
                  <span className="text-3xl block grayscale">🔒</span>
                  <p className="text-[10px] font-bold text-slate-500">Ocean Diver</p>
                  <p className="text-[8px] text-slate-600 font-semibold">LOCKED</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Panel Card */}
          <div className="md:col-span-1 card p-6 border border-slate-100 bg-white shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <Gift size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-black text-base text-slate-800">Refer & Earn</h3>
                <p className="text-xs text-slate-550">Share your invite link with your travel buddies and earn 500 Travel Points each time someone registers!</p>
              </div>
            </div>

            {/* Referral Stats Counter */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="text-slate-500 flex items-center gap-1.5"><Users size={14} /> Total Referrals</span>
              <span className="text-brand-600 font-bold text-sm">{stats.referred_count} Joins</span>
            </div>

            {/* Link Copy Widget */}
            <div className="space-y-2 text-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Your Share Code</label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-brand-500 transition-all">
                <input
                  type="text"
                  readOnly
                  value={stats.referral_code}
                  className="bg-transparent px-3 py-2 text-slate-850 font-mono w-full focus:outline-none text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-3 flex items-center justify-center transition-all"
                  title="Copy Link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
