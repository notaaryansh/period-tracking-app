import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  SweepGradient,
  vec,
  BlurMask,
  Shadow,
  Paint,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
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

function arcPath(cx: number, cy: number, r: number, startRad: number, endRad: number, thickness: number) {
  const p = Skia.Path.Make();
  const outerStart = { x: cx + r * Math.cos(startRad), y: cy + r * Math.sin(startRad) };
  const innerR = r - thickness;
  p.moveTo(outerStart.x, outerStart.y);
  p.addArc(
    { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
    (startRad * 180) / Math.PI,
    ((endRad - startRad) * 180) / Math.PI
  );
  const innerEnd = { x: cx + innerR * Math.cos(endRad), y: cy + innerR * Math.sin(endRad) };
  p.lineTo(innerEnd.x, innerEnd.y);
  p.addArc(
    { x: cx - innerR, y: cy - innerR, width: innerR * 2, height: innerR * 2 },
    (endRad * 180) / Math.PI,
    -((endRad - startRad) * 180) / Math.PI
  );
  p.close();
  return p;
}

export function CycleWheel({ size, phase, dayOfCycle, cycleLength, progress }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const thickness = size * 0.16;

  const totalWeight = SECTORS.reduce((s, x) => s + x.weight, 0);
  const sectors = useMemo(() => {
    let acc = -Math.PI / 2;
    return SECTORS.map(({ phase: p, weight }) => {
      const start = acc;
      const end = acc + (weight / totalWeight) * Math.PI * 2;
      acc = end;
      return { phase: p, start, end };
    });
  }, [totalWeight]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const glowRadius = useDerivedValue(() => 18 + pulse.value * 14, [pulse]);

  const indicatorAngle = -Math.PI / 2 + Math.min(1, Math.max(0, progress)) * Math.PI * 2;
  const ix = cx + (r - thickness / 2) * Math.cos(indicatorAngle);
  const iy = cy + (r - thickness / 2) * Math.sin(indicatorAngle);

  const current = phaseColors[phase];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        <Group>
          <Circle cx={cx} cy={cy} r={r + 4} color={palette.white}>
            <Shadow dx={0} dy={6} blur={18} color={palette.shadow} />
          </Circle>
        </Group>
        {sectors.map((s) => (
          <Path
            key={s.phase}
            path={arcPath(cx, cy, r, s.start, s.end, thickness)}
            color={phaseColors[s.phase].soft}>
            {phase === s.phase && <BlurMask blur={0.5} style="solid" />}
          </Path>
        ))}
        {sectors
          .filter((s) => s.phase === phase)
          .map((s) => (
            <Path
              key={`active-${s.phase}`}
              path={arcPath(cx, cy, r, s.start, s.end, thickness)}>
              <Paint>
                <SweepGradient
                  c={vec(cx, cy)}
                  colors={[
                    phaseColors[s.phase].primary,
                    phaseColors[s.phase].soft,
                    phaseColors[s.phase].primary,
                  ]}
                />
              </Paint>
              <BlurMask blur={2} style="solid" />
            </Path>
          ))}
        <Circle cx={ix} cy={iy} r={glowRadius} color={current.glow}>
          <BlurMask blur={18} style="normal" />
        </Circle>
        <Circle cx={ix} cy={iy} r={10} color={palette.white} />
        <Circle cx={ix} cy={iy} r={6} color={current.primary} />
        <Circle cx={cx} cy={cy} r={r - thickness - 8} color={palette.cream}>
          <Shadow dx={0} dy={2} blur={10} color={palette.shadow} inner />
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
  emoji: { fontSize: 36, marginBottom: 4 },
  dayBig: { fontSize: 34, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 },
  phaseLabel: { fontSize: 18, fontWeight: '600', color: palette.deepRose, marginTop: 2 },
  subtle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
});
