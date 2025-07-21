import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

const ScooterDashboard: React.FC = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with title and profile */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>My Scooter</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>
        <Image
          source={{
            uri: "https://api.builder.io/api/v1/image/assets/TEMP/91972ddee7f73ce465849bf6f128876ac2787206?width=114",
          }}
          style={styles.profileImage}
        />
      </View>

      {/* Main scooter image */}
      <View style={styles.scooterContainer}>
        <Image
          source={{
            uri: "https://api.builder.io/api/v1/image/assets/TEMP/25ce964af8c388a37bd0c5a094f3715eb65f905f?width=924",
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

      {/* Lock button */}
      <TouchableOpacity style={styles.lockButton} activeOpacity={0.8}>
        <View style={styles.lockIconContainer}>
          <Image
            source={{
              uri: "https://api.builder.io/api/v1/image/assets/TEMP/098eec73d27d5c64cb08e16a60ca3998a3635614?width=56",
            }}
            style={styles.lockIcon}
          />
        </View>
        <Text style={styles.lockText}>Lock</Text>
      </TouchableOpacity>

      {/* Bottom cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.securityCard}>
          <View style={styles.cardIconContainer}>
            <Image
              source={{
                uri: "https://api.builder.io/api/v1/image/assets/TEMP/752e97db974e549ecd825077f8fece72c632b4d1?width=50",
              }}
              style={styles.cardIcon}
            />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Security System</Text>
            <Text style={styles.cardSubtitle}>Alarm & Sensor</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.analyzerCard}
          onPress={() => router.push("/map")}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconContainer}>
            <Image
              source={{
                uri: "https://api.builder.io/api/v1/image/assets/TEMP/9a936899395fe6460434678f8415bb5f7cd426b0?width=50",
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101827",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  titleContainer: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 11,
    height: 11,
    backgroundColor: "#22C55D",
    borderRadius: 5.5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#22C55D",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: -0.32,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  profileImage: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  scooterContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  scooterImage: {
    width: 350,
    height: 350,
    resizeMode: "contain",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  locationDot: {
    width: 11,
    height: 11,
    backgroundColor: "#22C55D",
    borderRadius: 5.5,
    marginRight: 8,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: 0.5,
  },
  lockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#48586B",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#48586B",
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  lockIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  lockIcon: {
    width: 28,
    height: 28,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  lockText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 21,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 32,
  },
  securityCard: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 16,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
  },
  analyzerCard: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 16,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
  },
  cardIconContainer: {
    width: 30,
    height: 32,
    backgroundColor: "#374151",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIcon: {
    width: 25,
    height: 25,
  },
  cardTextContainer: {
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: -0.32,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7B8390",
    fontFamily: "Inter",
    lineHeight: 21,
    letterSpacing: -0.32,
    textAlign: "center",
    marginTop: 2,
  },
});

export default ScooterDashboard;
