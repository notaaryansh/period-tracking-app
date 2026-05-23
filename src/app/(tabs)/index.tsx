import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { Screen } from '@/components/Screen';
import { CycleWheel } from '@/components/wheel/CycleWheel';
import { Card } from '@/components/cards/Card';
import { PeriodLogger } from '@/components/PeriodLogger';
import { palette, phaseColors } from '@/theme/colors';
import {
  getOpenCycle,
  getSetting,
  listCycles,
  listMoods,
  listNotes,
  type Cycle,
  type Mood,
  type Note,
} from '@/lib/db';
import { averageCycleLength, computePhase, todayISO, type PhaseInfo } from '@/lib/cycle';
import type { ZodiacSign } from '@/lib/horoscope';
import { SIGN_EMOJI } from '@/lib/horoscope';
import { getDaily } from '@/lib/daily-cache';
import type { DailyPayload } from '@/lib/openai';
import { rescheduleAll } from '@/lib/notifications';

export default function HomeScreen() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [openCycle, setOpenCycle] = useState<Cycle | null>(null);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [info, setInfo] = useState<PhaseInfo | null>(null);
  const [avgCycleLength, setAvgCycleLength] = useState(28);
  const [signs, setSigns] = useState<{ sun: ZodiacSign | null; moon: ZodiacSign | null; rising: ZodiacSign | null }>({
    sun: null,
    moon: null,
    rising: null,
  });
  const [daily, setDaily] = useState<DailyPayload | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);

  const load = useCallback(async () => {
    const [c, oc, m, n, avgS, lutS, sunS, moonS, risingS] = await Promise.all([
      listCycles(),
      getOpenCycle(),
      listMoods(20),
      listNotes(),
      getSetting('avg_cycle_length'),
      getSetting('luteal_length'),
      getSetting('sun_sign'),
      getSetting('moon_sign'),
      getSetting('rising_sign'),
    ]);
    setCycles(c);
    setOpenCycle(oc);
    setMoods(m);
    setNotes(n);
    const fallbackAvg = Number(avgS ?? 28) || 28;
    const lLen = Number(lutS ?? 14) || 14;
    const avg = averageCycleLength(c, fallbackAvg);
    setAvgCycleLength(avg);
    const phaseInfo = computePhase(c, { avgCycleLength: avg, lutealLength: lLen });
    setInfo(phaseInfo);
    setSigns({
      sun: (sunS as ZodiacSign | null) ?? null,
      moon: (moonS as ZodiacSign | null) ?? null,
      rising: (risingS as ZodiacSign | null) ?? null,
    });
    if (phaseInfo) void rescheduleAll(phaseInfo);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    setLoadingDaily(true);
    getDaily({
      date: todayISO(),
      phase: info.phase,
      dayOfCycle: info.dayOfCycle,
      cycleLength: info.cycleLength,
      recentMoods: moods.slice(0, 5).map((m) => ({ date: m.date, mood: m.mood })),
      recentNotes: notes.slice(0, 3).map((n) => ({ date: n.date, content: n.content })),
      sun: signs.sun,
      moon: signs.moon,
      rising: signs.rising,
    }).then((d) => {
      if (!cancelled) {
        setDaily(d);
        setLoadingDaily(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [info?.phase, info?.dayOfCycle, signs.sun, signs.moon, signs.rising]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const current = info ? phaseColors[info.phase] : phaseColors.follicular;
  const hasSigns = signs.sun || signs.moon || signs.rising;

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.deepRose} />}
        contentStyle={{ paddingTop: 0 }}>
        <LinearGradient
          colors={[current.soft, palette.cream]}
          style={[StyleSheet.absoluteFill, { height: 360 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <View style={{ paddingTop: 8 }}>
          <Text style={styles.greeting}>Bloom</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMM d')}</Text>
        </View>

        {!info ? (
          <Card title="Welcome 🌸" subtitle="Tap below to log her first period date and we'll start tracking.">
            <Pressable style={styles.primaryBtn} onPress={() => setLoggerOpen(true)}>
              <Text style={styles.primaryBtnText}>Log her first period</Text>
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
              {openCycle ? (
                <Chip label="Petal days 🌸" tint={phaseColors.menstrual.soft} fg={phaseColors.menstrual.primary} />
              ) : (
                <Chip
                  label={`Next period in ${info.daysUntilNextPeriod}d`}
                  tint={phaseColors.menstrual.soft}
                  fg={phaseColors.menstrual.primary}
                />
              )}
              <Chip
                label={
                  info.daysUntilOvulation >= 0
                    ? `Ovulation in ${info.daysUntilOvulation}d`
                    : `Ovulated ${-info.daysUntilOvulation}d ago`
                }
                tint={phaseColors.ovulation.soft}
                fg={phaseColors.ovulation.primary}
              />
            </View>

            <Card>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardLabel}>{current.emoji} Today's suggestion</Text>
                {daily?.vibe && <Text style={styles.vibe}>{daily.vibe}</Text>}
              </View>
              {loadingDaily ? (
                <ActivityIndicator color={palette.deepRose} style={{ marginVertical: 12 }} />
              ) : (
                <Text style={styles.suggestion}>{daily?.suggestion}</Text>
              )}
            </Card>

            {hasSigns ? (
              <Card>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardLabel}>✨ Daily horoscope</Text>
                  <Text style={styles.signsRow}>
                    {signs.sun ? `${SIGN_EMOJI[signs.sun]}` : ''}
                    {signs.moon ? ` ${SIGN_EMOJI[signs.moon]}` : ''}
                    {signs.rising ? ` ${SIGN_EMOJI[signs.rising]}` : ''}
                  </Text>
                </View>
                {loadingDaily ? (
                  <ActivityIndicator color={palette.deepRose} style={{ marginVertical: 12 }} />
                ) : (
                  <Text style={styles.horoscope}>{daily?.horoscope}</Text>
                )}
              </Card>
            ) : (
              <Card>
                <Text style={styles.cardLabel}>✨ Daily horoscope</Text>
                <Text style={styles.hint}>
                  Add her sun, moon, and rising signs in Settings to unlock a daily reading.
                </Text>
              </Card>
            )}

            <Pressable style={styles.primaryBtn} onPress={() => setLoggerOpen(true)}>
              <Text style={styles.primaryBtnText}>{openCycle ? 'Update period dates' : 'Log a period'}</Text>
            </Pressable>
          </>
        )}
      </Screen>
      <PeriodLogger visible={loggerOpen} onClose={() => setLoggerOpen(false)} onSaved={load} />
    </>
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
  greeting: { fontSize: 34, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  date: { fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  wheelWrap: { alignItems: 'center', marginVertical: 4 },
  chipsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  chipText: { fontSize: 13, fontWeight: '700' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: palette.inkSoft, letterSpacing: 0.2 },
  vibe: { fontSize: 12, fontWeight: '700', color: palette.deepRose, backgroundColor: palette.petalBlush, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  suggestion: { fontSize: 16, lineHeight: 23, color: palette.ink, fontWeight: '500' },
  horoscope: { fontSize: 15, lineHeight: 22, color: palette.ink, fontStyle: 'italic' },
  signsRow: { fontSize: 18 },
  hint: { fontSize: 13, color: palette.inkSoft, marginTop: 8 },
  primaryBtn: {
    backgroundColor: palette.deepRose,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: { color: palette.white, fontWeight: '700', fontSize: 15 },
});
