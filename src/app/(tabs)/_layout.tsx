import { useEffect, useState, type ComponentType } from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Flower2,
  CalendarDays,
  HeartPulse,
  NotebookPen,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { palette } from '@/theme/colors';

const SCREEN_PADDING = 18;
const BAR_HEIGHT = 64;
const PILL_INSET = 6;
const SPRING = { damping: 18, stiffness: 260, mass: 0.7 };

type TabConfig = { name: string; label: string; Icon: LucideIcon };

const TABS: TabConfig[] = [
  { name: 'index', label: 'Today', Icon: Flower2 },
  { name: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { name: 'mood', label: 'Mood', Icon: HeartPulse },
  { name: 'notes', label: 'Notes', Icon: NotebookPen },
  { name: 'settings', label: 'Settings', Icon: SettingsIcon },
];

function AnimatedTabIcon({
  Icon,
  focused,
  color,
}: {
  Icon: LucideIcon;
  focused: boolean;
  color: string;
}) {
  const scale = useSharedValue(focused ? 1.05 : 1);
  const translateY = useSharedValue(focused ? -1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, SPRING);
    translateY.value = withSpring(focused ? -1 : 0, SPRING);
  }, [focused, scale, translateY]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={aStyle}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} />
    </Animated.View>
  );
}

function AnimatedLabel({ label, focused }: { label: string; focused: boolean }) {
  const t = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [focused, t]);

  const aStyle = useAnimatedStyle(() => ({
    color: interpolateColor(t.value, [0, 1], [palette.inkSoft, palette.deepRose]),
    opacity: 0.7 + t.value * 0.3,
  }));

  return (
    <Animated.Text style={[styles.label, aStyle]} numberOfLines={1}>
      {label}
    </Animated.Text>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bottomGap = Math.max(insets.bottom, 12) + 8;
  const barWidth = screenWidth - SCREEN_PADDING * 2;
  const tabCount = state.routes.length;
  const tabWidth = (barWidth - PILL_INSET * 2) / tabCount;

  const pillX = useSharedValue(PILL_INSET + state.index * tabWidth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pillX.value = withSpring(PILL_INSET + state.index * tabWidth, SPRING);
  }, [state.index, tabWidth, pillX]);

  const onBarLayout = (_e: LayoutChangeEvent) => setReady(true);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: tabWidth,
  }));

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
        onLayout={onBarLayout}
        style={[
          styles.bar,
          {
            width: barWidth,
            height: BAR_HEIGHT,
            borderRadius: BAR_HEIGHT / 2,
            marginBottom: bottomGap,
          },
        ]}>
        <BlurView
          intensity={Platform.OS === 'android' ? 60 : 40}
          tint="light"
          style={[StyleSheet.absoluteFill, { borderRadius: BAR_HEIGHT / 2, overflow: 'hidden' }]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: BAR_HEIGHT / 2 },
          ]}
          pointerEvents="none"
        />

        {ready && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                top: PILL_INSET,
                bottom: PILL_INSET,
                borderRadius: (BAR_HEIGHT - PILL_INSET * 2) / 2,
              },
              pillStyle,
            ]}>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: palette.petalBlush,
                  borderRadius: (BAR_HEIGHT - PILL_INSET * 2) / 2,
                  opacity: 0.85,
                },
              ]}
            />
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const cfg = TABS.find((t) => t.name === route.name);
          if (!cfg) return null;
          const isFocused = state.index === index;
          const tint = isFocused ? palette.deepRose : palette.inkSoft;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              if (Platform.OS === 'ios') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              }
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={4}
              style={[styles.tab, { width: tabWidth }]}
              android_ripple={{ color: 'transparent', borderless: true }}>
              <AnimatedTabIcon Icon={cfg.Icon} focused={isFocused} color={tint} />
              <AnimatedLabel label={cfg.label} focused={isFocused} />
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

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: palette.deepRose,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: Platform.OS === 'android' ? 14 : 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pill: {
    position: 'absolute',
    left: 0,
  },
  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
