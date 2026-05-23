import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 12) + 6;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.deepRose,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 0 },
        tabBarItemStyle: { paddingVertical: 6 },
        tabBarStyle: {
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: bottomGap,
          height: 62,
          borderRadius: 31,
          borderTopWidth: 0,
          backgroundColor: palette.white,
          paddingTop: 8,
          paddingBottom: 8,
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
