import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { 
  getReels, createReel, updateReel, addReelComment, 
  createFavorite, deleteFavorite, getFavorites 
} from '../services/firestore';
import {
  Heart, MessageCircle, Volume2, VolumeX, Share2, Bookmark, Send, X, Music2,
  Star, MapPin, Sparkles, Building, Utensils, Compass, Calendar, Award, Check
} from 'lucide-react';

const REELS_DATA = [
  {
    id: 'reel_1',
    author: 'Elena Voyages',
    handle: 'elena.voyages',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC8ANcslmcLbVr25b81SazxpeTQnpKsu4G8s7iYiLkm0W4qONvKMGeUlBmqIIAIv7BvuSfq2VdGtuPLnKm3JLZKFXcHTXqh0jFU9MjaHtNXp13b070wB9sFFDL5QLiviYVp1COUTuJCigvWXUOTSI2N8XcUaCnUAFbisl0MdfyVit7mc_sqoOcDhcDo1u0SJoJRcwS_5fPW4znA99NmIXKOBmUX0FcJY3CHpHoiNCgjKwGPN5k_FZFxnDFCvZFxUzJUBVupo0eu9s',
    caption: 'Waking up in Goa feels like a dream. Exploring the quiet beaches and coconut groves before the sun gets too high... #goa #travel #india',
    video: 'https://res.cloudinary.com/demo/video/upload/glide-over-coastal-beach.mp4',
    likes: 3420,
    comments: 240,
    saves: 850,
    music: 'Goa Golden Breeze · Original Sound',
  },
  {
    id: 'reel_2',
    author: 'Marco Peaks',
    handle: 'marco.peaks',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZxqu2KRaVzuOX7QQel2kdMMQtRMVCMq6W9UxqIWJv40Ln-q7xLvYtV8W0vygfUJx8gMG4e3Ws8GAbu3v-f0h2r79laDYyu9H5Sk-eBqCYW5IhNSTeUGCFpTd9t_x5ZL88PIfzJl-wsHdQSKbm1PqRtB-GzcXDpQnxQCea4udW5xYqAUpcExiwJBNnUS_HZSYw6kL_BChpMfoH4nm20X93DxdbD4Qn7P1JeT6d0Q0J4QGifUSqQGGbakYc7ox0rjuB1GffMBWSOfo',
    caption: 'Waking up in Manali to these glorious snow-capped mountain views! True mountain bliss ❄️ #mountain #travel #manali',
    video: 'https://res.cloudinary.com/demo/video/upload/docs/mountain-aerial-view.mp4',
    likes: 5120,
    comments: 480,
    saves: 1200,
    music: 'Manali Cold Chills · LoFi Beats',
  },
  {
    id: 'reel_3',
    author: 'Kabir Captures',
    handle: 'kabir.captures',
    avatar: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100',
    caption: 'Exploring the glorious architecture and history in Jaipur 🏰 The colors are absolute eye candy! #jaipur #pinkcity #heritage',
    video: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    likes: 8200,
    comments: 920,
    saves: 2100,
    music: 'Jaipur Royal Flute · Instrumental',
  },
];

