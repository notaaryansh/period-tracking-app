import { Tabs } from 'expo-router';
import { Platform, Pressable, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { palette } from '@/theme/colors';

const SCREEN_PADDING = 18;

type TabConfig = { name: string; label: string; glyph: string };

const TABS: TabConfig[] = [
  { name: 'index', label: 'Today', glyph: '🌸' },
  { name: 'calendar', label: 'Calendar', glyph: '📅' },
  { name: 'mood', label: 'Mood', glyph: '🌼' },
  { name: 'notes', label: 'Notes', glyph: '📝' },
  { name: 'settings', label: 'Settings', glyph: '⚙️' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bottomGap = Math.max(insets.bottom, 12) + 6;
  const barWidth = screenWidth - SCREEN_PADDING * 2;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
      }}>
      <View
        style={{
          width: barWidth,
          marginBottom: bottomGap,
          height: 62,
          borderRadius: 31,
          backgroundColor: palette.white,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 6,
          shadowColor: palette.deepRose,
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: Platform.OS === 'android' ? 12 : 0,
        }}>
        {state.routes.map((route, index) => {
          const cfg = TABS.find((t) => t.name === route.name);
          if (!cfg) return null;
          const isFocused = state.index === index;
          const onPress = (e: GestureResponderEvent) => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name as never);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={4}
              style={{
                flex: 1,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View style={{ width: 28, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={{
                    fontSize: 20,
                    lineHeight: 22,
                    opacity: isFocused ? 1 : 0.55,
                    transform: [{ scale: isFocused ? 1.12 : 1 }],
                  }}>
                  {cfg.glyph}
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  lineHeight: 12,
                  fontWeight: '600',
                  color: isFocused ? palette.deepRose : palette.inkSoft,
                }}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
