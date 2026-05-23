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

function ringArc(cx: number, cy: number, r: number, start: number, end: number, thickness: number) {
  const inner = r - thickness;
  const path = Skia.Path.Make();
  const startDeg = (start * 180) / Math.PI;
  const sweepDeg = ((end - start) * 180) / Math.PI;
  path.addArc({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, startDeg, sweepDeg);
  const innerEndX = cx + inner * Math.cos(end);
  const innerEndY = cy + inner * Math.sin(end);
  path.lineTo(innerEndX, innerEndY);
  path.addArc(
    { x: cx - inner, y: cy - inner, width: inner * 2, height: inner * 2 },
    startDeg + sweepDeg,
    -sweepDeg
  );
  path.close();
  return path;
}

export function CycleWheel({ size, phase, dayOfCycle, cycleLength, progress }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const thickness = size * 0.13;
  const totalWeight = SECTORS.reduce((s, x) => s + x.weight, 0);

  let acc = -Math.PI / 2;
  const sectors = SECTORS.map(({ phase: p, weight }) => {
    const start = acc;
    const end = acc + (weight / totalWeight) * Math.PI * 2;
    acc = end;
    return { phase: p, start, end };
  });

  const indicatorAngle = -Math.PI / 2 + Math.min(1, Math.max(0, progress)) * Math.PI * 2;
  const ix = cx + (r - thickness / 2) * Math.cos(indicatorAngle);
  const iy = cy + (r - thickness / 2) * Math.sin(indicatorAngle);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const glowR = useDerivedValue(() => 14 + pulse.value * 14, [pulse]);
  const haloR = useDerivedValue(() => 26 + pulse.value * 22, [pulse]);

  const current = phaseColors[phase];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        {sectors.map((s) => {
          const isActive = s.phase === phase;
          return (
            <Path
              key={s.phase}
              path={ringArc(cx, cy, r, s.start, s.end, thickness)}
              color={isActive ? phaseColors[s.phase].primary : phaseColors[s.phase].soft}
              opacity={isActive ? 1 : 0.85}>
              {isActive && <BlurMask blur={1.2} style="solid" />}
            </Path>
          );
        })}

        <Circle cx={ix} cy={iy} r={haloR} opacity={0.5}>
          <RadialGradient c={vec(ix, iy)} r={48} colors={[current.glow, 'rgba(255,255,255,0)']} />
          <BlurMask blur={20} style="normal" />
        </Circle>
        <Circle cx={ix} cy={iy} r={glowR} color={current.glow}>
          <BlurMask blur={12} style="normal" />
        </Circle>
        <Circle cx={ix} cy={iy} r={11} color={palette.white}>
          <Shadow dx={0} dy={2} blur={6} color={palette.shadow} />
        </Circle>
        <Circle cx={ix} cy={iy} r={6} color={current.primary} />

        <Circle cx={cx} cy={cy} r={r - thickness - 6}>
          <RadialGradient c={vec(cx, cy)} r={r - thickness - 6} colors={[palette.white, current.soft]} />
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
  dayBig: { fontSize: 36, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  phaseLabel: { fontSize: 17, fontWeight: '600', color: palette.deepRose, marginTop: 2 },
  subtle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
});
