import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import type { PhaseKey } from '../theme/colors';
import type { Cycle } from './db';

export type PhaseInfo = {
  phase: PhaseKey;
  dayOfCycle: number;
  cycleLength: number;
  lutealLength: number;
  nextPeriodDate: Date;
  daysUntilNextPeriod: number;
  ovulationDate: Date;
  daysUntilOvulation: number;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  progress: number;
};

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isoToDate(iso: string): Date {
  return startOfDay(parseISO(iso));
}

export function averageCycleLength(cycles: Cycle[], fallback: number): number {
  const sorted = cycles
    .filter((c) => !!c.start_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length < 2) return fallback;
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(differenceInCalendarDays(isoToDate(sorted[i].start_date), isoToDate(sorted[i - 1].start_date)));
  }
  const trimmed = diffs.filter((d) => d >= 18 && d <= 45);
  if (trimmed.length === 0) return fallback;
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  return Math.round(avg);
}

export function computePhase(
  cycles: Cycle[],
  opts: { avgCycleLength: number; lutealLength: number; today?: Date }
): PhaseInfo | null {
  const today = startOfDay(opts.today ?? new Date());
  const last = cycles
    .filter((c) => !!c.start_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .find((c) => isoToDate(c.start_date).getTime() <= today.getTime());
  if (!last) return null;

  const lastStart = isoToDate(last.start_date);
  const cycleLength = opts.avgCycleLength;
  const lutealLength = opts.lutealLength;

  let dayOfCycle = differenceInCalendarDays(today, lastStart) + 1;
  while (dayOfCycle > cycleLength) {
    dayOfCycle -= cycleLength;
  }

  const ovulationDayInCycle = cycleLength - lutealLength;
  const ovulationDate = addDays(lastStart, ovulationDayInCycle - 1);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);
  const nextPeriodDate = addDays(lastStart, cycleLength);

  let phase: PhaseKey;
  const periodLength = 5;
  if (dayOfCycle <= periodLength) phase = 'menstrual';
  else if (dayOfCycle < ovulationDayInCycle - 1) phase = 'follicular';
  else if (dayOfCycle <= ovulationDayInCycle + 1) phase = 'ovulation';
  else phase = 'luteal';

  return {
    phase,
    dayOfCycle,
    cycleLength,
    lutealLength,
    nextPeriodDate,
    daysUntilNextPeriod: differenceInCalendarDays(nextPeriodDate, today),
    ovulationDate,
    daysUntilOvulation: differenceInCalendarDays(ovulationDate, today),
    fertileWindowStart,
    fertileWindowEnd,
    progress: dayOfCycle / cycleLength,
  };
}

export function phaseForDay(
  date: Date,
  cycles: Cycle[],
  opts: { avgCycleLength: number; lutealLength: number }
): PhaseKey | null {
  const info = computePhase(cycles, { ...opts, today: date });
  return info?.phase ?? null;
}

export const moodChoices: Record<PhaseKey, string[]> = {
  menstrual: ['Crampy', 'Tired', 'Tender', 'Low energy', 'Emotional', 'Okay'],
  follicular: ['Energetic', 'Focused', 'Playful', 'Social', 'Creative', 'Calm'],
  ovulation: ['Glowing', 'Confident', 'Flirty', 'High energy', 'Affectionate', 'Restless'],
  luteal: ['Irritable', 'Sensitive', 'Bloated', 'Anxious', 'Cozy', 'Withdrawn'],
};
