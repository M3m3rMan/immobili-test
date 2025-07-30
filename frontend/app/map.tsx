import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, StyleSheet, Pressable, TextInput, ScrollView, Animated, Alert, Platform, TouchableOpacity, Dimensions, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProfilePicture from '../components/ProfilePicture';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// Conditional imports to prevent native module errors on web
let Location: any = null;
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let MapViewDirections: any = null;

if (Platform.OS !== 'web') {
  Location = require('expo-location');
  try {
    const mapModule = require('react-native-maps');
    MapView = mapModule.default;
    Marker = mapModule.Marker;
    Callout = mapModule.Callout;
    MapViewDirections = require('react-native-maps-directions').default;
  } catch (error) {
    console.log('Maps not available on this platform');
  }
}

interface TheftReport {
  _id: string;
  raw: string;
  location: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  date: string;
}

interface SafetyZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'security' | 'parking' | 'emergency' | 'patrol';
  description: string;
}

interface SafeAlternative {
  latitude: number;
  longitude: number;
  theftCount: number;
  distanceFromDestination: number;
  safetyScore: number;
  name: string;
  address?: string;
  description?: string;
}

interface RouteAnalysis {
  safetyLevel: string;
  nearbyThefts: number;
  analysis: string;
  safeAlternatives: SafeAlternative[];
  theftReports: TheftReport[];
}

interface Destination {
  latitude: number;
  longitude: number;
  name: string;
}

const GOOGLE_MAPS_APIKEY = 'AIzaSyASv3U2e0Td2KUAjvnBii1Oj2CcxLCZdhc'; // Replace with your API key

// USC coordinates with better zoom for showing theft reports
const USC_COORDINATES = {
  latitude: 34.0224,
  longitude: -118.2851,
  latitudeDelta: 0.008, // Reduced for closer zoom
  longitudeDelta: 0.008, // Reduced for closer zoom
};

// Safety zones for secure scooter parking
const SAFETY_ZONES: SafetyZone[] = [
  // Main Security Facilities
  {
    id: 'usc-security',
    name: 'USC Department of Public Safety',
    latitude: 34.02107152583869,
    longitude: -118.29017304423343,
    type: 'security',
    description: 'USC Department of Public Safety - 24/7 monitored area with security presence. Safe zone for scooter parking.',
  },
  
  // Libraries with 24/7 Security and Access
  {
    id: 'leavey-library',
    name: 'Leavey Library (24/7 Security)',
    latitude: 34.0205,
    longitude: -118.2830,
    type: 'security',
    description: 'Thomas and Dorothy Leavey Library - 24/7 access with security presence and emergency assistance available.',
  },
  
  // Key Emergency Blue Light Phones (reduced from 8 to 3 strategic locations)
  {
    id: 'emergency-trousdale',
    name: 'Emergency Call Box - Trousdale',
    latitude: 34.0200,
    longitude: -118.2890,
    type: 'emergency',
    description: 'Blue light emergency phone with direct line to DPS. Push red button for immediate assistance.',
  },
  {
    id: 'emergency-figueroa',
    name: 'Emergency Call Box - Figueroa Gate',
    latitude: 34.0190,
    longitude: -118.2820,
    type: 'emergency',
    description: 'Emergency call box near main campus entrance. Direct connection to USC Department of Public Safety.',
  },
  {
    id: 'emergency-engineering',
    name: 'Emergency Call Box - Engineering Quad',
    latitude: 34.0225,
    longitude: -118.2890,
    type: 'emergency',
    description: 'Blue light emergency phone in Engineering Quad. 24/7 monitoring and response.',
  },
  
  {
    id: 'usc-village',
    name: 'USC Village (Residential Security)',
    latitude: 34.0250,
    longitude: -118.2900,
    type: 'security',
    description: 'USC Village residential area with 24/7 security officers, biometric access, and surveillance cameras.',
  },
  
  // Caruso Center
  {
    id: 'caruso-center',
    name: 'Our Savior Parish & USC Caruso Catholic Center',
    latitude: 34.0250846,
    longitude: -118.2834442,
    type: 'parking',
    description: 'Our Savior Parish & USC Caruso Catholic Center - Well-lit area with regular foot traffic. Recommended safe parking zone.',
  },
];

