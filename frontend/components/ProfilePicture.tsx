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
      if (savedImageUri && isValidImageUrl(savedImageUri)) {
        setImageUri(savedImageUri);
      }
      
      // Then try to load from backend (in case user logged in on different device)
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`https://immobili-backend-production.up.railway.app/api/user-profile/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.user?.profilePicture && 
              isValidImageUrl(userData.user.profilePicture) && 
              userData.user.profilePicture !== savedImageUri) {
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

  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    
    // Check if it's a valid HTTP/HTTPS URL
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const saveProfilePicture = async (uri: string) => {
    try {
      setLoading(true);
      
      // Upload image to backend first
      const uploadedImageUrl = await uploadImageToBackend(uri);
      
      if (uploadedImageUrl) {
        // Save the server URL locally and update state
        await AsyncStorage.setItem('profilePicture', uploadedImageUrl);
        setImageUri(uploadedImageUrl);
        onImageChange?.(uploadedImageUrl);
      }
    } catch (error) {
      console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to save profile picture');
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToBackend = async (localUri: string): Promise<string | null> => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return null;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add the image file
      formData.append('image', {
        uri: localUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as any);
      
      // Add userId
      formData.append('userId', userId);

      const response = await fetch('https://immobili-backend-production.up.railway.app/api/upload-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile image uploaded successfully:', data.imageUrl);
        return data.imageUrl;
      } else {
        const errorData = await response.text();
        console.error('Failed to upload profile image:', errorData);
        Alert.alert('Error', 'Failed to upload image to server');
        return null;
      }
    } catch (error) {
      console.error('Error uploading image to backend:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    }
  };

  const updateBackendProfilePicture = async (imageUri: string) => {
    // This function is no longer needed since uploadImageToBackend handles the database update
    // Keeping it for backward compatibility but it's essentially a no-op now
    return;
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      // Check current permissions first
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      // Only request if not already granted
      let cameraPermission = cameraStatus;
      let mediaPermission = mediaStatus;
      
      if (cameraStatus.status !== 'granted') {
        cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      }
      
      if (mediaStatus.status !== 'granted') {
        mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      
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
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Photo library permission is required.');
      return;
    }

    try {
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
            onError={(error) => {
              console.log('Image loading error:', error.nativeEvent.error);
              // Reset to placeholder if image fails to load
              setImageUri(null);
            }}
            onLoadStart={() => {
              console.log('Image loading started for:', imageUri);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', imageUri);
            }}
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
    borderColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 4,
  },
});