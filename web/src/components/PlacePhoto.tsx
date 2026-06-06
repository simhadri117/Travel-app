import React, { useState } from 'react';

interface PlacePhotoProps {
  photoReference?: string | null;
  photoUrl?: string | null;
  placeName?: string;
  destination?: string;
  className?: string;
  fallbackCategory?: 'attraction' | 'restaurant' | 'hotel' | 'destination';
}

const API_BASE = 'http://localhost:5001/api/v1';

// Curated Unsplash topic fallbacks by category
const FALLBACK_TOPICS: Record<string, string> = {
  attraction: 'sightseeing,monument,landmark',
  restaurant: 'restaurant,food,dining',
  hotel: 'hotel,resort,accommodation',
  destination: 'travel,tourism,scenic',
};

export default function PlacePhoto({
  photoReference,
  photoUrl,
  placeName = '',
  destination = 'India',
  className = 'w-full h-full object-cover',
  fallbackCategory = 'attraction',
}: PlacePhotoProps) {
  const [src, setSrc] = useState<string>(() => {
    // Priority 1: pre-resolved photo_url from backend
    if (photoUrl) return photoUrl;
    // Priority 2: proxy via our backend using photo_reference
    if (photoReference) return `${API_BASE}/itinerary/place-photo?ref=${encodeURIComponent(photoReference)}&name=${encodeURIComponent(placeName)}&destination=${encodeURIComponent(destination)}`;
    // Priority 3: Picsum seeded photo fallback
    return `https://picsum.photos/seed/${encodeURIComponent(placeName || destination)}/800/500`;
  });
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    if (fallbackLevel === 0 && (photoReference || photoUrl)) {
      // Try Picsum fallback
      setSrc(`https://picsum.photos/seed/${encodeURIComponent(placeName || destination)}/800/500`);
      setFallbackLevel(1);
    } else {
      // Final fallback: standard static Unsplash travel photo
      setSrc('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800');
      setFallbackLevel(2);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={placeName || destination}
        className={className}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
