import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DestinationImageProps {
  name: string;
  imageUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  height?: string;
  width?: string;
  borderRadius?: string;
}

export default function DestinationImage({ 
  name, 
  imageUrl,
  className = '', 
  style = {}, 
  height = '220px', 
  width = '100%', 
  borderRadius = '16px' 
}: DestinationImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadImage = async (url: string) => {
      setLoading(true);
      setError(false);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (active) {
          setSrc(url);
          setLoading(false);
        }
      };
      img.onerror = () => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      };
    };

    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        // Get clean name (e.g. "Goa" from "Goa, India")
        const cleanName = name.split(',')[0].trim();
        const res = await api.get(`/destinations/image/${encodeURIComponent(cleanName)}`);
        
        if (res.data.success && res.data.imageUrl && active) {
          await loadImage(res.data.imageUrl);
        } else if (active) {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if (imageUrl) {
      loadImage(imageUrl);
    } else {
      fetchImage();
    }

    return () => {
      active = false;
    };
  }, [name, imageUrl]);

  // Loading skeleton state
  if (loading) {
    return (
      <div 
        className="animate-pulse bg-slate-200" 
        style={{ 
          width, 
          height, 
          borderRadius,
          ...style 
        }}
      />
    );
  }

  // Safe fallback banner
  const finalSrc = error || !src
    ? 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'
    : src;

  return (
    <img
      src={finalSrc}
      alt={name}
      className={className}
      style={{
        objectFit: 'cover',
        width,
        height,
        borderRadius,
        ...style
      }}
      onError={(e) => {
        // Fallback to ensure broken link never displays
        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
      }}
    />
  );
}
