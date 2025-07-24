import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// Conditional imports for camera functionality
let ImagePicker: any = null;
let Camera: any = null;

if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('expo-image-picker');
    Camera = require('expo-camera');
  } catch (error) {
    console.log('Camera modules not available');
  }
}

const { width, height } = Dimensions.get('window');

interface CommunityPost {
  id: string;
  username: string;
  avatar: string;
  text: string;
  image?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  location?: string;
}

// Sample community posts
const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: '1',
    username: 'ScooterRider23',
    avatar: '🛴',
    text: 'Just found an amazing new route through campus! Perfect for avoiding the busy streets. Anyone want to join me tomorrow?',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: 12,
    comments: 3,
    location: 'USC'
  },
  {
    id: '2',
    username: 'EcoCommuter',
    avatar: '🌱',
    text: 'PSA: Remember to always lock your scooters! Saw three unlocked ones today that could easily be stolen. Stay safe everyone! 🔒',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likes: 28,
    comments: 7,
    location: 'UCLA'
  },
  {
    id: '3',
    username: 'SpeedDemon',
    avatar: '⚡',
    text: 'New personal record! 25 miles on a single charge. This new battery upgrade is incredible!',
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    likes: 15,
    comments: 5,
    location: 'USC'
  }
];

export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>(SAMPLE_POSTS);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      setCameraPermission(false);
      return;
    }

    try {
      // Request both camera and media library permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setCameraPermission(
        cameraPermission.status === 'granted' && mediaPermission.status === 'granted'
      );
    } catch (error) {
      console.log('Permission request failed:', error);
      setCameraPermission(false);
    }
  };

  const takePhoto = async () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'Camera not available on this platform.');
      return;
    }

    if (!cameraPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    if (!ImagePicker || !cameraPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const createPost = () => {
    if (!newPostText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some text or an image to your post.');
      return;
    }

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      username: 'You',
      avatar: '👤',
      text: newPostText,
      image: selectedImage || undefined,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      location: 'Your Location'
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setSelectedImage(null);
    setShowCreatePost(false);
    Alert.alert('Success', 'Your post has been shared with the community!');
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const likePost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const renderPost = (post: CommunityPost) => (
    <View key={post.id} style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{post.avatar}</Text>
          <View>
            <Text style={styles.username}>{post.username}</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(post.timestamp)}</Text>
          </View>
        </View>
        {post.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.location}>{post.location}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.postText}>{post.text}</Text>
      
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => likePost(post.id)}
        >
          <Ionicons name="heart-outline" size={20} color={tintColor} />
          <Text style={[styles.actionText, { color: tintColor }]}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={tintColor} />
          <Text style={[styles.actionText, { color: tintColor }]}>{post.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={tintColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scooter Community</Text>
          <TouchableOpacity onPress={() => setShowCreatePost(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Community Feed */}
        <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to the Community! 🛴</Text>
            <Text style={styles.welcomeText}>
              Share your scooter experiences, tips, and connect with fellow riders!
            </Text>
          </View>
          
          {posts.map(renderPost)}
        </ScrollView>

        {/* Create Post Modal */}
        <Modal
          visible={showCreatePost}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <ThemedView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={createPost}>
                <Text style={[styles.postButton, { color: tintColor }]}>Post</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <TextInput
                style={styles.textInput}
                placeholder="What's happening in the scooter world?"
                placeholderTextColor="#FFFFFF"
                multiline
                value={newPostText}
                onChangeText={setNewPostText}
                maxLength={500}
              />
              
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#101827" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                  <Text style={styles.mediaButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.characterCount}>{newPostText.length}/500</Text>
            </ScrollView>
          </ThemedView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101827', // Updated background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // Updated border color
    backgroundColor: '#101827', // Updated header background
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff', // Fixed: Changed from #101827 to #FFFFFF for visibility
  },
  feed: {
    flex: 1,
    backgroundColor: '#101827', // Updated feed background
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#101827', // Updated welcome section background
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF', // Updated welcome title color
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    color: '#FFFFFF', // Updated welcome text color
  },
  postContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1F2937', // Changed from #101827 to #374151
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Updated username color
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF', // Updated timestamp color for better contrast
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#9CA3AF', // Updated location color for better contrast
    marginLeft: 4,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#FFFFFF', // Updated post text color
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#4B5563', // Updated border color for better contrast
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFFFFF', // Updated action text color
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#101827', // Updated modal background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#101827', // Changed header background to #101827
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FFFFFF', // Changed Cancel button to white
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#101827',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
    color: '#FFFFFF',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#374151', // Updated remove button background
    borderRadius: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF', // Updated character count color
  },
});