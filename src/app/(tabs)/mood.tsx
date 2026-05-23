import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/cards/Card';
import { palette, phaseColors, type PhaseKey } from '@/theme/colors';
import { addMood, getSetting, listCycles, listMoods, type Cycle, type Mood } from '@/lib/db';
import { averageCycleLength, computePhase, moodChoices, todayISO } from '@/lib/cycle';

export default function MoodScreen() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [phase, setPhase] = useState<PhaseKey | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const [m, c, a, l] = await Promise.all([
      listMoods(50),
      listCycles(),
      getSetting('avg_cycle_length'),
      getSetting('luteal_length'),
    ]);
    setMoods(m);
    setCycles(c);
    const avg = averageCycleLength(c, Number(a ?? 28) || 28);
    const lLen = Number(l ?? 14) || 14;
    const info = computePhase(c, { avgCycleLength: avg, lutealLength: lLen });
    setPhase(info?.phase ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const choices = phase ? moodChoices[phase] : ['Calm', 'Tired', 'Happy', 'Stressed', 'Okay'];
  const current = phase ? phaseColors[phase] : phaseColors.follicular;

  const onSubmit = async () => {
    if (!picked) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addMood(todayISO(), phase ?? 'unknown', picked, note.trim() || null);
    setPicked(null);
    setNote('');
    await load();
  };

  return (
    <Screen>
      <Text style={styles.title}>Mood</Text>

      <Card
        title={phase ? `She's in ${current.label.toLowerCase()} phase ${current.emoji}` : 'Log a mood'}
        subtitle="Tap how she's feeling today">
        <View style={styles.chips}>
          {choices.map((c) => {
            const active = picked === c;
            return (
              <Pressable
                key={c}
                style={[styles.chip, { backgroundColor: active ? current.primary : current.soft }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPicked(c);
                }}>
                <Text style={[styles.chipText, { color: active ? palette.white : palette.ink }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Optional note (what triggered it? context?)"
          placeholderTextColor={palette.inkSoft}
          value={note}
          onChangeText={setNote}
          multiline
        />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: picked ? palette.deepRose : palette.petalBlush }]}
          disabled={!picked}
          onPress={onSubmit}>
          <Text style={[styles.saveBtnText, { color: picked ? palette.white : palette.deepRose }]}>Save mood</Text>
        </Pressable>
      </Card>

      <Card title="Recent moods">
        {moods.length === 0 ? (
          <Text style={styles.empty}>No moods logged yet.</Text>
        ) : (
          moods.slice(0, 15).map((m) => {
            const pc = (phaseColors as Record<string, (typeof phaseColors)[PhaseKey] | undefined>)[m.phase];
            return (
              <View key={m.id} style={styles.moodRow}>
                <View style={[styles.moodDot, { backgroundColor: pc?.primary ?? palette.inkSoft }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.moodPrimary}>
                    {m.mood} <Text style={styles.moodPhase}>· {pc?.label ?? m.phase}</Text>
                  </Text>
                  {m.note && <Text style={styles.moodNote}>{m.note}</Text>}
                </View>
                <Text style={styles.moodDate}>{format(new Date(m.date), 'MMM d')}</Text>
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  chipText: { fontWeight: '600', fontSize: 14 },
  input: {
    borderRadius: 12,
    backgroundColor: palette.cream,
    padding: 12,
    fontSize: 14,
    color: palette.ink,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontWeight: '700', fontSize: 15 },
  empty: { color: palette.inkSoft, fontSize: 14, fontStyle: 'italic' },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  moodDot: { width: 10, height: 10, borderRadius: 5 },
  moodPrimary: { fontSize: 15, fontWeight: '600', color: palette.ink },
  moodPhase: { fontSize: 13, color: palette.inkSoft, fontWeight: '400' },
  moodNote: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  moodDate: { fontSize: 12, color: palette.inkSoft },
});
