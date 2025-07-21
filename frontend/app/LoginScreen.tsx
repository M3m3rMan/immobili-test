import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInPressed, setSignInPressed] = useState(false);
  const [registerPressed, setRegisterPressed] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username and password are required');
      return;
    }
    setLoading(true);
    
    // Temporary bypass of MongoDB authentication
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Login successful!');
      router.replace('/home');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.titleSection}>
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
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
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
            onPress={handleLogin}
            onPressIn={() => setSignInPressed(true)}
            onPressOut={() => setSignInPressed(false)}
            android_ripple={{ color: '#60a5fa' }}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </Pressable>
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.signInButtonWrapper}>
          {registerPressed && <View style={styles.registerGlow} pointerEvents="none" />}
          <Pressable
            style={styles.registerButton}
            onPressIn={() => setRegisterPressed(true)}
            onPressOut={() => setRegisterPressed(false)}
            android_ripple={{ color: '#60a5fa' }}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#cbd5e1',
  },
  formSection: {
    marginBottom: 48,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 18,
    paddingRight: 50,
  },
  userIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -14 }],
    width: 28,
    height: 28,
    backgroundColor: '#475569',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -11 }],
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonWrapper: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: 70,
    borderRadius: 20,
    backgroundColor: '#60a5fa',
    opacity: 0.85,
    zIndex: 0,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 40,
  },
  registerGlow: {
    position: 'absolute',
    width: '100%',
    height: 70,
    borderRadius: 20,
    backgroundColor: '#60a5fa',
    opacity: 0.85,
    zIndex: 0,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 40,
  },
  signInButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#475569',
  },
  dividerText: {
    paddingHorizontal: 24,
    color: '#94a3b8',
    fontSize: 18,
  },
  registerButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#545454',
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  registerButtonText: {
    color: '#cbd5e1',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default LoginScreen;