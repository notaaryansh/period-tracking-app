import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import { palette, phaseColors, type PhaseKey } from '@/theme/colors';
import type { Cycle } from '@/lib/db';
import { phaseForDay } from '@/lib/cycle';

type Props = {
  month: Date;
  cycles: Cycle[];
  avgCycleLength: number;
  lutealLength: number;
  selectedDate?: Date;
  onSelect?: (d: Date) => void;
  onChangeMonth?: (delta: number) => void;
};

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarGrid({
  month,
  cycles,
  avgCycleLength,
  lutealLength,
  selectedDate,
  onSelect,
  onChangeMonth,
}: Props) {
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

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => onChangeMonth?.(-1)} hitSlop={12}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{format(month, 'MMMM yyyy')}</Text>
        <Pressable onPress={() => onChangeMonth?.(1)} hitSlop={12}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>
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
          const bg = phase ? phaseColors[phase].soft : 'transparent';
          const accent = phase ? phaseColors[phase].primary : palette.inkSoft;
          return (
            <Pressable key={i} style={styles.cell} onPress={() => onSelect?.(d)}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: bg },
                  isSelected && { borderWidth: 2, borderColor: palette.deepRose },
                  isToday && { borderWidth: 2, borderColor: palette.ink },
                ]}>
                <Text style={[styles.dayText, { color: accent }]}>{d.getDate()}</Text>
              </View>
              {isPeriod && <View style={styles.periodDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function addMonthsToDate(date: Date, n: number): Date {
  return addMonths(date, n);
}

const CELL = 44;
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: palette.ink },
  nav: { fontSize: 28, color: palette.deepRose, paddingHorizontal: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weekday: { width: CELL, textAlign: 'center', fontSize: 12, fontWeight: '600', color: palette.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 14, fontWeight: '600' },
  periodDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.deepRose, marginTop: 2 },
});

export { addMonthsToDate };
