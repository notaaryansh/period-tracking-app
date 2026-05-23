import { View, StyleSheet, Text, type ViewStyle } from 'react-native';
import { palette } from '@/theme/colors';

type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  tint?: string;
};

export function Card({ title, subtitle, children, style, tint }: Props) {
  return (
    <View style={[styles.card, tint ? { backgroundColor: tint } : null, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: palette.deepRose,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: '700', color: palette.ink, marginBottom: 2 },
  subtitle: { fontSize: 13, color: palette.inkSoft, marginBottom: 10 },
});