const REEL_DESTINATIONS: Record<string, {
  name: string;
  location: string;
  rating: number;
  reviews: string;
  description: string;
  image: string;
  destinationSearch: string;
  highlights: Array<{ icon: any; title: string; subtitle: string }>;
  related: string[];
}> = {
  reel_1: {
    name: 'Goa Coastal Escape',
    location: 'Goa, India',
    rating: 4.7,
    reviews: '1.8k reviews',
    description: 'Experience the romantic allure of sun-kissed beaches. From quiet heritage streets in Panaji to active water sports and local beach shacks, Goa offers a perfect tropical getaway.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',
    destinationSearch: 'Goa',
    highlights: [
      { icon: Building, title: 'Luxury Stays', subtitle: 'From $80/nt' },
      { icon: Utensils, title: 'Local Dining', subtitle: 'Avg $25/pp' },
      { icon: Compass, title: 'Water Sports', subtitle: 'Starts $30' },
      { icon: Calendar, title: 'Best Season', subtitle: 'Nov - Feb' }
    ],
    related: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=150',
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=150'
    ]
  },
  reel_2: {
    name: 'Manali Peak Adventure',
    location: 'Manali, India',
    rating: 4.8,
    reviews: '2.4k reviews',
    description: 'Nestled in the mountains of Himachal Pradesh, Manali offers breathtaking snow-capped peaks, paragliding, and cozy cafe vibes. Ideal for adventure seekers and nature lovers.',
    image: 'https://images.unsplash.com/photo-1626392339560-487d25135507?w=600&q=80',
    destinationSearch: 'Manali',
    highlights: [
      { icon: Building, title: 'Mountain Resorts', subtitle: 'From $120/nt' },
      { icon: Utensils, title: 'Local Cafes', subtitle: 'Avg $15/pp' },
      { icon: Compass, title: 'Solang Adventure', subtitle: 'Starts $20' },
      { icon: Calendar, title: 'Best Season', subtitle: 'Oct - Mar' }
    ],
    related: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150',
      'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=150'
    ]
  },
  reel_3: {
    name: 'Jaipur Heritage & Forts',
    location: 'Jaipur, India',
    rating: 4.9,
    reviews: '3.1k reviews',
    description: 'Discover the rich heritage of the Pink City. Explore majestic Amer Fort, the iconic Hawa Mahal, and colorful traditional bazaars selling exquisite local handicrafts.',
    image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=600&q=80',
    destinationSearch: 'Jaipur',
    highlights: [
      { icon: Building, title: 'Heritage Havelis', subtitle: 'From $110/nt' },
      { icon: Utensils, title: 'Traditional Eats', subtitle: 'Avg $20/pp' },
      { icon: Compass, title: 'Palace Tours', subtitle: 'Starts $10' },
      { icon: Calendar, title: 'Best Season', subtitle: 'Oct - Mar' }
    ],
    related: [
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=150',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=150',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150'
    ]
  }
};

const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

