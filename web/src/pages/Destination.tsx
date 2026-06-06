import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  MapPin, Cloud, Sun, Navigation, Calendar, 
  Coins, Heart, MessageCircle, Star, Compass
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

  if (loading) return <p className="text-center text-xs text-gray-500 py-10">Loading destination files...</p>;
  if (!data) return <p className="text-center text-xs text-gray-500 py-10">Destination details not found.</p>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* 1. Slideshow Header */}
      <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-100 shadow-lg">
        <img 
          src={data.slideshow[activeSlide]} 
          alt={data.name} 
          className="w-full h-full object-cover brightness-75 transition-all duration-500"
        />
        {/* Slideshow dot indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {data.slideshow.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'bg-white w-4' : 'bg-white/50'}`}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-1.5 text-xs text-brand-200 font-bold">
            <MapPin size={12} className="text-brand-300" /> {data.state}, {data.country}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-1">{data.name}</h1>
        </div>
      </div>

      {/* 2. Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best Season</p>
          <p className="text-xs font-black text-slate-800 mt-1">{data.best_season}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Temp</p>
          <p className="text-xs font-black text-brand-600 mt-1">{data.avg_temp}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Cost (3 Days)</p>
          <p className="text-xs font-black text-brand-600 mt-1">{data.avg_cost_3d}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UNESCO Sites</p>
          <p className="text-xs font-black text-slate-800 mt-1">{data.unesco_sites_count} sites</p>
        </div>
      </div>

      {/* 3. Weather & Transit options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weather Forecast */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><Cloud size={16} className="text-slate-400" /> 7-Day Weather Forecast</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {data.weather_forecast?.map((w: any, idx: number) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-2xl flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-medium">{w.day}</span>
                <Sun size={14} className="text-amber-500 animate-pulse" />
                <span className="font-bold text-slate-800">{w.temp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transit Guides */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><Navigation size={16} className="text-slate-400" /> How to Get There</h3>
          <div className="space-y-3">
            {data.transit?.map((t: any) => (
              <div key={t.type} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-slate-700">{t.type} Journey</span>
                <div className="text-right space-y-0.5">
                  <p className="text-brand-600 font-extrabold">{t.price}</p>
                  <p className="text-[10px] text-slate-400">Duration: {t.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Attractions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Top Attractions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {data.attractions?.map((a: any) => (
            <div 
              key={a.name} 
              className="bg-white border border-slate-100 shadow-sm overflow-hidden hover:-translate-y-[6px] transition-all duration-300 ease-in-out cursor-pointer relative"
              style={{ height: '320px', borderRadius: '20px' }}
            >
              {/* Image & Badges */}
              <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
                <img 
                  src={a.photo} 
                  alt={a.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
                  }}
                />
                {/* Category Badge */}
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-[6px] text-white text-[9px] font-bold uppercase rounded-full tracking-wider">
                  {a.category || 'Historical Site'}
                </span>
                {/* Verified Fee Badge */}
                {a.fee && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-extrabold rounded-full shadow-sm">
                    {a.fee}
                  </span>
                )}
                {/* Opening Hours */}
                {a.opening_hours && (
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-[4px] text-slate-800 text-[8px] font-semibold rounded border border-slate-100">
                    🕒 {a.opening_hours}
                  </span>
                )}
              </div>
              
              {/* Details Content (100px area) */}
              <div className="p-4 flex flex-col justify-between" style={{ height: '100px' }}>
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-bold text-xs text-slate-800 truncate" title={a.name}>{a.name}</h4>
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 flex-shrink-0">
                      ⭐ {a.rating?.toFixed(1) || '4.5'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    📍 {a.location}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-50">
                  <span className="font-medium">
                    🕒 {a.duration}
                  </span>
                  <span className="text-slate-400 font-medium">
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
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Places to Dine</h3>
          <div className="space-y-3">
            {data.restaurants?.map((r: any) => (
              <div key={r.name} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.cuisine} • {r.price}</p>
                </div>
                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                  ★ {r.rating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Accommodations Tiers</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800">Budget Stay</p>
                <p className="text-[10px] text-slate-400">{data.hotels.budget.name}</p>
              </div>
              <span className="text-emerald-600 font-bold">{data.hotels.budget.price}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
              <div>
                <p className="font-bold text-slate-800">Mid-Range Hotel</p>
                <p className="text-[10px] text-slate-400">{data.hotels.mid_range.name}</p>
              </div>
              <span className="text-emerald-600 font-bold">{data.hotels.mid_range.price}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
              <div>
                <p className="font-bold text-slate-800">Luxury Resort</p>
                <p className="text-[10px] text-slate-400">{data.hotels.luxury.name}</p>
              </div>
              <span className="text-emerald-600 font-bold">{data.hotels.luxury.price}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 6. Travel tips & Similar destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tips */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Travel Tips</h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            {data.tips?.map((t: string, idx: number) => (
              <li key={idx} className="leading-relaxed">{t}</li>
            ))}
          </ul>
        </div>

        {/* Similar spots */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Similar Recommendations</h3>
          <div className="space-y-3">
            {data.similar?.map((sName: string) => (
              <div 
                key={sName}
                onClick={() => navigate(`/destination/${sName.toLowerCase()}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer transition-all text-xs"
              >
                <span className="font-bold text-slate-700">{sName}</span>
                <span className="text-[10px] text-brand-600 font-bold">Discover →</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. Social Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">What Travelers Say</h2>
        {data.posts?.length === 0 ? (
          <p className="text-xs text-slate-500">No travel logs shared for this destination yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.posts?.map((post: any) => (
              <div 
                key={post._id} 
                onClick={() => navigate('/social')}
                className="card card-hover overflow-hidden cursor-pointer"
              >
                <div className="h-32 bg-slate-100">
                  <img src={post.media_urls?.[0]} alt="traveler post" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[80px] font-semibold text-slate-700">{post.user_id?.name}</span>
                  <span className="flex items-center gap-0.5"><Heart size={10} fill="red" className="text-red-500" /> {post.likes_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
