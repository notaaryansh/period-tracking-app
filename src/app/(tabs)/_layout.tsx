import { Tabs } from 'expo-router';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';

const SCREEN_PADDING = 18;

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View style={{ width: 28, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 20,
          lineHeight: 22,
          opacity: focused ? 1 : 0.55,
          transform: [{ scale: focused ? 1.12 : 1 }],
        }}>
        {glyph}
      </Text>
    </View>
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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 3, marginBottom: 0, lineHeight: 12 },
        tabBarItemStyle: { justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
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
