import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

interface ReportData {
  incidentType: string;
  description: string;
  location: string;
  dateTime: string;
  contactInfo: string;
}

const Report: React.FC = () => {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData>({
    incidentType: '',
    description: '',
    location: '',
    dateTime: '',
    contactInfo: '',
  });
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');

  const incidentTypes = [
    'E-scooter Theft',
    'Vandalism',
    'Suspicious Activity',
    'Accident',
    'Other Crime',
  ];

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!selectedIncidentType || !reportData.description || !reportData.location) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleEmergencyCall = (number: string, department: string) => {
    Alert.alert(
      `Call ${department}`,
      `Are you sure you want to call ${department}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${number}`),
        },
      ]
    );
  };

  const handleSubmitReport = (department: 'USC' | 'LAPD') => {
    if (!validateForm()) return;

    const reportText = `
Incident Type: ${selectedIncidentType}
Description: ${reportData.description}
Location: ${reportData.location}
Date/Time: ${reportData.dateTime || 'Not specified'}
Contact Info: ${reportData.contactInfo || 'Not provided'}
`;

    if (department === 'USC') {
      // USC DPS non-emergency email
      const subject = encodeURIComponent(`E-Scooter ${selectedIncidentType} Report`);
      const body = encodeURIComponent(reportText);
      Linking.openURL(`mailto:dps@usc.edu?subject=${subject}&body=${body}`);
    } else {
      // LAPD online reporting or email
     Alert.alert(
        'Submit to LAPD',
        'This will open the LAPD online reporting system. You can also call the non-emergency line at (877) 275-5273.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open LAPD Portal',
            onPress: () => Linking.openURL('httpss://www.lapdonline.org/'),
          },
        ]
      );
    }
  };
  return (
    <>
      <Stack.Screen 
        options={{
          headerStyle: { backgroundColor: '#101827' },
          headerTintColor: '#fff',
          headerTitle: 'Report Incident',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: '',
          headerBackVisible: false,
          headerBackButtonMenuEnabled: false, // Disable the back button menu
          presentation: 'card', // Use card presentation
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Emergency Contacts */}
          <View style={styles.emergencySection}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <View style={styles.emergencyButtons}>
              <TouchableOpacity
                style={[styles.emergencyButton, styles.emergencyButtonRed]}
                onPress={() => handleEmergencyCall('911', '911 Emergency')}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.emergencyButtonText}>911 Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emergencyButton, styles.emergencyButtonBlue]}
                onPress={() => handleEmergencyCall('213-740-4321', 'USC DPS Emergency')}
              >
                <Ionicons name="shield" size={20} color="#fff" />
                <Text style={styles.emergencyButtonText}>USC DPS Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Report Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Report Details</Text>
            
            {/* Incident Type */}
            <Text style={styles.fieldLabel}>Incident Type *</Text>
            <View style={styles.incidentTypeContainer}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.incidentTypeButton,
                    selectedIncidentType === type && styles.incidentTypeButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedIncidentType(type);
                    handleInputChange('incidentType', type);
                  }}
                >
                  <Text
                    style={[
                      styles.incidentTypeText,
                      selectedIncidentType === type && styles.incidentTypeTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the incident in detail..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              value={reportData.description}
              onChangeText={(text) => handleInputChange('description', text)}
            />

            {/* Location */}
            <Text style={styles.fieldLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Where did this occur? (e.g., USC Campus, specific address)"
              placeholderTextColor="#888"
              value={reportData.location}
              onChangeText={(text) => handleInputChange('location', text)}
            />

            {/* Date/Time */}
            <Text style={styles.fieldLabel}>Date & Time</Text>
            <TextInput
              style={styles.textInput}
              placeholder="When did this occur? (e.g., Dec 15, 2024 at 3:00 PM)"
              placeholderTextColor="#888"
              value={reportData.dateTime}
              onChangeText={(text) => handleInputChange('dateTime', text)}
            />

            {/* Contact Info */}
            <Text style={styles.fieldLabel}>Your Contact Information</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Phone number or email (optional)"
              placeholderTextColor="#888"
              value={reportData.contactInfo}
              onChangeText={(text) => handleInputChange('contactInfo', text)}
            />
          </View>

          {/* Submit Buttons */}
          <View style={styles.submitSection}>
            <Text style={styles.sectionTitle}>Submit Report To:</Text>
            
            <TouchableOpacity
              style={[styles.submitButton, styles.uscButton]}
              onPress={() => handleSubmitReport('USC')}
            >
              <Ionicons name="school" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>USC Department of Public Safety</Text>
              <Text style={styles.submitButtonSubtext}>For incidents on USC campus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, styles.lapdButton]}
              onPress={() => handleSubmitReport('LAPD')}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Los Angeles Police Department</Text>
              <Text style={styles.submitButtonSubtext}>For incidents off-campus</Text>
            </TouchableOpacity>
          </View>

          {/* Non-Emergency Contacts */}
          <View style={styles.nonEmergencySection}>
            <Text style={styles.sectionTitle}>Non-Emergency Contacts</Text>
            <View style={styles.contactItem}>
              <Text style={styles.contactTitle}>USC DPS Non-Emergency</Text>
              <TouchableOpacity onPress={() => Linking.openURL('tel:213-740-6000')}>
                <Text style={styles.contactNumber}>(213) 740-6000</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactTitle}>LAPD Non-Emergency</Text>
              <TouchableOpacity onPress={() => Linking.openURL('tel:877-275-5273')}>
                <Text style={styles.contactNumber}>(877) 275-5273</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101827',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#16213e',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  emergencySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  emergencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  emergencyButtonRed: {
    backgroundColor: '#e74c3c',
  },
  emergencyButtonBlue: {
    backgroundColor: '#3498db',
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  formSection: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 15,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  incidentTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    marginRight: 8,
    marginBottom: 8,
  },
  incidentTypeButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  incidentTypeText: {
    color: '#ccc',
    fontSize: 14,
  },
  incidentTypeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#1F2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#1F2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  uscButton: {
    backgroundColor: '#8B0000',
  },
  lapdButton: {
    backgroundColor: '#1e3a8a',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  submitButtonSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 10,
  },
  nonEmergencySection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  contactTitle: {
    color: '#fff',
    fontSize: 16,
  },
  contactNumber: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Report;