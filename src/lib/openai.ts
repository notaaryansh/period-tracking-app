import Constants from 'expo-constants';
import type { PhaseKey } from '../theme/colors';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-5-mini';

function getApiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as { openaiApiKey?: string | null };
  return extra.openaiApiKey ?? null;
}

export type SuggestionInput = {
  phase: PhaseKey;
  dayOfCycle: number;
  cycleLength: number;
  recentMoods: { date: string; mood: string }[];
  recentNotes: { date: string; content: string }[];
};

export type Suggestion = {
  headline: string;
  ideas: string[];
};

export async function fetchSuggestions(input: SuggestionInput): Promise<Suggestion> {
  const key = getApiKey();
  if (!key) {
    return {
      headline: 'Set OPENAI_API_KEY to get personalized ideas',
      ideas: ['Bring her favourite snack', 'Send a sweet text', 'Plan a quiet evening together'],
    };
  }

  const system =
    'You are a kind, thoughtful relationship companion. The user is tracking his girlfriend\'s menstrual cycle to better support her. Reply with concrete, gentle, specific suggestions for what HE can do to please and support HER given her current cycle phase, recent moods, and notes. Avoid medical advice. Keep tone warm, not clinical. Return ONLY valid JSON: {"headline": "...", "ideas": ["...", "...", "...", "...", "..."]}. Headline <= 8 words. Each idea <= 18 words.';

  const user = JSON.stringify({
    phase: input.phase,
    day_of_cycle: input.dayOfCycle,
    cycle_length: input.cycleLength,
    recent_moods: input.recentMoods.slice(0, 5),
    recent_notes: input.recentNotes.slice(0, 5).map((n) => ({ date: n.date, content: n.content.slice(0, 200) })),
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
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    return {
      headline: typeof parsed.headline === 'string' ? parsed.headline : 'Some ideas for today',
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 6).map(String) : [],
    };
  } catch (err) {
    return {
      headline: 'Couldn\'t reach AI — here are evergreen ideas',
      ideas: [
        'Send a thoughtful "thinking of you" text',
        'Offer a back rub or warm tea unprompted',
        'Pick up her favourite treat on the way home',
        'Cue up a comfort movie she loves',
        'Listen without trying to fix anything',
      ],
    };
  }
}
