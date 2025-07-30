import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import ProfilePicture from "@/components/ProfilePicture";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ScooterDashboard: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header with title and profile */}
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>My Scooter</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Available</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            activeOpacity={0.8}
          >
            <ProfilePicture 
              size={60} 
              editable={false}
            />
          </TouchableOpacity>
        </View>

        {/* Main scooter image */}
        <View style={styles.scooterContainer}>
          <Image
            source={{
              uri: "httpss://api.builder.io/api/v1/image/assets/TEMP/25ce964af8c388a37bd0c5a094f3715eb65f905f?width=924",
            }}
            style={styles.scooterImage}
          />
        </View>

        {/* Current location */}
        <View style={styles.locationContainer}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>
            Current Location: USC Campus
          </Text>
        </View>

        {/* Report Button */}
        <View style={styles.reportContainer}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/report")}
            activeOpacity={0.8}
          >
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.securityCard}
            onPress={() => router.push("/community")}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Image
                source={{
                  uri: "httpss://api.builder.io/api/v1/image/assets/TEMP/752e97db974e549ecd825077f8fece72c632b4d1?width=50",
                }}
                style={styles.cardIcon}
              />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Community Page</Text>
              <Text style={styles.cardSubtitle}>Talk to people in your community</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.analyzerCard}
            onPress={() => router.push("/map")}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <Image
                source={{
                  uri: "httpss://api.builder.io/api/v1/image/assets/TEMP/9a936899395fe6460434678f8415bb5f7cd426b0?width=50",
                }}
                style={styles.cardIcon}
              />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Ai Analyzer</Text>
              <Text style={styles.cardSubtitle}>Reports & Location</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: "flex-start",
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 34,
    letterSpacing: -0.32,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: "#22C55D",
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22C55D",
    fontFamily: "Inter",
    lineHeight: 20,
    letterSpacing: -0.32,
  },
  scooterContainer: {
    alignItems: "center",
    marginBottom: 0,
    marginTop: 40,
    height: 340,
    justifyContent: "center",
  },
  scooterImage: {
    width: screenWidth * 1.1,
    height: screenHeight * 1,
    resizeMode: "contain",
    maxWidth: 400,
    maxHeight: 465,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    marginTop: 40,
  },
  locationDot: {
    width: 10,
    height: 10,
    backgroundColor: "#22C55D",
    borderRadius: 5,
    marginRight: 10,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: 0.5,
  },
  reportContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  reportButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "rgba(220, 38, 38, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  reportButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 16,
    marginBottom: 40,
    marginTop: -30,
  },
  securityCard: {
    flex: 1,
    backgroundColor: "#232e41",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#48586B",
    padding: 18,
    shadowColor: "rgba(0, 0, 0, 0.18)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  analyzerCard: {
    flex: 1,
    backgroundColor: "#232e41",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#48586B",
    padding: 18,
    shadowColor: "rgba(0, 0, 0, 0.18)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#374151",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#232e41",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardIcon: {
    width: 28,
    height: 28,
  },
  cardTextContainer: {
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 22,
    letterSpacing: -0.32,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B8390",
    fontFamily: "Inter",
    lineHeight: 18,
    letterSpacing: -0.32,
    textAlign: "center",
    marginTop: 4,
  },
});

export default ScooterDashboard;