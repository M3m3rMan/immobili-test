import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, StyleSheet, Pressable, TextInput, ScrollView, Animated, Alert, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Conditional import to prevent native module errors on web
let Location: any = null;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
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
  type: 'security' | 'parking';
  description: string;
}

interface SafeAlternative {
  latitude: number;
  longitude: number;
  theftCount: number;
  distanceFromDestination: number;
  safetyScore: number;
  name: string;
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

const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your API key

// USC coordinates
const USC_COORDINATES = {
  latitude: 34.0224,
  longitude: -118.2851,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Safety zones for secure scooter parking
const SAFETY_ZONES: SafetyZone[] = [
  {
    id: 'usc-security',
    name: 'USC Department of Public Safety',
    latitude: 34.0224,
    longitude: -118.2851,
    type: 'security',
    description: 'USC Department of Public Safety - 24/7 monitored area with security presence. Safe zone for scooter parking.',
  },
  {
    id: 'caruso-center',
    name: 'Our Savior Parish & USC Caruso Catholic Center',
    latitude: 34.0198,
    longitude: -118.2889,
    type: 'parking',
    description: 'Our Savior Parish & USC Caruso Catholic Center - Well-lit area with regular foot traffic. Recommended safe parking zone.',
  },
];

// Sample reports near USC
const SAMPLE_REPORTS: TheftReport[] = [
  {
    _id: '2',
    raw: 'Attempted theft of red electric scooter near USC Village. Suspect fled when approached by security. No injuries reported.',
    location: 'USC Village',
    latitude: 34.0251,
    longitude: -118.2831,
    title: 'Stolen E-scooter Reported, Bird scooter theft near library',
    description: 'Suspect fled when approached',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

const MapScreen: React.FC = () => {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [reports, setReports] = useState<TheftReport[]>(SAMPLE_REPORTS);
  const [safetyZones] = useState<SafetyZone[]>(SAFETY_ZONES);
  const [selectedReport, setSelectedReport] = useState<TheftReport | null>(null);
  const [selectedSafetyZone, setSelectedSafetyZone] = useState<SafetyZone | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [initialRegion, setInitialRegion] = useState(USC_COORDINATES);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [safeAlternatives, setSafeAlternatives] = useState<SafeAlternative[]>([]);
  const [showRouteAnalysis, setShowRouteAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    // Request location permissions and get current location
    const getLocationPermission = async () => {
      // Skip location services on web to avoid ExpoLocation native module error
      if (Platform.OS === 'web' || !Location) {
        console.log('Location services not available on web, using default USC coordinates');
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
      } catch (error) {
        console.log('Error getting location:', error);
        Alert.alert('Location Error', 'Could not get your current location. Using USC as default.');
        setUserLocation(USC_COORDINATES);
      }
    };

    getLocationPermission();

    // Fetch reports from backend - get 10 danger zones
    const fetchReports = async () => {
      try {
        console.log('Fetching reports from backend...');
        const res = await fetch('http://localhost:3001/api/scooter-reports');
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          // Get 10 reports for danger zones
          const dangerZones = data.reports.slice(0, 10);
          setReports(dangerZones);
          console.log(`Loaded ${dangerZones.length} danger zones from backend`);
        } else {
          console.log('No reports from backend, using sample data');
          setReports(SAMPLE_REPORTS);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports(SAMPLE_REPORTS);
      }
    };

    fetchReports();
  }, []);

  const handleMarkerPress = (report: TheftReport) => {
    setSelectedReport(report);
    setSelectedSafetyZone(null);
    setShowDetails(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSafetyZonePress = (zone: SafetyZone) => {
    setSelectedSafetyZone(zone);
    setSelectedReport(null);
    setShowDetails(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSafeAlternativePress = (alternative: SafeAlternative) => {
    Alert.alert(
      alternative.name,
      `Safety Score: ${alternative.safetyScore}/10\nDistance from destination: ${(alternative.distanceFromDestination * 1000).toFixed(0)}m\nNearby thefts: ${alternative.theftCount}`,
      [{ text: 'OK' }]
    );
  };

  const handleCloseDetails = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDetails(false);
      setSelectedReport(null);
      setSelectedSafetyZone(null);
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSetDestination = async () => {
    if (!destinationInput.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    // For demo, we'll use a fixed coordinate near USC
    // In a real app, you'd use geocoding to convert address to coordinates
    const demoDestination: Destination = {
      latitude: 34.0199 + (Math.random() - 0.5) * 0.01,
      longitude: -118.2899 + (Math.random() - 0.5) * 0.01,
      name: destinationInput
    };

    setDestination(demoDestination);
    setShowDirections(true);
    
    // Analyze the route
    await analyzeRoute(demoDestination);
  };

  const analyzeRoute = async (dest: Destination) => {
    if (!userLocation) {
      Alert.alert('Error', 'User location not available');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3001/api/analyze-route', {
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
    setShowRouteAnalysis(false);
    setDestinationInput('');
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
    <View style={styles.container}>
      {/* Main map view with dynamic location and dark mode */}
      <MapView
        ref={mapRef}
        style={styles.mapView}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
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
      >
        {/* Red markers for danger zones (theft reports) */}
        {reports.map((report, index) => {
          // Ensure we have valid coordinates before rendering
          if (!report.latitude || !report.longitude || 
              isNaN(report.latitude) || isNaN(report.longitude)) {
            console.warn(`Invalid coordinates for report ${index}:`, report);
            return null;
          }
          
          console.log(`Rendering danger zone ${index} at:`, report.latitude, report.longitude);
          return (
            <Marker
              key={`danger-${report._id || `sample-${index}`}`}
              coordinate={{
                latitude: Number(report.latitude),
                longitude: Number(report.longitude),
              }}
              onPress={() => handleMarkerPress(report)}
              pinColor="red"
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
              pinColor="green"
            />
          );
        })}

        {/* Green markers for safe alternatives */}
        {safeAlternatives.map((alternative, index) => (
          <Marker
            key={`alternative-${index}`}
            coordinate={{
              latitude: alternative.latitude,
              longitude: alternative.longitude,
            }}
            onPress={() => handleSafeAlternativePress(alternative)}
            pinColor="green"
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
            pinColor="blue"
          />
        )}

        {/* Directions */}
        {showDirections && userLocation && destination && (
          <MapViewDirections
            origin={userLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={3}
            strokeColor="#007AFF"
            optimizeWaypoints={true}
            onStart={(params) => {
              console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
            }}
            onReady={(result) => {
              console.log(`Distance: ${result.distance} km`);
              console.log(`Duration: ${result.duration} min.`);
            }}
            onError={(errorMessage) => {
              console.log('Directions error:', errorMessage);
            }}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ai Analyzer</Text>
          <Text style={styles.headerSubtitle}>Report & Location</Text>
        </View>
      </View>

      {/* Route Planning Controls */}
      <View style={styles.routeControls}>
        <View style={styles.routeInputContainer}>
          <TextInput
            style={styles.routeInput}
            placeholder="Enter destination..."
            placeholderTextColor="#8E8E93"
            value={destinationInput}
            onChangeText={setDestinationInput}
          />
          <TouchableOpacity 
            style={styles.routeButton} 
            onPress={handleSetDestination}
            disabled={isAnalyzing}
          >
            <Text style={styles.routeButtonText}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Route'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showDirections && (
          <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
            <Text style={styles.clearButtonText}>Clear Route</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Route Analysis Results */}
      {showRouteAnalysis && routeAnalysis && (
        <View style={styles.routeAnalysisContainer}>
          <View style={styles.routeAnalysisHeader}>
            <Text style={styles.routeAnalysisTitle}>Route Safety Analysis</Text>
            <TouchableOpacity onPress={() => setShowRouteAnalysis(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.safetyLevelContainer}>
            <Text style={styles.safetyLevelLabel}>Safety Level:</Text>
            <Text style={[styles.safetyLevelValue, { color: getSafetyColor(routeAnalysis.safetyLevel) }]}>
              {routeAnalysis.safetyLevel}
            </Text>
          </View>
          
          <Text style={styles.analysisText}>{routeAnalysis.analysis}</Text>
          
          <Text style={styles.nearbyTheftsText}>
            Nearby theft reports: {routeAnalysis.nearbyThefts}
          </Text>
          
          {routeAnalysis.safeAlternatives.length > 0 && (
            <View style={styles.alternativesSection}>
              <Text style={styles.alternativesTitle}>Safer Alternatives:</Text>
              {routeAnalysis.safeAlternatives.slice(0, 3).map((alt, index) => (
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
        </View>
      )}

      {/* Search bar at bottom */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Maps"
            placeholderTextColor="#989FAB"
          />
          <Text style={styles.micIcon}>🎤</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.profileIcon} />
        </View>
        <View style={styles.searchHandle} />
      </View>

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
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={styles.statusValue}>Open</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Police Response</Text>
                  <Text style={styles.statusValueGreen}>Report filed</Text>
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
                  <Text style={styles.statusLabel}>Zone Type</Text>
                  <Text style={styles.statusValueGreen}>
                    {selectedSafetyZone.type === 'security' ? 'Security Monitored' : 'Safe Parking'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Recommendation</Text>
                  <Text style={styles.statusValueGreen}>Highly Recommended</Text>
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
    </View>
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
    paddingHorizontal: 20,
    zIndex: 10,
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
    paddingTop: 8,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  searchHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#48484A',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
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
  profileContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#48484A',
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
    marginBottom: 24,
  },
  statusItem: {
    flex: 1,
    marginRight: 16,
  },
  statusLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  statusValue: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  statusValueGreen: {
    color: '#30D158',
    fontSize: 16,
    fontWeight: '600',
  },
  fullReportSection: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 20,
  },
  fullReportTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fullReportText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Route planning styles
  routeControls: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  routeInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  routeInput: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
  },
  routeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  routeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  routeAnalysisContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 12,
    padding: 16,
    maxHeight: height * 0.4,
    zIndex: 10,
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
});

export default MapScreen;