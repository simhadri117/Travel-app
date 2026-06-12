import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  MapPin, Search, Navigation, Building, Utensils, Star, Compass,
  SlidersHorizontal, Locate, Trees, Castle, Church, Sparkles, AlertTriangle
} from 'lucide-react';

// Custom Map Styles for "Interactive Canvas" Mode
const canvasMapStyles = [
  { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "color": "#e9e5dc" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#f1ece4" }] },
  { "featureType": "poi", "elementType": "geometry.fill", "stylers": [{ "color": "#e0dbd1" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#d5e2cd" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b5d0d8" }] }
];

const CITY_ALIASES: Record<string, string[]> = {
  'bangalore': ['bengaluru'],
  'bengaluru': ['bangalore'],
  'bombay': ['mumbai'],
  'mumbai': ['bombay'],
  'madras': ['chennai'],
  'chennai': ['madras'],
  'calcutta': ['kolkata'],
  'kolkata': ['calcutta'],
  'trivandrum': ['thiruvananthapuram'],
  'thiruvananthapuram': ['trivandrum'],
  'benaras': ['varanasi'],
  'varanasi': ['benaras'],
  'peking': ['beijing'],
  'beijing': ['peking'],
  'saigon': ['ho chi minh city', 'ho chi minh'],
  'ho chi minh city': ['saigon', 'ho chi minh'],
  'ho chi minh': ['saigon', 'ho chi minh city'],
  'new york city': ['nyc', 'new york'],
  'nyc': ['new york city', 'new york'],
  'new york': ['nyc', 'new york city'],
  'new delhi': ['delhi'],
  'delhi': ['new delhi']
};

const GOA_ALIASES = ['goa', 'north goa', 'south goa'];

const checkLocationMatch = (searchQuery: string, resolvedName: string, placeId?: string): boolean => {
  if (placeId && placeId !== 'default-fallback-place' && placeId !== 'gemini-fallback-place') {
    return true;
  }

  const cleanSearch = searchQuery.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanResolved = resolvedName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (cleanResolved.includes(cleanSearch) || cleanSearch.includes(cleanResolved)) {
    return true;
  }

  const searchTokens = cleanSearch.split(/\s+/);
  const resolvedTokens = cleanResolved.split(/\s+/);
  if (searchTokens.length > 0 && resolvedTokens.length > 0) {
    const firstSearchWord = searchTokens[0];
    const firstResolvedWord = resolvedTokens[0];
    if (firstSearchWord.length > 3 && firstResolvedWord.length > 3) {
      if (firstResolvedWord.includes(firstSearchWord) || firstSearchWord.includes(firstResolvedWord)) {
        return true;
      }
    }
  }

  const searchPrimary = searchQuery.split(',')[0].trim().toLowerCase();
  const resolvedPrimary = resolvedName.split(',')[0].trim().toLowerCase();

  const searchAliases = CITY_ALIASES[searchPrimary] || [];
  if (searchAliases.includes(resolvedPrimary)) {
    return true;
  }

  const resolvedAliases = CITY_ALIASES[resolvedPrimary] || [];
  if (resolvedAliases.includes(searchPrimary)) {
    return true;
  }

  for (const [key, aliases] of Object.entries(CITY_ALIASES)) {
    if (searchPrimary.includes(key) || key.includes(searchPrimary)) {
      if (aliases.some(alias => resolvedPrimary.includes(alias) || alias.includes(resolvedPrimary))) {
        return true;
      }
    }
  }

  const isSearchGoa = GOA_ALIASES.some(g => searchPrimary.includes(g));
  const isResolvedGoa = GOA_ALIASES.some(g => resolvedPrimary.includes(g));
  if (isSearchGoa && isResolvedGoa) {
    return true;
  }

  return false;
};


export default function Maps() {
  const [apiKey, setApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);

  // Search & Suggestions
  const [cityInput, setCityInput] = useState<string>('Chennai');
  const [activeCity, setActiveCity] = useState<string>('Chennai, Tamil Nadu, India');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Map & Route Coordinates
  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number }>({ lat: 13.0827, lng: 80.2707 }); // Chennai default
  const [filterType, setFilterType] = useState<'attractions' | 'hotels' | 'restaurants' | 'hidden_gems' | 'stations' | 'airports'>('attractions');
  const [activePin, setActivePin] = useState<any | null>(null);
  const [navigationPath, setNavigationPath] = useState<any[] | null>(null);
  const [mapType, setMapType] = useState<string>('roadmap');

  // Geolocation states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<{
    formatted: string;
    city: string;
    state: string;
    country: string;
    district?: string;
    postalCode?: string;
    accuracy?: number;
    timestamp?: string;
  } | null>(null);

  const [loadingMessage, setLoadingMessage] = useState<string>('Searching global mapping network...');
  const [routeDetails, setRouteDetails] = useState<{
    start: string;
    destination: string;
    distance: string;
    duration: string;
    traffic: string;
    cost: string;
  } | null>(null);

  // Discovery Filters states
  const [distanceBand, setDistanceBand] = useState<'all' | '1km' | '5km' | '10km' | '25km'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'popularity'>('distance');

  // Transport and multi-stop states
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>('driving');
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [trafficLayerActive, setTrafficLayerActive] = useState<boolean>(false);

  // Dynamic Data
  const [placesData, setPlacesData] = useState<{
    attractions: any[];
    hotels: any[];
    restaurants: any[];
    hidden_gems: any[];
    stations: any[];
    airports: any[];
  }>({
    attractions: [],
    hotels: [],
    restaurants: [],
    hidden_gems: [],
    stations: [],
    airports: []
  });
  
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [cityInfo, setCityInfo] = useState<{ population: string; best_time_to_visit: string } | null>(null);

  // Refs for Google Map elements
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const mockPolylineRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);
  const waypointPolylineRef = useRef<any>(null);

  const clearDirections = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    if (mockPolylineRef.current) {
      mockPolylineRef.current.setMap(null);
      mockPolylineRef.current = null;
    }
    if (waypointPolylineRef.current) {
      waypointPolylineRef.current.setMap(null);
      waypointPolylineRef.current = null;
    }
    setRouteDetails(null);
  };

  const clearWaypoints = () => {
    waypointMarkersRef.current.forEach(m => m.setMap(null));
    waypointMarkersRef.current = [];
    if (waypointPolylineRef.current) {
      waypointPolylineRef.current.setMap(null);
      waypointPolylineRef.current = null;
    }
    setWaypoints([]);
  };

  // 1. Fetch public Google Maps key configuration
  useEffect(() => {
    api.get('/maps/config')
      .then(res => {
        if (res.data.success && res.data.googleMapsApiKey) {
          setApiKey(res.data.googleMapsApiKey);
          loadGoogleMapsScript(res.data.googleMapsApiKey);
        }
      })
      .catch(err => {
        console.error('Failed to load Google Maps configuration', err);
        setSearchError('Failed to load mapping configurations.');
      });
  }, []);

  // 2. Load Google Maps JS SDK dynamically
  const loadGoogleMapsScript = (key: string) => {
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      if ((window as any).google) {
        setMapLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    script.onerror = () => {
      setSearchError('Failed to load Google Maps SDK.');
    };
    document.head.appendChild(script);
  };

  // 3. Fetch search suggestions for Autocomplete
  useEffect(() => {
    if (cityInput.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      api.get(`/maps/autocomplete?input=${encodeURIComponent(cityInput)}`)
        .then(res => {
          if (res.data.success) {
            setSuggestions(res.data.predictions || []);
          }
        })
        .catch(err => console.error('Autocomplete failed', err));
    }, 300);

    return () => clearTimeout(timer);
  }, [cityInput]);

  // 4. Initial load on maps load
  useEffect(() => {
    if (mapLoaded) {
      triggerSearch(activeCity);
    }
  }, [mapLoaded]);

  // 5. Initialize or update Google Map when coords or mapType changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).google) return;

    const google = (window as any).google;

    // Create Map instance if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: cityCoords,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        mapTypeId: mapType === 'canvas' ? google.maps.MapTypeId.ROADMAP : mapType,
        styles: mapType === 'canvas' ? canvasMapStyles : []
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563EB',
          strokeWeight: 4
        }
      });
    } else {
      mapInstance.current.setCenter(cityCoords);
      mapInstance.current.setOptions({
        mapTypeId: mapType === 'canvas' ? google.maps.MapTypeId.ROADMAP : mapType,
        styles: mapType === 'canvas' ? canvasMapStyles : []
      });
    }

    // Set/Update Destination Center Marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    destinationMarkerRef.current = new google.maps.Marker({
      position: cityCoords,
      map: mapInstance.current,
      title: activeCity,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8
      }
    });

    // Render markers for current place list
    renderPlacesMarkers();

  }, [cityCoords, mapLoaded, mapType, filterType, placesData]);

  // 5.5. Live Traffic Layer Toggle
  useEffect(() => {
    if (!mapInstance.current || !(window as any).google) return;
    const google = (window as any).google;

    if (trafficLayerActive) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(mapInstance.current);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [trafficLayerActive, mapLoaded]);

  // Helper: Convert distance string to numeric km
  const parseDistanceKm = (distStr: string): number => {
    if (!distStr) return 999;
    const cleaned = distStr.toLowerCase().trim();
    if (cleaned.endsWith('km')) {
      return parseFloat(cleaned.replace('km', '').trim()) || 0;
    }
    if (cleaned.endsWith('m')) {
      const meters = parseFloat(cleaned.replace('m', '').trim()) || 0;
      return meters / 1000;
    }
    return parseFloat(cleaned) || 999;
  };

  // Helper: Calculate distance in km
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const currentList = placesData[filterType] || [];

  // Filter & Sort list based on distance bands & sort tabs
  const processedPlaces = React.useMemo(() => {
    let list = [...currentList];

    if (distanceBand !== 'all') {
      const maxDist = distanceBand === '1km' ? 1 :
                      distanceBand === '5km' ? 5 :
                      distanceBand === '10km' ? 10 : 25;
      list = list.filter(place => parseDistanceKm(place.distance) <= maxDist);
    }

    list.sort((a, b) => {
      if (sortBy === 'distance') {
        return parseDistanceKm(a.distance) - parseDistanceKm(b.distance);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'popularity') {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return parseDistanceKm(a.distance) - parseDistanceKm(b.distance);
      }
      return 0;
    });

    return list;
  }, [currentList, distanceBand, sortBy]);

  // 6. Handle category markers rendering
  const renderPlacesMarkers = () => {
    if (!mapInstance.current || !(window as any).google) return;
    const google = (window as any).google;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Reset directions line
    clearDirections();

    const listToRender = processedPlaces;

    listToRender.forEach((place) => {
      const isSelected = activePin?.name === place.name;

      const marker = new google.maps.Marker({
        position: place.coord,
        map: mapInstance.current,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? '#2563EB' : '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: isSelected ? 9 : 7
        }
      });

      // Add click handler
      marker.addListener('click', () => {
        setActivePin(place);
        setNavigationPath(null);
        clearDirections();
        mapInstance.current.panTo(place.coord);
        mapInstance.current.setZoom(15);
      });

      markersRef.current.push(marker);
    });
  };

  // 6.5. GPS Locate Me Success handler
  const handleGpsSuccess = async (coords: { lat: number; lng: number }, accuracy: number, timestamp: string) => {
    // Reset all previous states
    setPlacesData({ attractions: [], hotels: [], restaurants: [], hidden_gems: [], stations: [], airports: [] });
    setWeatherForecast([]);
    clearDirections();
    clearWaypoints();
    setResolvedNotice(null);
    setSearchError(null);

    setUserLocation(coords);
    setCityCoords(coords);

    if (mapInstance.current && (window as any).google) {
      const google = (window as any).google;
      mapInstance.current.panTo(coords);
      mapInstance.current.setZoom(14);

      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setMap(null);
      }

      const pulsingSvg = `data:image/svg+xml;utf-8,` + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="6" fill="#2563EB" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="14" fill="none" stroke="#2563EB" stroke-width="2" opacity="0.6">
            <animate attributeName="r" values="6;14" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `).trim();

      userMarkerRef.current = new google.maps.Marker({
        position: coords,
        map: mapInstance.current,
        title: 'You Are Here',
        icon: {
          url: pulsingSvg,
          size: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        }
      });

      userAccuracyCircleRef.current = new google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
        fillColor: '#2563EB',
        fillOpacity: 0.12,
        map: mapInstance.current,
        center: coords,
        radius: accuracy
      });
    }

    try {
      setLoadingMessage("Finding Address...");
      const reverseRes = await api.get(`/maps/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`);
      if (reverseRes.data.success) {
        const { formatted_address, city, state, country, district, postal_code } = reverseRes.data;
        setUserAddress({
          formatted: formatted_address,
          city,
          state,
          country,
          district: district !== 'Local District' ? district : undefined,
          postalCode: postal_code !== 'N/A' ? postal_code : undefined,
          accuracy,
          timestamp
        });
        setActiveCity(formatted_address);
        setCityInput(city);

        setLoadingMessage("Loading Nearby Places...");
        const [placesRes, weatherRes] = await Promise.all([
          api.get(`/maps/places?lat=${coords.lat}&lng=${coords.lng}&query=${encodeURIComponent(city)}`),
          api.get(`/maps/weather?lat=${coords.lat}&lng=${coords.lng}&name=${encodeURIComponent(city)}`)
        ]);

        if (placesRes.data.success) {
          setPlacesData(placesRes.data.data);
          setCityInfo(placesRes.data.data.city_info || { population: 'N/A', best_time_to_visit: 'N/A' });
        }
        if (weatherRes.data.success) {
          setWeatherForecast(weatherRes.data.weather_forecast || []);
        }
      } else {
        throw new Error("Reverse geocoding failed on backend");
      }
    } catch (error: any) {
      console.error('Error fetching geolocation context:', error);
      setSearchError("Failed to fetch surrounding info for detected location.");
    } finally {
      setLoadingMessage("Preparing Map...");
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const runLevel2Fallback = async () => {
    try {
      setLoadingMessage("GPS timed out. Querying Google Geolocation service...");
      let currentKey = apiKey;
      if (!currentKey) {
        const configRes = await api.get('/maps/config');
        if (configRes.data.success && configRes.data.googleMapsApiKey) {
          currentKey = configRes.data.googleMapsApiKey;
          setApiKey(currentKey);
        }
      }
      
      if (!currentKey) throw new Error("API Key not available");
      
      const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${currentKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`Google Geolocation failed with status ${res.status}`);
      const data = await res.json();
      if (data.location && data.location.lat && data.location.lng) {
        const coords = { lat: data.location.lat, lng: data.location.lng };
        const accuracy = data.accuracy || 1500;
        const timestamp = new Date().toLocaleTimeString();
        await handleGpsSuccess(coords, accuracy, timestamp);
      } else {
        throw new Error("No location coordinates returned");
      }
    } catch (err: any) {
      console.warn(`Level 2 fallback failed: ${err.message}. Trying Level 3 fallback...`);
      await runLevel3Fallback();
    }
  };

  const runLevel3Fallback = async () => {
    try {
      setLoadingMessage("Google Geolocation failed. Using IP lookup fallback...");
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error(`IP lookup failed with status ${res.status}`);
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const coords = { lat: data.latitude, lng: data.longitude };
        const accuracy = 5000;
        const timestamp = new Date().toLocaleTimeString();
        await handleGpsSuccess(coords, accuracy, timestamp);
      } else {
        throw new Error("No IP geolocation coordinates returned");
      }
    } catch (err: any) {
      console.warn(`Level 3 fallback failed: ${err.message}. Showing manual selection notice.`);
      runLevel4Fallback();
    }
  };

  const runLevel4Fallback = () => {
    setLoading(false);
    setSearchError("We could not automatically detect your location. Please type a city name in the search bar above.");
  };

  // Browser Geolocation Detector
  const handleLocateMe = async () => {
    setLoading(true);
    setSearchError(null);
    setResolvedNotice(null);
    setActivePin(null);
    clearDirections();
    
    // Level 1: Browser GPS
    setLoadingMessage("Detecting Location...");
    
    if (!navigator.geolocation) {
      console.warn("Browser geolocation not supported. Trying Level 2 fallback...");
      await runLevel2Fallback();
      return;
    }

    setLoadingMessage("Getting GPS Coordinates...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp).toLocaleTimeString();
        await handleGpsSuccess({ lat: latitude, lng: longitude }, accuracy, timestamp);
      },
      async (error) => {
        console.warn(`Browser GPS failed (code ${error.code}): ${error.message}. Trying Level 2 fallback...`);
        await runLevel2Fallback();
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  // Waypoint route planner additions
  const handleAddWaypoint = (place: any) => {
    if (waypoints.some(w => w.name === place.name)) return;
    setWaypoints([...waypoints, place]);
  };

  const handleRemoveWaypoint = (index: number) => {
    const updated = [...waypoints];
    updated.splice(index, 1);
    setWaypoints(updated);
  };

  // Multi-modal estimator
  const computeTransportOptions = (distanceKm: number) => {
    const walkMin = Math.round((distanceKm / 5) * 60);
    const walkTimeStr = walkMin > 60 ? `${Math.floor(walkMin / 60)}h ${walkMin % 60}m` : `${walkMin} min`;
    
    const cycleMin = Math.round((distanceKm / 15) * 60);
    const cycleTimeStr = cycleMin > 60 ? `${Math.floor(cycleMin / 60)}h ${cycleMin % 60}m` : `${cycleMin} min`;
    
    const autoMin = Math.round((distanceKm / 30) * 60) + 2;
    const autoTimeStr = autoMin > 60 ? `${Math.floor(autoMin / 60)}h ${autoMin % 60}m` : `${autoMin} min`;
    const autoCost = Math.round(30 + distanceKm * 15);

    const carMin = Math.round((distanceKm / 40) * 60) + 3;
    const carTimeStr = carMin > 60 ? `${Math.floor(carMin / 60)}h ${carMin % 60}m` : `${carMin} min`;
    const carCost = Math.round(50 + distanceKm * 20);

    const transitMin = Math.round((distanceKm / 25) * 60) + 5;
    const transitTimeStr = transitMin > 60 ? `${Math.floor(transitMin / 60)}h ${transitMin % 60}m` : `${transitMin} min`;
    const transitCost = Math.round(Math.max(20, 5 + distanceKm * 2));

    const options = [
      { id: 'walking', name: 'Walk', icon: '🚶', time: walkTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: '₹0' },
      { id: 'bicycling', name: 'Cycle', icon: '🚴', time: cycleTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: '₹0' },
      { id: 'auto', name: 'Auto', icon: '🛺', time: autoTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: `₹${autoCost}` },
      { id: 'driving', name: 'Taxi', icon: '🚗', time: carTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: `₹${carCost}` },
      { id: 'transit', name: 'Transit', icon: '🚌', time: transitTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: `₹${transitCost}` }
    ];

    if (distanceKm > 300) {
      const flightMin = Math.round((distanceKm / 600) * 60) + 120;
      const flightTimeStr = `${Math.floor(flightMin / 60)}h ${flightMin % 60}m`;
      const flightCost = Math.round(3000 + distanceKm * 6);
      options.push({
        id: 'flight', name: 'Flight', icon: '✈️', time: flightTimeStr, dist: `${distanceKm.toFixed(1)} km`, cost: `₹${flightCost}`
      });
    }

    let recommendedId = 'driving';
    if (distanceKm <= 1.5) {
      recommendedId = 'walking';
    } else if (distanceKm <= 5) {
      recommendedId = 'auto';
    } else if (distanceKm > 300) {
      recommendedId = 'flight';
    } else if (distanceKm > 10) {
      recommendedId = 'transit';
    }

    return options.map(opt => ({
      ...opt,
      isRecommended: opt.id === recommendedId
    }));
  };

  // 7. Get driving directions from center coordinates to active pin
  const fetchDirections = (place: any, modeId: string = 'driving') => {
    if (!(window as any).google || !directionsRendererRef.current) return;
    const google = (window as any).google;

    let travelMode = google.maps.TravelMode.DRIVING;
    if (modeId === 'walking') travelMode = google.maps.TravelMode.WALKING;
    if (modeId === 'bicycling') travelMode = google.maps.TravelMode.BICYCLING;
    if (modeId === 'transit') travelMode = google.maps.TravelMode.TRANSIT;

    setSelectedTransportMode(modeId);

    let originCoords = cityCoords;
    let isUserLocationUsed = false;
    
    if (userLocation) {
      const distanceToDestination = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        place.coord.lat,
        place.coord.lng
      );
      if (distanceToDestination <= 50) {
        originCoords = userLocation;
        isUserLocationUsed = true;
      } else {
        console.log(`User location is ${distanceToDestination.toFixed(1)}km away from destination (>50km limit). Routing from city center instead.`);
      }
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: originCoords,
        destination: place.coord,
        travelMode: travelMode
      },
      (result: any, status: string) => {
        const distanceKm = parseDistanceKm(place.distance);
        const options = computeTransportOptions(distanceKm);
        setTransportOptions(options);

        const matchingOpt = options.find(o => o.id === modeId) || options[3];

        if (status === 'OK') {
          clearDirections();
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          const steps = (leg.steps || []).map((s: any) => ({
            step: s.instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
            dist: s.distance?.text || ''
          }));
          setNavigationPath(steps);

          setRouteDetails({
            start: isUserLocationUsed ? 'Current Location' : activeCity.split(',')[0],
            destination: place.name,
            distance: leg.distance?.text || `${distanceKm.toFixed(1)} km`,
            duration: leg.duration?.text || matchingOpt.time,
            traffic: trafficLayerActive ? 'Normal Traffic' : 'Traffic data disabled',
            cost: matchingOpt.cost
          });
        } else {
          console.warn('Google Directions Service failed:', status, '- Using fallback route');
          clearDirections();

          // Draw fallback direct polyline on map
          mockPolylineRef.current = new google.maps.Polyline({
            path: [originCoords, place.coord],
            geodesic: true,
            strokeColor: '#2563EB',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapInstance.current
          });

          // Fit map bounds to show both start and end point
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(originCoords);
          bounds.extend(place.coord);
          mapInstance.current.fitBounds(bounds);

          // Generate simulated routing steps
          const steps = [
            {
              step: `Depart from starting location`,
              dist: '0.0 km'
            },
            {
              step: `Head toward ${place.name} using ${matchingOpt.name} travel option`,
              dist: matchingOpt.dist
            },
            {
              step: `Arrive at ${place.name} (Estimated time: ${matchingOpt.time}, Cost: ${matchingOpt.cost})`,
              dist: '0.0 km'
            }
          ];
          setNavigationPath(steps);

          setRouteDetails({
            start: isUserLocationUsed ? 'Current Location' : activeCity.split(',')[0],
            destination: place.name,
            distance: matchingOpt.dist,
            duration: matchingOpt.time,
            traffic: 'Simulated (Traffic unverified)',
            cost: matchingOpt.cost
          });
        }
      }
    );
  };

  // Multi-stop Optimized Route Planner
  const calculateMultiStopRoute = () => {
    if (!(window as any).google || !mapInstance.current) return;
    const google = (window as any).google;

    if (waypoints.length < 1) {
      alert('Please add at least one waypoint stop.');
      return;
    }

    setLoading(true);
    clearDirections();

    const originCoords = userLocation || cityCoords;
    const destination = waypoints[waypoints.length - 1];
    const intermediateStops = waypoints.slice(0, -1).map(wp => ({
      location: new google.maps.LatLng(wp.coord.lat, wp.coord.lng),
      stopover: true
    }));

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: originCoords,
        destination: new google.maps.LatLng(destination.coord.lat, destination.coord.lng),
        waypoints: intermediateStops,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status: string) => {
        setLoading(false);
        if (status === 'OK') {
          clearDirections();
          directionsRendererRef.current.setDirections(result);

          const route = result.routes[0];
          const waypointOrder = route.waypoint_order;
          
          const optimizedIntermediate = waypoints.slice(0, -1);
          const reordered = waypointOrder.map((idx: number) => optimizedIntermediate[idx]);
          reordered.push(destination);

          setWaypoints(reordered);

          // Render waypoints pins on map
          waypointMarkersRef.current.forEach(m => m.setMap(null));
          waypointMarkersRef.current = [];

          const legs = route.legs;
          const steps: any[] = [];

          legs.forEach((leg: any, legIdx: number) => {
            const destName = legIdx === legs.length - 1 ? destination.name : reordered[legIdx].name;

            const waypointMarker = new google.maps.Marker({
              position: leg.end_location,
              map: mapInstance.current,
              label: {
                text: `${legIdx + 1}`,
                color: '#FFFFFF',
                fontWeight: 'bold'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 12
              },
              title: destName
            });
            waypointMarkersRef.current.push(waypointMarker);

            steps.push({
              step: `Leg ${legIdx + 1} to ${destName}`,
              dist: leg.distance?.text || ''
            });

            (leg.steps || []).forEach((s: any) => {
              steps.push({
                step: s.instructions.replace(/<[^>]*>/g, ''),
                dist: s.distance?.text || ''
              });
            });
          });

          setNavigationPath(steps);
        } else {
          console.warn('Google optimized waypoints route failed:', status, '- Using straight-line fallback');
          clearDirections();

          const pathPoints = [originCoords, ...waypoints.map(wp => wp.coord)];
          
          mockPolylineRef.current = new google.maps.Polyline({
            path: pathPoints,
            geodesic: true,
            strokeColor: '#EF4444',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapInstance.current
          });

          const bounds = new google.maps.LatLngBounds();
          pathPoints.forEach(pt => bounds.extend(pt));
          mapInstance.current.fitBounds(bounds);

          waypointMarkersRef.current.forEach(m => m.setMap(null));
          waypointMarkersRef.current = [];

          waypoints.forEach((wp, idx) => {
            const m = new google.maps.Marker({
              position: wp.coord,
              map: mapInstance.current,
              label: {
                text: `${idx + 1}`,
                color: '#FFFFFF',
                fontWeight: 'bold'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 12
              },
              title: wp.name
            });
            waypointMarkersRef.current.push(m);
          });

          const steps = [
            { step: 'Start at your current location', dist: '0.0 km' },
            ...waypoints.map((wp, idx) => ({
              step: `Proceed directly to Stop ${idx + 1}: ${wp.name}`,
              dist: wp.distance || 'Calculating...'
            })),
            { step: 'Multi-stop route completed.', dist: '0.0 km' }
          ];
          setNavigationPath(steps);
        }
      }
    );
  };

  // 8. Execute Geocoding, Places and Weather queries
  const triggerSearch = async (targetSearch: string) => {
    setLoading(true);
    setLoadingMessage("Finding Coordinates...");
    setSearchError(null);
    setResolvedNotice(null);
    setActivePin(null);
    setNavigationPath(null);
    clearDirections();

    try {
      // Step A: Geocode query to get coordinates
      const geocodeRes = await api.get(`/maps/geocode?address=${encodeURIComponent(targetSearch)}`);
      if (!geocodeRes.data.success || !geocodeRes.data.location) {
        throw new Error('Destination not found.');
      }

      setLoadingMessage("Verifying Location...");
      const { lat, lng } = geocodeRes.data.location;
      const formattedName = geocodeRes.data.name;
      const placeId = geocodeRes.data.place_id;

      // LOCATION MATCHING VERIFICATION
      if (!checkLocationMatch(targetSearch, formattedName, placeId)) {
        throw new Error(`Location Mismatch: Searched for "${targetSearch}", but resolved to "${formattedName}". Please specify a correct city name.`);
      }

      // Check if search query differs slightly to show banner notice
      const cleanSearchCity = targetSearch.split(',')[0].trim().toLowerCase();
      const cleanGeocodedCity = formattedName.split(',')[0].trim().toLowerCase();
      if (cleanSearchCity !== cleanGeocodedCity) {
        setResolvedNotice(`Showing results for ${formattedName}`);
      } else {
        setResolvedNotice(null);
      }

      setCityCoords({ lat, lng });
      setActiveCity(formattedName);
      setCityInput(formattedName);

      // Center Map and Set Zoom Level to 13 (within 12-14 range)
      if (mapInstance.current) {
        mapInstance.current.setCenter({ lat, lng });
        mapInstance.current.setZoom(13);
      }

      // Step B: Query places & weather forecasts in parallel
      setLoadingMessage("Loading Nearby Places...");
      const [placesRes, weatherRes] = await Promise.all([
        api.get(`/maps/places?lat=${lat}&lng=${lng}&query=${encodeURIComponent(formattedName)}`),
        api.get(`/maps/weather?lat=${lat}&lng=${lng}&name=${encodeURIComponent(formattedName)}`)
      ]);

      if (placesRes.data.success) {
        setPlacesData(placesRes.data.data);
        setCityInfo(placesRes.data.data.city_info || { population: 'N/A', best_time_to_visit: 'N/A' });
      }
      if (weatherRes.data.success) {
        setWeatherForecast(weatherRes.data.weather_forecast || []);
      }

    } catch (err: any) {
      console.error('Search failed:', err);
      setSearchError(err.message || err.response?.data?.error || 'No results found for this destination.');
      setPlacesData({ attractions: [], hotels: [], restaurants: [], hidden_gems: [], stations: [], airports: [] });
      setWeatherForecast([]);
      setCityInfo(null);
    } finally {
      setLoadingMessage("Preparing Map...");
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // 9. Autocomplete suggestion selection
  const handleSelectSuggestion = (prediction: any) => {
    const description = prediction.description;
    setCityInput(description);
    setShowSuggestions(false);
    triggerSearch(description);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (cityInput.trim()) {
      triggerSearch(cityInput.trim());
    }
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm relative">
      
      {/* Sidebar: Destination Listings & Travel Utilities */}
      <aside className="w-[400px] flex flex-col z-10 border-r border-slate-200 bg-white flex-shrink-0">
        
        {/* Header Search, Location Summary & Filters */}
        <div className="p-6 border-b border-slate-100 space-y-4 relative">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Compass size={18} className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Explore Maps</span>
            </h1>
            <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* Autocomplete Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 relative">
            <div className="relative flex-grow">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search city, landmark, or state..."
                className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
              Search
            </button>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((p) => (
                  <div
                    key={p.place_id}
                    onClick={() => handleSelectSuggestion(p)}
                    className="p-3 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700 font-medium flex items-center gap-2"
                  >
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{p.description}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Locate Me Info Card */}
          {userAddress && (
            <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100/50 space-y-2 relative animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">📍 Current Location</p>
                <button
                  onClick={() => {
                    setUserAddress(null);
                    setUserLocation(null);
                    if (userMarkerRef.current) {
                      userMarkerRef.current.setMap(null);
                      userMarkerRef.current = null;
                    }
                    if (userAccuracyCircleRef.current) {
                      userAccuracyCircleRef.current.setMap(null);
                      userAccuracyCircleRef.current = null;
                    }
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-700 font-extrabold"
                >
                  Clear GPS
                </button>
              </div>
              <p className="text-xs font-black text-slate-800 leading-snug">{userAddress.formatted}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] font-bold text-slate-500 border-t border-blue-100/60 pt-2 mt-2">
                <span>City: {userAddress.city}</span>
                <span>State: {userAddress.state}</span>
                <span>Country: {userAddress.country}</span>
                {userAddress.district && <span>District: {userAddress.district}</span>}
                {userAddress.postalCode && <span>Postal: {userAddress.postalCode}</span>}
                {userAddress.accuracy !== undefined && <span>Accuracy: ±{Math.round(userAddress.accuracy)}m</span>}
                {userAddress.timestamp && <span className="col-span-2 text-blue-600 font-extrabold mt-0.5">Updated: {userAddress.timestamp}</span>}
              </div>
            </div>
          )}

          {/* Smart Nearby Discovery Filters */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Discovery Radius</span>
              <span>Sort By</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                {([
                  { id: 'all', label: 'All' },
                  { id: '1km', label: '1 km' },
                  { id: '5km', label: '5 km' },
                  { id: '10km', label: '10 km' },
                  { id: '25km', label: '25 km' }
                ] as const).map(band => (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => setDistanceBand(band.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                      distanceBand === band.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-150 hover:bg-slate-100'
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
              >
                <option value="distance">📍 Distance</option>
                <option value="rating">⭐ Rating</option>
                <option value="popularity">🔥 Popularity</option>
              </select>
            </div>
          </div>

          {/* Multi-Stop Trip Waypoints Tray */}
          {waypoints.length > 0 && (
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal size={10} />
                  <span>Multi-Stop Route ({waypoints.length})</span>
                </p>
                <button onClick={clearWaypoints} className="text-[10px] text-rose-500 hover:text-rose-700 font-bold">Clear All</button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {waypoints.map((wp, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-rose-100 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700">
                    <span className="truncate flex-1">
                      {idx === 0 ? '📍 Start: ' : `${idx}. `} {wp.name}
                    </span>
                    <button onClick={() => handleRemoveWaypoint(idx)} className="text-rose-400 hover:text-rose-600 font-bold ml-2">×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={calculateMultiStopRoute}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Optimize & Render Route</span>
              </button>
            </div>
          )}

          {/* Categories Filter list */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {(['attractions', 'hotels', 'restaurants', 'hidden_gems', 'stations', 'airports'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilterType(cat); setActivePin(null); setNavigationPath(null); clearDirections(); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {cat === 'attractions' ? 'Attractions' :
                 cat === 'hotels' ? 'Hotels' :
                 cat === 'restaurants' ? 'Restaurants' :
                 cat === 'hidden_gems' ? 'Hidden Gems' :
                 cat === 'stations' ? 'Stations' : 'Airports'}
              </button>
            ))}
          </div>
        </div>

        {/* Results Sidebar Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
          
          {resolvedNotice && !loading && !searchError && (
            <div className="bg-blue-50 border border-blue-150 text-blue-900 text-[11px] font-bold rounded-2xl p-3.5 flex items-center gap-2 shadow-sm">
              <span className="text-xs">📍</span>
              <span>{resolvedNotice}</span>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-20 space-y-3 animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" style={{ animationDuration: '0.8s' }} />
              <p className="text-[11px] font-extrabold text-blue-600">{loadingMessage}</p>
            </div>
          ) : searchError ? (
            <div className="text-center py-16 bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-2.5">
              <AlertTriangle size={28} className="text-rose-500 mx-auto" />
              <p className="text-xs font-black text-rose-800">{searchError}</p>
              <p className="text-[10px] text-rose-500">Please refine your search terms or verify connection settings.</p>
            </div>
          ) : (
            <>
              {/* Destination weather overview summary */}
              {weatherForecast.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">7-Day Weather Forecast</p>
                    <span className="text-[10px] text-blue-600 font-extrabold">Live Update</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                    {weatherForecast.map((w, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-xl p-2.5 text-center flex-shrink-0 min-w-16 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-450">{w.day}</p>
                        <p className="text-xs font-black text-slate-800 mt-1">{w.temp}</p>
                        <p className="text-[8px] font-bold text-blue-500 mt-0.5">{w.condition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Places details card list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider capitalize">
                    {filterType === 'hidden_gems' ? 'Hidden Gems' : filterType} ({processedPlaces.length})
                  </p>
                  <span className="text-[9px] font-extrabold text-slate-400">Powered by Google Places</span>
                </div>
                {processedPlaces.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No places matched your distance filters</p>
                  </div>
                ) : (
                  processedPlaces.map((place) => {
                    const isSelected = activePin?.name === place.name;
                    return (
                      <div
                        key={place.name}
                        onClick={() => {
                          setActivePin(place);
                          setNavigationPath(null);
                          clearDirections();
                          if (mapInstance.current) {
                            mapInstance.current.panTo(place.coord);
                            mapInstance.current.setZoom(15);
                          }
                        }}
                        className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                            : 'bg-white border-slate-150 hover:bg-slate-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative h-36 overflow-hidden bg-slate-50">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                            <span className="text-[10px] font-extrabold text-blue-600">{place.price}</span>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-slate-800 text-xs truncate flex-1">{place.name}</h3>
                            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded-lg text-[9px] font-bold">
                              <Star size={8} fill="currentColor" />
                              <span>{place.rating}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{place.description}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-[9px] font-semibold rounded-md text-slate-450">{place.category}</span>
                            <span className="text-[9px] font-medium text-slate-400">• {place.distance} away</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

        </div>

        {/* Floating Detail & Navigation Options Panel */}
        {activePin && !loading && !searchError && (
          <div className="p-6 border-t border-slate-100 bg-white space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md">{activePin.category}</span>
                <span className="text-[9px] font-bold text-slate-400">{activePin.distance} from center</span>
              </div>
              
              <div className="flex items-start justify-between gap-2 mt-1.5">
                <h3 className="font-extrabold text-slate-850 text-xs truncate flex-1">{activePin.name}</h3>
                <button
                  type="button"
                  onClick={() => handleAddWaypoint(activePin)}
                  className="text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg transition-colors border border-blue-200"
                >
                  + Add Stop
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{activePin.description}</p>
            </div>

            {/* Compare Multi-Modal Transport Rates */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Compare Multi-Modal Transit</p>
              <div className="grid grid-cols-5 gap-1.5">
                {computeTransportOptions(parseDistanceKm(activePin.distance)).map((opt) => {
                  const isSelected = selectedTransportMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => fetchDirections(activePin, opt.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-50/50 border-slate-150 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span className="text-[8px] font-extrabold truncate w-full mt-0.5">{opt.name}</span>
                      <span className={`text-[8px] font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{opt.cost}</span>
                      {opt.isRecommended && (
                        <span className={`text-[6px] font-black uppercase px-1 rounded-sm mt-0.5 ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>Best</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {navigationPath && routeDetails ? (
              <div className="space-y-4 pt-1 border-t border-slate-100 animate-fadeIn">
                {/* Route Summary */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">🗺️ Route Summary ({selectedTransportMode})</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] font-bold text-slate-700">
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">From</span>
                      <span className="text-slate-800 truncate block">{routeDetails.start}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">To</span>
                      <span className="text-slate-800 truncate block">{routeDetails.destination}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Distance</span>
                      <span className="text-slate-800">{routeDetails.distance}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Travel Time</span>
                      <span className="text-slate-800">{routeDetails.duration}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Traffic</span>
                      <span className={`${routeDetails.traffic.includes('Simulated') ? 'text-amber-600' : 'text-emerald-600'}`}>{routeDetails.traffic}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Estimated Cost</span>
                      <span className="text-blue-600 font-extrabold">{routeDetails.cost}</span>
                    </div>
                  </div>
                </div>

                {/* Turn-by-Turn Steps */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Turn-by-Turn Directions</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar font-mono text-[9px]">
                    {navigationPath.map((step, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-slate-50 border border-slate-100 p-2 rounded-xl gap-2">
                        <span className="text-slate-600 leading-relaxed">{idx + 1}. {step.step}</span>
                        <span className="text-blue-600 font-bold font-sans flex-shrink-0 mt-0.5">{step.dist}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => { setNavigationPath(null); clearDirections(); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-2 px-3 rounded-xl transition-colors text-center"
                >
                  Clear Directions
                </button>
              </div>
            ) : (
              <button
                onClick={() => fetchDirections(activePin, 'driving')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation size={12} />
                <span>Get Route Directions</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Map Content Column */}
      <section className="flex-grow bg-slate-100 flex flex-col overflow-hidden">
        
        {/* Premium Glassmorphic City Info Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100/50">
              <MapPin className="text-blue-600 animate-bounce" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-850 leading-tight">
                {activeCity}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1 bg-slate-100/70 px-2 py-0.5 rounded-md">
                  <span className="text-slate-400">Lat:</span> {cityCoords.lat.toFixed(4)}
                </span>
                <span className="flex items-center gap-1 bg-slate-100/70 px-2 py-0.5 rounded-md">
                  <span className="text-slate-400">Lng:</span> {cityCoords.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-semibold">
            {cityInfo && (
              <>
                <div className="bg-slate-50/80 border border-slate-150 rounded-2xl px-4 py-2 flex flex-col min-w-28 shadow-sm">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Population</span>
                  <span className="font-black text-slate-850 mt-0.5">{cityInfo.population || 'N/A'}</span>
                </div>
                <div className="bg-slate-50/80 border border-slate-150 rounded-2xl px-4 py-2 flex flex-col min-w-28 shadow-sm">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Best Time To Visit</span>
                  <span className="font-black text-blue-600 mt-0.5">{cityInfo.best_time_to_visit || 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Map and Overlays Wrapper */}
        <div className="w-full flex-1 relative overflow-hidden bg-slate-50">
          
          {/* Layer Switcher & Live Traffic Toggle Overlay */}
          <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-lg max-w-[280px]">
            <div className="flex gap-1 text-[9px] font-black tracking-wider uppercase text-slate-400">
              <span>Map theme layers</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[9px] font-black">
              {([
                { id: 'roadmap', label: 'Standard' },
                { id: 'satellite', label: 'Satellite' },
                { id: 'terrain', label: 'Terrain' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'canvas', label: 'Canvas Style' }
              ] as const).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMapType(type.id)}
                  className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                    mapType === type.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                      : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="h-px bg-slate-150 w-full" />
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-black tracking-wider uppercase text-slate-500 flex items-center gap-1">
                🚦 Live traffic speed overlay
              </span>
              <button
                type="button"
                onClick={() => setTrafficLayerActive(!trafficLayerActive)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                  trafficLayerActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    trafficLayerActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Real Dynamic Map Container */}
          {apiKey ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
              <p className="text-xs font-bold">Configuring Google Maps SDK...</p>
            </div>
          )}

          {/* Floating Controls Overlay (Right Stack) */}
          {!loading && !searchError && (
            <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-10 items-end">
              
              {/* Active Destination / Position Badge */}
              <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-md flex items-center gap-2 border border-slate-200">
                <MapPin size={13} className="text-blue-600 animate-bounce" />
                <span className="text-[10px] font-black text-slate-800 capitalize truncate max-w-44">{activeCity}</span>
              </div>

              {/* Custom Interactive Control Buttons stack */}
              <div className="flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200">
                {/* Locate Me */}
                <button
                  type="button"
                  onClick={handleLocateMe}
                  title="Detect My GPS Location"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50/50 hover:text-blue-700 transition-all focus:outline-none"
                >
                  <Locate size={16} className="animate-pulse" />
                </button>

                <div className="h-px bg-slate-150 w-full" />

                {/* Recenter Map to core city location */}
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstance.current) {
                      mapInstance.current.setCenter(cityCoords);
                      mapInstance.current.setZoom(13);
                    }
                  }}
                  title="Recenter Destination"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-850 transition-all focus:outline-none"
                >
                  <Compass size={16} />
                </button>

                <div className="h-px bg-slate-150 w-full" />

                {/* Zoom In button */}
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstance.current) {
                      mapInstance.current.setZoom(mapInstance.current.getZoom() + 1);
                    }
                  }}
                  title="Zoom In"
                  className="w-9 h-9 rounded-xl flex text-base font-bold items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-850 transition-all focus:outline-none"
                >
                  +
                </button>

                {/* Zoom Out button */}
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstance.current) {
                      mapInstance.current.setZoom(Math.max(1, mapInstance.current.getZoom() - 1));
                    }
                  }}
                  title="Zoom Out"
                  className="w-9 h-9 rounded-xl flex text-base font-bold items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-850 transition-all focus:outline-none"
                >
                  −
                </button>

                <div className="h-px bg-slate-150 w-full" />

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const mapEl = mapRef.current;
                    if (!mapEl) return;
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      mapEl.requestFullscreen().catch(err => console.error(err));
                    }
                  }}
                  title="Fullscreen Map View"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-850 transition-all focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M16 4h4v4M4 16v4h4m12-4v4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
      
    </div>
  );
}
