import { Slot } from 'expo-router';

import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="CrimeDetailsScreen" options={{ headerShown: false }} />
    </Stack>
  );
}