import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Camera as CameraIcon, RotateCw, Video, Sparkles, Check, Play, Square, Loader } from 'lucide-react';

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Vintage', class: 'grayscale brightness-90 sepia-[0.3]' },
  { name: 'Chrome', class: 'contrast-125 saturate-150' },
  { name: 'Warm', class: 'sepia-[0.15] hue-rotate-[10deg] saturate-110' },
  { name: 'Cool', class: 'contrast-95 hue-rotate-[-10deg] brightness-105' }
];

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  // View state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [destTag, setDestTag] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Start webcam
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setErrorMsg('Could not access webcam. Using fallback camera simulator.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture snapshot
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Apply filter to canvas rendering context
        const filterStr = FILTERS[activeFilter].name;
        if (filterStr === 'Vintage') ctx.filter = 'grayscale(0.6) sepia(0.3)';
        else if (filterStr === 'Chrome') ctx.filter = 'contrast(1.25) saturate(1.5)';
        else if (filterStr === 'Warm') ctx.filter = 'sepia(0.15) saturate(1.1)';
        else if (filterStr === 'Cool') ctx.filter = 'contrast(0.95) brightness(1.05)';
        else ctx.filter = 'none';

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);

        // Turn off stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    } else {
      // Simulator mode fallback capture
      setCapturedPhoto('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800');
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto) return;
    setPublishing(true);
    try {
      // Post created photo
      const res = await api.post('/posts', {
        media_urls: [capturedPhoto],
        media_types: ['image'],
        caption,
        destination_tag: destTag
      });
      if (res.data.success) {
        alert('Moments shared successfully in community feed!');
        setCapturedPhoto(null);
        setCaption('');
        setDestTag('');
        startCamera();
      }
    } catch (err) {
      alert('Failed to share captured photo.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CameraIcon className="text-brand-600" /> Travel Camera Uploads
        </h1>
        <p className="text-slate-500 text-xs mt-1">Capture photos/videos, apply filter presets, and upload directly to your feed.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-2xl text-center">
          {errorMsg}
        </div>
      )}

      {/* Viewfinder/Preview Container */}
      <div className="relative aspect-[3/4] bg-black border border-white/10 rounded-lg-custom overflow-hidden shadow-2xl flex items-center justify-center">
        {!capturedPhoto ? (
          <>
            {/* Real Video Stream */}
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transform -scale-x-100 ${FILTERS[activeFilter].class}`}
              />
            ) : (
              /* Simulated Camera Viewfinder */
              <div className="text-center p-6 space-y-4">
                <span className="text-5xl block animate-pulse">⛰️</span>
                <p className="text-xs text-gray-500 font-semibold">Offline Camera Simulator</p>
                <button
                  onClick={captureSnapshot}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2 px-5 rounded text-xs"
                >
                  Capture Simulated Travel View
                </button>
              </div>
            )}

            {/* Filter Slider (Viewfinder Overlay) */}
            {stream && (
              <div className="absolute bottom-20 left-0 right-0 px-4 py-2 bg-black/60 backdrop-blur border-y border-white/5 flex gap-3 overflow-x-auto z-10">
                {FILTERS.map((f, idx) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFilter(idx)}
                    className={`flex-shrink-0 text-[10px] px-3 py-1 rounded border font-semibold transition-all ${activeFilter === idx ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            {/* Viewfinder controls */}
            {stream && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10">
                <button
                  onClick={captureSnapshot}
                  className="w-14 h-14 bg-white hover:bg-gray-100 rounded-full border-4 border-brand-600 flex items-center justify-center text-black font-bold active:scale-95 transition-all shadow-lg"
                >
                  <CameraIcon size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Taken Snapshot Preview & Caption Editor */
          <div className="w-full h-full relative flex flex-col justify-end p-5 bg-cover bg-center" style={{ backgroundImage: `url(${capturedPhoto})` }}>
            <div className="absolute inset-0 bg-black/40" />

            <form onSubmit={handlePublish} className="space-y-4 relative z-10 bg-black/60 backdrop-blur p-4 border border-white/10 rounded-md-custom text-xs text-white">
              <h3 className="font-bold border-b border-white/5 pb-1">Edit Travel Snippet</h3>
              <div className="space-y-1">
                <label className="text-gray-400">Caption Details</label>
                <input
                  type="text"
                  placeholder="Capture details... #tags"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-400">Destination Location Tag</label>
                <input
                  type="text"
                  placeholder="E.g. Manali, India"
                  value={destTag}
                  onChange={(e) => setDestTag(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2 border border-white/10 hover:bg-white/5 rounded font-bold text-gray-300"
                >
                  Retake
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 rounded font-bold text-white flex items-center justify-center gap-1"
                >
                  {publishing ? <Loader className="animate-spin" size={12} /> : <Check size={14} />} Publish
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
