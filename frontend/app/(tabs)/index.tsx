import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '../../components/ui/IconSymbol';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInPressed, setSignInPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('https://immobili-backend-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Store user ID and username for future use
        console.log('Login successful, User ID:', data.userId);
        await AsyncStorage.setItem('userId', data.userId);
        await AsyncStorage.setItem('username', username);
        router.replace('/map');
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    }
    
    setLoading(false);
  };

  const handleRegisterPress = () => {
    router.push('/register');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                <View style={styles.titleSection}>
                  <Image
                    source={require('../../assets/images/logo_no_color.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>IMMOBILI</Text>
                  <Text style={styles.tagline}>Lock it down. Track it live.</Text>
                </View>
                <View style={styles.formSection}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#94a3b8"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.userIcon}>
                      <Image
                        source={require('../../assets/images/Face_ID_logo.png')}
                        style={{ width: 20, height: 20, resizeMode: 'contain' }}
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.signInButtonWrapper}>
                  {signInPressed && <View style={styles.glow} pointerEvents="none" />}
                  <Pressable
                    style={styles.signInButton}
                    onPressIn={() => setSignInPressed(true)}
                    onPressOut={() => setSignInPressed(false)}
                    onPress={handleLogin}
                    disabled={loading}
                    android_ripple={{ color: '#60a5fa' }}
                  >
                    <Text style={styles.signInButtonText}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={styles.registerButton}
                  activeOpacity={0.8}
                  onPress={handleRegisterPress}
                >
                  <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// Add styles definition below
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: -20,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#166bf6',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  userIcon: {
    marginLeft: 8,
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
  signInButtonWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  signInButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    zIndex: -1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94a3b8',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});