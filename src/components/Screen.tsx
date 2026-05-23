import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type RefreshControlProps, type ViewStyle, type StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  topExtra?: number;
};

export function Screen({
  children,
  scroll = true,
  refreshControl,
  contentStyle,
  backgroundColor = palette.cream,
  topExtra = 8,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + topExtra;
  const Body = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={[{ paddingTop, paddingBottom: 120, paddingHorizontal: 18, gap: 14 }, contentStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, backgroundColor, paddingTop, paddingHorizontal: 18 }, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {Body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
