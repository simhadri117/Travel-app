import React, { useState } from 'react';
import { Map, MapPin, Search, Navigation, Building, Utensils, Star, Compass, Info } from 'lucide-react';

// Sample places data
const NEARBY_PLACES: Record<string, any[]> = {
  attractions: [
    { name: 'Basilica of Bom Jesus', category: 'Heritage', distance: '1.2 km', rating: 4.8, coord: { x: 120, y: 150 } },
    { name: 'Anjuna Beach Cliff', category: 'Beach', distance: '3.5 km', rating: 4.6, coord: { x: 250, y: 80 } },
    { name: 'Dudhsagar Waterfalls', category: 'Nature', distance: '24 km', rating: 4.9, coord: { x: 380, y: 280 } }
  ],
  restaurants: [
    { name: "Fisherman's Wharf", category: 'Goan Seafood', distance: '0.8 km', rating: 4.5, coord: { x: 180, y: 190 } },
    { name: 'Gunpowder Bistro', category: 'South Indian Coast', distance: '2.1 km', rating: 4.7, coord: { x: 90, y: 110 } },
    { name: 'Curlies Beach Shack', category: 'Multi-cuisine', distance: '3.6 km', rating: 4.2, coord: { x: 270, y: 90 } }
  ],
  hotels: [
    { name: 'Goa Ocean Palms Resort', category: '4-Star Resort', distance: '1.5 km', rating: 4.4, coord: { x: 140, y: 170 } },
    { name: 'Grand Heritage Inn', category: '5-Star Stay', distance: '2.8 km', rating: 4.8, coord: { x: 210, y: 220 } }
  ]
};

export default function Maps() {
  const [city, setCity] = useState('Goa');
  const [filterType, setFilterType] = useState<'attractions' | 'restaurants' | 'hotels'>('attractions');
  const [activePin, setActivePin] = useState<any>(null);
  const [navigationPath, setNavigationPath] = useState<any[] | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'live'>('live');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate updating places
    alert(`Showing nearby maps and details for "${city}"`);
  };

  const handlePinClick = (place: any) => {
    setActivePin(place);
  };

  const startNavigation = (place: any) => {
    // Generate simulated routing steps
    setNavigationPath([
      { step: 'Head north on Beach Road', dist: '200m' },
      { step: 'Turn right at the main bazaar crossroad', dist: '500m' },
      { step: `Continue straight. Destination "${place.name}" is on the right`, dist: place.distance }
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-900 flex items-center gap-2">
          <Map className="text-brand-600" /> Interactive Travel Maps
        </h1>
        <p className="text-slate-550 text-sm mt-1">Navigate nearby attractions, hotels, dining, and plan routes on our map canvas.</p>
      </div>

      {/* Main Map Portal Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Controls and list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Location search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 input-field py-2 text-xs"
              placeholder="Search city..."
            />
            <button type="submit" className="btn btn-primary px-4 py-2 text-xs font-bold">
              Search
            </button>
          </form>

          {/* Place filters */}
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => { setFilterType('attractions'); setActivePin(null); }}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all ${filterType === 'attractions' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Attracts
            </button>
            <button
              onClick={() => { setFilterType('restaurants'); setActivePin(null); }}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all ${filterType === 'restaurants' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Food
            </button>
            <button
              onClick={() => { setFilterType('hotels'); setActivePin(null); }}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all ${filterType === 'hotels' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Stays
            </button>
          </div>

          {/* List of Places */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
            {NEARBY_PLACES[filterType].map((place) => (
              <div
                key={place.name}
                onClick={() => handlePinClick(place)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${activePin?.name === place.name ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'}`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-slate-800">{place.name}</p>
                  <span className="text-[10px] text-brand-600 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {place.rating}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{place.category} • {place.distance} away</p>
              </div>
            ))}
          </div>

          {/* Place details / navigation routing */}
          {activePin && (
            <div className="card p-4 border border-slate-100 bg-white shadow-sm text-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">{activePin.name}</h3>
              <p className="text-slate-550">{activePin.category} located in the central district.</p>
              <button
                onClick={() => startNavigation(activePin)}
                className="btn btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Navigation size={12} /> Get Directions
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Simulated Map Canvas */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-[16/9] bg-[#111] border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* View Mode Toggle */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 p-1 rounded-2xl flex gap-1 z-20 shadow-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('live')}
                className={`px-3 py-1 rounded-xl transition-all ${viewMode === 'live' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Live Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1 rounded-xl transition-all ${viewMode === 'canvas' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Interactive Canvas
              </button>
            </div>

            {viewMode === 'live' ? (
              <iframe
                title="Real Map View"
                src={activePin 
                  ? `https://maps.google.com/maps?q=${encodeURIComponent(activePin.name + ', ' + city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(city)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
                }
                className="w-full h-full border-0 rounded-3xl"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <>
                {/* Grid background simulation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] opacity-15" />

                {/* Roads simulation */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <path d="M 0 100 Q 200 120 400 300 T 800 200" fill="none" stroke="white" strokeWidth="6" />
                  <path d="M 150 0 C 120 200 300 150 400 600" fill="none" stroke="white" strokeWidth="4" />
                  <path d="M 500 0 C 450 300 600 450 800 450" fill="none" stroke="white" strokeWidth="4" />
                </svg>

                {/* Navigation route path line */}
                {navigationPath && activePin && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <path
                      d={`M 150 200 Q 200 180 ${activePin.coord.x} ${activePin.coord.y}`}
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="4"
                      strokeDasharray="5,5"
                      className="animate-[dash_2s_linear_infinite]"
                    />
                    {/* Current Location Pin */}
                    <circle cx="150" cy="200" r="8" fill="#2563EB" stroke="white" strokeWidth="2" />
                  </svg>
                )}

                {/* Interactive Pins */}
                {NEARBY_PLACES[filterType].map((place) => {
                  const isActive = activePin?.name === place.name;
                  const colorClass = filterType === 'attractions' ? 'text-amber-500' :
                                     filterType === 'restaurants' ? 'text-success' : 'text-brand-600';
                  return (
                    <button
                      key={place.name}
                      onClick={() => handlePinClick(place)}
                      style={{ left: place.coord.x, top: place.coord.y }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                    >
                      <MapPin
                        size={isActive ? 28 : 20}
                        className={`${isActive ? 'text-brand-500' : colorClass} filter drop-shadow-md group-hover:scale-110 transition-all`}
                        fill={isActive ? 'currentColor' : 'none'}
                      />
                      <span className="bg-black/80 backdrop-blur px-2 py-0.5 border border-white/10 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -top-8">
                        {place.name}
                      </span>
                    </button>
                  );
                })}

                {/* Map Controls */}
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700/50 p-2 rounded flex flex-col gap-1 z-20 text-[10px] text-gray-400">
                  <p className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Attractions</p>
                  <p className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Restaurants</p>
                  <p className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Stays</p>
                </div>
              </>
            )}
          </div>

          {/* Navigation Path step logs */}
          {navigationPath && activePin && (
            <div className="card p-5 border border-slate-100 bg-white shadow-sm space-y-3 text-xs text-slate-700">
              <h3 className="font-heading font-black text-slate-800 flex items-center gap-1.5">
                <Compass className="animate-spin text-brand-600" size={16} /> Live Route Navigation
              </h3>
              <div className="space-y-2 pt-2 border-t border-slate-100 font-mono">
                {navigationPath.map((n, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>{idx + 1}. {n.step}</span>
                    <span className="text-brand-600 font-bold font-sans">{n.dist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
