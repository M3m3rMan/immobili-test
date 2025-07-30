import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import ProfilePicture from '@/components/ProfilePicture';

interface UserSettings {
  name: string;
  email: string;
  notifications: boolean;
  locationSharing: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    name: 'John Doe',
    email: 'john@college.edu',
    notifications: true,
    locationSharing: true,
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // First load from AsyncStorage for immediate display
      const storedUsername = await AsyncStorage.getItem('username');
      const storedEmail = await AsyncStorage.getItem('email');
      
      if (storedUsername) {
        setSettings(prev => ({ ...prev, name: storedUsername }));
      }
      if (storedEmail) {
        setSettings(prev => ({ ...prev, email: storedEmail }));
      }

      // Then load from backend to get the most up-to-date data
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`https://immobili-backend-production.up.railway.app/api/user-profile/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          const user = userData.user;
          
          // Update state with backend data
          setSettings(prev => ({
            ...prev,
            name: user.username || prev.name,
            email: user.email || prev.email,
          }));

          // Update AsyncStorage with backend data
          if (user.username) {
            await AsyncStorage.setItem('username', user.username);
          }
          if (user.email) {
            await AsyncStorage.setItem('email', user.email);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Update backend first
      const response = await fetch('https://immobili-backend-production.up.railway.app/api/update-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          username: settings.name,
          email: settings.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update AsyncStorage with the saved data
        await AsyncStorage.setItem('username', settings.name);
        await AsyncStorage.setItem('email', settings.email);
        
        // Navigate back to home page instead of showing alert
        router.push('/home');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/LoginScreen');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <ProfilePicture 
              size={96} 
              editable={true}
            />
          </View>

          {/* Settings Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={settings.name}
                onChangeText={(value) => handleSettingChange('name', value)}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={settings.email}
                onChangeText={(value) => handleSettingChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* E-Scooter Specific Settings */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>E-Scooter Settings</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Push Notifications</Text>
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => handleSettingChange('notifications', value)}
                  trackColor={{ false: '#374151', true: '#22C55D' }}
                  thumbColor={settings.notifications ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Location Sharing</Text>
                <Switch
                  value={settings.locationSharing}
                  onValueChange={(value) => handleSettingChange('locationSharing', value)}
                  trackColor={{ false: '#374151', true: '#22C55D' }}
                  thumbColor={settings.locationSharing ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profilePictureContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  sectionContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});