// Sample reports near USC
const SAMPLE_REPORTS: TheftReport[] = [
  {
    _id: '1',
    raw: 'Attempted theft of red electric scooter near USC Village. Suspect fled when approached by security. No injuries reported.',
    location: 'USC Village',
    latitude: 34.0251,
    longitude: -118.2831,
    title: 'Attempted E-scooter Theft',
    description: 'Suspect fled when approached',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    _id: '2',
    raw: 'Electric scooter stolen from Exposition Park area. Victim reported scooter missing from parking area.',
    location: 'Exposition Park',
    latitude: 34.0189,
    longitude: -118.2820,
    title: 'Electric Scooter Stolen',
    description: 'Scooter missing from parking area',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    _id: '3',
    raw: 'Attempted theft of e-scooter near USC Campus. Suspect fled when confronted.',
    location: 'USC Campus',
    latitude: 34.0224,
    longitude: -118.2851,
    title: 'Attempted E-Scooter Theft',
    description: 'Suspect fled when confronted',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    _id: '4',
    raw: 'Red electric scooter theft reported near USC North area. Lock was cut.',
    location: 'USC North',
    latitude: 34.0260,
    longitude: -118.2830,
    title: 'Red E-Scooter Theft',
    description: 'Lock was cut, scooter stolen',
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
  {
    _id: '5',
    raw: 'Blue scooter stolen from USC South parking area during evening hours.',
    location: 'USC South',
    latitude: 34.0180,
    longitude: -118.2880,
    title: 'Blue Scooter Theft',
    description: 'Stolen during evening hours',
    date: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
  },
  {
    _id: '6',
    raw: 'E-scooter theft incident at USC East. Scooter was secured but lock was broken.',
    location: 'USC East',
    latitude: 34.0230,
    longitude: -118.2810,
    title: 'E-Scooter Theft - Lock Broken',
    description: 'Secured scooter, lock was broken',
    date: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
  },
  {
    _id: '7',
    raw: 'White electric scooter reported stolen from USC West area near dormitories.',
    location: 'USC West',
    latitude: 34.0200,
    longitude: -118.2920,
    title: 'White E-Scooter Theft',
    description: 'Stolen near dormitories',
    date: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
  },
  {
    _id: '8',
    raw: 'Scooter theft attempt foiled by security at USC Central area.',
    location: 'USC Central',
    latitude: 34.0245,
    longitude: -118.2865,
    title: 'Theft Attempt Foiled',
    description: 'Security prevented theft',
    date: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
  },
  // Yellow markers - suspects got away, no investigation
  {
    _id: '9',
    raw: 'Scooter theft reported near USC Library. Suspect escaped on foot, no witnesses available for identification.',
    location: 'USC Library',
    latitude: 34.0215,
    longitude: -118.2835,
    title: 'Scooter Theft - Suspect Escaped',
    description: 'No witnesses, suspect got away',
    date: new Date(Date.now() - 777600000).toISOString(), // 9 days ago
  },
  {
    _id: '10',
    raw: 'Electric scooter stolen from USC parking structure. Security cameras malfunctioned, no leads.',
    location: 'USC Parking',
    latitude: 34.0240,
    longitude: -118.2840,
    title: 'E-Scooter Theft - No Leads',
    description: 'Camera malfunction, no investigation',
    date: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
  },
  {
    _id: '11',
    raw: 'Attempted scooter theft near USC Student Union. Suspect fled before security arrived, case closed.',
    location: 'USC Student Union',
    latitude: 34.0205,
    longitude: -118.2870,
    title: 'Attempted Theft - Case Closed',
    description: 'Suspect fled, insufficient evidence',
    date: new Date(Date.now() - 950400000).toISOString(), // 11 days ago
  },
  {
    _id: '12',
    raw: 'Scooter theft reported at USC Village Gate. Victim could not provide description, no investigation pursued.',
    location: 'USC Village Gate',
    latitude: 34.0255,
    longitude: -118.2825,
    title: 'Theft Report - No Description',
    description: 'Insufficient details for investigation',
    date: new Date(Date.now() - 1036800000).toISOString(), // 12 days ago
  },
  {
    _id: '13',
    raw: 'Electric scooter missing from USC Recreation Center area. Reported as theft but suspect unknown.',
    location: 'USC Recreation',
    latitude: 34.0195,
    longitude: -118.2845,
    title: 'Missing E-Scooter',
    description: 'Theft suspected, no suspect identified',
    date: new Date(Date.now() - 1123200000).toISOString(), // 13 days ago
  },
  {
    _id: '14',
    raw: 'Scooter theft attempt near USC Bookstore. Suspect escaped when student approached, no follow-up.',
    location: 'USC Bookstore',
    latitude: 34.0210,
    longitude: -118.2855,
    title: 'Theft Attempt - No Follow-up',
    description: 'Suspect escaped, case not pursued',
    date: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
  }
];

const MapScreen: React.FC = () => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [reports, setReports] = useState<TheftReport[]>(SAMPLE_REPORTS);
  const [safetyZones] = useState<SafetyZone[]>(SAFETY_ZONES);
  const [selectedReport, setSelectedReport] = useState<TheftReport | null>(null);
  const [selectedSafetyZone, setSelectedSafetyZone] = useState<SafetyZone | null>(null);
  const [selectedSafeAlternative, setSafeAlternative] = useState<SafeAlternative | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [initialRegion, setInitialRegion] = useState(USC_COORDINATES);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [safeAlternatives, setSafeAlternatives] = useState<SafeAlternative[]>([]);
  const [showSafeAlternatives, setShowSafeAlternatives] = useState(false);
  const [showRouteAnalysis, setShowRouteAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];
  
  // Add keyboard state management
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const searchContainerAnim = useRef(new Animated.Value(0)).current;
  
  // Bottom sheet expansion state
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded

  // Helper function to get marker icons
  const getMarkerIcon = (type: 'danger' | 'warning' | 'warning-alt' | 'safety' | 'alternative' | 'destination') => {
    switch (type) {
      case 'danger':
        return require('../assets/images/map/red_error.png');
      case 'warning':
        return require('../assets/images/map/yellow_error.png');
      case 'warning-alt':
        return require('../assets/images/map/red_error2.png'); // Different red icon for variety
      case 'safety':
        return require('../assets/images/map/clear-green-marker.png');
      case 'alternative':
        return require('../assets/images/map/clear-green-marker.png');
      case 'destination':
        // You can add a blue destination icon here if you have one
        return null; // Will use default blue pin
      default:
        return null;
    }
  };

  // Debug logging
  console.log('MapScreen render - Reports count:', reports.length, 'Safety zones:', safetyZones.length);

  // Helper function to determine report severity
  const getReportSeverity = (report: TheftReport) => {
    const title = report.title.toLowerCase();
    const description = report.description.toLowerCase();
    const raw = report.raw.toLowerCase();
    
    // Yellow markers: attempted thefts, suspects who got away, no investigation cases
    if (title.includes('attempted') || description.includes('attempted') || raw.includes('attempted') ||
        title.includes('foiled') || description.includes('foiled') || raw.includes('foiled') ||
        title.includes('prevented') || description.includes('prevented') || raw.includes('prevented') ||
        title.includes('escaped') || description.includes('escaped') || raw.includes('escaped') ||
        title.includes('got away') || description.includes('got away') || raw.includes('got away') ||
        title.includes('fled') || description.includes('fled') || raw.includes('fled') ||
        title.includes('no leads') || description.includes('no leads') || raw.includes('no leads') ||
        title.includes('no investigation') || description.includes('no investigation') || raw.includes('no investigation') ||
        title.includes('case closed') || description.includes('case closed') || raw.includes('case closed') ||
        title.includes('no follow-up') || description.includes('no follow-up') || raw.includes('no follow-up') ||
        title.includes('insufficient') || description.includes('insufficient') || raw.includes('insufficient') ||
        title.includes('no witnesses') || description.includes('no witnesses') || raw.includes('no witnesses') ||
        title.includes('no description') || description.includes('no description') || raw.includes('no description') ||
        title.includes('suspect unknown') || description.includes('suspect unknown') || raw.includes('suspect unknown') ||
        title.includes('missing') || description.includes('missing') || raw.includes('missing')) {
      return 'attempted';
    }
    
    // Red markers: completed thefts with evidence/investigation
    return 'completed';
  };

  useEffect(() => {
    // Request location permissions and get current location
    const getLocationPermission = async () => {
      // Skip location services on web to avoid ExpoLocation native module error
      if (Platform.OS === 'web') {
        setUserLocation(USC_COORDINATES);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show your position on the map.');
          setUserLocation(USC_COORDINATES);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(currentLocation);
        console.log('User location:', currentLocation);
        
        // Show a toast notification about the POI feature
      } catch (error) {
        console.log('Error getting location:', error);
        Alert.alert('Location Error', 'Could not get your current location. Using USC as default.');
        setUserLocation(USC_COORDINATES);
      }
    };

    getLocationPermission();

    // Fetch reports from backend - with immediate fallback
    const fetchReports = async () => {
      // First, ensure we always have sample data visible
      console.log('Setting initial sample reports...', SAMPLE_REPORTS.length, 'reports');
      setReports(SAMPLE_REPORTS);
      
      try {
        console.log('Fetching reports from backend...');
        const res = await fetch('https://immobili-backend-production.up.railway.app/api/scooter-reports');
        const data = await res.json();
        console.log('Backend response:', data);
        
        if (data.reports && data.reports.length > 0) {
          // Combine backend reports with sample data to ensure we always have visible markers
          const combinedReports = [...SAMPLE_REPORTS, ...data.reports];
          setReports(combinedReports);
          console.log(`Loaded ${data.reports.length} reports from backend, total: ${combinedReports.length}`);
        } else {
          console.log('No reports from backend, keeping sample data');
          // Ensure sample data is set again
          setReports(SAMPLE_REPORTS);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        console.log('Using sample data due to backend error');
        // Ensure sample data is set again
        setReports(SAMPLE_REPORTS);
      }
    };

    fetchReports();

    // Keyboard event listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
        
        // Animate the search container up
        Animated.timing(searchContainerAnim, {
          toValue: -event.endCoordinates.height + 34, // 34 is the safe area bottom padding
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        
        // Animate the search container back down
        Animated.timing(searchContainerAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
      cleanup(); // Clean up timeouts and animations
    };
  }, []);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const [isMarkerPressed, setIsMarkerPressed] = useState(false);
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastClickTime = useRef<number>(0);
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  // Cleanup function for timeouts and animations
  const cleanup = () => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    // Stop all animations
    animationRefs.current.forEach(animation => animation.stop());
    animationRefs.current = [];
  };

  // Add timeout with tracking
  const addTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      // Remove from tracking array
      timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
    }, delay);
    timeoutRefs.current.push(timeout);
    return timeout;
  };

  // Add animation with tracking
  const addAnimation = (animation: Animated.CompositeAnimation) => {
    animationRefs.current.push(animation);
    return animation;
  };

  // Debounce function for rapid clicks
  const debounceClick = (callback: () => void, delay: number = 300) => {
    const now = Date.now();
    if (now - lastClickTime.current < delay) {
      console.log('Click debounced - too rapid');
      return false;
    }
    lastClickTime.current = now;
    callback();
    return true;
  };

  // Bottom sheet pan gesture handler
  const onPanGestureEvent = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    // Only handle upward gestures (negative translationY) to expand
    // and downward gestures (positive translationY) to collapse
    if (!isBottomSheetExpanded && translationY < -50) {
      // Expand the bottom sheet
      expandBottomSheet();
    } else if (isBottomSheetExpanded && translationY > 50) {
      // Collapse the bottom sheet
      collapseBottomSheet();
    }
  };

  const expandBottomSheet = () => {
    setIsBottomSheetExpanded(true);
    const animation = Animated.timing(bottomSheetAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    });
    addAnimation(animation);
    animation.start();
  };

  const collapseBottomSheet = () => {
    setIsBottomSheetExpanded(false);
    const animation = Animated.timing(bottomSheetAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    });
    addAnimation(animation);
    animation.start();
  };

  const toggleBottomSheet = () => {
    if (isBottomSheetExpanded) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  };

  const handleMarkerPress = (report: TheftReport) => {
    if (!debounceClick(() => {}, 200)) return; // Debounce rapid clicks
    
    setIsMarkerPressed(true);
    setSelectedReport(report);
    setSelectedSafetyZone(null);
    setShowDetails(true);
    
    const animation = Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    addAnimation(animation);
    animation.start();
    
    // Reset the flag after a short delay using tracked timeout
    addTimeout(() => setIsMarkerPressed(false), 100);
  };

  const handleSafetyZonePress = (zone: SafetyZone) => {
    if (!debounceClick(() => {}, 200)) return; // Debounce rapid clicks
    
    setIsMarkerPressed(true);
    setSelectedSafetyZone(zone);
    setSelectedReport(null);
    setShowDetails(true);
    
    const animation = Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    addAnimation(animation);
    animation.start();
    
    // Reset the flag after a short delay using tracked timeout
    addTimeout(() => setIsMarkerPressed(false), 100);
  };

  const handleSafeAlternativePress = (alternative: SafeAlternative) => {
    if (!debounceClick(() => {}, 200)) return; // Debounce rapid clicks
    
    setIsMarkerPressed(true);
    
    // Show confirmation dialog to replace current destination
    Alert.alert(
      'Use Safe Alternative',
      `Would you like to navigate to ${alternative.name} instead? This is a safer parking option.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Just show details without changing destination
            setSafeAlternative(alternative);
            setSelectedReport(null);
            setSelectedSafetyZone(null);
            setShowDetails(true);
            const animation = Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            });
            addAnimation(animation);
            animation.start();
          }
        },
        {
          text: 'Navigate Here',
          onPress: async () => {
            // Prevent multiple simultaneous operations
            if (isProcessingClick) return;
            setIsProcessingClick(true);
            
            // Replace current destination with the safe alternative
            setIsAnalyzing(true);
            
            try {
              const newDestination: Destination = {
                latitude: alternative.latitude,
                longitude: alternative.longitude,
                name: alternative.name
              };
              
              // Clear current route and alternatives
              setDestination(null);
              setShowDirections(false);
              setSafeAlternatives([]);
              setShowRouteAnalysis(false);
              
              // Set new destination
              setDestinationInput(alternative.name);
              setDestination(newDestination);
              setShowDirections(true);
              
              // Analyze the new route
              await analyzeRoute(newDestination);
              
              console.log(`Switched to safe alternative: ${alternative.name}`);
            } catch (error) {
              console.error('Error switching to safe alternative:', error);
              Alert.alert('Error', 'Failed to set new destination. Please try again.');
              setIsAnalyzing(false);
            } finally {
              setIsProcessingClick(false);
            }
          }
        }
      ]
    );
    
    // Reset the flag after a short delay using tracked timeout
    addTimeout(() => setIsMarkerPressed(false), 100);
  };

  const handleCloseDetails = () => {
    const animation = Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    });
    addAnimation(animation);
    animation.start(() => {
      setShowDetails(false);
      setSelectedReport(null);
      setSelectedSafetyZone(null);
      setSafeAlternative(null);
    });
  };

  const handlePoiClick = async (event: any) => {
    // Debounce rapid clicks and prevent multiple simultaneous operations
    if (!debounceClick(() => {}, 300) || isProcessingClick) {
      console.log('POI click ignored - too rapid or already processing');
      return;
    }
    
    const { coordinate, name, placeId } = event.nativeEvent;
    
    console.log('POI clicked:', { name, coordinate, placeId });
    
    // Show a confirmation alert with the POI name
    Alert.alert(
      'Set Destination',
      `Would you like to navigate to ${name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            // Prevent multiple simultaneous operations
            if (isProcessingClick) return;
            setIsProcessingClick(true);
            
            setIsAnalyzing(true);
            
            try {
              const destination: Destination = {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                name: name || 'Selected Location'
              };
              
              // Update the destination input to show the selected POI
              setDestinationInput(name || 'Selected Location');
              setDestination(destination);
              setShowDirections(true);
              
              // Analyze the route
              await analyzeRoute(destination);
              
              console.log(`Set destination to POI: ${name} at (${coordinate.latitude}, ${coordinate.longitude})`);
            } catch (error) {
              console.error('Error setting POI destination:', error);
              Alert.alert('Error', 'Failed to set destination. Please try again.');
              setIsAnalyzing(false);
            } finally {
              setIsProcessingClick(false);
            }
          },
        },
      ]
    );
  };

  // Helper function to calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Function to check safety level based on proximity to safety zones
  const getSafetyLevel = (latitude: number, longitude: number): string => {
    const SAFE_DISTANCE = 100; // 100 meters
    const LOW_RISK_DISTANCE = 200; // 200 meters
    
    for (const zone of safetyZones) {
      const distance = calculateDistance(latitude, longitude, zone.latitude, zone.longitude);
      
      if (distance <= SAFE_DISTANCE) {
        return 'Safe';
      } else if (distance <= LOW_RISK_DISTANCE) {
        return 'Low Risk';
      }
    }
    
    return ''; // No safety level if not near any safety zones
  };

  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    // Debounce rapid clicks and prevent multiple simultaneous operations
    if (!debounceClick(() => {}, 300) || isProcessingClick) {
      console.log('Map press ignored - too rapid or already processing');
      return;
    }
    
    setIsProcessingClick(true);
    console.log('Map tapped at:', coordinate);
    
    // Clear any existing route first
    clearRoute();
    
    try {
      // Use reverse geocoding to get a readable location name
      const reverseGeocode = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const geocodeData = await reverseGeocode.json();
      
      let locationName = 'Selected Location';
       if (geocodeData.results && geocodeData.results.length > 0) {
         // Try to get a business name or point of interest
         const businessResult = geocodeData.results.find((r: any) => 
           r.types.includes('establishment') || 
           r.types.includes('point_of_interest') ||
           r.types.includes('store')
         );
         
         // Get the address result (usually the first one)
         const addressResult = geocodeData.results[0];
         
         if (businessResult && businessResult.name) {
           // If we have a business name, combine it with the address
           const businessName = businessResult.name;
           const address = addressResult.formatted_address || businessResult.formatted_address;
           
           // Extract street address (remove city, state, zip)
           const streetAddress = address.split(',')[0];
           
           locationName = `${streetAddress} (Also known as: ${businessName})`;
         } else {
           // Just use the formatted address
           locationName = addressResult.formatted_address || 'Selected Location';
         }
       }
      
      // Check safety level based on proximity to safety zones
      const safetyLevel = getSafetyLevel(coordinate.latitude, coordinate.longitude);
      if (safetyLevel) {
        locationName = `${locationName} [${safetyLevel}]`;
      }
      
      // Directly set the destination without confirmation
      setIsAnalyzing(true);
      
      try {
        const destination: Destination = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          name: locationName
        };
        
        // Update the destination input to show the selected location
        setDestinationInput(locationName);
        setDestination(destination);
        setShowDirections(true);
        
        // Analyze the route
        await analyzeRoute(destination);
        
        console.log(`Set destination to: ${locationName} at (${coordinate.latitude}, ${coordinate.longitude})`);
      } catch (error) {
        console.error('Error setting map destination:', error);
        Alert.alert('Error', 'Failed to set destination. Please try again.');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      // Fallback without geocoding - directly set destination
      setIsAnalyzing(true);
      
      // Check safety level for fallback case
      let fallbackLocationName = 'Selected Location';
      const safetyLevel = getSafetyLevel(coordinate.latitude, coordinate.longitude);
      if (safetyLevel) {
        fallbackLocationName = `Selected Location [${safetyLevel}]`;
      }
      
      try {
        const destination: Destination = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          name: fallbackLocationName
        };
        
        setDestinationInput(fallbackLocationName);
        setDestination(destination);
        setShowDirections(true);
        
        await analyzeRoute(destination);
        
        console.log(`Set destination to selected location at (${coordinate.latitude}, ${coordinate.longitude})`);
      } catch (error) {
        console.error('Error setting destination:', error);
        Alert.alert('Error', 'Failed to set destination. Please try again.');
        setIsAnalyzing(false);
      }
    } finally {
      setIsProcessingClick(false);
    }
  };

  const handleSetDestination = async () => {
    if (!destinationInput.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Use Google Places API to get accurate coordinates
      const destination = await geocodeAddress(destinationInput);
      
      if (!destination) {
        Alert.alert('Error', 'Could not find the specified location. Please try a different address.');
        setIsAnalyzing(false);
        return;
      }

      console.log(`Found destination: ${destination.name} at (${destination.latitude}, ${destination.longitude})`);
      
      setDestination(destination);
      setShowDirections(true);
      
      // Analyze the route with accurate coordinates
      await analyzeRoute(destination);
    } catch (error) {
      console.error('Error setting destination:', error);
      Alert.alert('Error', 'Failed to set destination. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Add this function to use Google Places API for geocoding
  const geocodeAddress = async (address: string): Promise<Destination | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_APIKEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          name: result.formatted_address
        };
      } else {
        console.error('Geocoding failed:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const analyzeRoute = async (dest: Destination) => {
    if (!userLocation) {
      Alert.alert('Error', 'User location not available');
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('https://immobili-backend-production.up.railway.app/api/analyze-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startLat: userLocation.latitude,
          startLng: userLocation.longitude,
          endLat: dest.latitude,
          endLng: dest.longitude,
          destinationName: dest.name
        }),
      });

      if (response.ok) {
        const analysis: RouteAnalysis = await response.json();
        setRouteAnalysis(analysis);
        setSafeAlternatives(analysis.safeAlternatives);
        setShowRouteAnalysis(true);
      } else {
        Alert.alert('Error', 'Failed to analyze route');
      }
    } catch (error) {
      console.error('Route analysis error:', error);
      Alert.alert('Error', 'Failed to analyze route');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearRoute = () => {
    setDestination(null);
    setShowDirections(false);
    setRouteAnalysis(null);
    setSafeAlternatives([]);
    setShowSafeAlternatives(false);
    setShowRouteAnalysis(false);
    setDestinationInput('');
    setIsAnalyzing(false);
  };

  // MarkdownText component for rendering formatted text
const MarkdownText: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<View key={`space-${index}`} style={{ height: 8 }} />);
        return;
      }
      
      // Headers
      if (trimmedLine.startsWith('## ')) {
        elements.push(
          <Text key={index} style={[styles.markdownH2, style]}>
            {trimmedLine.substring(3)}
          </Text>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <Text key={index} style={[styles.markdownH3, style]}>
            {trimmedLine.substring(4)}
          </Text>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          elements.push(
            <View key={index} style={styles.markdownBulletContainer}>
              <Text style={styles.markdownNumber}>{match[1]}.</Text>
              <Text style={[styles.markdownBulletText, style]}>
                {renderInlineMarkdown(match[2])}
              </Text>
            </View>
          );
        }
      }
      // Bullet points
      else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
        elements.push(
          <View key={index} style={styles.markdownBulletContainer}>
            <Text style={styles.markdownBullet}>•</Text>
            <Text style={[styles.markdownBulletText, style]}>
              {renderInlineMarkdown(trimmedLine.substring(2))}
            </Text>
          </View>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <Text key={index} style={[styles.markdownParagraph, style]}>
            {renderInlineMarkdown(trimmedLine)}
          </Text>
        );
      }
    });
    
    return elements;
  };
  
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.markdownBold}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };
  
  return <View>{renderMarkdown(text)}</View>;
};

