'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useLanguage } from '@/contexts/LanguageContext';
import { reportService, CommunityReport } from '@/services/reportService';

interface GoogleMapProps {
  className?: string;
}

interface CrimeData {
  cmplnt_num: string;
  cmplnt_fr_dt: string;
  boro_nm: string;
  latitude: string;
  longitude: string;
  ofns_desc: string;
  pd_desc: string;
  law_cat_cd: string;
}

interface RouteOption {
  route: google.maps.DirectionsRoute;
  renderer: google.maps.DirectionsRenderer;
  safetyScore: number;
  efficiencyScore: number;
  compositeScore: number;
  riskPoints: number;
  recommendation: 'safest' | 'balanced' | 'fastest' | 'avoid';
}

const GoogleMap: React.FC<GoogleMapProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  // Core map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);

  // Data state
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);

  // UI state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  
  // Display toggles
  const [showCrimeLayer, setShowCrimeLayer] = useState(true);

  // Markers
  const [crimeMarkers, setCrimeMarkers] = useState<google.maps.Marker[]>([]);
  const [reportMarkers, setReportMarkers] = useState<google.maps.Marker[]>([]);

  // Load community reports on mount
  useEffect(() => {
    setCommunityReports(reportService.getReports());
  }, []);

  // Setup global vote function for reports
  useEffect(() => {
    (window as Window & typeof globalThis & { voteReport?: (reportId: string, isUpvote: boolean) => void }).voteReport = (reportId: string, isUpvote: boolean) => {
      try {
        reportService.updateReportVotes(reportId, isUpvote);
        const updatedReports = reportService.getReports();
        setCommunityReports(updatedReports);
        if (map) addReportMarkers(map, updatedReports);
      } catch (error) {
        console.error('Error voting on report:', error);
      }
    };
    return () => {
      delete (window as Window & typeof globalThis & { voteReport?: (reportId: string, isUpvote: boolean) => void }).voteReport;
    };
  }, [map]);

  // Fetch crime data
  const fetchCrimeData = async () => {
    try {
      console.log('🔍 Starting crime data fetch...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 18);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`📅 Fetching crimes from ${startDateStr} to ${endDateStr}`);

      const whereClause = `boro_nm='BRONX' AND cmplnt_fr_dt >= '${startDateStr}T00:00:00.000' AND cmplnt_fr_dt <= '${endDateStr}T23:59:59.999'`;
      const encodedWhere = encodeURIComponent(whereClause);
      const apiUrl = `https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=2000&$where=${encodedWhere}&$order=cmplnt_fr_dt DESC`;

      console.log('🌐 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Received ${data.length} raw crime records`);
        
        const validCrimes = data.filter((crime: CrimeData) => 
          crime.latitude && 
          crime.longitude && 
          !isNaN(parseFloat(crime.latitude)) && 
          !isNaN(parseFloat(crime.longitude)) &&
          parseFloat(crime.latitude) !== 0 &&
          parseFloat(crime.longitude) !== 0
        );
        
        setCrimeData(validCrimes);
        console.log(`✅ Loaded ${validCrimes.length} valid crime records for display`);
        
        // Log sample of crimes for debugging
        if (validCrimes.length > 0) {
          console.log('📋 Sample crimes:', validCrimes.slice(0, 3).map((c: CrimeData) => ({
            type: c.ofns_desc,
            date: c.cmplnt_fr_dt,
            lat: c.latitude,
            lng: c.longitude
          })));
        }
      } else {
        console.error(`❌ API response failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Crime data fetch failed:', error);
    }
  };

  // Add crime markers to map
  const addCrimeMarkers = (mapInstance: google.maps.Map, crimes: CrimeData[]) => {
    console.log(`🗺️ addCrimeMarkers called with ${crimes.length} crimes, showCrimeLayer: ${showCrimeLayer}`);
    
    // Clear existing markers
    crimeMarkers.forEach(marker => marker.setMap(null));
    setCrimeMarkers([]);

    if (!showCrimeLayer || crimes.length === 0) {
      console.log('❌ Not showing crime markers - layer disabled or no data');
      return;
    }

    console.log(`📍 Creating markers for ${Math.min(crimes.length, 100)} crimes`);
    
    const newMarkers = crimes.slice(0, 100).map((crime, index) => {
      const lat = parseFloat(crime.latitude);
      const lng = parseFloat(crime.longitude);

      if (index < 3) {
        console.log(`🔍 Creating marker ${index + 1}: ${crime.ofns_desc} at (${lat}, ${lng})`);
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: `Crime: ${crime.ofns_desc}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="#ef4444" stroke="white" stroke-width="1"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(12, 12),
          anchor: new google.maps.Point(6, 6)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; color: #ef4444; font-size: 12px;">🚨 ${crime.ofns_desc}</h4>
            <p style="margin: 0; font-size: 11px; color: #666;">
              <strong>Date:</strong> ${new Date(crime.cmplnt_fr_dt).toLocaleDateString()}<br>
              <strong>Type:</strong> ${crime.law_cat_cd}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => infoWindow.open(mapInstance, marker));
      return marker;
    });

    setCrimeMarkers(newMarkers);
    console.log(`✅ Successfully created ${newMarkers.length} crime markers`);
  };

  // Add report markers to map
  const addReportMarkers = (mapInstance: google.maps.Map, reports: CommunityReport[]) => {
    reportMarkers.forEach(marker => marker.setMap(null));
    setReportMarkers([]);

    const icons = {
      dark: { icon: '💡', color: '#f59e0b' },
      unsafe: { icon: '⚠️', color: '#ef4444' },
      loitering: { icon: '👥', color: '#f97316' },
      harassment: { icon: '🚫', color: '#8b5cf6' },
      other: { icon: '❓', color: '#6b7280' }
    };

    const newMarkers = reports.map(report => {
      const reportIcon = icons[report.type];
      const timeAgo = getTimeAgo(report.timestamp);

      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: mapInstance,
        title: `Community Report: ${report.type}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="${reportIcon.color}" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">${reportIcon.icon}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: ${reportIcon.color};">${reportIcon.icon} ${t(`report.${report.type}`)}</h4>
            ${report.comment ? `<p style="margin: 0 0 8px 0; font-size: 14px;">${report.comment}</p>` : ''}
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
              <strong>Reported:</strong> ${timeAgo} | <strong>Votes:</strong> ${report.votes}
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.voteReport('${report.id}', true)" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 11px;">👍</button>
              <button onclick="window.voteReport('${report.id}', false)" style="padding: 4px 8px; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 11px;">👎</button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => infoWindow.open(mapInstance, marker));
      return marker;
    });

    setReportMarkers(newMarkers);
  };

  // Helper function for time ago
  const getTimeAgo = (timestamp: Date): string => {
    const diffMs = Date.now() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Submit community report
  const submitReport = (type: CommunityReport['type'], comment: string) => {
    if (!reportLocation) return;

    try {
      reportService.addReport({
        lat: reportLocation.lat,
        lng: reportLocation.lng,
        type,
        comment
      });

      const updatedReports = reportService.getReports();
      setCommunityReports(updatedReports);
      if (map) addReportMarkers(map, updatedReports);

      setShowReportModal(false);
      setReportLocation(null);
      console.log('✅ Report submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      alert('Error submitting report. A similar report may already exist nearby.');
    }
  };

  // Calculate safe routes
  const calculateSafeRoutes = async () => {
    if (!directionsService || !map || !origin || !destination) {
      alert('Please enter both starting location and destination');
      return;
    }

    setIsCalculatingRoutes(true);
    routeOptions.forEach(option => option.renderer.setMap(null));
    setRouteOptions([]);

    try {
      const request: google.maps.DirectionsRequest = {
        origin: origin.trim(),
        destination: destination.trim(),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
        avoidHighways: true
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          const routes = result.routes.slice(0, 3).map((route, index) => {
            const safetyScore = Math.floor(Math.random() * 40) + 60; // Simplified for demo
            const efficiencyScore = Math.floor(Math.random() * 30) + 70;
            const compositeScore = Math.round((safetyScore * 0.7) + (efficiencyScore * 0.3));
            
            const renderer = new google.maps.DirectionsRenderer({
              map: map,
              polylineOptions: {
                strokeColor: index === 0 ? '#22c55e' : index === 1 ? '#3b82f6' : '#f59e0b',
                strokeWeight: 6,
                strokeOpacity: 0.8
              },
              suppressMarkers: index > 0
            });

            renderer.setDirections({ ...result, routes: [route] });

            return {
              route,
              renderer,
              safetyScore,
              efficiencyScore,
              compositeScore,
              riskPoints: Math.floor(Math.random() * 5),
              recommendation: (index === 0 ? 'safest' : index === 1 ? 'balanced' : 'fastest') as RouteOption['recommendation']
            };
          });

          setRouteOptions(routes);
        } else {
          alert('Could not find routes between these locations.');
        }
        setIsCalculatingRoutes(false);
      });
    } catch (error) {
      console.error('Error calculating routes:', error);
      setIsCalculatingRoutes(false);
    }
  };

  // Toggle crime layer
  const toggleCrimeLayer = () => {
    const newShowCrimeLayer = !showCrimeLayer;
    console.log(`🔄 Toggling crime layer: ${showCrimeLayer} -> ${newShowCrimeLayer}`);
    setShowCrimeLayer(newShowCrimeLayer);
    
    if (map) {
      if (newShowCrimeLayer && crimeData.length > 0) {
        console.log('🔄 Showing crime markers...');
        addCrimeMarkers(map, crimeData);
      } else if (!newShowCrimeLayer) {
        console.log('🔄 Hiding crime markers...');
        crimeMarkers.forEach(marker => marker.setMap(null));
        setCrimeMarkers([]);
      } else if (newShowCrimeLayer && crimeData.length === 0) {
        console.log('🔄 No crime data yet, will show when loaded');
      }
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();

        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 40.8448, lng: -73.8648 },
          zoom: 13,
          styles: [
            { featureType: "all", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#f7fafc" }] },
            { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#2d3748" }] },
            { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#4a5568" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#4a5568" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#553c9a" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#2b6cb0" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#4c51bf" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#553c9a" }] }
          ]
        });

        const dirService = new google.maps.DirectionsService();
        setMap(mapInstance);
        setDirectionsService(dirService);

        // Setup autocomplete
        if (originInputRef.current && destinationInputRef.current) {
          const originAutocomplete = new google.maps.places.Autocomplete(originInputRef.current);
          const destAutocomplete = new google.maps.places.Autocomplete(destinationInputRef.current);

          originAutocomplete.addListener('place_changed', () => {
            const place = originAutocomplete.getPlace();
            if (place.formatted_address) setOrigin(place.formatted_address);
          });

          destAutocomplete.addListener('place_changed', () => {
            const place = destAutocomplete.getPlace();
            if (place.formatted_address) setDestination(place.formatted_address);
          });
        }

        // Right-click to report
        mapInstance.addListener('rightclick', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            setReportLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
            setShowReportModal(true);
          }
        });

        setIsLoading(false);
        await fetchCrimeData();
      } catch (error) {
        console.error('Map initialization error:', error);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Update markers when data changes
  useEffect(() => {
    console.log(`🔄 Crime data useEffect: map=${!!map}, crimeData.length=${crimeData.length}, showCrimeLayer=${showCrimeLayer}`);
    if (map && crimeData.length > 0 && showCrimeLayer) {
      console.log('🔄 Triggering addCrimeMarkers from useEffect');
      addCrimeMarkers(map, crimeData);
    } else if (map && !showCrimeLayer) {
      console.log('🔄 Clearing crime markers from useEffect');
      crimeMarkers.forEach(marker => marker.setMap(null));
      setCrimeMarkers([]);
    }
  }, [map, crimeData, showCrimeLayer]);

  useEffect(() => {
    if (map && communityReports.length > 0) {
      addReportMarkers(map, communityReports);
    }
  }, [map, communityReports]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <div className="text-center text-slate-300">
          <p className="text-red-400 font-semibold">Error loading map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
          <div className="text-center text-slate-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Loading SafePath...</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-20 dark-glass-morphism rounded-2xl shadow-2xl border border-slate-600 w-80 max-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="p-4 border-b border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-100">{t('main.title')}</h1>
              <p className="text-sm text-slate-400">{t('main.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowDirectionsPanel(!showDirectionsPanel)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${!showDirectionsPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {showDirectionsPanel && (
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Route Inputs */}
            <div className="space-y-3">
              <input
                ref={originInputRef}
                type="text"
                placeholder={t('main.origin')}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                ref={destinationInputRef}
                type="text"
                placeholder={t('main.destination')}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={calculateSafeRoutes}
                disabled={!origin || !destination || isCalculatingRoutes}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  origin && destination && !isCalculatingRoutes
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isCalculatingRoutes ? 'Calculating...' : t('main.findRoutes')}
              </button>
            </div>

            {/* Crime Layer Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-slate-200">{t('crime.title')}</h3>
                <p className="text-xs text-slate-400">{t('crime.subtitle')}</p>
              </div>
              <button
                onClick={toggleCrimeLayer}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showCrimeLayer ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showCrimeLayer ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Route Options */}
            {routeOptions.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-slate-200">Routes</h2>
                {routeOptions.map((route, index) => (
                  <div key={index} className="p-3 bg-slate-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-slate-200 capitalize">{route.recommendation}</h3>
                      <span className="text-lg font-bold text-slate-300">{route.compositeScore}</span>
                    </div>
                    <div className="text-sm text-slate-400 mb-3">
                      {route.route.legs[0].duration?.text} • {route.route.legs[0].distance?.text}
                    </div>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`)}
                      className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Open in Google Maps
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Button */}
      <button
        onClick={() => alert('Right-click anywhere on the map to report a safety issue')}
        className="absolute bottom-20 right-6 z-20 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-full w-14 h-14 shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>

      {/* Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-100">{t('report.title')}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {(['dark', 'unsafe', 'loitering', 'harassment', 'other'] as const).map(type => {
                const icons = {
                  dark: { icon: '💡', label: t('report.poorLighting'), color: 'bg-yellow-600' },
                  unsafe: { icon: '⚠️', label: t('report.generalSafety'), color: 'bg-red-600' },
                  loitering: { icon: '👥', label: t('report.suspiciousActivity'), color: 'bg-orange-600' },
                  harassment: { icon: '🚫', label: t('report.harassment'), color: 'bg-purple-600' },
                  other: { icon: '❓', label: t('report.other'), color: 'bg-gray-600' }
                };
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      const comment = prompt(`${t('report.additionalDetails')} ${icons[type].label.toLowerCase()} ${t('report.optional')}`);
                      submitReport(type, comment || '');
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 border-slate-600 hover:border-slate-500 transition-all ${icons[type].color} bg-opacity-20 hover:bg-opacity-30 flex items-center space-x-3`}
                  >
                    <span className="text-2xl">{icons[type].icon}</span>
                    <span className="font-medium text-slate-200">{icons[type].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default GoogleMap; 