import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { CycleWheel } from '@/components/wheel/CycleWheel';
import { Card } from '@/components/cards/Card';
import { palette, phaseColors } from '@/theme/colors';
import {
  addCycle,
  getSetting,
  listCycles,
  listMoods,
  listNotes,
  type Cycle,
  type Mood,
  type Note,
} from '@/lib/db';
import { averageCycleLength, computePhase, todayISO, type PhaseInfo } from '@/lib/cycle';
import { fetchSuggestions, type Suggestion } from '@/lib/openai';
import { rescheduleAll } from '@/lib/notifications';

export default function HomeScreen() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [info, setInfo] = useState<PhaseInfo | null>(null);
  const [avgCycleLength, setAvgCycleLength] = useState(28);
  const [lutealLength, setLutealLength] = useState(14);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [c, m, n, avgS, lutS] = await Promise.all([
      listCycles(),
      listMoods(20),
      listNotes(),
      getSetting('avg_cycle_length'),
      getSetting('luteal_length'),
    ]);
    setCycles(c);
    setMoods(m);
    setNotes(n);
    const fallbackAvg = Number(avgS ?? 28) || 28;
    const lLen = Number(lutS ?? 14) || 14;
    const avg = averageCycleLength(c, fallbackAvg);
    setAvgCycleLength(avg);
    setLutealLength(lLen);
    const phaseInfo = computePhase(c, { avgCycleLength: avg, lutealLength: lLen });
    setInfo(phaseInfo);
    if (phaseInfo) {
      void rescheduleAll(phaseInfo);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    setLoadingSuggestion(true);
    fetchSuggestions({
      phase: info.phase,
      dayOfCycle: info.dayOfCycle,
      cycleLength: info.cycleLength,
      recentMoods: moods.slice(0, 5).map((m) => ({ date: m.date, mood: m.mood })),
      recentNotes: notes.slice(0, 3).map((n) => ({ date: n.date, content: n.content })),
    }).then((s) => {
      if (!cancelled) {
        setSuggestion(s);
        setLoadingSuggestion(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [info?.phase, info?.dayOfCycle, moods, notes]);

  const onLogPeriodStart = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCycle(todayISO());
    await load();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const current = info ? phaseColors[info.phase] : phaseColors.follicular;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.cream }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.deepRose} />}>
      <LinearGradient
        colors={[current.soft, palette.cream]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      <View style={styles.header}>
        <Text style={styles.greeting}>Bloom</Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMM d')}</Text>
      </View>

      {!info ? (
        <Card title="Welcome \u{1F338}" subtitle="Tap below to log her first period date and we\'ll start tracking.">
          <Pressable style={styles.primaryBtn} onPress={onLogPeriodStart}>
            <Text style={styles.primaryBtnText}>Log period start (today)</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <View style={styles.wheelWrap}>
            <CycleWheel
              size={300}
              phase={info.phase}
              dayOfCycle={info.dayOfCycle}
              cycleLength={info.cycleLength}
              progress={info.progress}
            />
          </View>

          <View style={styles.chipsRow}>
            <Chip label={`Next period in ${info.daysUntilNextPeriod}d`} tint={phaseColors.menstrual.soft} fg={phaseColors.menstrual.primary} />
            <Chip
              label={info.daysUntilOvulation >= 0 ? `Ovulation in ${info.daysUntilOvulation}d` : `Ovulated ${-info.daysUntilOvulation}d ago`}
              tint={phaseColors.ovulation.soft}
              fg={phaseColors.ovulation.primary}
            />
          </View>

          <Card title={`Suggestions for ${current.label.toLowerCase()} phase`} subtitle={suggestion?.headline}>
            {loadingSuggestion ? (
              <ActivityIndicator color={palette.deepRose} style={{ marginVertical: 16 }} />
            ) : (
              (suggestion?.ideas ?? []).map((idea, i) => (
                <View key={i} style={styles.ideaRow}>
                  <Text style={styles.ideaBullet}>{current.emoji}</Text>
                  <Text style={styles.ideaText}>{idea}</Text>
                </View>
              ))
            )}
          </Card>

          <Card title="Quick actions">
            <Pressable style={styles.primaryBtn} onPress={onLogPeriodStart}>
              <Text style={styles.primaryBtnText}>Log new period start (today)</Text>
            </Pressable>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Chip({ label, tint, fg }: { label: string; tint: string; fg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 16, paddingBottom: 32 },
  header: { marginBottom: 4 },
  greeting: { fontSize: 32, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  date: { fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  wheelWrap: { alignItems: 'center', marginVertical: 8 },
  chipsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  chipText: { fontSize: 13, fontWeight: '700' },
  ideaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  ideaBullet: { fontSize: 16, marginTop: 2 },
  ideaText: { flex: 1, fontSize: 15, color: palette.ink, lineHeight: 21 },
  primaryBtn: {
    backgroundColor: palette.deepRose,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: palette.white, fontWeight: '700', fontSize: 15 },
});
