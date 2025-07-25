import { Slot } from 'expo-router';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="CrimeDetailsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="security" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="community" options={{ headerShown: false }} />
    </Stack>
  );
}