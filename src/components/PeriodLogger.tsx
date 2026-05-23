import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO, startOfDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { palette, phaseColors } from '@/theme/colors';
import { addCycle, getOpenCycle, setCycleEndDate, type Cycle } from '@/lib/db';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type Mode = 'choose' | 'start' | 'end';

export function PeriodLogger({ visible, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [openCycle, setOpenCycle] = useState<Cycle | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode('choose');
    setDate(startOfDay(new Date()));
    setShowPicker(false);
    void getOpenCycle().then(setOpenCycle);
  }, [visible]);

  const onPick = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDate(startOfDay(selected));
  };

  const saveStart = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCycle(format(date, 'yyyy-MM-dd'));
    onSaved();
    onClose();
  };

  const saveEnd = async () => {
    if (!openCycle) return;
    const startDate = parseISO(openCycle.start_date);
    if (date < startDate) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setCycleEndDate(openCycle.id, format(date, 'yyyy-MM-dd'));
    onSaved();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        {mode === 'choose' && (
          <View style={{ gap: 12 }}>
            <Text style={styles.title}>Log a period</Text>

            {openCycle ? (
              <View style={styles.banner}>
                <Text style={styles.bannerEmoji}>{phaseColors.menstrual.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Currently bleeding</Text>
                  <Text style={styles.bannerSub}>Started {format(parseISO(openCycle.start_date), 'EEE, MMM d')}</Text>
                </View>
              </View>
            ) : null}

            {openCycle && (
              <Pressable style={[styles.actionBtn, { backgroundColor: palette.deepRose }]} onPress={() => setMode('end')}>
                <Text style={[styles.actionText, { color: palette.white }]}>Log end date for this period</Text>
              </Pressable>
            )}

            <Pressable style={[styles.actionBtn, { backgroundColor: openCycle ? palette.petalBlush : palette.deepRose }]} onPress={() => setMode('start')}>
              <Text style={[styles.actionText, { color: openCycle ? palette.deepRose : palette.white }]}>
                {openCycle ? 'Log a different period start' : 'Log new period start'}
              </Text>
            </Pressable>

            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {(mode === 'start' || mode === 'end') && (
          <View style={{ gap: 12 }}>
            <Text style={styles.title}>{mode === 'start' ? 'When did her period start?' : 'When did her period end?'}</Text>
            <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateText}>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
              <Text style={styles.dateHint}>Tap to change</Text>
            </Pressable>

            {(showPicker || Platform.OS === 'ios') && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={mode === 'end' && openCycle ? parseISO(openCycle.start_date) : undefined}
                onChange={onPick}
              />
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={[styles.actionBtn, { backgroundColor: palette.petalBlush, flex: 1 }]} onPress={() => setMode('choose')}>
                <Text style={[styles.actionText, { color: palette.deepRose }]}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: palette.deepRose, flex: 1 }]}
                onPress={mode === 'start' ? saveStart : saveEnd}>
                <Text style={[styles.actionText, { color: palette.white }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(58, 38, 48, 0.35)' } as object,
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
    gap: 8,
  },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.petalBlush, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.petalBlush,
    padding: 14,
    borderRadius: 16,
  },
  bannerEmoji: { fontSize: 24 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  bannerSub: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  actionBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  actionText: { fontSize: 15, fontWeight: '700' },
  cancel: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: palette.inkSoft, fontSize: 14 },
  dateBtn: { backgroundColor: palette.white, padding: 16, borderRadius: 14, alignItems: 'center' },
  dateText: { fontSize: 17, fontWeight: '700', color: palette.ink },
  dateHint: { fontSize: 12, color: palette.inkSoft, marginTop: 4 },
});
