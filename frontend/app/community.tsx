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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// Sample posts data to match the example
const SAMPLE_POSTS: CommunityPost[] = [
  {
    _id: '1',
    username: 'ScooterRider23',
    avatar: '🛴',
    text: 'Just found an amazing new route through campus! Perfect for avoiding the busy streets. Anyone want to join me tomorrow?',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    timestamp: '2h ago',
    likes: 12,
    comments: 3,
    location: 'USC',
    userId: 'user1' //tobi
  },
  {
    _id: '2',
    username: 'EcoCommuter',
    avatar: '🌱',
    text: 'PSA: Remember to always lock your scooters! Saw three unlocked ones today that could easily be stolen. Stay safe everyone! 🔒',
    timestamp: '4h ago',
    likes: 28,
    comments: 7,
    location: 'UCLA',
    userId: 'user2'
  }
];

interface CommunityPost {
  _id: string;
  username: string;
  avatar: string;
  text: string;
  image?: string;
  timestamp?: string; // Made optional to handle undefined cases
  likes: number;
  comments: number;
  location?: string;
  userId: string | { _id: string; username: string };
}

export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>(SAMPLE_POSTS);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(true); // Add user data loading state
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    requestCameraPermission();
    loadUserData();
    fetchPosts();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Community screen focused - refreshing data');
      
      // Add error handling for focus effect
      const refreshData = async () => {
        try {
          await Promise.all([loadUserData(), fetchPosts()]);
        } catch (error) {
          console.error('Error during focus refresh:', error);
          // Don't crash the app, just log the error
        }
      };
      
      refreshData();
    }, [])
  );

  // Debug useEffect to// Track username state changes
  useEffect(() => {
    console.log('Username state changed to:', username);
  }, [username]);

  // Track userDataLoading state changes
  useEffect(() => {
    console.log('User data loading state changed to:', userDataLoading);
  }, [userDataLoading]);

  const loadUserData = async () => {
    try {
      setUserDataLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUsername = await AsyncStorage.getItem('username');
      console.log('Loaded user data from AsyncStorage:', { storedUserId, storedUsername });
      
      // Ensure we have valid data before setting state
      setUserId(storedUserId || null);
      setUsername(storedUsername || null);
      console.log('Set username state to:', storedUsername);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set default values on error
      setUserId(null);
      setUsername(null);
    } finally {
      setUserDataLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Pull to refresh triggered');
    try {
      await Promise.all([loadUserData(), fetchPosts()]);
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      console.log('🔄 Fetching posts from backend...');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch('https://immobili-backend-production.up.railway.app/api/community-posts', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Fetched posts data:', data);
          
          // The backend returns { posts: [...] }, so we need to access data.posts
          const fetchedPosts = Array.isArray(data.posts) ? data.posts : [];
          console.log('📝 Raw fetched posts:', fetchedPosts);
          
          // Process the posts to handle populated user data
          const processedPosts = fetchedPosts.map((post: any) => {
            try {
              const processedPost = {
                ...post,
                // If userId is populated, use the username from the populated user object
                username: post.userId?.username || post.username || 'Anonymous',
                // Don't format timestamp here - let the component handle it
                timestamp: post.timestamp || new Date().toISOString()
              };
              console.log('🔄 Processed post:', processedPost);
              return processedPost;
            } catch (postError) {
              console.error('Error processing post:', postError);
              return {
                ...post,
                username: 'Anonymous',
                timestamp: new Date().toISOString()
              };
            }
          });
          
          console.log('✅ All processed posts:', processedPosts);
          
          // Combine fetched posts with sample posts, ensuring we always have content
          // Put fetched posts first so they appear at the top
          const allPosts = [...processedPosts, ...SAMPLE_POSTS];
          console.log('📋 Final posts array:', allPosts);
          setPosts(allPosts);
        } else {
          console.error('❌ Failed to fetch posts:', response.status);
          setPosts(SAMPLE_POSTS); // Use sample posts on error
        }
      } catch (fetchError: any) {
         clearTimeout(timeoutId);
         if (fetchError.name === 'AbortError') {
           console.error('❌ Request timed out');
         } else {
           console.error('❌ Network error:', fetchError);
         }
         setPosts(SAMPLE_POSTS); // Use sample posts on error
       }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      setPosts(SAMPLE_POSTS); // Use sample posts on error
    } finally {
      setPostsLoading(false);
      console.log('✅ Posts loading completed');
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web') {
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
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web platform.');
      return;
    }

    if (cameraPermission === false) {
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
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Image picker is not available on web platform.');
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
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const openCreatePostModal = async () => {
    // Simply open the modal - the createPost function will handle username retrieval
    setShowCreatePost(true);
  };

  const createPost = async () => {
    if (!newPostText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some text or an image to your post.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    setLoading(true);
    
    // ALWAYS fetch username fresh from AsyncStorage - this is the key fix
    let finalUsername = 'Anonymous';
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      console.log('🔍 Fresh username from AsyncStorage:', storedUsername);
      
      if (storedUsername && storedUsername.trim() !== '') {
        finalUsername = storedUsername.trim();
        // Also update the state for consistency
        setUsername(finalUsername);
        console.log('✅ Using username:', finalUsername);
      } else {
        console.warn('⚠️ No valid username found in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error fetching username from AsyncStorage:', error);
    }

    try {
      // Store the values before clearing them
      const postText = newPostText;
      const postImage = selectedImage;
      
      // Create a new post object for immediate display
      const newPost: CommunityPost = {
        _id: Date.now().toString(), // Temporary ID
        username: finalUsername,
        avatar: '🛴',
        text: postText,
        image: postImage || undefined,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        location: 'Your Location',
        userId: userId,
      };

      console.log('📝 Creating post with username:', finalUsername);

      // Add the new post to the beginning of the posts array
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      // Clear the form and close modal
      setNewPostText('');
      setSelectedImage(null);
      setShowCreatePost(false);

      // Try to save to backend
      try {
        const response = await fetch('https://immobili-backend-production.up.railway.app/api/community-posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: postText,
            userId: userId,
            username: finalUsername,
            image: postImage || undefined,
          }),
        });

        if (response.ok) {
          const savedPost = await response.json();
          console.log('💾 Post saved to backend with username:', savedPost.username);
          
          // Refresh all posts to get the latest data from backend
          await fetchPosts();
          
          // Show success message
          // Alert.alert('Success', `Post created and saved as "${finalUsername}"`);
        } else {
          console.error('Backend save failed:', await response.text());
          Alert.alert('Warning', 'Post created locally but failed to save to server.');
        }
      } catch (backendError) {
        console.error('Backend save failed, but post is shown locally:', backendError);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp?: string) => {
    // Handle undefined or null timestamps
    if (!timestamp) {
      return 'Just now';
    }
    
    // If it's already a formatted string like "2h ago", return as is
    if (timestamp.includes('ago') || timestamp.includes('now')) {
      return timestamp;
    }
    
    // Otherwise, format the ISO timestamp
    const now = new Date();
    const postTime = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(postTime.getTime())) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch(`https://immobili-backend-production.up.railway.app/api/community-posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update the local state to reflect the new like count
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, likes: data.likes }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to delete posts.');
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`https://immobili-backend-production.up.railway.app/api/community-posts/${postId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
              });

              if (response.ok) {
                // Remove the post from local state
                setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to delete post.');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scooter Community</Text>
        <TouchableOpacity 
          onPress={openCreatePostModal} 
          disabled={userDataLoading}
          style={{ opacity: userDataLoading ? 0.5 : 1 }}
        >
          {userDataLoading ? (
            <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
          ) : (
            <Ionicons name="add" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Community Feed */}
      <ScrollView 
        style={styles.feed} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
            title="Pull to refresh"
          />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Community! 🛴</Text>
          <Text style={styles.welcomeText}>
            Share your scooter experiences, tips, and connect with fellow riders!
          </Text>
        </View>
        
        {postsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          </View>
        ) : (
          posts.map((post, index) => {
            try {
              console.log('Rendering post:', { index, post });
              
              // Ensure post has required properties
              if (!post || typeof post !== 'object') {
                console.warn('Invalid post object:', post);
                return null;
              }
              
              const postUserId = typeof post.userId === 'object' ? post.userId._id : post.userId;
              console.log('User ID comparison:', { postUserId, currentUserId: userId, shouldShowDelete: postUserId === userId });
              
              return (
                <View key={post._id || `post-${index}`} style={styles.postContainer}>
                  <View style={styles.postHeader}>
                    <View style={styles.userInfo}>
                      {post.avatar && post.avatar !== '👤' ? (
                        <Image 
                          source={{ uri: post.avatar }} 
                          style={styles.avatarImage}
                          onError={() => console.warn('Failed to load avatar image:', post.avatar)}
                        />
                      ) : (
                        <Text style={styles.avatar}>{post.avatar || '🛴'}</Text>
                      )}
                      <View>
                        <Text style={styles.username}>{post.username || 'Anonymous'}</Text>
                        <Text style={styles.timestamp}>{formatTimeAgo(post.timestamp)}</Text>
                      </View>
                    </View>
                    <View style={styles.postHeaderRight}>
                      {post.location && (
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                          <Text style={styles.location}>{post.location}</Text>
                        </View>
                      )}
                      {((typeof post.userId === 'object' ? post.userId._id : post.userId) === userId) && (
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => deletePost(post._id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.postText}>{post.text || ''}</Text>
                  
                  {post.image && (
                    <Image 
                      source={{ uri: post.image }} 
                      style={styles.postImage}
                      onError={() => console.warn('Failed to load post image:', post.image)}
                    />
                  )}
                  
                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => likePost(post._id)}
                    >
                      <Ionicons name="heart-outline" size={20} color={tintColor} />
                      <Text style={[styles.actionText, { color: tintColor }]}>{post.likes || 0}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={20} color={tintColor} />
                      <Text style={[styles.actionText, { color: tintColor }]}>{post.comments || 0}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="share-outline" size={20} color={tintColor} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } catch (renderError) {
              console.error('Error rendering post:', renderError, 'Post:', post);
              return (
                <View key={`error-${index}`} style={styles.postContainer}>
                  <Text style={styles.errorText}>Error loading post</Text>
                </View>
              );
            }
          }).filter(Boolean) // Remove null entries
        )}
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
            <TouchableOpacity onPress={createPost} disabled={loading}>
              <Text style={[styles.postButton, { color: tintColor }]}>
                {loading ? 'Posting...' : 'Post'}
              </Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101827', // Updated background color
    paddingTop: 60, // Add top padding for iPhone notch
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#101827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  feed: {
    flex: 1,
    backgroundColor: '#101827', // Updated feed background
  },
  welcomeSection: {
    padding: 20,
    paddingTop: 20, // Reduced top padding since we have a header
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
    marginBottom: 16,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#374151',
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    padding: 16,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});