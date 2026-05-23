export const palette = {
  sakura: '#FFB7C5',
  petalBlush: '#FFD9DD',
  wildflowerLavender: '#E0BBE4',
  cream: '#FFF5F0',
  deepRose: '#D4798A',
  moss: '#C8D5B9',
  ink: '#3A2630',
  inkSoft: '#6B4A57',
  white: '#FFFFFF',
  shadow: 'rgba(212, 121, 138, 0.18)',
};

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const phaseColors: Record<PhaseKey, { primary: string; soft: string; glow: string; label: string; emoji: string }> = {
  menstrual: {
    primary: '#D4798A',
    soft: '#FFD9DD',
    glow: 'rgba(212, 121, 138, 0.55)',
    label: 'Menstrual',
    emoji: '\u{1F338}',
  },
  follicular: {
    primary: '#E0BBE4',
    soft: '#F2DDF5',
    glow: 'rgba(224, 187, 228, 0.55)',
    label: 'Follicular',
    emoji: '\u{1F33C}',
  },
  ovulation: {
    primary: '#FFB7C5',
    soft: '#FFE3E8',
    glow: 'rgba(255, 183, 197, 0.65)',
    label: 'Ovulation',
    emoji: '\u{1F33A}',
  },
  luteal: {
    primary: '#C8D5B9',
    soft: '#E3ECDA',
    glow: 'rgba(200, 213, 185, 0.55)',
    label: 'Luteal',
    emoji: '\u{1F33F}',
  },
};
