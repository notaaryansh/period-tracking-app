import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/cards/Card';
import { palette } from '@/theme/colors';
import { getDb, getSetting, listCycles, setSetting } from '@/lib/db';
import { averageCycleLength } from '@/lib/cycle';
import { ZODIAC_SIGNS, SIGN_EMOJI, type ZodiacSign } from '@/lib/horoscope';
import { debugKeyInfo, testApiKey } from '@/lib/openai';
import { clearDailyCache } from '@/lib/daily-cache';

type SignSlot = 'sun' | 'moon' | 'rising';

export default function SettingsScreen() {
  const [avgInput, setAvgInput] = useState('28');
  const [lutealInput, setLutealInput] = useState('14');
  const [detectedAvg, setDetectedAvg] = useState<number | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [signs, setSigns] = useState<Record<SignSlot, ZodiacSign | null>>({ sun: null, moon: null, rising: null });
  const [editingSlot, setEditingSlot] = useState<SignSlot | null>(null);

  const load = useCallback(async () => {
    const [a, l, cycles, sun, moon, rising] = await Promise.all([
      getSetting('avg_cycle_length'),
      getSetting('luteal_length'),
      listCycles(),
      getSetting('sun_sign'),
      getSetting('moon_sign'),
      getSetting('rising_sign'),
    ]);
    setAvgInput(a ?? '28');
    setLutealInput(l ?? '14');
    setCycleCount(cycles.length);
    setDetectedAvg(cycles.length >= 2 ? averageCycleLength(cycles, Number(a ?? 28) || 28) : null);
    setSigns({
      sun: (sun as ZodiacSign | null) ?? null,
      moon: (moon as ZodiacSign | null) ?? null,
      rising: (rising as ZodiacSign | null) ?? null,
    });
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

  const pickSign = async (slot: SignSlot, sign: ZodiacSign | null) => {
    Haptics.selectionAsync();
    await setSetting(`${slot}_sign`, sign ?? '');
    setSigns((s) => ({ ...s, [slot]: sign }));
    setEditingSlot(null);
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
              DELETE FROM settings WHERE key LIKE 'daily:%';
            `);
            await load();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>

      <Card title="Her zodiac" subtitle="Used to generate her daily horoscope">
        {(['sun', 'moon', 'rising'] as const).map((slot) => (
          <View key={slot} style={{ marginBottom: 8 }}>
            <Text style={styles.label}>{slot.charAt(0).toUpperCase() + slot.slice(1)} sign</Text>
            <Pressable
              style={styles.signPicker}
              onPress={() => setEditingSlot(editingSlot === slot ? null : slot)}>
              <Text style={styles.signValue}>
                {signs[slot] ? `${SIGN_EMOJI[signs[slot]!]}  ${signs[slot]}` : 'Tap to set'}
              </Text>
              <Text style={styles.signChevron}>{editingSlot === slot ? '×' : '›'}</Text>
            </Pressable>
            {editingSlot === slot && (
              <View style={styles.signGrid}>
                {ZODIAC_SIGNS.map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.signChip,
                      signs[slot] === s && { backgroundColor: palette.deepRose },
                    ]}
                    onPress={() => pickSign(slot, s)}>
                    <Text style={[styles.signChipText, signs[slot] === s && { color: palette.white }]}>
                      {SIGN_EMOJI[s]} {s}
                    </Text>
                  </Pressable>
                ))}
                {signs[slot] && (
                  <Pressable style={styles.clearChip} onPress={() => pickSign(slot, null)}>
                    <Text style={styles.clearChipText}>Clear</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ))}
      </Card>

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
          <Text style={styles.hint}>Auto-detected from {cycleCount} logged cycles: {detectedAvg}d</Text>
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

      <Card title="OpenAI key debug" subtitle={
        debugKeyInfo().present
          ? `Loaded · prefix "${debugKeyInfo().prefix}…" · length ${debugKeyInfo().length}`
          : 'No key found. Add OPENAI_API_KEY to .env and restart `expo start`.'
      }>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: palette.deepRose }]}
          onPress={async () => {
            const r = await testApiKey();
            Alert.alert(r.ok ? '✅ OpenAI works' : `❌ Status ${r.status || 'error'}`, r.message);
          }}>
          <Text style={styles.saveBtnText}>Test OpenAI</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: palette.petalBlush, marginTop: 8 }]}
          onPress={async () => {
            await clearDailyCache();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Cleared', 'Daily AI cache wiped. Pull-to-refresh on Today to fetch fresh.');
          }}>
          <Text style={[styles.saveBtnText, { color: palette.deepRose }]}>Clear AI cache</Text>
        </Pressable>
      </Card>

      <Card title="About">
        <Text style={styles.bodyText}>Bloom · v0.2</Text>
        <Text style={[styles.bodyText, { color: palette.inkSoft, marginTop: 4 }]}>
          All data is stored locally on this device. Suggestions powered by OpenAI.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  signPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.cream,
    padding: 12,
    borderRadius: 12,
  },
  signValue: { fontSize: 15, fontWeight: '600', color: palette.ink },
  signChevron: { fontSize: 20, color: palette.inkSoft },
  signGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  signChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: palette.cream },
  signChipText: { fontSize: 13, color: palette.ink, fontWeight: '600' },
  clearChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: palette.petalBlush },
  clearChipText: { fontSize: 13, color: palette.deepRose, fontWeight: '700' },
});
