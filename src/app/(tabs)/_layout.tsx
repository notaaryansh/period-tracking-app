import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.deepRose,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.petalBlush,
          height: 72,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon glyph="\u{1F338}" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon glyph="\u{1F4C5}" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ focused }) => <TabIcon glyph="\u{1F33C}" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused }) => <TabIcon glyph="\u{1F4DD}" focused={focused} />,
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
