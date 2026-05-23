import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { PhaseInfo } from './cycle';
import { phaseColors } from '../theme/colors';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');
let _notifs: NotificationsModule | null = null;
function notifs(): NotificationsModule | null {
  if (IS_EXPO_GO) return null;
  if (_notifs) return _notifs;
  try {
    _notifs = require('expo-notifications') as NotificationsModule;
    _notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return _notifs;
  } catch {
    return null;
  }
}

export async function ensurePermission(): Promise<boolean> {
  const n = notifs();
  if (!n) return false;
  const settings = await n.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === n.IosAuthorizationStatus.PROVISIONAL) return true;
  const req = await n.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return req.granted;
}

export async function setupAndroidChannel(): Promise<void> {
  const n = notifs();
  if (!n) return;
  if (Platform.OS !== 'android') return;
  await n.setNotificationChannelAsync('bloom', {
    name: 'Bloom',
    importance: n.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120, 60, 120],
    lightColor: '#FFB7C5',
  });
}

async function scheduleAt(date: Date, title: string, body: string, data?: Record<string, unknown>) {
  const n = notifs();
  if (!n) return;
  if (date.getTime() <= Date.now()) return;
  await n.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: { type: n.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function rescheduleAll(info: PhaseInfo): Promise<void> {
  const n = notifs();
  if (!n) return;
  await n.cancelAllScheduledNotificationsAsync();
  const now = new Date();

  const periodSoon = addDays(info.nextPeriodDate, -2);
  periodSoon.setHours(10, 0, 0, 0);
  await scheduleAt(
    periodSoon,
    'Period in ~2 days',
    "She's likely entering luteal-end. A heating pad, chocolate, or a quiet night in could mean a lot.",
    { kind: 'period_soon' }
  );

  const periodToday = new Date(info.nextPeriodDate);
  periodToday.setHours(9, 0, 0, 0);
  await scheduleAt(
    periodToday,
    'Period likely starts today',
    'Be gentle. Check in softly and offer comfort, not solutions.',
    { kind: 'period_today' }
  );

  const ovulation = new Date(info.ovulationDate);
  ovulation.setHours(10, 30, 0, 0);
  await scheduleAt(
    ovulation,
    'Ovulation day',
    `${phaseColors.ovulation.emoji} She's likely peaking — confident, social, flirty energy. Make plans tonight.`,
    { kind: 'ovulation' }
  );

  const checkInDay = addDays(startOfDay(now), 1);
  checkInDay.setHours(19, 30, 0, 0);
  await scheduleAt(
    checkInDay,
    'Mood check-in?',
    'Log how she seemed today — small notes make great patterns.',
    { kind: 'mood_checkin' }
  );

  const transitionTargets: { name: string; date: Date }[] = [
    { name: 'follicular', date: addDays(info.nextPeriodDate, -info.cycleLength + 6) },
    { name: 'ovulation', date: info.ovulationDate },
    { name: 'luteal', date: addDays(info.ovulationDate, 2) },
  ];
  for (const t of transitionTargets) {
    if (differenceInCalendarDays(t.date, now) <= 0) continue;
    const d = new Date(t.date);
    d.setHours(11, 0, 0, 0);
    await scheduleAt(
      d,
      `Entering ${t.name}`,
      `Phase shift ahead — open the app for a fresh suggestion.`,
      { kind: 'phase_transition', phase: t.name }
    );
  }
}
