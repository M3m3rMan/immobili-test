import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Text, StyleSheet, Pressable, TextInput, ScrollView, Animated, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';

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
    _id: '1',
    raw: 'Black electric scooter stolen from bike rack near Taper Hall. Victim reported the theft occurred between 2:00 PM and 4:00 PM. Security footage being reviewed.',
    location: 'Taper Hall, USC',
    latitude: 34.0218,
    longitude: -118.2848,
    title: 'Stolen E-scooter Reported, Lime scooter taken from campus',
    description: 'Black scooter taken from bike rack',
    date: new Date().toISOString(),
  },
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
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    // Request location permissions and get current location
    const getLocationPermission = async () => {
      // Skip location services on web to avoid ExpoLocation native module error
      if (Platform.OS === 'web' || !Location) {
        console.log('Location services not available on web, using default USC coordinates');
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show your position on the map.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(currentLocation);
        
        // Update initial region to user's location
        setInitialRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        console.log('User location:', currentLocation);
      } catch (error) {
        console.log('Error getting location:', error);
        Alert.alert('Location Error', 'Could not get your current location. Using USC as default.');
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
        }
      } catch (err) {
        console.log('Error fetching from backend, using sample data:', err);
        // Keep sample data as fallback
      }
    };

    fetchReports();
    
    // Debug: Log the reports to ensure they have valid coordinates
    console.log('Reports loaded:', reports);
    reports.forEach((report, index) => {
      console.log(`Report ${index}:`, {
        title: report.title,
        lat: report.latitude,
        lng: report.longitude
      });
    });
  }, []);

  const handleMarkerPress = (report: TheftReport) => {
    setSelectedReport(report);
    setSelectedSafetyZone(null); // Clear safety zone selection
    setShowDetails(true);
    // Animate the modal up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSafetyZonePress = (zone: SafetyZone) => {
    setSelectedSafetyZone(zone);
    setSelectedReport(null); // Clear report selection
    setShowDetails(true);
    // Animate the modal up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseDetails = () => {
    // Animate the modal down
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDetails(false);
      setSelectedReport(null);
      setSelectedSafetyZone(null);
      
      // Return to user location if available
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    });
  };

  const handleUserLocationChange = (location: any) => {
    if (location?.coordinate) {
      setUserLocation({
        latitude: location.coordinate.latitude,
        longitude: location.coordinate.longitude,
      });
    }
  };

  const handleBackPress = () => {
    router.back();
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
        onUserLocationChange={handleUserLocationChange}
      >
        {/* Red markers for danger zones (theft reports) */}
        {reports.map((report, index) => {
          console.log(`Rendering danger zone ${index} at:`, report.latitude, report.longitude);
          return (
            <Marker
              key={`report-${report._id || index}`}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              title={report.title}
              description={report.description}
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
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
              description={zone.description}
              onPress={() => handleSafetyZonePress(zone)}
              pinColor="green"
            />
          );
        })}
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
});

export default MapScreen;