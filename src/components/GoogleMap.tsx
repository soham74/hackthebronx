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
  
  // Report form state
  const [selectedReportType, setSelectedReportType] = useState<CommunityReport['type'] | null>(null);
  const [reportComment, setReportComment] = useState('');

  // Markers
  const [crimeMarkers, setCrimeMarkers] = useState<google.maps.Marker[]>([]);
  const [reportMarkers, setReportMarkers] = useState<google.maps.Marker[]>([]);
  const [currentInfoWindow, setCurrentInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Load community reports on mount
  useEffect(() => {
    setCommunityReports(reportService.getReports());
  }, []);

  // Prevent browser context menu globally
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add global context menu prevention
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
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
      console.log('🔍 Fetching Bronx crime data...');
      
      // Use past 2 months from current date
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 2); // Go back 2 months

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`📅 Fetching crimes from ${startDateStr} to ${endDateStr}`);
      console.log(`📅 Current system date: ${endDateStr}`);

      // Simplified query focusing on Bronx borough with higher limit
      const apiUrl = `https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=10000&boro_nm=BRONX&$where=cmplnt_fr_dt >= '${startDateStr}T00:00:00.000' AND cmplnt_fr_dt <= '${endDateStr}T23:59:59.999'&$order=cmplnt_fr_dt DESC`;

      console.log('🌐 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Received ${data.length} raw crime records from past 2 months`);
        
        // Filter for valid coordinates
        const validCrimes = data.filter((crime: CrimeData) => 
          crime.latitude && 
          crime.longitude && 
          !isNaN(parseFloat(crime.latitude)) && 
          !isNaN(parseFloat(crime.longitude)) &&
          parseFloat(crime.latitude) !== 0 &&
          parseFloat(crime.longitude) !== 0 &&
          crime.boro_nm === 'BRONX' // Double-check it's Bronx
        );
        
        setCrimeData(validCrimes);
        console.log(`✅ Loaded ${validCrimes.length} valid Bronx crime records from past 2 months`);
        
        // Log sample of crimes for debugging
        if (validCrimes.length > 0) {
          console.log('📋 Sample crimes:', validCrimes.slice(0, 3).map((c: CrimeData) => ({
            type: c.ofns_desc,
            date: c.cmplnt_fr_dt,
            borough: c.boro_nm,
            lat: c.latitude,
            lng: c.longitude
          })));
        } else {
          console.log('⚠️ No valid Bronx crime data found in past 2 months');
          
          // Fallback: try to get any recent NYC data to test the API
          console.log('🔄 Testing API with broader query...');
          try {
            const testUrl = `https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=100&$order=cmplnt_fr_dt DESC`;
            const testResponse = await fetch(testUrl);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log(`📊 Test query returned ${testData.length} records from all boroughs`);
              const boroughCounts: Record<string, number> = {};
              testData.forEach((crime: CrimeData) => {
                boroughCounts[crime.boro_nm] = (boroughCounts[crime.boro_nm] || 0) + 1;
              });
              console.log('📍 Borough distribution:', boroughCounts);
              
              // Also check date range in the test data
              const dates = testData.map((crime: CrimeData) => crime.cmplnt_fr_dt).slice(0, 5);
              console.log('📅 Sample dates from recent data:', dates);
              
              // Try a broader Bronx query without date filter
              console.log('🔄 Trying Bronx query without date filter...');
              const bronxUrl = `https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=1000&boro_nm=BRONX&$order=cmplnt_fr_dt DESC`;
              const bronxResponse = await fetch(bronxUrl);
              if (bronxResponse.ok) {
                const bronxData = await bronxResponse.json();
                console.log(`📊 Bronx-only query returned ${bronxData.length} records`);
                if (bronxData.length > 0) {
                  console.log('📅 Latest Bronx crime date:', bronxData[0].cmplnt_fr_dt);
                  
                  // Use this data if it exists
                  const validBronxCrimes = bronxData.filter((crime: CrimeData) => 
                    crime.latitude && 
                    crime.longitude && 
                    !isNaN(parseFloat(crime.latitude)) && 
                    !isNaN(parseFloat(crime.longitude)) &&
                    parseFloat(crime.latitude) !== 0 &&
                    parseFloat(crime.longitude) !== 0
                  );
                  
                  if (validBronxCrimes.length > 0) {
                    setCrimeData(validBronxCrimes);
                    console.log(`🎉 Using ${validBronxCrimes.length} Bronx records from broader query`);
                  }
                }
              }
            }
          } catch (testError) {
            console.error('❌ Test query also failed:', testError);
          }
        }
      } else {
        console.error(`❌ API response failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Crime data fetch failed:', error);
    }
  };

  // Add crime markers near routes only
  const addCrimeMarkersNearRoutes = (mapInstance: google.maps.Map, crimes: CrimeData[], routes: RouteOption[]) => {
    console.log(`🗺️ Adding crime markers near ${routes.length} routes from ${crimes.length} total crimes`);
    
    // Clear existing crime markers
    crimeMarkers.forEach(marker => marker.setMap(null));
    setCrimeMarkers([]);

    if (crimes.length === 0 || routes.length === 0) {
      console.log(`❌ Not showing markers: crimes=${crimes.length}, routes=${routes.length}`);
      return;
    }

    // Get all route points
    const allRoutePoints: google.maps.LatLng[] = [];
    routes.forEach(routeOption => {
      allRoutePoints.push(...routeOption.route.overview_path);
    });

    // Filter crimes that are near any route (within 200m for consistency)
    const nearRouteCrimes = crimes.filter(crime => {
      const crimeLat = parseFloat(crime.latitude);
      const crimeLng = parseFloat(crime.longitude);
      const crimePos = new google.maps.LatLng(crimeLat, crimeLng);
      
      return allRoutePoints.some(routePoint => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(crimePos, routePoint);
        return distance < 200; // 200 meters from any route (consistent with risk calc)
      });
    });

    console.log(`📍 Found ${nearRouteCrimes.length} crimes near routes`);

    // Create markers for crimes near routes
    const newMarkers = nearRouteCrimes.slice(0, 100).map((crime, index) => {
      const lat = parseFloat(crime.latitude);
      const lng = parseFloat(crime.longitude);

      if (index < 5) {
        console.log(`📍 Route crime ${index + 1}: ${crime.ofns_desc} at (${lat}, ${lng})`);
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: `${crime.ofns_desc} - ${new Date(crime.cmplnt_fr_dt).toLocaleDateString()}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7, // Slightly larger for better visibility
          fillColor: '#dc2626', // Slightly darker red
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        zIndex: 1500
      });

      // Improved info window with better styling
      const crimeDate = new Date(crime.cmplnt_fr_dt);
      const daysAgo = Math.floor((Date.now() - crimeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const severityColor = crime.law_cat_cd === 'FELONY' ? '#dc2626' : 
                           crime.law_cat_cd === 'MISDEMEANOR' ? '#f59e0b' : '#10b981';
      
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            padding: 16px; 
            max-width: 280px; 
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.4;
            color: #1f2937;
          ">
            <div style="
              display: flex; 
              align-items: center; 
              margin-bottom: 12px; 
              padding-bottom: 8px; 
              border-bottom: 2px solid #e5e7eb;
            ">
              <span style="font-size: 24px; margin-right: 8px;">🚨</span>
              <div>
                <h3 style="
                  margin: 0; 
                  font-size: 16px; 
                  font-weight: 600; 
                  color: ${severityColor};
                  line-height: 1.2;
                ">${crime.ofns_desc}</h3>
                <p style="
                  margin: 2px 0 0 0; 
                  font-size: 12px; 
                  color: #6b7280; 
                  font-weight: 500;
                ">${crime.law_cat_cd}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                margin-bottom: 4px;
              ">
                <span style="
                  font-size: 13px; 
                  font-weight: 600; 
                  color: #374151;
                ">📅 ${t('crime.date')}:</span>
                <span style="
                  font-size: 13px; 
                  color: #4b5563;
                ">${crimeDate.toLocaleDateString()}</span>
              </div>
              
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
              ">
                <span style="
                  font-size: 13px; 
                  font-weight: 600; 
                  color: #374151;
                ">⏰ ${t('crime.timeAgo')}:</span>
                <span style="
                  font-size: 13px; 
                  color: #4b5563;
                ">${daysAgo === 0 ? t('crime.today') : daysAgo === 1 ? t('crime.dayAgo') : t('crime.daysAgo').replace('{days}', daysAgo.toString())}</span>
              </div>
            </div>
            
            <div style="
              background-color: #f9fafb; 
              padding: 8px; 
              border-radius: 6px; 
              border-left: 3px solid ${severityColor};
            ">
              <p style="
                margin: 0; 
                font-size: 11px; 
                color: #6b7280; 
                text-align: center;
              ">
                ${t('crime.riskLevel')}: <strong style="color: ${severityColor};">${crime.law_cat_cd}</strong>
              </p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close any existing info window (crime or community report)
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        
        // Open new info window and set it as current
        infoWindow.open(mapInstance, marker);
        setCurrentInfoWindow(infoWindow);
      });
      
      return marker;
    });

    setCrimeMarkers(newMarkers);
    console.log(`✅ Successfully added ${newMarkers.length} crime markers near routes`);
  };

  // Add report markers to map
  const addReportMarkers = (mapInstance: google.maps.Map, reports: CommunityReport[]) => {
    // Close any existing info window when adding new markers
    if (currentInfoWindow) {
      currentInfoWindow.close();
      setCurrentInfoWindow(null);
    }
    
    reportMarkers.forEach(marker => marker.setMap(null));
    setReportMarkers([]);

    const reportTypes = {
      dark: { icon: '💡', color: '#f59e0b', labelKey: 'community.poorLighting' },
      unsafe: { icon: '⚠️', color: '#ef4444', labelKey: 'community.safetyConcern' },
      loitering: { icon: '👥', color: '#f97316', labelKey: 'community.suspiciousActivity' },
      harassment: { icon: '🚫', color: '#8b5cf6', labelKey: 'community.harassment' },
      other: { icon: '❓', color: '#6b7280', labelKey: 'community.otherIssue' }
    };

    const newMarkers = reports.map(report => {
      const reportInfo = reportTypes[report.type];
      const timeAgo = getTimeAgo(report.timestamp);
      const label = t(reportInfo.labelKey);

      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: mapInstance,
        title: `${t('community.communityReport')}: ${label}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="${reportInfo.color}" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">${reportInfo.icon}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            padding: 16px; 
            max-width: 280px; 
            background-color: #ffffff; 
            color: #1f2937;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.4;
          ">
            <div style="
              display: flex; 
              align-items: center; 
              margin-bottom: 12px; 
              padding-bottom: 8px; 
              border-bottom: 2px solid #e5e7eb;
            ">
              <span style="font-size: 24px; margin-right: 8px;">${reportInfo.icon}</span>
              <div>
                <h3 style="
                  margin: 0; 
                  font-size: 16px; 
                  font-weight: 600; 
                  color: ${reportInfo.color};
                  line-height: 1.2;
                ">${label}</h3>
                <p style="
                  margin: 2px 0 0 0; 
                  font-size: 12px; 
                  color: #6b7280; 
                  font-weight: 500;
                ">${t('community.communityReport')}</p>
              </div>
            </div>
            
            ${report.comment ? `
              <div style="margin-bottom: 12px;">
                <h4 style="
                  margin: 0 0 4px 0; 
                  font-size: 13px; 
                  font-weight: 600; 
                  color: #374151;
                ">${t('community.details')}:</h4>
                <p style="
                  margin: 0; 
                  font-size: 14px; 
                  color: #4b5563;
                  font-style: italic;
                ">"${report.comment}"</p>
              </div>
            ` : ''}
            
            <div style="margin-bottom: 12px;">
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                margin-bottom: 4px;
              ">
                <span style="
                  font-size: 13px; 
                  font-weight: 600; 
                  color: #374151;
                ">⏰ ${t('community.reported')}:</span>
                <span style="
                  font-size: 13px; 
                  color: #4b5563;
                ">${timeAgo}</span>
              </div>
              
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
              ">
                <span style="
                  font-size: 13px; 
                  font-weight: 600; 
                  color: #374151;
                ">👥 ${t('community.votes')}:</span>
                <span style="
                  font-size: 13px; 
                  color: #4b5563;
                  font-weight: 600;
                ">${report.votes}</span>
              </div>
            </div>
            
            <div style="
              display: flex; 
              gap: 8px;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
            ">
              <button 
                onclick="window.voteReport('${report.id}', true)" 
                style="
                  flex: 1;
                  padding: 6px 12px; 
                  background: #3b82f6; 
                  color: white; 
                  border: none; 
                  border-radius: 6px; 
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#2563eb'"
                onmouseout="this.style.backgroundColor='#3b82f6'"
              >👍 ${t('community.helpful')}</button>
              <button 
                onclick="window.voteReport('${report.id}', false)" 
                style="
                  flex: 1;
                  padding: 6px 12px; 
                  background: #6b7280; 
                  color: white; 
                  border: none; 
                  border-radius: 6px; 
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#4b5563'"
                onmouseout="this.style.backgroundColor='#6b7280'"
              >👎 ${t('community.notHelpful')}</button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close any existing info window
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        
        // Open new info window and set it as current
        infoWindow.open(mapInstance, marker);
        setCurrentInfoWindow(infoWindow);
      });
      
      return marker;
    });

    setReportMarkers(newMarkers);
  };

  // Helper function for time ago with translations
  const getTimeAgo = (timestamp: Date): string => {
    const diffMs = Date.now() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return t('crime.today');
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return t('crime.dayAgo');
    return t('crime.daysAgo').replace('{days}', diffDays.toString());
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
      setSelectedReportType(null);
      setReportComment('');
      console.log('✅ Report submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      alert(t('error.reportSubmissionFailed'));
    }
  };

  // Calculate safe routes
  const calculateSafeRoutes = async () => {
    if (!directionsService || !map || !origin || !destination) {
      alert(t('error.enterBothLocations'));
      return;
    }

    setIsCalculatingRoutes(true);
    
    // Clear existing routes and crime markers
    routeOptions.forEach(option => option.renderer.setMap(null));
    setRouteOptions([]);
    crimeMarkers.forEach(marker => marker.setMap(null));
    setCrimeMarkers([]);

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
            // More accurate risk calculation - only count crimes very close to THIS specific route
            let riskPoints = 0;
            const processedCrimes = new Set<string>(); // Track processed crimes to avoid double counting
            
            if (crimeData.length > 0) {
              // Sample route points more densely for better accuracy
              const routePoints: google.maps.LatLng[] = [];
              route.overview_path.forEach((point, i) => {
                routePoints.push(point);
                // Add intermediate points for better coverage
                if (i < route.overview_path.length - 1) {
                  const nextPoint = route.overview_path[i + 1];
                  const midLat = (point.lat() + nextPoint.lat()) / 2;
                  const midLng = (point.lng() + nextPoint.lng()) / 2;
                  routePoints.push(new google.maps.LatLng(midLat, midLng));
                }
              });
              
              crimeData.forEach(crime => {
                const crimeId = crime.cmplnt_num;
                if (processedCrimes.has(crimeId)) return; // Skip if already counted
                
                const crimeLat = parseFloat(crime.latitude);
                const crimeLng = parseFloat(crime.longitude);
                const crimePos = new google.maps.LatLng(crimeLat, crimeLng);
                
                // Check if crime is within 100m of ANY point on this specific route (tighter radius)
                const isNearRoute = routePoints.some(point => {
                  const distance = google.maps.geometry.spherical.computeDistanceBetween(point, crimePos);
                  return distance < 100; // 100 meters - much tighter for accuracy
                });
                
                if (isNearRoute) {
                  processedCrimes.add(crimeId); // Mark as processed
                  riskPoints += crime.law_cat_cd === 'FELONY' ? 3 : 
                               crime.law_cat_cd === 'MISDEMEANOR' ? 2 : 1;
                }
              });
            }

            const duration = route.legs[0].duration?.value || 0;
            const safetyScore = Math.round(Math.max(20, 100 - riskPoints * 2));
            const efficiencyScore = Math.round(Math.max(20, 100 - (duration / 60))); // Penalty for longer routes
            const compositeScore = Math.round((safetyScore * 0.7) + (efficiencyScore * 0.3));

            console.log(`Route ${index + 1}: ${riskPoints} unique risks (100m radius), safety: ${safetyScore}, efficiency: ${efficiencyScore}, composite: ${compositeScore}`);

            return {
              route,
              renderer: null as any, // Will be set below
              safetyScore,
              efficiencyScore,
              compositeScore,
              riskPoints,
              recommendation: 'balanced' as RouteOption['recommendation'] // Will be determined after sorting
            };
          });

          // Sort by composite score and assign types
          const sortedRoutes = routes.sort((a, b) => b.compositeScore - a.compositeScore);
          
          sortedRoutes.forEach((routeOption, index) => {
            // Assign route types based on ranking
            if (index === 0) routeOption.recommendation = 'safest';
            else if (index === 1) routeOption.recommendation = 'balanced'; 
            else routeOption.recommendation = 'fastest';

            // Set colors and styles based on recommendation
            const colors = {
              safest: { color: '#22c55e', weight: 8, opacity: 1.0, zIndex: 1000 },
              balanced: { color: '#3b82f6', weight: 6, opacity: 0.8, zIndex: 500 },
              fastest: { color: '#f59e0b', weight: 6, opacity: 0.8, zIndex: 100 }
            };

            const style = colors[routeOption.recommendation];
            
            const renderer = new google.maps.DirectionsRenderer({
              map: map,
              polylineOptions: {
                strokeColor: style.color,
                strokeWeight: style.weight,
                strokeOpacity: style.opacity,
                zIndex: style.zIndex
              },
              suppressMarkers: index > 0,
              preserveViewport: index > 0
            });

            renderer.setDirections({ ...result, routes: [routeOption.route] });
            routeOption.renderer = renderer;
          });

          setRouteOptions(sortedRoutes);
          
          // Now show crime markers near the calculated routes
          if (map && crimeData.length > 0) {
            addCrimeMarkersNearRoutes(map, crimeData, sortedRoutes);
          }
        } else {
          alert(t('error.noRoutesFound'));
        }
        setIsCalculatingRoutes(false);
      });
    } catch (error) {
      console.error('Error calculating routes:', error);
      setIsCalculatingRoutes(false);
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
            // Lighter, more readable map styling
            { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#2d3748" }] },
            { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
            { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c3c3c3" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#2d3748" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f7fafc" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#a7c6ed" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e6f2ff" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0f4f8" }] }
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
            setSelectedReportType(null);
            setReportComment('');
          }
        });

        // Close info windows when clicking on empty map areas
        mapInstance.addListener('click', () => {
          if (currentInfoWindow) {
            currentInfoWindow.close();
            setCurrentInfoWindow(null);
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

  // Update report markers when data changes
  useEffect(() => {
    if (map && communityReports.length > 0) {
      addReportMarkers(map, communityReports);
    }
  }, [map, communityReports]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 ${className}`}>
        <div className="text-center text-slate-300">
          <p className="text-red-400 font-semibold">{t('error.mapLoadFailed')}</p>
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
            <p>{t('error.loadingMap')}</p>
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

            {/* Route Options */}
            {routeOptions.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-slate-200">{t('routes.title')}</h2>
                {routeOptions.map((routeOption, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    routeOption.recommendation === 'safest' 
                      ? 'bg-emerald-900/20 border-emerald-500' 
                      : routeOption.recommendation === 'balanced'
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-amber-900/20 border-amber-500'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-bold capitalize ${
                        routeOption.recommendation === 'safest' ? 'text-emerald-400' :
                        routeOption.recommendation === 'balanced' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {routeOption.recommendation === 'safest' && '⭐ '}
                        {t(`routes.${routeOption.recommendation}`)}
                      </h3>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-200">{routeOption.compositeScore}</span>
                        <p className="text-xs text-slate-400">{t('routes.score')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                      <div className="text-center">
                        <div className={`font-semibold ${
                          routeOption.safetyScore >= 80 ? 'text-emerald-400' :
                          routeOption.safetyScore >= 60 ? 'text-blue-400' : 'text-red-400'
                        }`}>{routeOption.safetyScore}</div>
                        <div className="text-slate-400">{t('routes.safety')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-slate-300">{routeOption.efficiencyScore}</div>
                        <div className="text-slate-400">{t('routes.speed')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-400">{routeOption.riskPoints}</div>
                        <div className="text-slate-400">{t('routes.risks')}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-300 mb-2">
                      {routeOption.route.legs[0].distance?.text} • {routeOption.route.legs[0].duration?.text}
                    </div>
                    
                    <button
                      onClick={() => {
                        const waypoints = routeOption.route.overview_path
                          .filter((_, i) => i % 15 === 0)
                          .slice(1, -1)
                          .map(point => `${point.lat()},${point.lng()}`)
                          .join('|');
                        
                        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking${waypoints ? `&waypoints=${waypoints}` : ''}`;
                        window.open(url, '_blank');
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                        routeOption.recommendation === 'safest'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : routeOption.recommendation === 'balanced'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {t('routes.openInMaps')}
                    </button>
                  </div>
                ))}
                
                {crimeData.length > 0 && crimeMarkers.length > 0 && (
                  <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-400">
                    {t('routes.analysisNote').replace('{count}', crimeMarkers.length.toString()).replace('{total}', crimeData.length.toString())}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Button - Moved higher to avoid bottom bar */}
      <button
        onClick={() => {
          setShowReportModal(true);
          setReportLocation({ lat: 40.8448, lng: -73.8648 }); // Default to Bronx center
          setSelectedReportType(null);
          setReportComment('');
        }}
        className="absolute bottom-24 right-6 z-20 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-full w-14 h-14 shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title={t('main.reportIssue')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>

      {/* Enhanced Report Modal with proper UI */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-600">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-600">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{t('report.title')}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {reportLocation ? 
                    t('report.locationLabel').replace('{lat}', reportLocation.lat.toFixed(4)).replace('{lng}', reportLocation.lng.toFixed(4)) :
                    t('report.clickToSetLocation')
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReportType(null);
                  setReportComment('');
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Instructions */}
            <div className="p-6 bg-blue-900/20 border-b border-slate-600">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-1">{t('report.howToReport')}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('report.instructions')}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Type Selection */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t('report.selectIssueType')}</h4>
              <div className="space-y-3">
                {(['dark', 'unsafe', 'loitering', 'harassment', 'other'] as const).map(type => {
                  const icons = {
                    dark: { icon: '💡', labelKey: 'community.poorLighting', color: 'bg-yellow-600', descriptionKey: 'report.poorLighting' },
                    unsafe: { icon: '⚠️', labelKey: 'community.safetyConcern', color: 'bg-red-600', descriptionKey: 'report.generalSafety' },
                    loitering: { icon: '👥', labelKey: 'community.suspiciousActivity', color: 'bg-orange-600', descriptionKey: 'report.suspiciousActivity' },
                    harassment: { icon: '🚫', labelKey: 'community.harassment', color: 'bg-purple-600', descriptionKey: 'report.harassment' },
                    other: { icon: '❓', labelKey: 'community.otherIssue', color: 'bg-gray-600', descriptionKey: 'report.other' }
                  };
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedReportType(type)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all flex items-center space-x-3 ${
                        selectedReportType === type 
                          ? `${icons[type].color} border-slate-400 bg-opacity-30` 
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{icons[type].icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{t(icons[type].labelKey)}</div>
                        <div className="text-xs text-slate-400 mt-1">{t(icons[type].descriptionKey)}</div>
                      </div>
                      {selectedReportType === type && (
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Comment Section */}
              {selectedReportType && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    {t('report.additionalDetailsLabel')}
                  </label>
                  <textarea
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder={t('report.instructions')}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-xs text-slate-400 mt-1 text-right">
                    {t('report.charactersRemaining').replace('{count}', reportComment.length.toString())}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {selectedReportType && (
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedReportType(null);
                      setReportComment('');
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-medium bg-slate-600 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {t('report.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedReportType) {
                        submitReport(selectedReportType, reportComment);
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white transition-all hover:shadow-lg"
                  >
                    {t('report.submitReport')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default GoogleMap; 