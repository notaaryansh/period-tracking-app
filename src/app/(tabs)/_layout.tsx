import { Tabs } from 'expo-router';
import { Platform, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';

const SCREEN_PADDING = 18;

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: focused ? 22 : 18,
        opacity: focused ? 1 : 0.6,
        lineHeight: 24,
        textAlign: 'center',
      }}>
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bottomGap = Math.max(insets.bottom, 12) + 6;
  const barWidth = screenWidth - SCREEN_PADDING * 2;
  const barLeft = SCREEN_PADDING;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.deepRose,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { justifyContent: 'center', alignItems: 'center', paddingVertical: 0, height: 62 },
        tabBarStyle: {
          position: 'absolute',
          left: barLeft,
          width: barWidth,
          bottom: bottomGap,
          height: 62,
          borderRadius: 31,
          borderTopWidth: 0,
          backgroundColor: palette.white,
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          shadowColor: palette.deepRose,
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: Platform.OS === 'android' ? 12 : 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon glyph="🌸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon glyph="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ focused }) => <TabIcon glyph="🌼" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused }) => <TabIcon glyph="📝" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon glyph="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
