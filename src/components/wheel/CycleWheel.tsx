import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  RadialGradient,
  vec,
  BlurMask,
  Shadow,
} from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { palette, phaseColors, type PhaseKey } from '@/theme/colors';
import { font } from '@/theme/font';

type Props = {
  size: number;
  phase: PhaseKey;
  dayOfCycle: number;
  cycleLength: number;
  progress: number;
};

const SECTORS: { phase: PhaseKey; weight: number }[] = [
  { phase: 'menstrual', weight: 5 },
  { phase: 'follicular', weight: 9 },
  { phase: 'ovulation', weight: 3 },
  { phase: 'luteal', weight: 11 },
];

const GAP_DEG = 2.2;

function arcStroke(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  const path = Skia.Path.Make();
  path.addArc({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, startDeg, sweepDeg);
  return path;
}

export function CycleWheel({ size, phase, dayOfCycle, cycleLength, progress }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 22;
  const thickness = size * 0.11;
  const totalWeight = SECTORS.reduce((s, x) => s + x.weight, 0);

  let accDeg = -90;
  const sectors = SECTORS.map(({ phase: p, weight }) => {
    const sweep = (weight / totalWeight) * 360;
    const start = accDeg + GAP_DEG / 2;
    const span = sweep - GAP_DEG;
    accDeg += sweep;
    return { phase: p, start, span };
  });

  const indicatorAngle = (-90 + Math.min(1, Math.max(0, progress)) * 360) * (Math.PI / 180);
  const ix = cx + r * Math.cos(indicatorAngle);
  const iy = cy + r * Math.sin(indicatorAngle);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const glowR = useDerivedValue(() => 14 + pulse.value * 14, [pulse]);
  const haloR = useDerivedValue(() => 30 + pulse.value * 24, [pulse]);

  const current = phaseColors[phase];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={thickness + 2} color={palette.white} />

        {sectors.map((s) => {
          const isActive = s.phase === phase;
          return (
            <Path
              key={s.phase}
              path={arcStroke(cx, cy, r, s.start, s.span)}
              style="stroke"
              strokeCap="round"
              strokeWidth={thickness}
              color={isActive ? phaseColors[s.phase].primary : phaseColors[s.phase].soft}
              opacity={isActive ? 1 : 0.9}
            />
          );
        })}

        <Circle cx={ix} cy={iy} r={haloR} opacity={0.45}>
          <RadialGradient c={vec(ix, iy)} r={56} colors={[current.glow, 'rgba(255,255,255,0)']} />
          <BlurMask blur={22} style="normal" />
        </Circle>
        <Circle cx={ix} cy={iy} r={glowR} color={current.glow}>
          <BlurMask blur={12} style="normal" />
        </Circle>
        <Circle cx={ix} cy={iy} r={11} color={palette.white}>
          <Shadow dx={0} dy={2} blur={6} color={palette.shadow} />
        </Circle>
        <Circle cx={ix} cy={iy} r={6} color={current.primary} />

        <Circle cx={cx} cy={cy} r={r - thickness / 2 - 8}>
          <RadialGradient
            c={vec(cx, cy)}
            r={r - thickness / 2 - 8}
            colors={[palette.white, current.soft]}
          />
        </Circle>
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.centerLabel]} pointerEvents="none">
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.dayBig}>Day {dayOfCycle}</Text>
        <Text style={styles.phaseLabel}>{current.label}</Text>
        <Text style={styles.subtle}>of {cycleLength}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerLabel: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 34, marginBottom: 4 },
  dayBig: { fontSize: 42, fontFamily: font.black, color: palette.ink, letterSpacing: -1 },
  phaseLabel: { fontSize: 18, fontFamily: font.italicMedium, color: palette.deepRose, marginTop: 2 },
  subtle: { fontSize: 13, color: palette.inkSoft, marginTop: 2, fontFamily: font.regular },
});
