import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ensurePermission, setupAndroidChannel } from '@/lib/notifications';
import { getDb } from '@/lib/db';
import { palette } from '@/theme/colors';

export default function RootLayout() {
  useEffect(() => {
    void getDb();
    void setupAndroidChannel();
    void ensurePermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.cream }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
