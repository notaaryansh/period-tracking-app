import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { addMonths, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/cards/Card';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { palette, phaseColors } from '@/theme/colors';
import {
  addCycle,
  deleteCycle,
  getSetting,
  listCycles,
  type Cycle,
} from '@/lib/db';
import { averageCycleLength, phaseForDay } from '@/lib/cycle';

export default function CalendarScreen() {
  const [month, setMonth] = useState(new Date());
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [avgCycleLength, setAvgCycleLength] = useState(28);
  const [lutealLength, setLutealLength] = useState(14);

  const load = useCallback(async () => {
    const [c, a, l] = await Promise.all([listCycles(), getSetting('avg_cycle_length'), getSetting('luteal_length')]);
    setCycles(c);
    setAvgCycleLength(averageCycleLength(c, Number(a ?? 28) || 28));
    setLutealLength(Number(l ?? 14) || 14);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onChangeMonth = (delta: number) => setMonth((m) => addMonths(m, delta));

  const selectedDateStr = selected ? format(selected, 'yyyy-MM-dd') : null;
  const selectedCycle = selectedDateStr ? cycles.find((c) => c.start_date === selectedDateStr) : null;
  const selectedPhase = selected ? phaseForDay(selected, cycles, { avgCycleLength, lutealLength }) : null;

  const onMarkPeriodStart = async () => {
    if (!selectedDateStr) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCycle(selectedDateStr);
    await load();
  };

  const onRemoveCycle = async () => {
    if (!selectedCycle) return;
    Alert.alert('Remove this period start?', selectedCycle.start_date, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteCycle(selectedCycle.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.cream }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Calendar</Text>

      <Card>
        <CalendarGrid
          month={month}
          cycles={cycles}
          avgCycleLength={avgCycleLength}
          lutealLength={lutealLength}
          selectedDate={selected}
          onSelect={(d) => setSelected(d)}
          onChangeMonth={onChangeMonth}
        />
      </Card>

      {selected && (
        <Card
          title={format(selected, 'EEEE, MMM d')}
          subtitle={selectedPhase ? `${phaseColors[selectedPhase].emoji} ${phaseColors[selectedPhase].label} phase` : 'No data yet'}>
          {selectedCycle ? (
            <Pressable style={[styles.btn, { backgroundColor: palette.petalBlush }]} onPress={onRemoveCycle}>
              <Text style={[styles.btnText, { color: palette.deepRose }]}>Remove period start</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.btn} onPress={onMarkPeriodStart}>
              <Text style={[styles.btnText, { color: palette.white }]}>Mark as period start</Text>
            </Pressable>
          )}
        </Card>
      )}

      <Card title="Legend">
        {(['menstrual', 'follicular', 'ovulation', 'luteal'] as const).map((p) => (
          <View key={p} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: phaseColors[p].soft, borderColor: phaseColors[p].primary }]} />
            <Text style={styles.legendText}>
              {phaseColors[p].emoji} {phaseColors[p].label}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 14, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  btn: {
    backgroundColor: palette.deepRose,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { fontWeight: '700', fontSize: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  legendDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  legendText: { fontSize: 14, color: palette.ink },
});
