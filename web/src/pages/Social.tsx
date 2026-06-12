import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { createFavorite, deleteFavorite, getFavorites } from '../services/firestore';
import {
  Heart, MessageCircle, Share2, Send, X,
  MapPin, PlusCircle, Search, Bookmark, MoreHorizontal
} from 'lucide-react';

export default function Social() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [tab, setTab] = useState<'feed' | 'explore' | 'create'>('feed');

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [commentPost, setCommentPost] = useState<any>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [destTag, setDestTag] = useState('');
  const [uploading, setUploading] = useState(false);

  const [exploreQuery, setExploreQuery] = useState('');
  const [explorePosts, setExplorePosts] = useState<any[]>([]);

  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await api.get('/posts/feed');
      if (res.data.success) {
        let bookmarkedIds: string[] = [];
        if (isAuthenticated) {
          try {
            const favs = await getFavorites();
            bookmarkedIds = favs.filter(f => f.targetType === 'post').map(f => f.targetId);
          } catch (favErr) {
            console.error('Error fetching favorites for social feed:', favErr);
          }
        }
        const mapped = res.data.data.map((p: any) => ({
          ...p,
          saved: bookmarkedIds.includes(p._id)
        }));
        setFeedPosts(mapped);
      }
    } catch {} finally { setLoadingFeed(false); }
  };

  useEffect(() => {
    if (tab === 'feed') fetchFeed();
    else if (tab === 'explore') handleExploreSearch();
  }, [tab, isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Like Post',
        subtitle: 'Sign in to like posts, interact with the community, and follow users.',
        onSuccess: () => {
          handleLike(postId);
        }
      });
      return;
    }
    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data.success) {
        setFeedPosts(posts => posts.map(p => p._id === postId
          ? { ...p, liked_by_me: res.data.data.liked, likes_count: res.data.data.likes_count }
          : p
        ));
      }
    } catch {}
  };

  const handleSavePost = async (postId: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Save Post',
        subtitle: 'Sign in to save posts, interact with the community, and follow users.',
        onSuccess: () => {
          handleSavePost(postId);
        }
      });
      return;
    }

    const targetPost = feedPosts.find(p => p._id === postId);
    if (!targetPost) return;

    const newSaved = !targetPost.saved;
    setFeedPosts(posts => posts.map(p => p._id === postId ? { ...p, saved: newSaved } : p));

    try {
      if (newSaved) {
        await createFavorite({
          targetId: postId,
          targetType: 'post',
          name: targetPost.caption || 'Community Post',
          imageUrl: targetPost.media_urls?.[0] || ''
        });
      } else {
        const favs = await getFavorites();
        const targetFav = favs.find(f => f.targetId === postId && f.targetType === 'post');
        if (targetFav && targetFav.id) {
          await deleteFavorite(targetFav.id);
        }
      }
    } catch (err) {
      console.error('[Firestore Save Post Favorite Failed]:', err);
    }
  };

  const handleOpenComments = async (post: any) => {
    setCommentPost(post);
    try {
      const res = await api.get(`/posts/${post._id}/comments`);
      if (res.data.success) setCommentsList(res.data.data);
    } catch {}
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commentPost) return;
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Add Comment',
        subtitle: 'Sign in to share your thoughts and reply to this post.',
        onSuccess: () => {
          handleAddComment(e);
        }
      });
      return;
    }
    try {
      const res = await api.post(`/posts/${commentPost._id}/comments`, { text: newComment });
      if (res.data.success) {
        setCommentsList(prev => [...prev, { ...res.data.data, user_id: { _id: user?._id, name: user?.name, profile_photo_url: user?.profile_photo_url } }]);
        setNewComment('');
        setFeedPosts(posts => posts.map(p => p._id === commentPost._id ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch {}
  };

  const handleExploreSearch = async () => {
    try {
      const res = await api.get('/explore', { params: { query: exploreQuery } });
      if (res.data.success) {
        let bookmarkedIds: string[] = [];
        if (isAuthenticated) {
          try {
            const favs = await getFavorites();
            bookmarkedIds = favs.filter(f => f.targetType === 'post').map(f => f.targetId);
          } catch (favErr) {
            console.error('Error fetching favorites for explore feed:', favErr);
          }
        }
        const mapped = res.data.data.map((p: any) => ({
          ...p,
          saved: bookmarkedIds.includes(p._id)
        }));
        setExplorePosts(mapped);
      }
    } catch {}
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) { alert('Please provide a photo URL'); return; }
    setUploading(true);
    try {
      const res = await api.post('/posts', {
        media_urls: [mediaUrl],
        media_types: [mediaUrl.includes('mp4') ? 'video' : 'image'],
        caption, destination_tag: destTag
      });
      if (res.data.success) { setMediaUrl(''); setCaption(''); setDestTag(''); setTab('feed'); fetchFeed(); }
    } catch {} finally { setUploading(false); }
  };

  const SAMPLE_IMAGES = [
    { label: '🏖️ Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
    { label: '🏔️ Mountain', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800' },
    { label: '🕌 Heritage', url: 'https://images.unsplash.com/photo-1477587458883-47145ed31769?w=800' },
    { label: '🌴 Tropical', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800' },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Community</h1>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal({
                title: 'Create a Post',
                subtitle: 'Sign in to share your travel photos, videos, and recommendations.',
                onSuccess: () => {
                  setTab('create');
                }
              });
              return;
            }
            setTab('create');
          }}
          className="btn btn-sm btn-primary"
        >
          <PlusCircle size={14} /> New Post
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        {(['feed', 'explore'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px
              ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t === 'feed' ? 'Social Feed' : 'Explore'}
          </button>
        ))}
      </div>

      {/* ── FEED ── */}
      {tab === 'feed' && (
        <div className="space-y-5">
          {loadingFeed ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="card overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-2xl" />
                    <div className="space-y-2 flex-1"><div className="skeleton-text w-24" /><div className="skeleton-text w-16" /></div>
                  </div>
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-2"><div className="skeleton-text w-full" /><div className="skeleton-text w-3/4" /></div>
                </div>
              ))}
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-slate-400 text-sm">No posts yet. Be the first to share!</p>
              <button onClick={() => setTab('create')} className="btn btn-md btn-primary mt-4">Create Post</button>
            </div>
          ) : (
            feedPosts.map(post => (
              <div key={post._id} className="card overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.user_id?.profile_photo_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${post.user_id?.name}`}
                      alt={post.user_id?.name}
                      className="w-10 h-10 rounded-2xl object-cover bg-slate-100"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{post.user_id?.name || 'Explorer'}</p>
                      {post.destination_tag && (
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={10} className="text-brand-500" /> {post.destination_tag}
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Media */}
                <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                  {post.media_types?.[0] === 'video' ? (
                    <video src={post.media_urls?.[0]} controls loop muted className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={post.media_urls?.[0]}
                      alt="post"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                      onDoubleClick={() => handleLike(post._id)}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 transition-all hover:scale-110 ${post.liked_by_me ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                      <Heart size={20} fill={post.liked_by_me ? 'currentColor' : 'none'} />
                      <span className="text-xs font-semibold">{post.likes_count}</span>
                    </button>
                    <button onClick={() => handleOpenComments(post)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                      <MessageCircle size={20} />
                      <span className="text-xs font-semibold">{post.comments_count}</span>
                    </button>
                    <button className="text-slate-400 hover:text-slate-700 transition-colors">
                      <Share2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleSavePost(post._id)}
                      className={`ml-auto transition-all hover:scale-110 ${post.saved ? 'text-brand-600' : 'text-slate-400 hover:text-slate-750'}`}
                    >
                      <Bookmark size={20} fill={post.saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  {post.caption && (
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900 mr-1">{post.user_id?.name}</span>
                      {post.caption}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── EXPLORE ── */}
      {tab === 'explore' && (
        <div className="space-y-4">
          <form onSubmit={e => { e.preventDefault(); handleExploreSearch(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-3 text-slate-400" />
              <input type="text" placeholder="Search locations, hashtags..." value={exploreQuery}
                onChange={e => setExploreQuery(e.target.value)} className="input-field pl-9" />
            </div>
            <button type="submit" className="btn btn-md btn-primary">Search</button>
          </form>

          <div className="grid grid-cols-3 gap-2">
            {explorePosts.map(post => (
              <div key={post._id} onClick={() => { setFeedPosts([post]); setTab('feed'); }}
                className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative group cursor-pointer">
                <img src={post.media_urls?.[0]} alt="explore" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-bold flex items-center gap-1"><Heart size={12} fill="white" /> {post.likes_count}</span>
                </div>
              </div>
            ))}
            {explorePosts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
                Search for travel moments & places
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE POST ── */}
      {tab === 'create' && (
        <form onSubmit={handleUpload} className="card p-6 space-y-5">
          <h2 className="font-bold text-lg text-slate-900">Share a Travel Moment</h2>

          {/* Image preview */}
          {mediaUrl && (
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100">
              <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setMediaUrl('')}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600 hover:bg-slate-100">
                <X size={14} />
              </button>
            </div>
          )}

          <div>
            <label className="label">Photo URL</label>
            <input type="text" placeholder="Paste image URL (Unsplash, etc.)" value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)} className="input-field font-mono text-xs" required />
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
              {SAMPLE_IMAGES.map(s => (
                <button key={s.label} type="button" onClick={() => setMediaUrl(s.url)}
                  className="chip text-xs flex-shrink-0">{s.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Caption</label>
            <textarea placeholder="Write a caption... #hashtags 🌍" value={caption}
              onChange={e => setCaption(e.target.value)} rows={3}
              className="input-field resize-none" />
          </div>

          <div>
            <label className="label">Tag Destination</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-4 top-3.5 text-slate-400" />
              <input type="text" placeholder="Goa, Manali, Jaipur..." value={destTag}
                onChange={e => setDestTag(e.target.value)} className="input-field pl-9" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setTab('feed')} className="btn btn-md btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={uploading} className="btn btn-md btn-primary flex-1 disabled:opacity-50">
              {uploading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      )}

      {/* ── COMMENT DRAWER ── */}
      {commentPost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50 p-4 modal-overlay"
          onClick={() => setCommentPost(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col modal-content"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Comments</h3>
              <button onClick={() => setCommentPost(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {commentsList.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No comments yet. Be the first!</p>
              ) : (
                commentsList.map(c => (
                  <div key={c._id} className="flex gap-3">
                    <img src={c.user_id?.profile_photo_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${c.user_id?.name}`}
                      className="w-8 h-8 rounded-2xl object-cover bg-slate-100 flex-shrink-0" alt={c.user_id?.name} />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{c.user_id?.name || 'Explorer'}</p>
                      <p className="text-sm text-slate-600">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-100">
              <input type="text" placeholder="Write a comment..." value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="input-field flex-1 py-2.5" required />
              <button type="submit" className="btn btn-md btn-primary px-4 rounded-2xl">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
