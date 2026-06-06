import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Heart, MessageCircle, Volume2, VolumeX, Share2, Bookmark, Send, X, Music2 } from 'lucide-react';

const REELS_DATA = [
  {
    id: 'reel_1',
    author: 'Ananya Iyer',
    handle: 'ananya.travels',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    caption: 'Sunset strolls along the golden sand of Goa 🌅 Nothing matches this vibe. #goa #beach #sunset',
    video: 'https://res.cloudinary.com/demo/video/upload/glide-over-coastal-beach.mp4',
    likes: 3420,
    comments: 240,
    saves: 850,
    music: 'Goa Golden Breeze · Original Sound',
  },
  {
    id: 'reel_2',
    author: 'Rohan Sharma',
    handle: 'rohan.explorer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    caption: 'Waking up to these glorious mountain views in Manali! True bliss ❄️ #mountain #travel #manali',
    video: 'https://res.cloudinary.com/demo/video/upload/docs/mountain-aerial-view.mp4',
    likes: 5120,
    comments: 480,
    saves: 1200,
    music: 'Manali Cold Chills · LoFi Beats',
  },
  {
    id: 'reel_3',
    author: 'Kabir Dev',
    handle: 'kabir.captures',
    avatar: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100',
    caption: 'Exploring the Patrika Gate in Jaipur 🎨 The colors are absolute eye candy! #jaipur #pinkcity #heritage',
    video: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    likes: 8200,
    comments: 920,
    saves: 2100,
    music: 'Jaipur Rajasthani Flute · Instrumental',
  },
];

const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

export default function Reels() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [reels, setReels] = useState<any[]>(REELS_DATA);
  const [muted, setMuted] = useState(true);
  const [commentReel, setCommentReel] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([
    { id: '1', user: 'Arjun', text: 'This looks absolute magic! 🔥' },
    { id: '2', user: 'Simran', text: 'On my bucket list for sure! 😍' },
    { id: '3', user: 'Neil', text: 'Which camera was this shot on?' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [heartAnim, setHeartAnim] = useState<Record<string, boolean>>({});

  const handleLike = (id: string, doubleTap = false) => {
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
    setReels(r => r.map(reel => reel.id === id
      ? { ...reel, liked: !reel.liked, likes: reel.liked ? reel.likes - 1 : reel.likes + 1 }
      : reel
    ));
    if (doubleTap) {
      setHeartAnim(p => ({ ...p, [id]: true }));
      setTimeout(() => setHeartAnim(p => ({ ...p, [id]: false })), 800);
    }
  };

  const handleSave = (id: string) => {
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
    setReels(r => r.map(reel => reel.id === id ? { ...reel, saved: !reel.saved } : reel));
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
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
    setComments(c => [...c, { id: Date.now().toString(), user: 'Me', text: newComment }]);
    setNewComment('');
    if (commentReel) {
      setReels(r => r.map(reel => reel.id === commentReel.id ? { ...reel, comments: reel.comments + 1 } : reel));
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm relative" style={{ height: '85vh' }}>
        <div className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth rounded-3xl bg-black overflow-hidden no-scrollbar shadow-panel">
          {reels.map(reel => (
            <div
              key={reel.id}
              className="relative w-full h-full snap-start overflow-hidden bg-black"
              onDoubleClick={() => handleLike(reel.id, true)}
              style={{ minHeight: '85vh' }}
            >
              {/* Video */}
              <video
                src={reel.video}
                autoPlay loop muted={muted} playsInline
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

              {/* Top bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={reel.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt={reel.author} />
                  <div>
                    <p className="text-white text-xs font-bold">{reel.author}</p>
                    <p className="text-white/60 text-[10px]">@{reel.handle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMuted(!muted)}
                  className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>

              {/* Double-tap heart animation */}
              {heartAnim[reel.id] && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart size={90} className="text-red-500 fill-red-500 animate-ping" />
                </div>
              )}

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <p className="text-white text-xs leading-relaxed">{reel.caption}</p>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
                  <Music2 size={10} className="text-white" />
                  <span className="text-white text-[10px] font-medium truncate max-w-[200px]">{reel.music}</span>
                </div>
              </div>

              {/* Right action buttons */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
                <button onClick={() => handleLike(reel.id)} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center">
                    <Heart size={18} className={reel.liked ? 'fill-red-500 text-red-500' : 'text-white'} />
                  </div>
                  <span className="text-white text-[10px] font-semibold">{formatNum(reel.likes)}</span>
                </button>

                <button onClick={() => setCommentReel(reel)} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <span className="text-white text-[10px] font-semibold">{formatNum(reel.comments)}</span>
                </button>

                <button onClick={() => handleSave(reel.id)} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center">
                    <Bookmark size={18} className={reel.saved ? 'fill-white text-white' : 'text-white'} />
                  </div>
                  <span className="text-white text-[10px] font-semibold">{formatNum(reel.saves)}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center">
                    <Share2 size={18} className="text-white" />
                  </div>
                  <span className="text-white text-[10px] font-semibold">Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comment drawer */}
        {commentReel && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-end rounded-3xl overflow-hidden">
            <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[60%] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm">Comments</h4>
                <button onClick={() => setCommentReel(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {c.user[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">@{c.user}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={postComment} className="flex gap-2 pt-2 border-t border-slate-100">
                <input type="text" placeholder="Add a comment..."
                  value={newComment} onChange={e => setNewComment(e.target.value)}
                  className="input-field flex-1 py-2" required />
                <button type="submit" className="btn btn-md btn-primary px-4 rounded-2xl">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
