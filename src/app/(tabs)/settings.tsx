import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/cards/Card';
import { palette } from '@/theme/colors';
import { getDb, getSetting, listCycles, setSetting } from '@/lib/db';
import { averageCycleLength } from '@/lib/cycle';

export default function SettingsScreen() {
  const [avgInput, setAvgInput] = useState('28');
  const [lutealInput, setLutealInput] = useState('14');
  const [detectedAvg, setDetectedAvg] = useState<number | null>(null);
  const [cycleCount, setCycleCount] = useState(0);

  const load = useCallback(async () => {
    const [a, l, cycles] = await Promise.all([
      getSetting('avg_cycle_length'),
      getSetting('luteal_length'),
      listCycles(),
    ]);
    setAvgInput(a ?? '28');
    setLutealInput(l ?? '14');
    setCycleCount(cycles.length);
    if (cycles.length >= 2) {
      setDetectedAvg(averageCycleLength(cycles, Number(a ?? 28) || 28));
    } else {
      setDetectedAvg(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onSave = async () => {
    const a = Math.max(18, Math.min(45, Number(avgInput) || 28));
    const l = Math.max(8, Math.min(18, Number(lutealInput) || 14));
    await setSetting('avg_cycle_length', String(a));
    await setSetting('luteal_length', String(l));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', `Cycle: ${a}d · Luteal: ${l}d`);
  };

  const onWipe = () => {
    Alert.alert(
      'Erase all data?',
      'This permanently deletes cycles, moods, and notes from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: async () => {
            const db = await getDb();
            await db.execAsync(`
              DELETE FROM cycles;
              DELETE FROM moods;
              DELETE FROM notes;
            `);
            await load();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: palette.cream }} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Card title="Cycle settings" subtitle="Adjust if you know her actual averages">
          <Text style={styles.label}>Average cycle length (days)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={avgInput}
            onChangeText={setAvgInput}
            maxLength={2}
          />
          {detectedAvg != null && (
            <Text style={styles.hint}>
              Auto-detected from {cycleCount} logged cycles: {detectedAvg}d
            </Text>
          )}
          <Text style={[styles.label, { marginTop: 14 }]}>Luteal phase length (days)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={lutealInput}
            onChangeText={setLutealInput}
            maxLength={2}
          />
          <Text style={styles.hint}>Standard is 14. Affects ovulation prediction.</Text>
          <Pressable style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </Card>

        <Card title="Data">
          <Text style={styles.bodyText}>{cycleCount} cycle(s) logged</Text>
          <Pressable style={[styles.saveBtn, { backgroundColor: palette.petalBlush, marginTop: 10 }]} onPress={onWipe}>
            <Text style={[styles.saveBtnText, { color: palette.deepRose }]}>Erase all data</Text>
          </Pressable>
        </Card>

        <Card title="About">
          <Text style={styles.bodyText}>Bloom · v0.1</Text>
          <Text style={[styles.bodyText, { color: palette.inkSoft, marginTop: 4 }]}>
            All data is stored locally on this device. Suggestions powered by OpenAI.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 14, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  label: { fontSize: 13, fontWeight: '600', color: palette.inkSoft, marginBottom: 6 },
  input: {
    borderRadius: 12,
    backgroundColor: palette.cream,
    padding: 12,
    fontSize: 16,
    color: palette.ink,
    fontWeight: '600',
  },
  hint: { fontSize: 12, color: palette.inkSoft, marginTop: 6 },
  saveBtn: { backgroundColor: palette.deepRose, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: palette.white, fontWeight: '700', fontSize: 14 },
  bodyText: { fontSize: 14, color: palette.ink },
});
