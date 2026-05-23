import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';
import { addMonths, endOfMonth, format, getDay, isSameDay, startOfDay, startOfMonth } from 'date-fns';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import { palette, phaseColors, type PhaseKey } from '@/theme/colors';
import type { Cycle } from '@/lib/db';
import { phaseForDay } from '@/lib/cycle';

type Props = {
  cycles: Cycle[];
  avgCycleLength: number;
  lutealLength: number;
  selectedDate?: Date;
  onSelect?: (d: Date) => void;
  initialMonth?: Date;
};

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL = 44;
const DOT = 38;
const RANGE = 24;

function GradientDot({ phase, focused }: { phase: PhaseKey; focused?: boolean }) {
  const c = phaseColors[phase];
  return (
    <Canvas style={{ width: DOT, height: DOT, position: 'absolute' }}>
      <Circle cx={DOT / 2} cy={DOT / 2} r={DOT / 2}>
        <RadialGradient
          c={vec(DOT / 2, DOT / 2)}
          r={DOT / 2}
          colors={[c.primary, c.soft, 'rgba(255,255,255,0)']}
        />
        {focused && <BlurMask blur={1.5} style="solid" />}
      </Circle>
    </Canvas>
  );
}

function MonthPage({
  month,
  cycles,
  avgCycleLength,
  lutealLength,
  selectedDate,
  onSelect,
  progress,
  index,
  cardWidth,
}: {
  month: Date;
  cycles: Cycle[];
  avgCycleLength: number;
  lutealLength: number;
  selectedDate?: Date;
  onSelect?: (d: Date) => void;
  progress: SharedValue<number>;
  index: number;
  cardWidth: number;
}) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const padStart = getDay(start);
    const list: (Date | null)[] = [];
    for (let i = 0; i < padStart; i++) list.push(null);
    for (let d = 1; d <= end.getDate(); d++) {
      list.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const today = startOfDay(new Date());

  const periodSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of cycles) {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : new Date(start.getTime() + 4 * 86400000);
      for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
        s.add(format(d, 'yyyy-MM-dd'));
      }
    }
    return s;
  }, [cycles]);

  const aStyle = useAnimatedStyle(() => {
    'worklet';
    const delta = progress.value - index;
    const abs = Math.abs(delta);
    const rotateY = interpolate(delta, [-1, 0, 1], [-22, 0, 22], Extrapolation.CLAMP);
    const scale = interpolate(abs, [0, 1], [1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.7, 0.5], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[{ width: cardWidth }, aStyle]}>
      <View style={styles.weekRow}>
        {WEEK.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const dateStr = format(d, 'yyyy-MM-dd');
          const isPeriod = periodSet.has(dateStr);
          const phase: PhaseKey | null = isPeriod
            ? 'menstrual'
            : phaseForDay(d, cycles, { avgCycleLength, lutealLength });
          const isToday = isSameDay(d, today);
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const textColor = phase ? phaseColors[phase].primary : palette.inkSoft;
          return (
            <Pressable key={i} style={styles.cell} onPress={() => onSelect?.(d)}>
              {phase && <GradientDot phase={phase} focused={isPeriod} />}
              <View
                style={[
                  styles.dot,
                  isSelected && { borderWidth: 2, borderColor: palette.deepRose },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: palette.ink },
                ]}>
                <Text style={[styles.dayText, { color: textColor, fontWeight: isPeriod ? '800' : '600' }]}>
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

export function MonthCarousel({
  cycles,
  avgCycleLength,
  lutealLength,
  selectedDate,
  onSelect,
  initialMonth = new Date(),
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 36 - 36;

  const months = useMemo(() => {
    const arr: Date[] = [];
    for (let i = -RANGE; i <= RANGE; i++) arr.push(startOfMonth(addMonths(initialMonth, i)));
    return arr;
  }, [initialMonth]);
  const startIndex = RANGE;

  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue(startIndex);
  const [activeIdx, setActiveIdx] = useState(startIndex);
  const [headerText, setHeaderText] = useState(format(months[startIndex], 'MMMM yyyy'));
  const headerOpacity = useSharedValue(1);

  useAnimatedReaction(
    () => progress.value,
    (v) => {
      const nearest = Math.round(v);
      if (nearest !== activeIdx && nearest >= 0 && nearest < months.length) {
        // schedule label update from JS thread
      }
    },
    [activeIdx]
  );

  const onSnap = useCallback(
    (i: number) => {
      setActiveIdx(i);
      headerOpacity.value = withTiming(0, { duration: 120 }, () => {
        headerOpacity.value = withTiming(1, { duration: 220 });
      });
      setHeaderText(format(months[i], 'MMMM yyyy'));
    },
    [months, headerOpacity]
  );

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const onNav = (delta: number) => {
    if (!ref.current) return;
    const next = Math.max(0, Math.min(months.length - 1, activeIdx + delta));
    ref.current.scrollTo({ index: next, animated: true });
  };

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => onNav(-1)} hitSlop={12} style={styles.navHit}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Animated.Text style={[styles.monthLabel, headerStyle]}>{headerText}</Animated.Text>
        <Pressable onPress={() => onNav(1)} hitSlop={12} style={styles.navHit}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <Carousel
        ref={ref}
        data={months}
        defaultIndex={startIndex}
        width={cardWidth}
        height={CELL * 7}
        loop={false}
        onProgressChange={(_offset, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        onSnapToItem={onSnap}
        scrollAnimationDuration={420}
        style={{ overflow: 'visible' }}
        renderItem={({ item, index }) => (
          <MonthPage
            month={item}
            cycles={cycles}
            avgCycleLength={avgCycleLength}
            lutealLength={lutealLength}
            selectedDate={selectedDate}
            onSelect={onSelect}
            progress={progress}
            index={index}
            cardWidth={cardWidth}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: palette.ink, textAlign: 'center', flex: 1 },
  navHit: { paddingHorizontal: 8, paddingVertical: 4 },
  nav: { fontSize: 28, color: palette.deepRose, lineHeight: 30 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weekday: { width: CELL, textAlign: 'center', fontSize: 12, fontWeight: '600', color: palette.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayText: { fontSize: 14 },
});