const getSafetyColor = (safetyLevel: string) => {
    switch (safetyLevel) {
      case 'Safe': return '#4CAF50';
      case 'Moderate Risk': return '#FF9800';
      case 'High Risk': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>IMMOBILI</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.push('/report')}
          >
            <Ionicons name="warning" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => router.push('/community')}
          >
            <Ionicons name="people" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <ProfilePicture size={40} editable={false} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main map view with dynamic location and dark mode */}
      <MapView
        ref={mapRef}
        style={styles.mapView}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        mapType="mutedStandard"
        userInterfaceStyle="dark"
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        zoomTapEnabled={true}
        zoomControlEnabled={true}
        moveOnMarkerPress={false}
        showsPointsOfInterest={true}
        onPoiClick={handlePoiClick}
        onPress={(event: any) => {
          // Dismiss keyboard when tapping on map
          Keyboard.dismiss();
          
          // If a marker was just pressed, don't handle map press
          if (isMarkerPressed) {
            return;
          }
          
          // Dismiss bottom panel if it's showing
          if (showDetails) {
            handleCloseDetails();
            return;
          }
          
          // Handle map tap for location selection only if not a marker press
          const coordinate = event.nativeEvent.coordinate;
          if (coordinate) {
            handleMapPress(coordinate);
          }
        }}
      >
        {/* Test marker to verify markers are working */}

        {/* Custom warning markers for danger zones (theft reports) */}
        {reports.map((report, index) => {
          // Ensure we have valid coordinates before rendering
          if (!report.latitude || !report.longitude || 
              isNaN(report.latitude) || isNaN(report.longitude)) {
            console.warn(`Invalid coordinates for report ${index}:`, report);
            return null;
          }
          
          // Determine marker type based on report severity
          const severity = getReportSeverity(report);
          let markerType: 'danger' | 'warning' | 'warning-alt' = severity === 'attempted' ? 'warning' : 'danger';
          
          // Add variety to warning markers - use alternate warning icon for some markers
          if (markerType === 'warning' && index % 3 === 0) {
            markerType = 'warning-alt';
          }
          
          // Determine fallback pin color
          const fallbackColor = markerType === 'danger' ? 'red' : 
                               markerType === 'warning-alt' ? 'red' : 'orange';
          
          console.log(`Rendering ${markerType} zone ${index} at:`, report.latitude, report.longitude, 'title:', report.title);
          return (
            <Marker
              key={`report-${report._id || `sample-${index}`}`}
              coordinate={{
                latitude: Number(report.latitude),
                longitude: Number(report.longitude),
              }}
              onPress={() => handleMarkerPress(report)}
              image={getMarkerIcon(markerType)}
              pinColor={fallbackColor} // Fallback if no custom image
              anchor={{ x: 0.5, y: 1 }} // Ensure proper positioning
              centerOffset={{ x: 0, y: -20 }} // Offset for better visibility
              tracksViewChanges={false} // Prevent unnecessary re-renders
            />
          );
        })}

        {/* Green markers for safety zones */}
        {safetyZones.map((zone, index) => {
          console.log(`Rendering safety zone ${index} at:`, zone.latitude, zone.longitude);
          return (
            <Marker
              key={`safety-${zone.id}`}
              coordinate={{
                latitude: Number(zone.latitude),
                longitude: Number(zone.longitude),
              }}
              onPress={() => handleSafetyZonePress(zone)}
              image={getMarkerIcon('safety')}
              pinColor="green" // Fallback if no custom image
              tracksViewChanges={false} // Prevent unnecessary re-renders
            />
          );
        })}

        {/* Green markers for safe alternatives - only show when explicitly enabled */}
        {showSafeAlternatives && safeAlternatives.map((alternative, index) => (
          <Marker
            key={`alternative-${alternative.name}-${index}`}
            coordinate={{
              latitude: alternative.latitude,
              longitude: alternative.longitude,
            }}
            onPress={() => handleSafeAlternativePress(alternative)}
            image={getMarkerIcon('alternative')}
            pinColor="green" // Fallback if no custom image
            tracksViewChanges={false} // Prevent unnecessary re-renders
          />
        ))}

        {/* Blue destination marker */}
        {destination && (
          <Marker
            key="destination"
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            onPress={() => {
              setIsMarkerPressed(true);
              // Just prevent route analysis, don't show details for destination marker
              addTimeout(() => setIsMarkerPressed(false), 100);
            }}
            image={getMarkerIcon('destination')}
            pinColor="blue" // Fallback if no custom image
            tracksViewChanges={false} // Prevent unnecessary re-renders
          />
        )}

        {/* Directions */}
        {showDirections && userLocation && destination && (
          <MapViewDirections
            origin={userLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={10}
            strokeColor="#007AFF"
            optimizeWaypoints={true}
            onStart={(params: any) => {
              console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
            }}
            onReady={(result: any) => {
              console.log(`Distance: ${result.distance} km`);
              console.log(`Duration: ${result.duration} min.`);
            }}
            onError={(errorMessage: any) => {
              console.log('Directions error:', errorMessage);
            }}
          />
        )}
      </MapView>

      {/* Bottom container with route planning and search - now animated and expandable */}
      {!showDetails && (
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanGestureEvent}
        >
          <Animated.View 
            style={[
              styles.searchContainer,
              {
                transform: [{ translateY: searchContainerAnim }],
                // Dynamic height based on expansion state
                maxHeight: isBottomSheetExpanded 
                  ? height * 0.8 
                  : (isKeyboardVisible ? height * 0.4 : height * 0.5),
              }
            ]}
          >
            <TouchableOpacity onPress={toggleBottomSheet} style={styles.searchHandleContainer}>
               <View style={styles.searchHandle} />
             </TouchableOpacity>
            
            {/* Route Planning Controls */}
            <View style={styles.routeInputContainer}>
              <TextInput
                style={styles.routeInput}
                placeholder="Enter destination..."
                placeholderTextColor="#8E8E93"
                value={destinationInput}
                onChangeText={setDestinationInput}
                onFocus={() => {
                  // Optional: Add any additional focus behavior here
                  console.log('Input focused');
                }}
                onBlur={() => {
                  // Optional: Add any additional blur behavior here
                  console.log('Input blurred');
                }}
                returnKeyType="search"
                onSubmitEditing={handleSetDestination}
              />
              <TouchableOpacity 
                style={styles.routeButton} 
                onPress={handleSetDestination}
                disabled={isAnalyzing}
              >
                <Text style={styles.routeButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'GO'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showDirections && (
              <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                <Text style={styles.clearButtonText}>Clear Route</Text>
              </TouchableOpacity>
            )}

            {/* Route Analysis Results */}
            {showRouteAnalysis && routeAnalysis && (
              <Animated.View 
                style={[
                  styles.routeAnalysisResults,
                  {
                    opacity: bottomSheetAnim,
                    maxHeight: bottomSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, height * 0.6],
                    }),
                  }
                ]}
              >
                <View style={styles.routeAnalysisHeader}>
                  <Text style={styles.routeAnalysisTitle}>Route Safety Analysis</Text>
                  <TouchableOpacity onPress={() => setShowRouteAnalysis(false)}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.routeAnalysisScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.safetyLevelContainer}>
                    <Text style={styles.safetyLevelLabel}>Safety Level:</Text>
                    <Text style={[styles.safetyLevelValue, { color: getSafetyColor(routeAnalysis.safetyLevel) }]}>
                      {routeAnalysis.safetyLevel}
                    </Text>
                  </View>
                  
                  <MarkdownText text={routeAnalysis.analysis} />
                  
                  <Text style={styles.nearbyTheftsText}>
                    Nearby theft reports: {routeAnalysis.nearbyThefts}
                  </Text>
                  
                  {routeAnalysis.safeAlternatives.length > 0 && (
                    <View style={styles.alternativesSection}>
                      <View style={styles.alternativesHeader}>
                        <Text style={styles.alternativesTitle}>Safer Alternatives ({routeAnalysis.safeAlternatives.length})</Text>
                        <TouchableOpacity 
                          style={styles.showAlternativesButton}
                          onPress={() => setShowSafeAlternatives(!showSafeAlternatives)}
                        >
                          <Text style={styles.showAlternativesText}>
                            {showSafeAlternatives ? 'Hide on Map' : 'Show on Map'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {routeAnalysis.safeAlternatives.map((alt, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.alternativeItem}
                          onPress={() => handleSafeAlternativePress(alt)}
                        >
                          <Text style={styles.alternativeName}>{alt.name}</Text>
                          <Text style={styles.alternativeScore}>Safety: {alt.safetyScore}/10</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            )}
          </Animated.View>
        </PanGestureHandler>
      )}

      {/* Report details modal - Citizen app style */}
      {showDetails && selectedReport && (
        <Animated.View 
          style={[
            styles.detailsModal,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.modalHandle} />
          
          {/* Quick summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertEmoji}>🚨</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>{selectedReport.title}</Text>
              <Text style={styles.summaryLocation}>{selectedReport.location}</Text>
              <Text style={styles.summaryTime}>
                {new Date(selectedReport.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleCloseDetails}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable detailed content */}
          <ScrollView 
            style={styles.detailsScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailsContent}>
              <Text style={styles.detailsTitle}>Incident Details</Text>
              <Text style={styles.detailsDescription}>{selectedReport.description}</Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>📋</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <Text style={styles.statusValue}>Open</Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>🚔</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Police Response</Text>
                    <Text style={styles.statusValueGreen}>Report filed</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.fullReportSection}>
                <Text style={styles.fullReportTitle}>Full Report</Text>
                <Text style={styles.fullReportText}>{selectedReport.raw}</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Safety zone details modal */}
      {showDetails && selectedSafetyZone && (
        <Animated.View 
          style={[
            styles.detailsModal,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.modalHandle} />
          
          {/* Quick summary card for safety zone */}
          <View style={styles.summaryCard}>
            <View style={styles.safetyIcon}>
              <Text style={styles.safetyEmoji}>🛡️</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>{selectedSafetyZone.name}</Text>
              <Text style={styles.summaryLocation}>Safe Parking Zone</Text>
              <Text style={styles.summaryTime}>
                {selectedSafetyZone.type === 'security' ? '24/7 Security' : 'Recommended Area'}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleCloseDetails}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable detailed content */}
          <ScrollView 
            style={styles.detailsScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailsContent}>
              <Text style={styles.detailsTitle}>Safety Zone Information</Text>
              <Text style={styles.detailsDescription}>{selectedSafetyZone.description}</Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>🏢</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Zone Type</Text>
                    <Text style={styles.statusValueGreen}>
                      {selectedSafetyZone.type === 'security' ? 'Security Monitored' : 'Safe Parking'}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>⭐</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Recommendation</Text>
                    <Text style={styles.statusValueGreen}>Highly Recommended</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.fullReportSection}>
                <Text style={styles.fullReportTitle}>Safety Tips</Text>
                <Text style={styles.fullReportText}>
                  • Park in well-lit areas{'\n'}
                  • Use proper locking mechanisms{'\n'}
                  • Avoid leaving valuables visible{'\n'}
                  • Report suspicious activity to security
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Safe alternative details modal */}
      {showDetails && selectedSafeAlternative && (
        <Animated.View 
          style={[
            styles.detailsModal,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.modalHandle} />
          
          {/* Quick summary card for safe alternative */}
          <View style={styles.summaryCard}>
            <View style={styles.safetyIcon}>
              <Text style={styles.safetyEmoji}>🅿️</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>{selectedSafeAlternative.name}</Text>
              <Text style={styles.summaryLocation}>{selectedSafeAlternative.address}</Text>
              <Text style={styles.summaryTime}>
                Distance from destination: {(selectedSafeAlternative.distanceFromDestination * 1000).toFixed(0)}m
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={handleCloseDetails}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* Scrollable detailed content */}
          <ScrollView 
            style={styles.detailsScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailsContent}>
              <Text style={styles.detailsDescription}>
                This location has been identified as a safer alternative for parking your scooter based on historical theft data and proximity to your destination.
              </Text>
              
              {/* Enhanced status container with better visual appeal */}
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>🛡️</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Safety Score</Text>
                    <Text style={styles.statusValueGreen}>
                      {selectedSafeAlternative.safetyScore}/10
                    </Text>
                  </View>
                </View>
                <View style={styles.statusItem}>
                  <View style={styles.statusIconContainer}>
                    <Text style={styles.statusIcon}>⚠️</Text>
                  </View>
                  <View style={styles.statusContent}>
                    <Text style={styles.statusLabel}>Nearby Thefts</Text>
                    <Text style={styles.statusValueGreen}>
                      {selectedSafeAlternative.theftCount}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Enhanced safety tips section */}
              <View style={styles.fullReportSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>💡</Text>
                  <Text style={styles.fullReportTitle}>Safety Tips</Text>
                </View>
                <Text style={styles.fullReportText}>
                  • Park in well-lit areas{'\n'}
                  • Use proper locking mechanisms{'\n'}
                  • Avoid leaving valuables visible{'\n'}
                  • Consider the walking distance to your destination
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  appTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  backArrow: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Search container at bottom
  searchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingHorizontal: 16,
    maxHeight: height * 0.7,
  },
  searchHandleContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#48484A',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  micIcon: {
    fontSize: 18,
    marginLeft: 8,
  },

  // Modal styles - Citizen app inspired
  detailsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#48484A',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertEmoji: {
    fontSize: 24,
  },
  safetyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  safetyEmoji: {
    fontSize: 24,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLocation: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 2,
  },
  summaryTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#8E8E93',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 20,
  },
  detailsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsDescription: {
    color: '#E5E5E7',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 12,
  },
  statusItem: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  statusLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusValue: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  statusValueGreen: {
    color: '#30D158',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusValueRed: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom sheet route analysis styles
  bottomSheetContent: {
    maxHeight: 300,
  },
  loadingContainer: {
    paddingBottom: 16,
  },
  loadingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  loadingEmoji: {
    fontSize: 24,
  },
  loadingDetails: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  routeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  routeEmoji: {
    fontSize: 24,
  },
  resultsScroll: {
    maxHeight: 280,
  },
  analysisContent: {
    padding: 20,
  },
  routeButtonDisabled: {
    backgroundColor: '#48484A',
    opacity: 0.6,
  },
  fullReportSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  fullReportTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullReportText: {
    color: '#E5E5E7',
    fontSize: 14,
    lineHeight: 22,
  },
  
  // Route planning styles
  routeInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  routeInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    fontSize: 16,
  },
  routeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 60,
  },
  routeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Route analysis styles
  routeAnalysisResults: {
    backgroundColor: 'rgba(44, 44, 46, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: height * 0.3,
  },
  routeAnalysisScroll: {
    maxHeight: height * 0.2,
  },
  routeAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeAnalysisTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetyLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyLevelLabel: {
    color: '#8E8E93',
    fontSize: 16,
    marginRight: 8,
  },
  safetyLevelValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  analysisText: {
    color: '#E5E5E7',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  nearbyTheftsText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  alternativesSection: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
  },
  alternativesTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alternativeItem: {
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#30D158',
  },
  alternativeName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeScore: {
    color: '#30D158',
    fontSize: 12,
    marginTop: 2,
  },
  
  // Markdown styles
  markdownH2: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  markdownH3: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  markdownBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  markdownParagraph: {
    color: '#E5E5E7',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  markdownBulletContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  markdownBullet: {
    color: '#30D158',
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
  },
  markdownNumber: {
    color: '#30D158',
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
    minWidth: 20,
  },
  markdownBulletText: {
    color: '#E5E5E7',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  
  // Enhanced route analysis styles
  safetyBadgeContainer: {
    marginBottom: 16,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  safetyBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  safetyBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analysisContainer: {
    marginBottom: 16,
  },
  theftSummaryContainer: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  theftSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  theftSummaryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  theftSummaryTitle: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  theftSummaryText: {
    color: '#E5E5E7',
    fontSize: 13,
    lineHeight: 18,
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  showAlternativesButton: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30D158',
  },
  showAlternativesText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '600',
  },
  alternativesIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  alternativeScoreLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginRight: 4,
  },
  
  addressSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  addressLabel: {
    color: '#30D158',
    fontSize: 16,
    fontWeight: '600',
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  descriptionText: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  distanceIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  distanceText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Enhanced status styles
  statusIconContainer: {
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusContent: {
    alignItems: 'center',
  },
  
  // Enhanced section header styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  
  // Callout styles for safe alternatives
  calloutContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  calloutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutSubtitle: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  calloutDistance: {
    color: '#8E8E93',
    fontSize: 11,
  },
});

export default MapScreen;
