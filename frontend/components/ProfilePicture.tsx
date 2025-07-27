import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface ProfilePictureProps {
  size?: number;
  editable?: boolean;
  onImageChange?: (imageUri: string) => void;
  style?: any;
}

export default function ProfilePicture({ 
  size = 96, 
  editable = false, 
  onImageChange,
  style 
}: ProfilePictureProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfilePicture();
  }, []);

  // Refresh profile picture when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfilePicture();
    }, [])
  );

  const loadProfilePicture = async () => {
    try {
      // First try to load from AsyncStorage (local cache)
      const savedImageUri = await AsyncStorage.getItem('profilePicture');
      if (savedImageUri) {
        setImageUri(savedImageUri);
      }
      
      // Then try to load from backend (in case user logged in on different device)
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`http://192.168.1.101:3001/api/user-profile/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.user?.profilePicture && userData.user.profilePicture !== savedImageUri) {
            // Update local storage and state if backend has newer image
            await AsyncStorage.setItem('profilePicture', userData.user.profilePicture);
            setImageUri(userData.user.profilePicture);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const saveProfilePicture = async (uri: string) => {
    try {
      await AsyncStorage.setItem('profilePicture', uri);
      setImageUri(uri);
      onImageChange?.(uri);
      
      // Also update the backend user profile
      await updateBackendProfilePicture(uri);
    } catch (error) {
      console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to save profile picture');
    }
  };

  const updateBackendProfilePicture = async (imageUri: string) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('http://192.168.1.101:3001/api/update-profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          profilePicture: imageUri,
        }),
      });

      if (!response.ok) {
        console.error('Failed to update profile picture on backend');
      }
    } catch (error) {
      console.error('Error updating backend profile picture:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraPermission.status === 'granted' && mediaPermission.status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const showImagePicker = () => {
    if (!editable) return;

    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        ...(imageUri ? [{ text: 'Remove Photo', onPress: removePhoto, style: 'destructive' as const }] : [])
      ]
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera and photo library permissions are required.');
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Photo library permission is required.');
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async () => {
    try {
      await AsyncStorage.removeItem('profilePicture');
      setImageUri(null);
      onImageChange?.('');
    } catch (error) {
      console.error('Error removing profile picture:', error);
    }
  };

  const containerSize = size;
  const borderRadius = size / 2;

  return (
    <TouchableOpacity
      style={[styles.container, { width: containerSize, height: containerSize }, style]}
      onPress={showImagePicker}
      disabled={!editable || loading}
      activeOpacity={editable ? 0.7 : 1}
    >
      <View style={[styles.imageContainer, { borderRadius }]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, { borderRadius }]}
          />
        ) : (
          <View style={[styles.placeholder, { borderRadius }]}>
            <Ionicons name="person" size={size * 0.5} color="#9CA3AF" />
          </View>
        )}
        
        {editable && (
          <View style={styles.editOverlay}>
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    aspectRatio: 1, // Ensures perfect square container
  },
  imageContainer: {
    borderWidth: 4,
    borderColor: '#22C55D',
    overflow: 'hidden',
    aspectRatio: 1, // Ensures perfect square border container
    width: '100%',
    height: '100%',
  },
  image: {
    resizeMode: 'cover',
    aspectRatio: 1, // Ensures perfect square aspect ratio
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1, // Ensures perfect square aspect ratio
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  editIcon: {
    backgroundColor: '#22C55D',
    borderRadius: 10,
    padding: 4,
  },
});