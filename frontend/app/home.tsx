import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const ScooterDashboard: React.FC = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.header}>My Scooter</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.status}>Available</Text>
          </View>
        </View>
        <Image 
          source={require('../assets/images/home/dude.png')} 
          style={styles.avatar} 
        />
      </View>
      <Image 
        source={require('../assets/images/home/scooter2.png')} 
        style={styles.scooterImage} 
      />
      <View style={styles.slideBackground}>
        <View style={styles.slideForeground}>
          <Text style={styles.slideText}>Slide to Lock</Text>
        </View>
        <View style={styles.slideCircle}>
          <Image 
            source={require('../assets/images/home/power.png')} 
            style={styles.slideIcon} 
          />
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.bottomLeftCard}>
          <View style={styles.bottomLeftIcon}>
            <Image 
              source={require('../assets/images/home/lock.png')} 
              style={styles.bottomLeftImage} 
            />

          </View>
          <View>
            <Text style={styles.bottomLeftTitle}>Security System</Text>
            <Text style={styles.bottomLeftSubtitle}>Alarm & Sensor</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bottomRightCard} 
          onPress={() => router.push('/map')} 
          activeOpacity={0.8}
        >
          <View style={styles.bottomRightIcon}>
            <Image 
              source={require('../assets/images/home/robot.png')} 
              style={styles.bottomRightImage} 
            />
          </View>
          <View>
            <Text style={styles.bottomRightTitle}>Ai Analyzer</Text>
            <Text style={styles.bottomRightSubtitle}>Reports & Location</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101827',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    backgroundColor: '#22C55D',
    borderRadius: 5,
    marginRight: 8,
  },
  status: {
    fontSize: 16,
    color: '#22C55D',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  scooterImage: {
    height: 250, // Adjusted to a fixed height to prevent pushing content off-screen
    width: '100%',
    resizeMode: 'contain',
    marginBottom: 20, // Add some margin below the scooter image
  },
  slideBackground: {
    backgroundColor: '#1F2937',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 20, // Adjusted margin to create space between slide and cards
  },
  slideForeground: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slideText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginLeft: 48, // Space for the icon
  },
  slideCircle: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 8,
  },
  slideIcon: {
    width: 28,
    height: 28,
    tintColor: '#1F2937',
  },
  bottomContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto', // Pushes the container to the bottom
  },
  bottomLeftCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLeftIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bottomLeftImage: {
    width: 24,
    height: 24,
    tintColor: '#9CA3AF',
  },
  bottomLeftTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLeftSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  bottomRightCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomRightIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bottomRightImage: {
    width: 24,
    height: 24,
    tintColor: '#9CA3AF',
  },
  bottomRightTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomRightSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
});

export default ScooterDashboard;