export default function Reels() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [reels, setReels] = useState<any[]>([]);
  const [muted, setMuted] = useState(true);
  const [commentReel, setCommentReel] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [heartAnim, setHeartAnim] = useState<Record<string, boolean>>({});
  
  // Track active reel currently in view
  const [activeReelId, setActiveReelId] = useState(reels[0]?.id || 'reel_1');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and seed reels from Firestore
  useEffect(() => {
    const initReels = async () => {
      try {
        let dbReels = await getReels();
        if (dbReels.length === 0) {
          console.log('[Reels Migration] Firestore reels collection is empty. Seeding from REELS_DATA...');
          // Seed mock reels
          const seedPromises = REELS_DATA.map(async (r) => {
            const created = await createReel({
              videoUrl: r.video,
              caption: r.caption,
              author: r.author,
              handle: r.handle,
              avatar: r.avatar,
              likes_count: r.likes,
              comments_count: r.comments,
              music: r.music,
              comments: [
                { id: '1', user: 'Arjun', text: 'This looks absolute magic! 🔥' },
                { id: '2', user: 'Simran', text: 'On my bucket list for sure! 😍' },
                { id: '3', user: 'Neil', text: 'Which camera was this shot on?' }
              ]
            });
            return created;
          });
          await Promise.all(seedPromises);
          dbReels = await getReels();
        }
        
        // Fetch user favorites to check saved reels
        let bookmarkedIds: string[] = [];
        if (isAuthenticated) {
          try {
            const favs = await getFavorites();
            bookmarkedIds = favs.filter(f => f.targetType === 'reel').map(f => f.targetId);
          } catch (favErr) {
            console.error('Error fetching favorites for reels:', favErr);
          }
        }

        const mapped = dbReels.map(r => ({
          id: r.id,
          author: r.author,
          handle: r.handle,
          avatar: r.avatar,
          caption: r.caption,
          video: r.videoUrl,
          likes: r.likes_count || 0,
          comments: r.comments_count || 0,
          saves: r.saves ?? 850,
          music: r.music,
          liked: false,
          saved: bookmarkedIds.includes(r.id || ''),
          dbComments: r.comments || []
        }));
        setReels(mapped);
        if (mapped.length > 0) {
          setActiveReelId(mapped[0].id);
        }
      } catch (err) {
        console.error('Failed to load reels from Firestore:', err);
      }
    };
    initReels();
  }, [isAuthenticated]);

  // Sync comments list when commentReel changes
  useEffect(() => {
    if (commentReel) {
      setComments(commentReel.dbComments || []);
    }
  }, [commentReel]);

  // Setup scroll observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-reel-id');
            if (id) {
              setActiveReelId(id);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const elements = container.querySelectorAll('[data-reel-id]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [reels]);

  const handleLike = async (id: string, doubleTap = false) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Like Reel',
        subtitle: 'Sign in to like travel reels, follow creators, and save your favorite clips.',
        onSuccess: () => {
          handleLike(id, doubleTap);
        }
      });
      return;
    }

    const targetReel = reels.find(r => r.id === id);
    if (!targetReel) return;

    const newLiked = !targetReel.liked;
    const newLikesCount = newLiked ? targetReel.likes + 1 : targetReel.likes - 1;

    setReels(r => r.map(reel => reel.id === id
      ? { ...reel, liked: newLiked, likes: newLikesCount }
      : reel
    ));

    if (doubleTap) {
      setHeartAnim(p => ({ ...p, [id]: true }));
      setTimeout(() => setHeartAnim(p => ({ ...p, [id]: false })), 800);
    }

    try {
      await updateReel(id, { likes_count: newLikesCount });
    } catch (err) {
      console.error('[Firestore Like Reel Failed]:', err);
    }
  };

  const handleSave = async (id: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Save Reel',
        subtitle: 'Sign in to save this clip and add it to your travel collection.',
        onSuccess: () => {
          handleSave(id);
        }
      });
      return;
    }

    const targetReel = reels.find(r => r.id === id);
    if (!targetReel) return;

    const newSaved = !targetReel.saved;
    setReels(r => r.map(reel => reel.id === id ? { ...reel, saved: newSaved } : reel));

    try {
      if (newSaved) {
        await createFavorite({
          targetId: id,
          targetType: 'reel',
          name: targetReel.caption || 'Travel Reel',
          imageUrl: targetReel.avatar || ''
        });
      } else {
        const favs = await getFavorites();
        const targetFav = favs.find(f => f.targetId === id && f.targetType === 'reel');
        if (targetFav && targetFav.id) {
          await deleteFavorite(targetFav.id);
        }
      }
    } catch (err) {
      console.error('[Firestore Save Reel Favorite Failed]:', err);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commentReel) return;
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Comment on Reel',
        subtitle: 'Sign in to share feedback, ask questions, and talk to other explorers.',
        onSuccess: () => {
          postComment(e);
        }
      });
      return;
    }

    const commentObj = {
      id: Date.now().toString(),
      user: user?.name || 'Explorer',
      text: newComment
    };

    setComments(c => [...c, commentObj]);
    setNewComment('');
    
    setReels(r => r.map(reel => reel.id === commentReel.id 
      ? { 
          ...reel, 
          comments: reel.comments + 1, 
          dbComments: [...(reel.dbComments || []), commentObj] 
        } 
      : reel
    ));

    try {
      await addReelComment(commentReel.id, commentObj);
    } catch (err) {
      console.error('[Firestore Post Comment Failed]:', err);
    }
  };

  const activeDestination = REEL_DESTINATIONS[activeReelId] || REEL_DESTINATIONS.reel_1;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      
      {/* Left Sidebar: Community & Filters (Desktop context) */}
      <aside className="hidden xl:flex flex-col w-80 p-6 border-r border-slate-200 bg-white overflow-y-auto no-scrollbar flex-shrink-0 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Community</h2>
        
        {/* Trending Creators */}
        <div className="space-y-4 mb-8">
          <p className="text-[11px] tracking-wider font-semibold text-slate-400 uppercase">Trending Creators</p>
          
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100">
            <img className="w-10 h-10 rounded-full object-cover border border-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC8ANcslmcLbVr25b81SazxpeTQnpKsu4G8s7iYiLkm0W4qONvKMGeUlBmqIIAIv7BvuSfq2VdGtuPLnKm3JLZKFXcHTXqh0jFU9MjaHtNXp13b070wB9sFFDL5QLiviYVp1COUTuJCigvWXUOTSI2N8XcUaCnUAFbisl0MdfyVit7mc_sqoOcDhcDo1u0SJoJRcwS_5fPW4znA99NmIXKOBmUX0FcJY3CHpHoiNCgjKwGPN5k_FZFxnDFCvZFxUzJUBVupo0eu9s" alt="Elena" />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800">Elena Voyages</span>
                <Check className="w-3.5 h-3.5 text-white bg-blue-500 rounded-full p-0.5" />
              </div>
              <p className="text-[10px] text-slate-400">420k followers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100">
            <img className="w-10 h-10 rounded-full object-cover border border-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZxqu2KRaVzuOX7QQel2kdMMQtRMVCMq6W9UxqIWJv40Ln-q7xLvYtV8W0vygfUJx8gMG4e3Ws8GAbu3v-f0h2r79laDYyu9H5Sk-eBqCYW5IhNSTeUGCFpTd9t_x5ZL88PIfzJl-wsHdQSKbm1PqRtB-GzcXDpQnxQCea4udW5xYqAUpcExiwJBNnUS_HZSYw6kL_BChpMfoH4nm20X93DxdbD4Qn7P1JeT6d0Q0J4QGifUSqQGGbakYc7ox0rjuB1GffMBWSOfo" alt="Marco" />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800">Marco Peaks</span>
                <Check className="w-3.5 h-3.5 text-white bg-blue-500 rounded-full p-0.5" />
              </div>
              <p className="text-[10px] text-slate-400">128k followers</p>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div className="space-y-4">
          <p className="text-[11px] tracking-wider font-semibold text-slate-400 uppercase">Browse Topics</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold cursor-pointer">All Feed</span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-200 transition-all">Luxury Stay</span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-200 transition-all">Solo Travel</span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-200 transition-all">Hidden Gems</span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-200 transition-all">Food Tours</span>
          </div>
        </div>
        
        {/* Upgrade Club Promo Card */}
        <div className="mt-auto p-5 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 rounded-2xl relative overflow-hidden group cursor-pointer shadow-sm hover:shadow transition-all">
          <div className="relative z-10 space-y-2">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
              <Award size={16} className="text-blue-600" /> Join the Club
            </h3>
            <p className="text-[11px] text-blue-700 leading-relaxed">Unlock exclusive AI-crafted itineraries from top travel influencers.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
              Upgrade Now
            </button>
          </div>
          <Award size={120} className="absolute -bottom-6 -right-6 text-blue-600 opacity-[0.05] pointer-events-none" />
        </div>
      </aside>
      
      {/* Center: Reel Feed */}
      <section
        ref={containerRef}
        className="flex-grow flex flex-col items-center bg-slate-50 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth h-full rounded-2xl border border-slate-100"
      >
        {reels.map((reel) => (
          <article
            key={reel.id}
            data-reel-id={reel.id}
            className="snap-start w-full md:w-[380px] lg:w-[420px] aspect-[9/16] h-[calc(100vh-180px)] min-h-[480px] max-h-[700px] relative my-4 shadow-xl rounded-3xl overflow-hidden group bg-black"
            onDoubleClick={() => handleLike(reel.id, true)}
          >
            {/* Video Player */}
            <video
              src={reel.video}
              autoPlay
              loop
              muted={muted}
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            
            {/* Top Bar Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <img src={reel.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt={reel.author} />
                <div>
                  <p className="text-white text-xs font-bold drop-shadow">{reel.author}</p>
                  <p className="text-white/70 text-[9px] drop-shadow">@{reel.handle}</p>
                </div>
              </div>
              <button
                onClick={() => setMuted(!muted)}
                className="w-8 h-8 bg-black/45 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            
            {/* Double Tap Heart Animation */}
            {heartAnim[reel.id] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart size={80} className="text-red-500 fill-red-500 animate-ping drop-shadow-lg" />
              </div>
            )}
            
            {/* Action Bar (Right Overlay) */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
              <button
                onClick={() => handleLike(reel.id)}
                className="flex flex-col items-center gap-1 group/btn"
              >
                <div className="w-10 h-10 bg-black/35 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 border border-white/10">
                  <Heart size={18} className={reel.liked ? 'fill-red-500 text-red-500' : 'text-white'} />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{formatNum(reel.likes)}</span>
              </button>
              
              <button
                onClick={() => setCommentReel(reel)}
                className="flex flex-col items-center gap-1 group/btn"
              >
                <div className="w-10 h-10 bg-black/35 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 border border-white/10">
                  <MessageCircle size={18} />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{formatNum(reel.comments)}</span>
              </button>
              
              <button
                onClick={() => handleSave(reel.id)}
                className="flex flex-col items-center gap-1 group/btn"
              >
                <div className="w-10 h-10 bg-black/35 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 border border-white/10">
                  <Bookmark size={18} className={reel.saved ? 'fill-white text-white' : 'text-white'} />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">{formatNum(reel.saves)}</span>
              </button>
              
              <button className="flex flex-col items-center gap-1 group/btn">
                <div className="w-10 h-10 bg-black/35 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 border border-white/10">
                  <Share2 size={18} />
                </div>
                <span className="text-white text-[10px] font-semibold drop-shadow">Share</span>
              </button>
            </div>
            
            {/* Caption & Music (Bottom Overlay) */}
            <div className="absolute bottom-4 left-4 right-16 text-white space-y-3 z-10">
              <p className="text-xs leading-relaxed drop-shadow line-clamp-3">{reel.caption}</p>
              
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 w-fit border border-white/10">
                <Music2 size={11} className="text-white" />
                <span className="text-white text-[9px] font-medium truncate max-w-[180px]">{reel.music}</span>
              </div>
            </div>
            
            {/* Overlay Comments Drawer inside active reel */}
            {commentReel?.id === reel.id && (
              <div className="absolute inset-0 bg-black/60 z-30 flex items-end animate-fade-in">
                <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[70%] flex flex-col animate-slide-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-800 text-xs">Comments ({formatNum(reel.comments)})</h4>
                    <button
                      onClick={() => setCommentReel(null)}
                      className="p-1.5 rounded-full hover:bg-slate-150 text-slate-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5 items-start">
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
                          {c.user[0].toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-700 text-[10px]">@{c.user}</p>
                          <p className="text-slate-600 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <form onSubmit={postComment} className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 focus:bg-white transition-all text-slate-800"
                      required
                    />
                    <button type="submit" className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
      
      {/* Right Sidebar: Destination Details & CTA */}
      <aside className="hidden lg:flex flex-col w-[360px] p-6 bg-white border-l border-slate-200 overflow-y-auto no-scrollbar flex-shrink-0 rounded-2xl shadow-sm">
        
        {/* Destination Image Banner */}
        <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-5 shadow-sm">
          <img
            src={activeDestination.image}
            alt={activeDestination.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
            <MapPin size={12} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-800">{activeDestination.location}</span>
          </div>
        </div>
        
        {/* Header Details */}
        <div className="space-y-3 mb-6">
          <h1 className="text-xl font-extrabold text-slate-800 leading-tight tracking-tight">
            {activeDestination.name}
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(activeDestination.rating) ? 'currentColor' : 'none'}
                  className={i < Math.floor(activeDestination.rating) ? 'text-amber-400' : 'text-slate-250'}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {activeDestination.rating} ({activeDestination.reviews})
            </span>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            {activeDestination.description}
          </p>
        </div>
        
        {/* Highlights Bento-style Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {activeDestination.highlights.map((hl, idx) => {
            const IconComp = hl.icon;
            return (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1 hover:bg-slate-100/40 transition-colors">
                <IconComp size={16} className="text-blue-600" />
                <p className="text-[11px] font-bold text-slate-700 mt-1">{hl.title}</p>
                <p className="text-[10px] font-medium text-slate-400">{hl.subtitle}</p>
              </div>
            );
          })}
        </div>
        
        {/* Plan a Trip CTA */}
        <button
          onClick={() => navigate('/planner', { state: { destination: activeDestination.destinationSearch } })}
          className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          <span>Plan a trip here</span>
        </button>
        
        {/* Related Posts */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-[10px] tracking-wider font-bold text-slate-400 uppercase">Related Posts</h3>
          <div className="grid grid-cols-3 gap-2">
            {activeDestination.related.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-150 cursor-pointer hover:opacity-85 active:scale-95 transition-all">
                <img src={url} className="w-full h-full object-cover" alt="related post" />
              </div>
            ))}
          </div>
        </div>
        
      </aside>
      
    </div>
  );
}
