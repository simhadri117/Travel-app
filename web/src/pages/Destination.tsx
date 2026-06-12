import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  MapPin, Cloud, Sun, Navigation, Calendar, 
  Coins, Heart, MessageCircle, Star, Compass,
  Info, ArrowRight, ShieldCheck, Plus, CheckCircle,
  Utensils, Building, Sparkles, AlertCircle, Plane, Train, Bus, Clock
} from 'lucide-react';


export default function Destination() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/destinations/${name}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [name]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Sparkles className="animate-spin text-primary" size={32} />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gathering destination files...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24 space-y-3 bg-white rounded-3xl border border-slate-100 max-w-xl mx-auto shadow-sm">
        <AlertCircle className="text-red-500 mx-auto" size={40} />
        <p className="text-sm text-slate-800 font-bold">Destination Not Found</p>
        <button 
          onClick={() => navigate('/social')}
          className="text-xs text-primary font-bold hover:underline"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* 1. Cinematic Slideshow Header */}
      <div className="relative h-72 sm:h-[400px] rounded-[32px] overflow-hidden border border-slate-100 shadow-xl group">
        <img 
          src={data.slideshow[activeSlide]} 
          alt={data.name} 
          className="w-full h-full object-cover brightness-[0.65] transition-all duration-700 ease-in-out group-hover:scale-[1.01]"
        />
        
        {/* Slideshow dot indicators */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
          {data.slideshow.map((_: any, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                activeSlide === idx ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Golden-scrim absolute gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
          <div className="flex items-center gap-1.5 text-xs text-primary-fixed font-black uppercase tracking-widest bg-primary/30 backdrop-blur-md px-3 py-1 rounded-full w-fit">
            <MapPin size={12} className="text-primary-fixed-dim" /> {data.state}, {data.country}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 font-display-lg">{data.name}</h1>
        </div>
      </div>

      {/* 2. Stats Grid Bento Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0px_8px_24px_rgba(15,23,42,0.06)] transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best Season</p>
          <p className="text-xs sm:text-sm font-black text-slate-800 mt-1.5">{data.best_season}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0px_8px_24px_rgba(15,23,42,0.06)] transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Temp</p>
          <p className="text-xs sm:text-sm font-black text-primary mt-1.5">{data.avg_temp}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0px_8px_24px_rgba(15,23,42,0.06)] transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Cost (3 Days)</p>
          <p className="text-xs sm:text-sm font-black text-primary mt-1.5">{data.avg_cost_3d}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center shadow-[0px_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0px_8px_24px_rgba(15,23,42,0.06)] transition-all">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UNESCO Sites</p>
          <p className="text-xs sm:text-sm font-black text-slate-800 mt-1.5">{data.unesco_sites_count} Sites</p>
        </div>
      </div>

      {/* 3. Weather & Transit options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weather Forecast */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Cloud size={16} className="text-primary" /> Weather Outlook
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {data.weather_forecast?.map((w: any, idx: number) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-2xl flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase">{w.day}</span>
                <Sun size={14} className="text-amber-500 animate-pulse" />
                <span className="font-bold text-slate-800">{w.temp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transit Guides */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation size={16} className="text-primary" /> Transit Guide
          </h3>
          <div className="space-y-3">
            {data.transit?.map((t: any) => {
              const Icon = t.type.toLowerCase().includes('flight') ? Plane : t.type.toLowerCase().includes('train') ? Train : Bus;
              return (
                <div key={t.type} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{t.type} Journey</span>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-black">{t.price}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">Duration: {t.duration}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Attractions */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-850 uppercase tracking-wider">Top Attractions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {data.attractions?.map((a: any) => (
            <div 
              key={a.name} 
              className="bg-white border border-slate-100 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] overflow-hidden hover:shadow-[0px_10px_30px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer relative flex flex-col justify-between"
              style={{ height: '330px', borderRadius: '24px' }}
            >
              {/* Image & Badges */}
              <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height: '210px' }}>
                <img 
                  src={a.photo} 
                  alt={a.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
                  }}
                />
                {/* Category Badge */}
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-[6px] text-white text-[9px] font-bold uppercase rounded-full tracking-wider">
                  {a.category || 'Historical'}
                </span>
                {/* Verified Fee Badge */}
                {a.fee && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full shadow-sm">
                    {a.fee}
                  </span>
                )}
                {/* Opening Hours */}
                {a.opening_hours && (
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-white/95 backdrop-blur-[4px] text-slate-800 text-[8px] font-bold rounded border border-slate-100 shadow-sm">
                    🕒 {a.opening_hours}
                  </span>
                )}
              </div>
              
              {/* Details Content */}
              <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-black text-xs text-slate-800 truncate" title={a.name}>{a.name}</h4>
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 flex-shrink-0">
                      ★ {a.rating?.toFixed(1) || '4.5'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate font-medium">
                    📍 {a.location}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-2 border-t border-slate-50 font-bold">
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} /> {a.duration}
                  </span>
                  <span>
                    🗓 {a.best_time || a.best_time_to_visit || 'Oct - Mar'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Food & Stays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Restaurants */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils size={16} className="text-primary" /> Dining Experiences
          </h3>
          <div className="space-y-3">
            {data.restaurants?.map((r: any) => (
              <div key={r.name} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{r.cuisine} • {r.price}</p>
                </div>
                <span className="text-amber-500 font-black flex items-center gap-0.5 text-[10px]">
                  ★ {r.rating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building size={16} className="text-primary" /> Accommodation Tiers
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800">Budget Tier</p>
                <p className="text-[10px] text-slate-400 font-medium">{data.hotels.budget.name}</p>
              </div>
              <span className="text-emerald-600 font-black">{data.hotels.budget.price}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
              <div>
                <p className="font-bold text-slate-800">Mid-Range Hotel</p>
                <p className="text-[10px] text-slate-400 font-medium">{data.hotels.mid_range.name}</p>
              </div>
              <span className="text-emerald-600 font-black">{data.hotels.mid_range.price}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
              <div>
                <p className="font-bold text-slate-800">Luxury Stay</p>
                <p className="text-[10px] text-slate-400 font-medium">{data.hotels.luxury.name}</p>
              </div>
              <span className="text-emerald-600 font-black">{data.hotels.luxury.price}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 6. Travel tips & Similar destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tips */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={16} className="text-primary" /> Curated Travel Tips
          </h3>
          <ul className="space-y-3.5 text-xs text-slate-600 font-medium pl-1">
            {data.tips?.map((t: string, idx: number) => (
              <li key={idx} className="flex gap-2 items-start leading-relaxed">
                <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Similar spots */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={16} className="text-primary" /> Similar Destinations
          </h3>
          <div className="space-y-2">
            {data.similar?.map((sName: string) => (
              <div 
                key={sName}
                onClick={() => navigate(`/destination/${sName.toLowerCase()}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-50 rounded-2xl flex justify-between items-center cursor-pointer transition-all text-xs"
              >
                <span className="font-bold text-slate-700">{sName}</span>
                <span className="text-[10px] text-primary font-black flex items-center gap-0.5">Discover <ArrowRight size={10} /></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. Social Posts */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-850 uppercase tracking-wider">What Travelers Say</h2>
        {data.posts?.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium pl-1">No traveler logs shared for this destination yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.posts?.map((post: any) => (
              <div 
                key={post._id} 
                onClick={() => navigate('/social')}
                className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="h-32 bg-slate-50 overflow-hidden relative border-b border-slate-50">
                  <img src={post.media_urls?.[0]} alt="traveler post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 flex justify-between text-[10px] text-slate-400 font-bold items-center">
                  <span className="truncate max-w-[80px] text-slate-700">{post.user_id?.name || 'Explorer'}</span>
                  <span className="flex items-center gap-0.5 text-red-500 font-black"><Heart size={10} fill="currentColor" /> {post.likes_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
