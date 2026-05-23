import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
  Fraunces_900Black,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium_Italic,
  Fraunces_700Bold_Italic,
} from '@expo-google-fonts/fraunces';
import { ensurePermission, setupAndroidChannel } from '@/lib/notifications';
import { getDb } from '@/lib/db';
import { palette } from '@/theme/colors';
import { font } from '@/theme/font';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Set global default font on Text
const TextAny = Text as unknown as { defaultProps?: { style?: object } };
TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.style = [TextAny.defaultProps.style, { fontFamily: font.regular, color: palette.ink }];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
    Fraunces_900Black,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium_Italic,
    Fraunces_700Bold_Italic,
  });

  useEffect(() => {
    void getDb();
    void setupAndroidChannel();
    void ensurePermission();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.cream }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.cream }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
