import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  FlatList, Image, SafeAreaView, StatusBar, Alert, ActivityIndicator, Modal
} from 'react-native';
import axios from 'axios';

interface Station {
  code: string;
  name: string;
  city: string;
  popular?: boolean;
}

const STATIONS: Station[] = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi', popular: true },
  { code: 'DLI', name: 'Delhi Junction', city: 'Delhi' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', popular: true },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', popular: true },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad' },
  { code: 'KCG', name: 'Kacheguda', city: 'Hyderabad' },
  { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bangalore', popular: true },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bangalore' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', popular: true },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai' },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', popular: true },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', popular: true },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', popular: true },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', popular: true },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Goa', popular: true },
  { code: 'VSG', name: 'Vasco Da Gama', city: 'Goa' }
];

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Pune'];

const getStationName = (code: string) => {
  if (!code) return '';
  const st = STATIONS.find(s => s.code === code.toUpperCase());
  return st ? st.name : code;
};

// Host machine LAN IP — physical Android device connects over WiFi to this address
// For Android emulator, use: http://10.0.2.2:5001/api/v1
// For physical device on same WiFi, use your PC's local IP:
const API_URL = 'http://10.40.63.134:5001/api/v1';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Navigation state: 'login' | 'onboard' | 'home' | 'hotels' | 'homestays' | 'planner' | 'assistant' | 'reels' | 'maps' | 'trips' | 'rewards'
  const [screen, setScreen] = useState<string>('login');

  // Input states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);

  // Onboard states
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [userRole, setUserRole] = useState('traveler'); // traveler | influencer | guide | agency
  const [preferences, setPreferences] = useState<string[]>([]);

  // AI Planner states
  const [plannerDestination, setPlannerDestination] = useState('Goa');
  const [plannerDays, setPlannerDays] = useState('3');
  const [plannerBudget, setPlannerBudget] = useState('15000');
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);

  // Feed/Reels states
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [reelsSubTab, setReelsSubTab] = useState<'watch' | 'camera'>('watch');
  const [activeFilter, setActiveFilter] = useState<'Normal' | 'Chrome' | 'Vintage' | 'Warm' | 'Cool'>('Normal');
  const [reelsCaption, setReelsCaption] = useState('');

  // Trips states
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripSubTab, setTripSubTab] = useState<'bookings' | 'chat' | 'splitter'>('bookings');
  
  // Trip Collaboration states
  const [tripMessages, setTripMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [tripBalances, setTripBalances] = useState<any>(null);
  const [inviteEmailOrPhone, setInviteEmailOrPhone] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitDescription, setSplitDescription] = useState('');

  // Trip creation state
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [newTripStart, setNewTripStart] = useState('2026-06-15');
  const [newTripEnd, setNewTripEnd] = useState('2026-06-18');

  // Hotels states
  const [hotelCity, setHotelCity] = useState('Goa');
  const [hotelsList, setHotelsList] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState('2026-06-15');
  const [hotelCheckOut, setHotelCheckOut] = useState('2026-06-18');
  const [hotelGuests, setHotelGuests] = useState('2');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  // Homestays states
  const [homestayCity, setHomestayCity] = useState('Goa');
  const [homestaysList, setHomestaysList] = useState<any[]>([]);
  const [selectedHomestay, setSelectedHomestay] = useState<any>(null);
  const [homestayModalVisible, setHomestayModalVisible] = useState(false);
  const [homestayCheckIn, setHomestayCheckIn] = useState('2026-06-15');
  const [homestayCheckOut, setHomestayCheckOut] = useState('2026-06-18');
  const [homestaySubTab, setHomestaySubTab] = useState<'browse' | 'host'>('browse');
  
  // Host Dashboard inputs
  const [hostListings, setHostListings] = useState<any[]>([]);
  const [newHomestayName, setNewHomestayName] = useState('');
  const [newHomestayPrice, setNewHomestayPrice] = useState('');
  const [newHomestayCity, setNewHomestayCity] = useState('');
  const [newHomestayAddress, setNewHomestayAddress] = useState('');
  const [newHomestayDesc, setNewHomestayDesc] = useState('');

  // Scroll ref for assistant chat
  const assistantScrollViewRef = useRef<ScrollView>(null);

  // AI Assistant states
  const [assistantChat, setAssistantChat] = useState<any[]>([]);
  const [assistantMessage, setAssistantMessage] = useState('');

  // Maps states
  const [mapFilter, setMapFilter] = useState<'all' | 'hotels' | 'attractions' | 'restaurants'>('all');
  const [selectedMapPath, setSelectedMapPath] = useState<string | null>(null);

  // Rewards states
  const [rewardsStats, setRewardsStats] = useState<any>(null);

  // Trains booking states
  const [trainSource, setTrainSource] = useState('NDLS');
  const [trainDestination, setTrainDestination] = useState('CSMT');
  const [trainSourceSearch, setTrainSourceSearch] = useState('New Delhi Railway Station');
  const [trainDestinationSearch, setTrainDestinationSearch] = useState('Chhatrapati Shivaji Maharaj Terminus');
  const [trainDate, setTrainDate] = useState('2026-06-15');
  const [trainQuota, setTrainQuota] = useState('General');
  const [trainPassengersCount, setTrainPassengersCount] = useState('1');
  const [trainsList, setTrainsList] = useState<any[]>([]);
  const [trainStep, setTrainStep] = useState<'search' | 'results' | 'berths' | 'checkout' | 'ticket'>('search');
  
  // Selection states
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [trainPassengersDetails, setTrainPassengersDetails] = useState<any[]>([{ name: '', age: '', gender: 'Male', berth_preference: 'Lower', id_number: '' }]);
  const [trainBookingConfirmation, setTrainBookingConfirmation] = useState<any>(null);

  // Autocomplete UI states
  const [trainActiveInput, setTrainActiveInput] = useState<'source' | 'destination' | null>(null);
  const [trainSearchQuery, setTrainSearchQuery] = useState('');
  const [showTrainDropdown, setShowTrainDropdown] = useState(false);

  // Voice Search states
  const [isTrainListening, setIsTrainListening] = useState(false);
  const [trainListeningTarget, setTrainListeningTarget] = useState<'source' | 'destination' | null>(null);

  const getTrainSuggestions = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIONS;
    return STATIONS.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  };

  const handleMobilePopularCityClick = (city: string) => {
    const popularStation = STATIONS.find(s => s.city.toLowerCase() === city.toLowerCase() && s.popular);
    if (!popularStation) return;

    if (trainActiveInput === 'destination') {
      setTrainDestination(popularStation.code);
      setTrainDestinationSearch(popularStation.name);
      setShowTrainDropdown(false);
    } else if (trainActiveInput === 'source') {
      setTrainSource(popularStation.code);
      setTrainSourceSearch(popularStation.name);
      setShowTrainDropdown(false);
    } else {
      if (!trainSource || trainSource === 'NDLS' && trainSourceSearch === 'New Delhi Railway Station') {
        setTrainSource(popularStation.code);
        setTrainSourceSearch(popularStation.name);
      } else {
        setTrainDestination(popularStation.code);
        setTrainDestinationSearch(popularStation.name);
      }
    }
  };

  const handleMobileVoiceSearch = (target: 'source' | 'destination') => {
    setTrainListeningTarget(target);
    setIsTrainListening(true);
    setTimeout(() => {
      const sampleQueries = ['Delhi', 'Mumbai', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Goa'];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      const matched = STATIONS.find(s => 
        s.name.toLowerCase().includes(randomQuery.toLowerCase()) || 
        s.city.toLowerCase().includes(randomQuery.toLowerCase())
      ) || STATIONS.find(s => s.city.toLowerCase() === 'delhi' && s.popular);

      if (matched) {
        if (target === 'source') {
          setTrainSource(matched.code);
          setTrainSourceSearch(matched.name);
        } else {
          setTrainDestination(matched.code);
          setTrainDestinationSearch(matched.name);
        }
      }
      setIsTrainListening(false);
    }, 2000);
  };

  const handleSearchTrains = async () => {
    setLoading(true);
    setTrainStep('results');
    try {
      const res = await api.get('/trains/search', {
        params: {
          source: trainSource,
          destination: trainDestination,
          date: trainDate,
          quota: trainQuota
        }
      });
      if (res.data.success) {
        setTrainsList(res.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to find trains');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTrain = async () => {
    for (let p of trainPassengersDetails) {
      if (!p.name || !p.age || !p.id_number) {
        return Alert.alert('Error', 'Please fill passenger details');
      }
    }
    setLoading(true);
    const totalPrice = selectedClass.price * Number(trainPassengersCount);
    try {
      const resBook = await api.post('/trains/book', {
        train_details: {
          ...selectedTrain,
          class_name: selectedClass.class_name,
          total_price: totalPrice,
          date: trainDate,
          quota: trainQuota
        },
        passengers: trainPassengersDetails,
        payment_id: `pay_mock_trn_${Math.random().toString(36).substring(2, 10)}`
      });

      if (resBook.data.success) {
        setTrainBookingConfirmation(resBook.data.data);
        setTrainStep('ticket');
        setTrainPassengersDetails([{ name: '', age: '', gender: 'Male', berth_preference: 'Lower', id_number: '' }]);
      }
    } catch (err) {
      Alert.alert('Error', 'Train booking transaction failed');
    } finally {
      setLoading(false);
    }
  };


  // Axios instance configurations
  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // 1. Request Phone OTP
  const handleRequestOtp = async () => {
    if (!phone) return Alert.alert('Error', 'Please enter your phone number');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/otp/request`, { phone });
      setOtpStep(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to request OTP. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Phone OTP
  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter OTP');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/otp/verify`, { phone, otp });
      if (res.data.success) {
        const { token: userToken, user: profile, is_new_user } = res.data.data;
        setToken(userToken);
        setUser(profile);
        if (is_new_user) {
          setScreen('onboard');
        } else {
          setScreen('home');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Mock social authentication options
  const handleMockSocialLogin = (provider: string) => {
    Alert.alert('Social Authentication', `Simulating ${provider} login request...`, [
      {
        text: 'Proceed as Traveler',
        onPress: () => {
          setToken('mock_social_token');
          setUser({ name: 'Guest Traveler', home_city: 'Mumbai', role: 'traveler' });
          setScreen('home');
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  // 3. Onboard profile setup
  const handleOnboardSubmit = async () => {
    if (!name || !homeCity) return Alert.alert('Error', 'Name and home city are required');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/onboard`, {
        name,
        home_city: homeCity,
        role: userRole,
        travel_preferences: preferences
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUser(res.data.data);
        setScreen('home');
      }
    } catch (err) {
      Alert.alert('Error', 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Generate AI Itinerary
  const handleGenerateItinerary = async () => {
    setLoading(true);
    try {
      const res = await api.post('/generate', {
        destination: plannerDestination,
        days: Number(plannerDays),
        budget: Number(plannerBudget),
        themes: preferences.length > 0 ? preferences : ['adventure'],
        month: 'October',
        year: 2026,
        transportPreference: 'No Preference',
        travelers: { adults: 1, children: 0 },
        accommodation: 'Mid-range',
        mealPreference: 'Both'
      });
      if (res.data.success) {
        setGeneratedItinerary(res.data.data.content);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  // 5. Fetch feed posts
  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/feed');
      if (res.data.success) setFeedPosts(res.data.data);
    } catch (err: any) {
      console.log('Feed fetch error:', err.message);
    }
  };

  // 6. Fetch Trips
  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      if (res.data.success) setMyTrips(res.data.data.upcoming);
    } catch (err: any) {
      console.log('Trips fetch error:', err.message);
    }
  };

  // 7. Create custom Trip
  const handleCreateTrip = async () => {
    if (!newTripName || !newTripDest) return Alert.alert('Error', 'Please fill name and destination');
    setLoading(true);
    try {
      const res = await api.post('/trips', {
        name: newTripName,
        destination: newTripDest,
        start_date: newTripStart,
        end_date: newTripEnd
      });
      if (res.data.success) {
        Alert.alert('Success', 'Trip scheduled successfully!');
        setNewTripName('');
        setNewTripDest('');
        setTripModalVisible(false);
        fetchTrips();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  // 8. Hotels search
  const handleSearchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels/search', { params: { city: hotelCity } });
      if (res.data.success) setHotelsList(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Hotel search failed');
    } finally {
      setLoading(false);
    }
  };

  // 9. Book Hotel
  const handleBookHotel = async () => {
    if (!cardHolder || !cardNumber) return Alert.alert('Error', 'Payment details required');
    setLoading(true);
    try {
      const res = await api.post('/hotels/book', {
        hotel_details: { name: selectedHotel.name, city: hotelCity },
        passengers: [{ name: user?.name || 'Lead Guest', age: 30, gender: 'M' }],
        check_in: hotelCheckIn,
        check_out: hotelCheckOut,
        amount_paid: selectedHotel.price_per_night * Number(hotelGuests),
        payment_id: `ch_stripe_${Math.random().toString(36).substring(7)}`
      });
      if (res.data.success) {
        Alert.alert('Booking Confirmed! 🏨', `Your room is booked at ${selectedHotel.name}.`);
        setHotelModalVisible(false);
        setSelectedHotel(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Booking transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // 10. Homestays search
  const handleSearchHomestays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/homestays/search', { params: { city: homestayCity } });
      if (res.data.success) setHomestaysList(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Homestays query failed');
    } finally {
      setLoading(false);
    }
  };

  // 11. Book Homestay
  const handleBookHomestay = async () => {
    setLoading(true);
    try {
      const res = await api.post('/homestays/book', {
        homestay_details: selectedHomestay,
        passengers: [{ name: user?.name || 'Guest User', age: 28, gender: 'F' }],
        check_in: homestayCheckIn,
        check_out: homestayCheckOut,
        amount_paid: selectedHomestay.price_per_night * 2,
        payment_id: `upi_mock_${Math.random().toString(36).substring(7)}`
      });
      if (res.data.success) {
        Alert.alert('Stay Confirmed! 🏡', `Host approved your booking request for ${selectedHomestay.name}`);
        setHomestayModalVisible(false);
        setSelectedHomestay(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Homestay booking failed');
    } finally {
      setLoading(false);
    }
  };

  // 12. Create Host listing
  const handleHostCreateHomestay = async () => {
    if (!newHomestayName || !newHomestayPrice || !newHomestayCity) {
      return Alert.alert('Error', 'Please fill name, price, and city');
    }
    setLoading(true);
    try {
      const res = await api.post('/homestays/create', {
        name: newHomestayName,
        description: newHomestayDesc || 'Charming local homestay with gorgeous garden view.',
        address: newHomestayAddress || 'Near City center main road',
        city: newHomestayCity,
        price_per_night: Number(newHomestayPrice)
      });
      if (res.data.success) {
        Alert.alert('Approved! ✅', 'Your property is listed and approved automatically.');
        setNewHomestayName('');
        setNewHomestayPrice('');
        setNewHomestayCity('');
        setNewHomestayAddress('');
        setNewHomestayDesc('');
        fetchHostProperties();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to publish listing');
    } finally {
      setLoading(false);
    }
  };

  const fetchHostProperties = async () => {
    try {
      const res = await api.get('/homestays/host-list');
      if (res.data.success) setHostListings(res.data.data);
    } catch (err: any) {
      console.log('Host list fetch error:', err.message);
    }
  };

  // 13. AI Assistant Send Query
  const handleAssistantSend = async (customMsg?: string) => {
    const textToSend = customMsg || assistantMessage;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', text: textToSend };
    setAssistantChat(prev => [...prev, userMessage]);
    if (!customMsg) setAssistantMessage('');

    setLoading(true);
    try {
      const res = await api.post('/assistant/chat', {
        message: textToSend,
        chatHistory: assistantChat
      });
      if (res.data.success) {
        setAssistantChat(prev => [...prev, { role: 'model', text: res.data.message }]);
      }
    } catch (err) {
      setAssistantChat(prev => [...prev, { role: 'model', text: "Sorry, I'm experiencing network issues right now." }]);
    } finally {
      setLoading(false);
    }
  };

  // 14. Reels double-tap like simulation
  const handleLikePost = async (postId: string) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data.success) fetchFeed();
    } catch (err: any) {
      console.log('Like error:', err.message);
    }
  };

  // Camera filter simulation capture
  const handleCameraCapture = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await api.post('/posts', {
          media_urls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'],
          caption: `${reelsCaption || 'Capturing the traveler essence!'} [Filter: ${activeFilter}]`,
          destination_tag: 'TravelSphere Destination'
        });
        if (res.data.success) {
          Alert.alert('Reels Published! 📸', 'Your filtered travel moment is live on the social feed.');
          setReelsCaption('');
          setReelsSubTab('watch');
          fetchFeed();
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to publish post');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  // 15. Rewards Statistics
  const fetchRewards = async () => {
    try {
      const res = await api.get('/rewards/stats');
      if (res.data.success) setRewardsStats(res.data.data);
    } catch (err: any) {
      console.log('Rewards error:', err.message);
    }
  };

  // 16. Trip collaborative actions
  const selectActiveTrip = async (trip: any) => {
    setSelectedTrip(trip);
    setScreen('trips');
    setTripSubTab('bookings');
    setLoading(true);
    try {
      // Fetch messages
      const msgRes = await api.get(`/trips/${trip._id}/messages`);
      if (msgRes.data.success) setTripMessages(msgRes.data.data);

      // Fetch balances
      const balRes = await api.get(`/trips/${trip._id}/balances`);
      if (balRes.data.success) setTripBalances(balRes.data.data);
    } catch (err: any) {
      console.log('Collaboration data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTripMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const res = await api.post(`/trips/${selectedTrip._id}/messages`, { message: chatMessage });
      if (res.data.success) {
        setTripMessages(prev => [...prev, res.data.data]);
        setChatMessage('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleInviteFriend = async () => {
    if (!inviteEmailOrPhone) return Alert.alert('Error', 'Enter phone number or email');
    setLoading(true);
    try {
      const res = await api.post(`/trips/${selectedTrip._id}/invite`, { emailOrPhone: inviteEmailOrPhone });
      if (res.data.success) {
        Alert.alert('Invited! ✉️', `${inviteEmailOrPhone} has been added to this trip.`);
        setInviteEmailOrPhone('');
        // Refresh balance details to include member
        const balRes = await api.get(`/trips/${selectedTrip._id}/balances`);
        if (balRes.data.success) setTripBalances(balRes.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Friend not found or already in trip');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitBillSubmit = async () => {
    if (!splitAmount || !splitDescription) return Alert.alert('Error', 'Enter amount and description');
    setLoading(true);
    try {
      // Calculate equal shares for all members
      const allMembers = tripBalances?.balances || [];
      if (allMembers.length === 0) return Alert.alert('Error', 'No members found');
      
      const shareVal = Number(splitAmount) / allMembers.length;
      const participants = allMembers.map((m: any) => ({
        user_id: m.user_id,
        share: shareVal
      }));

      const res = await api.post(`/trips/${selectedTrip._id}/shared-expenses`, {
        amount: Number(splitAmount),
        description: splitDescription,
        participants
      });
      if (res.data.success) {
        Alert.alert('Success', 'Bill logged and split equally!');
        setSplitAmount('');
        setSplitDescription('');
        // Refresh balances
        const balRes = await api.get(`/trips/${selectedTrip._id}/balances`);
        if (balRes.data.success) setTripBalances(balRes.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to log shared expense');
    } finally {
      setLoading(false);
    }
  };

  // Watchers / Fetch hooks
  useEffect(() => {
    if (token) {
      fetchFeed();
      fetchTrips();
      fetchRewards();
      if (userRole === 'agency' || userRole === 'guide') {
        fetchHostProperties();
      }
    }
  }, [token, screen]);

  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ================= SCREEN 1: LOGIN ================= */}
      {screen === 'login' && (
        <View style={styles.loginContainer}>
          <Text style={styles.appTitle}>🌍 TravelSphere AI</Text>
          <Text style={styles.subtitle}>Unified Travel Booking & Social Platform</Text>

          <View style={styles.formCard}>
            {!otpStep ? (
              <>
                <Text style={styles.label}>Enter Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 99999 99999"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <TouchableOpacity style={styles.button} onPress={handleRequestOtp}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Verification OTP</Text>}
                </TouchableOpacity>

                {/* Social Login Integrations */}
                <Text style={styles.orText}>OR SIGN IN WITH</Text>
                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleMockSocialLogin('Google')}>
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleMockSocialLogin('Facebook')}>
                    <Text style={styles.socialText}>Facebook</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleMockSocialLogin('Apple')}>
                    <Text style={styles.socialText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter Verification OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm & Login</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOtpStep(false)}>
                  <Text style={styles.backLink}>Change phone number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* ================= SCREEN 2: ONBOARDING ================= */}
      {screen === 'onboard' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Traveler Profile Onboarding</Text>
          <Text style={styles.subtitle}>Help us customize your TravelSphere AI dashboard</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Rohan Sharma"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Home City</Text>
            <TextInput
              style={styles.input}
              placeholder="New Delhi"
              placeholderTextColor="#64748B"
              value={homeCity}
              onChangeText={setHomeCity}
            />

            <Text style={styles.label}>Register As Role</Text>
            <View style={styles.badgeRow}>
              {[
                { key: 'traveler', label: 'Traveler' },
                { key: 'influencer', label: 'Influencer' },
                { key: 'guide', label: 'Tour Guide' },
                { key: 'agency', label: 'Travel Agency' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.badge, userRole === item.key && styles.selectedBadge]}
                  onPress={() => setUserRole(item.key)}
                >
                  <Text style={[styles.badgeText, userRole === item.key && styles.selectedBadgeText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Select Travel Themes</Text>
            <View style={styles.badgeRow}>
              {['beach', 'mountain', 'adventure', 'heritage', 'luxury', 'foodie'].map((item) => {
                const selected = preferences.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.badge, selected && styles.selectedBadge]}
                    onPress={() => togglePreference(item)}
                  >
                    <Text style={[styles.badgeText, selected && styles.selectedBadgeText]}>
                      {item.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleOnboardSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Launch Dashboard</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ================= SCREEN 3: HOME DASHBOARD ================= */}
      {screen === 'home' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.homeHeader}>
            <View>
              <Text style={styles.headerGreeting}>Hi, {user?.name || 'Explorer'} 👋</Text>
              <Text style={styles.subGreeting}>Home: {user?.home_city || 'Delhi'} | Role: {user?.role || 'Traveler'}</Text>
            </View>
            <TouchableOpacity onPress={() => setScreen('rewards')} style={styles.pointsBadge}>
              <Text style={styles.pointsText}>🏆 {rewardsStats?.points || 0} pts</Text>
            </TouchableOpacity>
          </View>

          {/* Super App Categories Grid */}
          <Text style={styles.sectionTitle}>TravelSphere Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity style={styles.serviceItem} onPress={() => { setScreen('hotels'); handleSearchHotels(); }}>
              <Text style={styles.serviceIcon}>🏨</Text>
              <Text style={styles.serviceLabel}>Hotels</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => { setScreen('homestays'); handleSearchHomestays(); }}>
              <Text style={styles.serviceIcon}>🏡</Text>
              <Text style={styles.serviceLabel}>Homestays</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => { setScreen('trains'); setTrainStep('search'); }}>
              <Text style={styles.serviceIcon}>🚂</Text>
              <Text style={styles.serviceLabel}>Trains</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => setScreen('planner')}>
              <Text style={styles.serviceIcon}>🤖</Text>
              <Text style={styles.serviceLabel}>AI Planner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => setScreen('assistant')}>
              <Text style={styles.serviceIcon}>💬</Text>
              <Text style={styles.serviceLabel}>AI Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => setScreen('reels')}>
              <Text style={styles.serviceIcon}>🎞️</Text>
              <Text style={styles.serviceLabel}>Reels</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => setScreen('maps')}>
              <Text style={styles.serviceIcon}>🗺️</Text>
              <Text style={styles.serviceLabel}>Vector Map</Text>
            </TouchableOpacity>
          </View>

          {/* Gamification mini-banner */}
          <TouchableOpacity style={styles.levelCard} onPress={() => setScreen('rewards')}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>Level: {rewardsStats?.level || 'Beginner Traveler 🚶'}</Text>
              <Text style={styles.levelPercentage}>{rewardsStats?.progress_to_next || 0}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${rewardsStats?.progress_to_next || 5}%` }]} />
            </View>
          </TouchableOpacity>

          {/* Interactive weather forecast card */}
          <View style={styles.weatherCard}>
            <Text style={styles.weatherTitle}>⛅ Local Travel Weather</Text>
            <Text style={styles.weatherTemp}>32°C</Text>
            <Text style={styles.weatherDesc}>Sunny skies and light summer breeze. Perfect for local touring!</Text>
          </View>

          {/* Trending destinations list */}
          <Text style={styles.sectionTitle}>Featured Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[
              { id: '1', name: 'Goa Golden Beaches', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300' },
              { id: '2', name: 'Jaipur Heritage Forts', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300' },
              { id: '3', name: 'Manali Snow Slopes', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300' }
            ].map((item) => (
              <View key={item.id} style={styles.destinationCard}>
                <Image source={{ uri: item.img }} style={styles.destImage} />
                <Text style={styles.destName}>{item.name}</Text>
                <Text style={styles.destCost}>Best price guaranteed</Text>
              </View>
            ))}
          </ScrollView>

          {/* Sponsored Ads / Offers Banner */}
          <Text style={styles.sectionTitle}>Exclusive Sponsored Deals</Text>
          <View style={styles.dealsCard}>
            <Text style={styles.dealText}>🎁 Uber Premier Airport Ride — Flat 15% Cashback</Text>
            <Text style={styles.dealText}>🎟️ Taj Mahal Entry FastTrack Tickets — Buy 2 Get 1 Free</Text>
          </View>
        </ScrollView>
      )}

      {/* ================= SCREEN 4: HOTELS ================= */}
      {screen === 'hotels' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Search Hotels</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              value={hotelCity}
              onChangeText={setHotelCity}
              placeholder="Enter City"
              placeholderTextColor="#64748B"
            />
            <TouchableOpacity style={[styles.button, { marginTop: 0 }]} onPress={handleSearchHotels}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {hotelsList.length === 0 ? (
            <Text style={styles.noDataText}>Search hotels by entering a city name above.</Text>
          ) : (
            hotelsList.map((hotel) => (
              <TouchableOpacity key={hotel.id} style={styles.hotelCard} onPress={() => { setSelectedHotel(hotel); setHotelModalVisible(true); }}>
                <Image source={{ uri: hotel.photos[0] }} style={styles.hotelImage} />
                <View style={styles.hotelDetails}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <Text style={styles.hotelRating}>⭐ {hotel.rating} ({hotel.reviews_count} reviews)</Text>
                  <Text style={styles.hotelAmenities}>{hotel.amenities.join(' • ')}</Text>
                  <Text style={styles.hotelPrice}>₹{hotel.price_per_night} / night</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Hotel booking modal */}
          {selectedHotel && (
            <Modal visible={hotelModalVisible} animationType="slide" transparent={true}>
              <View style={styles.modalBg}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedHotel.name}</Text>
                  <Text style={styles.modalDesc}>{selectedHotel.description}</Text>

                  <Text style={styles.label}>Check In Date</Text>
                  <TextInput style={styles.input} value={hotelCheckIn} onChangeText={setHotelCheckIn} />

                  <Text style={styles.label}>Check Out Date</Text>
                  <TextInput style={styles.input} value={hotelCheckOut} onChangeText={setHotelCheckOut} />

                  <Text style={styles.label}>Number of Guests</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={hotelGuests} onChangeText={setHotelGuests} />

                  {/* Payment Details Drawer */}
                  <Text style={styles.paymentHeader}>💳 Stripe Payment Checkout</Text>
                  <TextInput 
                    style={styles.input} placeholder="Cardholder Name" placeholderTextColor="#64748B"
                    value={cardHolder} onChangeText={setCardHolder} 
                  />
                  <TextInput 
                    style={[styles.input, { marginTop: 8 }]} placeholder="Card Number" placeholderTextColor="#64748B" keyboardType="numeric"
                    value={cardNumber} onChangeText={setCardNumber} maxLength={16}
                  />

                  <TouchableOpacity style={styles.button} onPress={handleBookHotel}>
                    <Text style={styles.buttonText}>Pay & Book Room</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setHotelModalVisible(false)}>
                    <Text style={styles.buttonText}>Go Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      )}

      {/* ================= SCREEN 5: HOMESTAYS ================= */}
      {screen === 'homestays' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Cozy Homestays & Villas</Text>
          
          <View style={styles.tabHeader}>
            <TouchableOpacity 
              style={[styles.tabButton, homestaySubTab === 'browse' && styles.activeTab]}
              onPress={() => setHomestaySubTab('browse')}
            >
              <Text style={styles.tabButtonText}>Browse Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, homestaySubTab === 'host' && styles.activeTab]}
              onPress={() => setHomestaySubTab('host')}
            >
              <Text style={styles.tabButtonText}>Host Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* Subtab 1: Browse listings */}
          {homestaySubTab === 'browse' && (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  value={homestayCity}
                  onChangeText={setHomestayCity}
                  placeholder="Enter City"
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity style={[styles.button, { marginTop: 0 }]} onPress={handleSearchHomestays}>
                  <Text style={styles.buttonText}>Search</Text>
                </TouchableOpacity>
              </View>

              {homestaysList.length === 0 ? (
                <Text style={styles.noDataText}>Search villas by entering a city name above.</Text>
              ) : (
                homestaysList.map((stay) => (
                  <TouchableOpacity key={stay._id} style={styles.hotelCard} onPress={() => { setSelectedHomestay(stay); setHomestayModalVisible(true); }}>
                    <Image source={{ uri: stay.photos[0] }} style={styles.hotelImage} />
                    <View style={styles.hotelDetails}>
                      <Text style={styles.hotelName}>{stay.name}</Text>
                      <Text style={styles.hotelRating}>🏡 Host: {stay.host_id?.name || 'Local Host'}</Text>
                      <Text style={styles.hotelAmenities}>{stay.amenities.join(' • ')}</Text>
                      <Text style={styles.hotelPrice}>₹{stay.price_per_night} / night</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Subtab 2: Host dashboard controls */}
          {homestaySubTab === 'host' && (
            <View style={styles.hostCard}>
              <Text style={styles.sectionHeader}>List Your Property</Text>
              <Text style={styles.subText}>Make money by sharing your cozy home with global travelers.</Text>

              <Text style={styles.label}>Listing Name</Text>
              <TextInput style={styles.input} placeholder="Sunset Vista Villa" placeholderTextColor="#64748B" value={newHomestayName} onChangeText={setNewHomestayName} />

              <Text style={styles.label}>City Location</Text>
              <TextInput style={styles.input} placeholder="Goa" placeholderTextColor="#64748B" value={newHomestayCity} onChangeText={setNewHomestayCity} />

              <Text style={styles.label}>Listing Address</Text>
              <TextInput style={styles.input} placeholder="12 Beachfront Road" placeholderTextColor="#64748B" value={newHomestayAddress} onChangeText={setNewHomestayAddress} />

              <Text style={styles.label}>Price per Night (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="4500" placeholderTextColor="#64748B" value={newHomestayPrice} onChangeText={setNewHomestayPrice} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Describe rooms, views, rules..." placeholderTextColor="#64748B" value={newHomestayDesc} onChangeText={setNewHomestayDesc} />

              <TouchableOpacity style={styles.button} onPress={handleHostCreateHomestay}>
                <Text style={styles.buttonText}>Submit Listing for Approval</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Your Active Listings</Text>
              {hostListings.length === 0 ? (
                <Text style={styles.noDataText}>No active listings found. Create one above!</Text>
              ) : (
                hostListings.map(listing => (
                  <View key={listing._id} style={styles.myListingItem}>
                    <Text style={styles.myListingName}>{listing.name} - {listing.city}</Text>
                    <Text style={styles.myListingStatus}>Status: Approved ✅ | Price: ₹{listing.price_per_night}/night</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Homestay Booking Modal */}
          {selectedHomestay && (
            <Modal visible={homestayModalVisible} animationType="slide" transparent={true}>
              <View style={styles.modalBg}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedHomestay.name}</Text>
                  <Text style={styles.modalDesc}>{selectedHomestay.description}</Text>
                  <Text style={styles.modalPrice}>Address: {selectedHomestay.address}</Text>

                  <Text style={styles.label}>Check In Date</Text>
                  <TextInput style={styles.input} value={homestayCheckIn} onChangeText={setHomestayCheckIn} />

                  <Text style={styles.label}>Check Out Date</Text>
                  <TextInput style={styles.input} value={homestayCheckOut} onChangeText={setHomestayCheckOut} />

                  {/* Payment Simulator */}
                  <Text style={styles.paymentHeader}>📲 Instant UPI App Checkout</Text>
                  <Text style={styles.subText}>Simulates launching GooglePay/PhonePe to complete booking.</Text>

                  <TouchableOpacity style={styles.button} onPress={handleBookHomestay}>
                    <Text style={styles.buttonText}>Authorize UPI Payment (₹{selectedHomestay.price_per_night * 2})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setHomestayModalVisible(false)}>
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      )}

      {/* ================= SCREEN 6: AI PLANNER ================= */}
      {screen === 'planner' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>AI Itinerary Generator</Text>
          <Text style={styles.subtitle}>Get custom TravelSphere AI travel routes in seconds</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Destination Name</Text>
            <TextInput
              style={styles.input}
              value={plannerDestination}
              onChangeText={setPlannerDestination}
            />

            <Text style={styles.label}>Number of Days</Text>
            <TextInput
              style={styles.input}
              value={plannerDays}
              keyboardType="number-pad"
              onChangeText={setPlannerDays}
            />

            <Text style={styles.label}>Total Budget (₹)</Text>
            <TextInput
              style={styles.input}
              value={plannerBudget}
              keyboardType="number-pad"
              onChangeText={setPlannerBudget}
            />

            <TouchableOpacity style={styles.button} onPress={handleGenerateItinerary}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Program</Text>}
            </TouchableOpacity>
          </View>

          {generatedItinerary && (
            <View style={styles.itineraryResultCard}>
              <Text style={styles.itineraryTitle}>{generatedItinerary.title}</Text>
              <Text style={styles.itineraryTagline}>{generatedItinerary.tagline}</Text>
              <Text style={styles.itineraryCost}>Estimate Cost: ₹{generatedItinerary.total_cost_estimate}</Text>
              
              <Text style={styles.timelineHeader}>TIMELINE DAYS</Text>
              {generatedItinerary.days?.map((day: any) => (
                <View key={day.day_number} style={styles.dayCard}>
                  <Text style={styles.dayNum}>Day {day.day_number} - {day.theme}</Text>
                  <Text style={styles.dayActivity}>🌅 Morning: {day.morning?.activity_name}</Text>
                  <Text style={styles.dayActivity}>🌇 Afternoon: {day.afternoon?.activity_name}</Text>
                  <Text style={styles.dayHotel}>🏨 Stay: {day.accommodation?.hotel_name}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ================= SCREEN 7: AI ASSISTANT ================= */}
      {screen === 'assistant' && (
        <View style={styles.assistantContainer}>
          <Text style={[styles.title, { padding: 15 }]}>AI Travel Assistant</Text>
          
          <ScrollView 
            style={styles.chatArea}
            contentContainerStyle={{ padding: 15 }}
            ref={assistantScrollViewRef}
            onContentSizeChange={() => assistantScrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {assistantChat.length === 0 && (
              <View style={styles.initialAssistantCard}>
                <Text style={styles.assistantGreeting}>Ask me anything about your next trip!</Text>
                <Text style={styles.subText}>Destinations, smart packing checklists, travel safety, or visa guides.</Text>
                
                <View style={styles.quickQuestionsRow}>
                  <TouchableOpacity style={styles.quickQuestionBtn} onPress={() => handleAssistantSend('What are the visa rules for Thailand?')}>
                    <Text style={styles.quickQuestionText}>Thailand Visa Rules 🇹🇭</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickQuestionBtn} onPress={() => handleAssistantSend('Packing checklist for a mountain trek.')}>
                    <Text style={styles.quickQuestionText}>Mountain Trek Checklist 🧭</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickQuestionBtn} onPress={() => handleAssistantSend('Top highlights and food items in Goa.')}>
                    <Text style={styles.quickQuestionText}>Goa Food Highlights 🏖️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {assistantChat.map((chat, idx) => (
              <View key={idx} style={[styles.chatBubble, chat.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={styles.chatText}>{chat.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={assistantMessage}
              onChangeText={setAssistantMessage}
              placeholder="Ask visa advice, packing rules, food guides..."
              placeholderTextColor="#64748B"
            />
            <TouchableOpacity style={styles.sendButton} onPress={() => handleAssistantSend()}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= SCREEN 8: TRAVEL REELS & CAMERA ================= */}
      {screen === 'reels' && (
        <View style={styles.reelsContainer}>
          <View style={styles.tabHeader}>
            <TouchableOpacity 
              style={[styles.tabButton, reelsSubTab === 'watch' && styles.activeTab]}
              onPress={() => setReelsSubTab('watch')}
            >
              <Text style={styles.tabButtonText}>Watch Reels</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, reelsSubTab === 'camera' && styles.activeTab]}
              onPress={() => setReelsSubTab('camera')}
            >
              <Text style={styles.tabButtonText}>Camera Capture</Text>
            </TouchableOpacity>
          </View>

          {/* Subtab 1: Watch Reels Feed */}
          {reelsSubTab === 'watch' && (
            <FlatList
              data={feedPosts}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 80 }}
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Text style={styles.postAuthor}>{item.user_id?.name || 'Explorer'}</Text>
                    <Text style={styles.postCity}>{item.destination_tag || 'India'}</Text>
                  </View>
                  <Image source={{ uri: item.media_urls?.[0] }} style={styles.postImage} />
                  
                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => handleLikePost(item._id)} style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>❤️ {item.likes_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>💬 {item.comments_count}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.postCaption}>{item.caption}</Text>
                </View>
              )}
              ListEmptyComponent={() => <Text style={styles.noDataText}>No reels found in feed. Switch to Camera tab to upload!</Text>}
            />
          )}

          {/* Subtab 2: Camera Capture Filter */}
          {reelsSubTab === 'camera' && (
            <ScrollView contentContainerStyle={styles.cameraFrame}>
              <Text style={styles.sectionHeader}>Simulated Viewfinder</Text>
              
              {/* Camera Preview Box */}
              <View style={[styles.cameraPreview, activeFilter === 'Chrome' && styles.filterChrome, activeFilter === 'Vintage' && styles.filterVintage, activeFilter === 'Warm' && styles.filterWarm, activeFilter === 'Cool' && styles.filterCool]}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500' }} style={styles.cameraBackground} />
                <Text style={styles.viewfinderText}>[Camera Sensor Active]</Text>
                <Text style={styles.viewfinderFilterText}>Filter: {activeFilter}</Text>
              </View>

              {/* Filters list */}
              <Text style={styles.label}>Select Photo Filter Effect</Text>
              <View style={styles.filterRow}>
                {['Normal', 'Chrome', 'Vintage', 'Warm', 'Cool'].map((filter: any) => (
                  <TouchableOpacity 
                    key={filter} 
                    style={[styles.filterBadge, activeFilter === filter && styles.selectedFilterBadge]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={styles.filterBadgeText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.input}
                value={reelsCaption}
                onChangeText={setReelsCaption}
                placeholder="Write an amazing caption for your travel vlog..."
                placeholderTextColor="#64748B"
              />

              <TouchableOpacity style={styles.button} onPress={handleCameraCapture}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capture & Upload Reel</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}

      {/* ================= SCREEN 9: VECTOR MAPS ================= */}
      {screen === 'maps' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Vector Maps & Routing</Text>
          <Text style={styles.subText}>Simulating your current destination exploration.</Text>

          {/* Map interactive simulator box */}
          <View style={styles.mapSimulator}>
            {/* Draw Simulated Landmarks based on filter */}
            {(mapFilter === 'all' || mapFilter === 'hotels') && (
              <View style={[styles.mapPin, { top: 40, left: 80 }]}><Text style={styles.pinLabel}>🏨 Ocean Palms</Text></View>
            )}
            {(mapFilter === 'all' || mapFilter === 'attractions') && (
              <View style={[styles.mapPin, { top: 120, left: 160 }]}><Text style={styles.pinLabel}>🏖️ Beach Viewpoint</Text></View>
            )}
            {(mapFilter === 'all' || mapFilter === 'restaurants') && (
              <View style={[styles.mapPin, { top: 90, left: 50 }]}><Text style={styles.pinLabel}>🍛 Coastal Kitchen</Text></View>
            )}

            {/* Vector routes simulation */}
            {selectedMapPath && (
              <View style={styles.vectorRouteLine}>
                <Text style={styles.routeRouteText}>--- Route Mode Active: {selectedMapPath} ---</Text>
              </View>
            )}

            <Text style={styles.mapCompass}>🧭 N</Text>
          </View>

          {/* Filter options */}
          <View style={styles.filterRow}>
            {['all', 'hotels', 'attractions', 'restaurants'].map((f: any) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterBadge, mapFilter === f && styles.selectedFilterBadge]}
                onPress={() => setMapFilter(f)}
              >
                <Text style={styles.filterBadgeText}>{f.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Directions Panel */}
          <Text style={styles.sectionTitle}>Get Driving Directions</Text>
          <View style={styles.directionsPanel}>
            <TouchableOpacity style={styles.directionItem} onPress={() => setSelectedMapPath('Goa Airport ✈️ to Ocean Palms Resort 🏨 (45 mins)')}>
              <Text style={styles.directionText}>✈️ Airport to Hotel Resort (45 mins)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.directionItem} onPress={() => setSelectedMapPath('Ocean Palms Resort 🏨 to Beach Viewpoint 🏖️ (15 mins walking)')}>
              <Text style={styles.directionText}>🏨 Hotel to Beach Viewpoint (15 mins walk)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ================= SCREEN 10: MY TRIPS & COLLABORATION ================= */}
      {screen === 'trips' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Detailed Trip Collaborative view vs General Trips list */}
          {selectedTrip ? (
            <View style={styles.collabContainer}>
              <TouchableOpacity onPress={() => setSelectedTrip(null)} style={styles.backTripLink}>
                <Text style={styles.backTripLinkText}>⬅️ Back to Scheduled Trips List</Text>
              </TouchableOpacity>
              
              <Text style={styles.tripCollabTitle}>{selectedTrip.name}</Text>
              <Text style={styles.tripCollabDest}>📍 Destination: {selectedTrip.destination}</Text>

              {/* Subtab menu */}
              <View style={styles.tabHeader}>
                <TouchableOpacity 
                  style={[styles.tabButton, tripSubTab === 'bookings' && styles.activeTab]}
                  onPress={() => selectActiveTrip(selectedTrip)}
                >
                  <Text style={styles.tabButtonText}>Timeline</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, tripSubTab === 'chat' && styles.activeTab]}
                  onPress={() => { setTripSubTab('chat'); selectActiveTrip(selectedTrip); }}
                >
                  <Text style={styles.tabButtonText}>Group Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, tripSubTab === 'splitter' && styles.activeTab]}
                  onPress={() => { setTripSubTab('splitter'); selectActiveTrip(selectedTrip); }}
                >
                  <Text style={styles.tabButtonText}>Split Bills</Text>
                </TouchableOpacity>
              </View>

              {/* 1. Timeline bookings */}
              {tripSubTab === 'bookings' && (
                <View style={styles.timelineBlock}>
                  <Text style={styles.sectionHeader}>Group Active Bookings</Text>
                  <Text style={styles.subText}>Displays tickets, flights, and accommodations synced inside travel dates.</Text>
                  
                  {/* Mock placeholder for bookings */}
                  <View style={styles.timelineItem}>
                    <Text style={styles.timelineItemTitle}>✈️ Flight Del to Goa (Confirmed)</Text>
                    <Text style={styles.timelineItemTime}>Departure: 08:30 AM | Seat 12B</Text>
                  </View>
                  <View style={styles.timelineItem}>
                    <Text style={styles.timelineItemTitle}>🏨 Ocean Palms Stay (Confirmed)</Text>
                    <Text style={styles.timelineItemTime}>3 Nights | Room 102</Text>
                  </View>
                </View>
              )}

              {/* 2. Group Chat */}
              {tripSubTab === 'chat' && (
                <View style={styles.chatCollabBlock}>
                  <Text style={styles.sectionHeader}>Trip Members Discussion</Text>
                  <ScrollView style={styles.msgHistory}>
                    {tripMessages.map((m, idx) => (
                      <View key={idx} style={[styles.chatBubble, m.sender_id?._id === user?._id ? styles.userBubble : styles.assistantBubble]}>
                        <Text style={styles.chatAuthor}>{m.sender_id?.name || 'Explorer'}</Text>
                        <Text style={styles.chatText}>{m.message}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.chatInput}
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      placeholder="Type a message to the group..."
                      placeholderTextColor="#64748B"
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendTripMessage}>
                      <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 3. Split Bills Splitter */}
              {tripSubTab === 'splitter' && (
                <View style={styles.splitterBlock}>
                  <Text style={styles.sectionHeader}>Trip Group Expenses Ledger</Text>
                  
                  {/* Total Expense balance display */}
                  <View style={styles.balanceSummary}>
                    <Text style={styles.balanceSummaryText}>Total Group Expenses: ₹{tripBalances?.total_expenses || 0}</Text>
                  </View>

                  {/* Who owes whom */}
                  <Text style={styles.label}>Balances Breakdown</Text>
                  {tripBalances?.balances?.map((bal: any, idx: number) => (
                    <View key={idx} style={styles.balanceRowItem}>
                      <Text style={styles.balanceRowName}>{bal.name}</Text>
                      <Text style={[styles.balanceRowVal, bal.balance >= 0 ? styles.balanceRowValPositive : styles.balanceRowValNegative]}>
                        {bal.balance >= 0 ? `Gets back ₹${Math.round(bal.balance)}` : `Owes ₹${Math.abs(Math.round(bal.balance))}`}
                      </Text>
                    </View>
                  ))}

                  {/* Split Expense Form */}
                  <View style={styles.formCard}>
                    <Text style={styles.sectionHeader}>Log New Bill Split</Text>
                    
                    <TextInput
                      style={styles.input}
                      placeholder="Amount (₹) e.g. 2400"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={splitAmount}
                      onChangeText={setSplitAmount}
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      placeholder="Description e.g. Beach Seafood Dinner"
                      placeholderTextColor="#64748B"
                      value={splitDescription}
                      onChangeText={setSplitDescription}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleSplitBillSubmit}>
                      <Text style={styles.buttonText}>Log & Split Equally</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Invite Friend Form */}
                  <View style={[styles.formCard, { marginTop: 12 }]}>
                    <Text style={styles.sectionHeader}>Invite Friend by Phone/Email</Text>
                    
                    <TextInput
                      style={styles.input}
                      placeholder="friend@email.com or +91 9999999999"
                      placeholderTextColor="#64748B"
                      value={inviteEmailOrPhone}
                      onChangeText={setInviteEmailOrPhone}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleInviteFriend}>
                      <Text style={styles.buttonText}>Add Member</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.searchRow}>
                <Text style={styles.title}>Scheduled Trips</Text>
                <TouchableOpacity style={[styles.button, { marginTop: 0 }]} onPress={() => setTripModalVisible(true)}>
                  <Text style={styles.buttonText}>+ New Trip</Text>
                </TouchableOpacity>
              </View>

              {myTrips.length === 0 ? (
                <Text style={styles.noDataText}>No scheduled trips yet. Generate one using AI Plan or add a custom trip above!</Text>
              ) : (
                myTrips.map((trip: any) => (
                  <TouchableOpacity key={trip._id} style={styles.tripCard} onPress={() => selectActiveTrip(trip)}>
                    <Text style={styles.tripTitle}>{trip.name}</Text>
                    <Text style={styles.tripText}>📍 Destination: {trip.destination}</Text>
                    <Text style={styles.tripText}>📅 Travel Dates: {new Date(trip.start_date).toLocaleDateString()} to {new Date(trip.end_date).toLocaleDateString()}</Text>
                    <Text style={styles.tripMembersCount}>👥 Group Members: {trip.members?.length || 0} friends</Text>
                  </TouchableOpacity>
                ))
              )}

              {/* Trip Creation Modal */}
              <Modal visible={tripModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalBg}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Plan Custom Trip</Text>

                    <Text style={styles.label}>Trip Name</Text>
                    <TextInput style={styles.input} placeholder="Family Goa Getaway" placeholderTextColor="#64748B" value={newTripName} onChangeText={setNewTripName} />

                    <Text style={styles.label}>Destination</Text>
                    <TextInput style={styles.input} placeholder="Goa, India" placeholderTextColor="#64748B" value={newTripDest} onChangeText={setNewTripDest} />

                    <Text style={styles.label}>Start Date</Text>
                    <TextInput style={styles.input} value={newTripStart} onChangeText={setNewTripStart} />

                    <Text style={styles.label}>End Date</Text>
                    <TextInput style={styles.input} value={newTripEnd} onChangeText={setNewTripEnd} />

                    <TouchableOpacity style={styles.button} onPress={handleCreateTrip}>
                      <Text style={styles.buttonText}>Schedule Trip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setTripModalVisible(false)}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        </ScrollView>
      )}

      {/* ================= SCREEN 11: REWARDS & GAMIFICATION ================= */}
      {screen === 'rewards' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Travel Rewards Hub</Text>
          <Text style={styles.subText}>Earn points by booking stays, vlogging reels, and inviting friends!</Text>

          <View style={styles.levelCard}>
            <Text style={styles.rewardsPointsCount}>🏆 {rewardsStats?.points || 0}</Text>
            <Text style={styles.rewardsPointsLabel}>Total TravelSphere Points</Text>

            <Text style={[styles.levelTitle, { marginTop: 15 }]}>Level Tier: {rewardsStats?.level || 'Explorer'}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${rewardsStats?.progress_to_next || 10}%` }]} />
            </View>
            <Text style={styles.subText}>{rewardsStats?.progress_to_next || 0}% progress to next travel tier</Text>
          </View>

          {/* Badges list */}
          <Text style={styles.sectionTitle}>Unlocked Achievements</Text>
          <View style={styles.badgesGrid}>
            {rewardsStats?.badges?.map((badge: string, idx: number) => (
              <View key={idx} style={styles.badgeItemCard}>
                <Text style={styles.badgeEmoji}>🏅</Text>
                <Text style={styles.badgeItemName}>{badge}</Text>
              </View>
            )) || <Text style={styles.noDataText}>Start booking trips to unlock achievements.</Text>}
          </View>

          {/* Referral system */}
          <Text style={styles.sectionTitle}>Invite & Earn</Text>
          <View style={styles.formCard}>
            <Text style={styles.referralHeader}>Share Referral Code</Text>
            <Text style={styles.subText}>Get 500 bonus points for each friend that signs up to TravelSphere AI!</Text>
            
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCodeText}>{rewardsStats?.referral_code || 'TRAVEL_REF'}</Text>
            </View>
            <Text style={styles.referredCountText}>👥 Total Referrals Tracked: {rewardsStats?.referred_count || 0} friends</Text>
          </View>
        </ScrollView>
      )}

      {/* ================= TRAINS BOOKING SCREEN ================= */}
      {screen === 'trains' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>🚂 Train Tickets</Text>

          {/* ---- STEP 1: SEARCH ---- */}
          {trainStep === 'search' && (
            <View style={styles.formCard}>

              {/* Voice Listening Banner */}
              {isTrainListening && (
                <View style={{ backgroundColor: 'rgba(14,165,233,0.1)', borderColor: '#0EA5E9', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#0EA5E9', fontSize: 11, fontWeight: 'bold' }}>
                    🎤 Listening for {trainListeningTarget === 'source' ? 'From' : 'To'} station... Simulating voice...
                  </Text>
                </View>
              )}

              {/* FROM station */}
              <Text style={styles.label}>From</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={trainSourceSearch}
                  onChangeText={(t) => { setTrainSourceSearch(t); setTrainActiveInput('source'); }}
                  placeholder="Search city or station..."
                  placeholderTextColor="#64748B"
                  onFocus={() => setTrainActiveInput('source')}
                />
                <TouchableOpacity
                  style={{ backgroundColor: isTrainListening && trainListeningTarget === 'source' ? '#EF4444' : '#334155', padding: 12, borderRadius: 8 }}
                  onPress={() => handleMobileVoiceSearch('source')}
                >
                  <Text style={{ color: '#fff', fontSize: 14 }}>🎤</Text>
                </TouchableOpacity>
              </View>

              {/* FROM Suggestions */}
              {trainActiveInput === 'source' && (
                <View style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
                  {getTrainSuggestions(trainSourceSearch).slice(0, 5).map((st) => (
                    <TouchableOpacity
                      key={st.code}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#0F172A' }}
                      onPress={() => {
                        setTrainSource(st.code);
                        setTrainSourceSearch(st.name);
                        setTrainActiveInput(null);
                      }}
                    >
                      <Text style={{ fontSize: 12, marginRight: 6 }}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' }}>{st.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{st.city}</Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(14,165,233,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#0EA5E9', fontSize: 10, fontWeight: 'bold' }}>{st.code}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* TO station */}
              <Text style={styles.label}>To</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={trainDestinationSearch}
                  onChangeText={(t) => { setTrainDestinationSearch(t); setTrainActiveInput('destination'); }}
                  placeholder="Search destination..."
                  placeholderTextColor="#64748B"
                  onFocus={() => setTrainActiveInput('destination')}
                />
                <TouchableOpacity
                  style={{ backgroundColor: isTrainListening && trainListeningTarget === 'destination' ? '#EF4444' : '#334155', padding: 12, borderRadius: 8 }}
                  onPress={() => handleMobileVoiceSearch('destination')}
                >
                  <Text style={{ color: '#fff', fontSize: 14 }}>🎤</Text>
                </TouchableOpacity>
              </View>

              {/* TO Suggestions */}
              {trainActiveInput === 'destination' && (
                <View style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
                  {getTrainSuggestions(trainDestinationSearch).slice(0, 5).map((st) => (
                    <TouchableOpacity
                      key={st.code}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#0F172A' }}
                      onPress={() => {
                        setTrainDestination(st.code);
                        setTrainDestinationSearch(st.name);
                        setTrainActiveInput(null);
                      }}
                    >
                      <Text style={{ fontSize: 12, marginRight: 6 }}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' }}>{st.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{st.city}</Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(14,165,233,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#0EA5E9', fontSize: 10, fontWeight: 'bold' }}>{st.code}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Cities */}
              <Text style={[styles.label, { marginTop: 12 }]}>Popular Cities</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {POPULAR_CITIES.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#475569' }}
                    onPress={() => handleMobilePopularCityClick(city)}
                  >
                    <Text style={{ color: '#F8FAFC', fontSize: 11, fontWeight: 'bold' }}>📍 {city}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date of Journey</Text>
              <TextInput
                style={styles.input}
                value={trainDate}
                onChangeText={setTrainDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.label}>Quota</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {['General', 'Tatkal', 'Premium Tatkal', 'Ladies', 'Senior Citizen'].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.badge, trainQuota === q && styles.selectedBadge]}
                    onPress={() => setTrainQuota(q)}
                  >
                    <Text style={[styles.badgeText, trainQuota === q && styles.selectedBadgeText]}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Passengers</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['1', '2', '3', '4', '5', '6'].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.badge, trainPassengersCount === n && styles.selectedBadge]}
                    onPress={() => {
                      setTrainPassengersCount(n);
                      const count = Number(n);
                      const arr = Array.from({ length: count }, (_, i) =>
                        trainPassengersDetails[i] || { name: '', age: '', gender: 'Male', berth_preference: 'Lower', id_number: '' }
                      );
                      setTrainPassengersDetails(arr);
                    }}
                  >
                    <Text style={[styles.badgeText, trainPassengersCount === n && styles.selectedBadgeText]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSearchTrains}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Find Available Trains</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ---- STEP 2: RESULTS ---- */}
          {trainStep === 'results' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {getStationName(trainSource)} → {getStationName(trainDestination)}
                </Text>
                <TouchableOpacity onPress={() => setTrainStep('search')}>
                  <Text style={{ color: '#0EA5E9', fontSize: 11, fontWeight: 'bold' }}>Modify</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator color="#0EA5E9" style={{ marginTop: 30 }} />
              ) : trainsList.length === 0 ? (
                <Text style={styles.noDataText}>No trains found. Try different stations or date.</Text>
              ) : (
                trainsList.map((train) => (
                  <View key={train.train_id} style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' }}>{train.train_name}</Text>
                    <Text style={{ color: '#64748B', fontSize: 10, marginBottom: 8 }}>#{train.train_number}</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View>
                        <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 }}>{train.departure_time}</Text>
                        <Text style={{ color: '#F8FAFC', fontSize: 10, fontWeight: '600' }}>{getStationName(train.source)}</Text>
                        <Text style={{ color: '#64748B', fontSize: 9 }}>({train.source})</Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#64748B', fontSize: 9 }}>{train.duration}</Text>
                        <Text style={{ color: '#475569', fontSize: 10 }}>──────</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 }}>{train.arrival_time}</Text>
                        <Text style={{ color: '#F8FAFC', fontSize: 10, fontWeight: '600' }}>{getStationName(train.destination)}</Text>
                        <Text style={{ color: '#64748B', fontSize: 9 }}>({train.destination})</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 6, fontWeight: 'bold' }}>SELECT CLASS:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {train.classes.map((cls: any) => (
                        <TouchableOpacity
                          key={cls.class_name}
                          style={{ backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 8, padding: 8, minWidth: 75 }}
                          onPress={() => {
                            setSelectedTrain(train);
                            setSelectedClass(cls);
                            setTrainStep('berths');
                          }}
                        >
                          <Text style={{ color: '#0EA5E9', fontWeight: 'bold', fontSize: 11 }}>{cls.class_name}</Text>
                          <Text style={{ color: '#10B981', fontSize: 10, marginTop: 2 }}>{cls.available_seats}</Text>
                          <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 12, marginTop: 2 }}>₹{cls.price}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ---- STEP 3: BERTHS & PASSENGER CONFIG ---- */}
          {trainStep === 'berths' && selectedTrain && selectedClass && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Configure Passengers</Text>
              <Text style={styles.subText}>
                {selectedTrain.train_name} | {getStationName(selectedTrain.source)} → {getStationName(selectedTrain.destination)} | {selectedClass.class_name}
              </Text>

              {trainPassengersDetails.map((p, idx) => (
                <View key={idx} style={{ borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 12 }}>
                  <Text style={{ color: '#0EA5E9', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>Passenger #{idx + 1}</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#64748B"
                    value={p.name}
                    onChangeText={(t) => {
                      const copy = [...trainPassengersDetails];
                      copy[idx].name = t;
                      setTrainPassengersDetails(copy);
                    }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Age"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      value={p.age}
                      onChangeText={(t) => {
                        const copy = [...trainPassengersDetails];
                        copy[idx].age = t;
                        setTrainPassengersDetails(copy);
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      {['Male', 'Female'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.badge, p.gender === g && styles.selectedBadge, { marginBottom: 4 }]}
                          onPress={() => {
                            const copy = [...trainPassengersDetails];
                            copy[idx].gender = g;
                            setTrainPassengersDetails(copy);
                          }}
                        >
                          <Text style={[styles.badgeText, p.gender === g && styles.selectedBadgeText]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: 8 }]}>Berth Preference</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.badge, p.berth_preference === b && styles.selectedBadge]}
                        onPress={() => {
                          const copy = [...trainPassengersDetails];
                          copy[idx].berth_preference = b;
                          setTrainPassengersDetails(copy);
                        }}
                      >
                        <Text style={[styles.badgeText, p.berth_preference === b && styles.selectedBadgeText]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Aadhaar / Passport Number"
                    placeholderTextColor="#64748B"
                    value={p.id_number}
                    onChangeText={(t) => {
                      const copy = [...trainPassengersDetails];
                      copy[idx].id_number = t;
                      setTrainPassengersDetails(copy);
                    }}
                  />
                </View>
              ))}

              <View style={{ borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: 12 }}>Total ({trainPassengersCount} ticket{Number(trainPassengersCount) > 1 ? 's' : ''})</Text>
                <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 18 }}>₹{selectedClass.price * Number(trainPassengersCount)}</Text>
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={handleBookTrain}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pay & Confirm Booking</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setTrainStep('results')}>
                <Text style={styles.buttonText}>← Back to Results</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ---- STEP 4: BOOKING CONFIRMATION ---- */}
          {trainStep === 'ticket' && trainBookingConfirmation && (
            <View style={{ backgroundColor: '#1E293B', borderColor: '#10B981', borderWidth: 2, borderRadius: 16, padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎟️</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginBottom: 4 }}>Train Ticket Booked!</Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 16 }}>IRCTC simulated booking confirmed</Text>

              <View style={{ backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16 }}>
                <Text style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>PNR: </Text>
                  <Text style={{ color: '#0EA5E9' }}>{trainBookingConfirmation.booking_reference}</Text>
                </Text>
                <Text style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>Train: </Text>{trainBookingConfirmation.journey_details.train_name}
                </Text>
                <Text style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>Route: </Text>
                  {getStationName(trainBookingConfirmation.journey_details.source)} → {getStationName(trainBookingConfirmation.journey_details.destination)}
                </Text>
                <Text style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>Date: </Text>{trainBookingConfirmation.journey_details.date}
                </Text>
                <Text style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11, marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold' }}>Class: </Text>{trainBookingConfirmation.journey_details.class_name} | {trainBookingConfirmation.journey_details.quota}
                </Text>

                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>SEAT ASSIGNMENTS:</Text>
                {trainBookingConfirmation.passengers.map((p: any, i: number) => (
                  <Text key={i} style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 10, marginBottom: 2 }}>
                    {p.name}: {p.seat_number} ({p.berth_preference})
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, { width: '100%' }]}
                onPress={() => { setTrainStep('search'); setSelectedTrain(null); setSelectedClass(null); setTrainBookingConfirmation(null); setTrainsList([]); }}
              >
                <Text style={styles.buttonText}>Book Another Train</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { width: '100%', marginTop: 8 }]} onPress={() => setScreen('home')}>
                <Text style={styles.buttonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* ================= BOTTOM TAB NAVIGATION BAR ================= */}
      {token && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabButton} onPress={() => setScreen('home')}>
            <Text style={[styles.tabText, screen === 'home' && styles.activeTabText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton} onPress={() => setScreen('planner')}>
            <Text style={[styles.tabText, screen === 'planner' && styles.activeTabText]}>AI Planner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton} onPress={() => setScreen('reels')}>
            <Text style={[styles.tabText, screen === 'reels' && styles.activeTabText]}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton} onPress={() => { setSelectedTrip(null); setScreen('trips'); }}>
            <Text style={[styles.tabText, screen === 'trips' && styles.activeTabText]}>Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton} onPress={() => setScreen('maps')}>
            <Text style={[styles.tabText, screen === 'maps' && styles.activeTabText]}>Map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium Slate Dark theme
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 90,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0F172A',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0EA5E9', // Sky Blue primary
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  orText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  socialText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  subGreeting: {
    fontSize: 12,
    color: '#94A3B8',
  },
  pointsBadge: {
    backgroundColor: '#0EA5E9',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backLink: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
  },
  selectedBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0EA5E9',
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedBadgeText: {
    color: '#F8FAFC',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  serviceItem: {
    width: '30%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  serviceLabel: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: 'bold',
  },
  levelCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  levelPercentage: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  weatherCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    borderColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  weatherTitle: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: 'bold',
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '900',
    color: '#06B6D4',
    marginVertical: 4,
  },
  weatherDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 10,
    marginBottom: 12,
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  destinationCard: {
    width: 140,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  destImage: {
    height: 90,
    width: '100%',
  },
  destName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F8FAFC',
    padding: 8,
    paddingBottom: 2,
  },
  destCost: {
    fontSize: 10,
    color: '#0EA5E9',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dealsCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 15,
  },
  dealText: {
    color: '#F8FAFC',
    fontSize: 11,
    marginVertical: 4,
  },
  noDataText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelDetails: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  hotelName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hotelRating: {
    color: '#0EA5E9',
    fontSize: 11,
  },
  hotelAmenities: {
    color: '#64748B',
    fontSize: 10,
  },
  hotelPrice: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  modalPrice: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
  },
  paymentHeader: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tabHeader: {
    flexDirection: 'row',
    borderColor: '#334155',
    borderBottomWidth: 1,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  tabButtonText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 12,
  },
  hostCard: {
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subText: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 10,
  },
  myListingItem: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  myListingName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  myListingStatus: {
    color: '#10B981',
    fontSize: 10,
    marginTop: 2,
  },
  itineraryResultCard: {
    marginTop: 20,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  itineraryTagline: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  itineraryCost: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  timelineHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0EA5E9',
    marginTop: 16,
    marginBottom: 8,
  },
  dayCard: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  dayNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  dayActivity: {
    fontSize: 10,
    color: '#94A3B8',
    marginVertical: 2,
  },
  dayHotel: {
    fontSize: 10,
    color: '#10B981',
    marginVertical: 2,
  },
  assistantContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  chatArea: {
    flex: 1,
  },
  initialAssistantCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  assistantGreeting: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickQuestionsRow: {
    marginTop: 15,
    width: '100%',
    gap: 8,
  },
  quickQuestionBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  quickQuestionText: {
    color: '#0EA5E9',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#0EA5E9',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chatText: {
    color: '#F8FAFC',
    fontSize: 12,
  },
  chatAuthor: {
    color: '#0EA5E9',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#1E293B',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#F8FAFC',
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reelsContainer: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  postHeader: {
    padding: 12,
  },
  postAuthor: {
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontSize: 13,
  },
  postCity: {
    fontSize: 10,
    color: '#94A3B8',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postCaption: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 12,
    color: '#94A3B8',
  },
  cameraFrame: {
    padding: 20,
  },
  cameraPreview: {
    height: 240,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 15,
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  viewfinderText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewfinderFilterText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  filterBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  selectedFilterBadge: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterChrome: {
    backgroundColor: '#27272a',
  },
  filterVintage: {
    backgroundColor: '#f5f5f4',
  },
  filterWarm: {
    backgroundColor: '#fef3c7',
  },
  filterCool: {
    backgroundColor: '#ecfeff',
  },
  mapSimulator: {
    height: 200,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 15,
  },
  mapPin: {
    position: 'absolute',
    backgroundColor: '#0F172A',
    borderColor: '#0EA5E9',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pinLabel: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: 'bold',
  },
  vectorRouteLine: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.9)',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  routeRouteText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mapCompass: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: '#06B6D4',
    fontWeight: 'bold',
    fontSize: 12,
  },
  directionsPanel: {
    gap: 8,
  },
  directionItem: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  directionText: {
    color: '#0EA5E9',
    fontSize: 11,
    fontWeight: 'bold',
  },
  collabContainer: {
    paddingBottom: 20,
  },
  backTripLink: {
    marginBottom: 10,
  },
  backTripLinkText: {
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripCollabTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  tripCollabDest: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 15,
  },
  timelineBlock: {
    marginTop: 10,
  },
  timelineItem: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  timelineItemTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineItemTime: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  chatCollabBlock: {
    height: 320,
    justifyContent: 'space-between',
  },
  msgHistory: {
    flex: 1,
    marginVertical: 10,
  },
  splitterBlock: {
    marginTop: 10,
  },
  balanceSummary: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  balanceSummaryText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  balanceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 6,
    marginVertical: 3,
  },
  balanceRowName: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  balanceRowVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  balanceRowValPositive: {
    color: '#10B981',
  },
  balanceRowValNegative: {
    color: '#EF4444',
  },
  tripCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  tripText: {
    fontSize: 11,
    color: '#94A3B8',
    marginVertical: 2,
  },
  tripMembersCount: {
    fontSize: 10,
    color: '#0EA5E9',
    fontWeight: 'bold',
    marginTop: 4,
  },
  rewardsPointsCount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#06B6D4',
    textAlign: 'center',
  },
  rewardsPointsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  badgeItemCard: {
    width: '30%',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeItemName: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  referralHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  referralCodeBox: {
    backgroundColor: '#0F172A',
    borderColor: '#0EA5E9',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  referralCodeText: {
    color: '#0EA5E9',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  referredCountText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#0EA5E9',
  },
});
