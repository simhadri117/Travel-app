import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Users, CreditCard, Newspaper, 
  Map, LogOut, Search, Activity, Trash, RefreshCw, Undo2
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5002/api/v1';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ww_admin_token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active section tab: 'dashboard' | 'users' | 'bookings' | 'posts' | 'itineraries'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'bookings' | 'posts' | 'itineraries'>('dashboard');

  // Stats / Tables states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  
  // Searches / Filters
  const [userSearch, setUserSearch] = useState('');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  // Axios configure
  const api = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, { email, password });
      if (res.data.success) {
        const adminToken = res.data.token;
        setToken(adminToken);
        localStorage.setItem('ww_admin_token', adminToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('ww_admin_token');
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings', { 
        params: { type: bookingTypeFilter, status: bookingStatusFilter } 
      });
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/admin/posts');
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await api.get('/admin/itineraries');
      if (res.data.success) setItineraries(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'dashboard') fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'bookings') fetchBookings();
      if (activeTab === 'posts') fetchPosts();
      if (activeTab === 'itineraries') fetchItineraries();
    }
  }, [token, activeTab, userSearch, bookingTypeFilter, bookingStatusFilter]);

  // Actions
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to suspend and delete this user profile?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessRefund = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and refund this booking?')) return;
    try {
      const res = await api.post(`/admin/bookings/${id}/refund`);
      if (res.data.success) {
        alert(res.data.message);
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Remove this post for violating guidelines?')) return;
    try {
      const res = await api.delete(`/admin/posts/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LOGIN RENDER =================
  if (!token) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-background-secondary border border-white/10 rounded-xl p-8 space-y-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-black text-accent-primary flex items-center justify-center gap-1.5">
              <ShieldAlert /> TravelSphere AI Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1">Please enter your credentials to authenticate</p>
          </div>

          {error && (
            <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs rounded text-center">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-gray-400">Admin Email</label>
              <input 
                type="email" placeholder="admin@travelsphere.ai" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-white focus:outline-none" required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-400">Password</label>
              <input 
                type="password" placeholder="admin123" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 text-white focus:outline-none" required 
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-primary/95 py-2.5 rounded font-bold text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    );
  }

  // ================= DASHBOARD SHELL RENDER =================
  return (
    <div className="min-h-screen bg-background-primary text-white flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-background-secondary border-b md:border-r border-white/5 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl">🛡️</span>
            <span className="font-heading font-black text-accent-primary text-lg">Admin Center</span>
          </div>

          <nav className="space-y-2 text-xs font-bold">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-left ${activeTab === 'dashboard' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Activity size={16} /> Home Metrics
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-left ${activeTab === 'users' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Users size={16} /> Manage Users
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-left ${activeTab === 'bookings' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <CreditCard size={16} /> Bookings Logs
            </button>
            <button 
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-left ${activeTab === 'posts' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Newspaper size={16} /> Moderator Queue
            </button>
            <button 
              onClick={() => setActiveTab('itineraries')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-left ${activeTab === 'itineraries' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Map size={16} /> Generated AI Plans
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 px-4 py-2 text-xs font-bold text-accent-primary border border-accent-primary/20 rounded hover:bg-accent-primary/10 transition-all w-full"
        >
          <LogOut size={16} /> Admin Log Out
        </button>
      </aside>

      {/* Main panel area */}
      <main className="flex-1 p-6 overflow-y-auto">

        {/* 1. DASHBOARD ANALYTICS PANEL */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-black">System Home Metrics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="glass-panel p-4 rounded">
                <p className="text-[10px] text-gray-500 font-bold uppercase">New Users Today</p>
                <p className="text-lg font-black text-accent-secondary mt-1">{stats.new_users_today}</p>
              </div>
              <div className="glass-panel p-4 rounded">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Bookings Count</p>
                <p className="text-lg font-black text-info mt-1">{stats.total_bookings_today}</p>
              </div>
              <div className="glass-panel p-4 rounded">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Revenue Sum Today</p>
                <p className="text-lg font-black text-accent-primary mt-1">₹{stats.total_revenue_today}</p>
              </div>
              <div className="glass-panel p-4 rounded">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Active Connections</p>
                <p className="text-lg font-black text-success mt-1">{stats.active_users_last_hour} Active</p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-wider">TravelSphere AI Platform Revenue Streams</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="glass-panel p-4 rounded border border-accent-primary/20 bg-accent-primary/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Hotel Commissions (10%)</p>
                <p className="text-lg font-black text-accent-primary mt-1">₹{stats.hotel_commission || 0}</p>
              </div>
              <div className="glass-panel p-4 rounded border border-success/20 bg-success/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Homestay Listing Fees (12%)</p>
                <p className="text-lg font-black text-success mt-1">₹{stats.homestay_listing_fees || 0}</p>
              </div>
              <div className="glass-panel p-4 rounded border border-accent-secondary/20 bg-accent-secondary/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Sponsored Reels Ad Revenue</p>
                <p className="text-lg font-black text-accent-secondary mt-1">₹{stats.sponsored_reels_revenue || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Breakdowns table */}
              <div className="glass-panel p-5 rounded space-y-4 text-xs">
                <h3 className="font-bold text-white border-b border-white/5 pb-2">Revenue Streams Today</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="pb-2">Booking Stream</th>
                      <th className="pb-2">Tickets Sold</th>
                      <th className="pb-2 text-right">Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.bookings_breakdown.map((b: any) => (
                      <tr key={b.type} className="border-t border-white/5">
                        <td className="py-2.5 font-bold uppercase">{b.type}</td>
                        <td className="py-2.5">{b.count}</td>
                        <td className="py-2.5 text-right font-black text-accent-secondary">₹{b.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Health Diagnostics */}
              <div className="glass-panel p-5 rounded space-y-4 text-xs">
                <h3 className="font-bold text-white border-b border-white/5 pb-2">Server Diagnostics</h3>
                <div className="space-y-2">
                  <p><strong>System Server Status:</strong> <span className="text-success font-bold">{stats.server_health}</span></p>
                  <p><strong>Node RAM Heap Limit:</strong> {stats.memory_usage.toFixed(2)} MB</p>
                  <p><strong>Database:</strong> MongoDB Atlas Connected</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS MANAGER */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-heading font-black">Registered Traveler Profiles</h2>
              <div className="flex items-center bg-white/5 border border-white/10 rounded px-3 py-1 text-xs">
                <Search size={14} className="text-gray-400 mr-2" />
                <input 
                  type="text" placeholder="Search users name..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent focus:outline-none" 
                />
              </div>
            </div>

            <div className="glass-panel rounded overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-gray-400">
                    <th className="p-3">User Name</th>
                    <th className="p-3">Phone number</th>
                    <th className="p-3">Home city</th>
                    <th className="p-3">Counters</th>
                    <th className="p-3 text-right">Moderations</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t border-white/5 hover:bg-white/2">
                      <td className="p-3 flex items-center gap-2">
                        <img src={u.profile_photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-bold">{u.name || 'Incomplete Profile'}</span>
                      </td>
                      <td className="p-3 font-mono">{u.phone}</td>
                      <td className="p-3">{u.home_city || 'Not Onboarded'}</td>
                      <td className="p-3 text-[10px] text-gray-500">
                        Posts: {u.posts_count} | Trips: {u.trips_count}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          className="bg-accent-primary/20 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary hover:text-white px-2 py-1 rounded transition-all"
                        >
                          Suspend User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. BOOKINGS LOGGER */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-heading font-black">Bookings and Revenue Logs</h2>
              
              <div className="flex gap-2">
                <select 
                  value={bookingTypeFilter} onChange={(e) => setBookingTypeFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                >
                  <option value="">All Types</option>
                  <option value="flight">Flights</option>
                  <option value="train">Trains</option>
                  <option value="bus">Buses</option>
                  <option value="hotel">Hotels</option>
                  <option value="homestay">Homestays</option>
                  <option value="activity">Activities</option>
                  <option value="package">Packages</option>
                </select>
                <select 
                  value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="glass-panel rounded overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-gray-400">
                    <th className="p-3">Passenger</th>
                    <th className="p-3">Reference PNR</th>
                    <th className="p-3">Type & Target</th>
                    <th className="p-3">Fare Amount</th>
                    <th className="p-3">State</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t border-white/5 hover:bg-white/2">
                      <td className="p-3">
                        <p className="font-bold">{b.user_id?.name || 'Guest'}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{b.provider_booking_id}</p>
                      </td>
                      <td className="p-3 font-mono font-bold text-accent-primary">{b.booking_reference}</td>
                      <td className="p-3 uppercase font-bold">
                        <div>{b.booking_type}</div>
                        <div className="text-[10px] text-gray-400 normal-case font-normal max-w-[200px] truncate">
                          {b.journey_details?.hotel_name || 
                           b.journey_details?.homestay_name || 
                           b.journey_details?.package_name ||
                           b.journey_details?.flight_details?.flight_number ||
                           b.journey_details?.train_name ||
                           b.journey_details?.bus_details?.operator_name || 
                           b.journey_details?.hotel_details?.name ||
                           b.journey_details?.homestay_details?.name ||
                           b.journey_details?.package_details?.name ||
                           b.journey_details?.flight_number ||
                           ''}
                        </div>
                      </td>
                      <td className="p-3 font-black text-accent-secondary">₹{b.amount_paid}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'confirmed' ? 'bg-success/20 text-success' : 'bg-white/5 text-gray-500'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => handleProcessRefund(b._id)}
                            className="bg-accent-primary/20 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary hover:text-white px-2.5 py-1 rounded transition-all"
                          >
                            Cancel & Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. MODERATOR QUEUE */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-black">Social Feed Moderator Queue</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div key={post._id} className="glass-panel p-4 rounded flex gap-4 text-xs border border-white/5">
                  <div className="w-20 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                    <img src={post.media_urls?.[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-bold text-white truncate">Author: {post.user_id?.name || 'Explorer'}</p>
                    <p className="text-gray-400 line-clamp-2">{post.caption}</p>
                    <p className="text-[10px] text-accent-secondary">Likes: {post.likes_count} | Comments: {post.comments_count}</p>
                    
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="mt-2 bg-accent-primary/20 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary hover:text-white px-3 py-1 rounded transition-all"
                    >
                      Delete Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. GENERATED AI PLANS */}
        {activeTab === 'itineraries' && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-black">AI Generated Travel Programs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {itineraries.map((it) => (
                <div key={it._id} className="glass-panel p-4 rounded space-y-2 border border-white/5 bg-white/[0.01]">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-white text-sm">{it.destination}</span>
                    <span className="text-[10px] text-accent-secondary">{new Date(it.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-400">User: {it.user_id?.name || 'Guest'}</p>
                  <p className="text-[10px] text-gray-500">Budget Limit: ₹{it.filters?.budget} | Duration: {it.filters?.days} Days</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
