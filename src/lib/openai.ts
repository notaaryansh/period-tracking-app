import Constants from 'expo-constants';
import type { PhaseKey } from '../theme/colors';
import type { ZodiacSign } from './horoscope';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

function getApiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as { openaiApiKey?: string | null };
  return extra.openaiApiKey ?? null;
}

export type DailyInput = {
  date: string;
  phase: PhaseKey;
  dayOfCycle: number;
  cycleLength: number;
  recentMoods: { date: string; mood: string }[];
  recentNotes: { date: string; content: string }[];
  sun: ZodiacSign | null;
  moon: ZodiacSign | null;
  rising: ZodiacSign | null;
};

export type DailyPayload = {
  suggestion: string;
  horoscope: string;
  vibe: string;
};

const FALLBACK: DailyPayload = {
  suggestion: "Send a soft 'thinking of you' text and pick up something small she loves on the way home.",
  horoscope: 'Quiet planets today — small acts of care will land bigger than grand ones.',
  vibe: 'Gentle',
};

export async function fetchDaily(input: DailyInput): Promise<DailyPayload> {
  const key = getApiKey();
  if (!key) {
    return { ...FALLBACK, vibe: 'Set OPENAI_API_KEY' };
  }

  const system = [
    "You are a warm, perceptive companion helping a man support his girlfriend through her cycle.",
    "Reply ONLY with valid JSON: {\"suggestion\": \"...\", \"horoscope\": \"...\", \"vibe\": \"...\"}.",
    "- suggestion: ONE specific, concrete thing he can do TODAY to please/support her, tailored to her cycle phase + recent moods/notes. <= 28 words. Warm, not clinical. No medical advice.",
    "- horoscope: a short, evocative daily reading (<= 35 words) blending her sun, moon, and rising signs if provided. Tie to today's date when natural. Mystical but grounded.",
    "- vibe: one or two words describing today's overall energy (e.g. 'Soft and slow', 'Bright', 'Magnetic').",
  ].join(' ');

  const user = JSON.stringify({
    date: input.date,
    phase: input.phase,
    day_of_cycle: input.dayOfCycle,
    cycle_length: input.cycleLength,
    recent_moods: input.recentMoods.slice(0, 5),
    recent_notes: input.recentNotes.slice(0, 3).map((n) => ({ date: n.date, content: n.content.slice(0, 180) })),
    sun_sign: input.sun,
    moon_sign: input.moon,
    rising_sign: input.rising,
  });

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      const snippet = text.slice(0, 140);
      if (__DEV__) console.warn('[openai] non-OK', res.status, snippet);
      return { ...FALLBACK, vibe: `API ${res.status}` };
    }
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    return {
      suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : FALLBACK.suggestion,
      horoscope: typeof parsed.horoscope === 'string' ? parsed.horoscope : FALLBACK.horoscope,
      vibe: typeof parsed.vibe === 'string' ? parsed.vibe : FALLBACK.vibe,
    };
  } catch (err) {
    if (__DEV__) console.warn('[openai] fetch failed', err);
    return { ...FALLBACK, vibe: 'Offline' };
  }
}
