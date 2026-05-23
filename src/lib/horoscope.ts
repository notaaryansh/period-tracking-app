export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const SIGN_EMOJI: Record<ZodiacSign, string> = {
  Aries: '♈️',
  Taurus: '♉️',
  Gemini: '♊️',
  Cancer: '♋️',
  Leo: '♌️',
  Virgo: '♍️',
  Libra: '♎️',
  Scorpio: '♏️',
  Sagittarius: '♐️',
  Capricorn: '♑️',
  Aquarius: '♒️',
  Pisces: '♓️',
};
