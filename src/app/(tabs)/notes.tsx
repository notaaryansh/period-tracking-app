import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/cards/Card';
import { palette } from '@/theme/colors';
import { addNote, deleteNote, listNotes, updateNote, type Note } from '@/lib/db';
import { todayISO } from '@/lib/cycle';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [tags, setTags] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setNotes(await listNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onSubmit = async () => {
    const content = draft.trim();
    if (!content) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingId != null) {
      await updateNote(editingId, content, tags.trim() || null);
    } else {
      await addNote(todayISO(), content, tags.trim() || null);
    }
    setDraft('');
    setTags('');
    setEditingId(null);
    await load();
  };

  const onEdit = (n: Note) => {
    setEditingId(n.id);
    setDraft(n.content);
    setTags(n.tags ?? '');
  };

  const onDelete = (n: Note) => {
    Alert.alert('Delete note?', n.content.slice(0, 60), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(n.id);
          if (editingId === n.id) {
            setEditingId(null);
            setDraft('');
            setTags('');
          }
          await load();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: palette.cream }} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Notes</Text>

        <Card title={editingId ? 'Edit note' : 'New note'} subtitle={format(new Date(), 'EEEE, MMM d')}>
          <TextInput
            style={[styles.input, { minHeight: 110 }]}
            placeholder="Anything to remember? Things she said, gifts ideas, patterns..."
            placeholderTextColor={palette.inkSoft}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Tags (comma-separated)"
            placeholderTextColor={palette.inkSoft}
            value={tags}
            onChangeText={setTags}
          />
          <View style={styles.row}>
            {editingId != null && (
              <Pressable
                style={[styles.btn, { backgroundColor: palette.petalBlush, flex: 1 }]}
                onPress={() => {
                  setEditingId(null);
                  setDraft('');
                  setTags('');
                }}>
                <Text style={[styles.btnText, { color: palette.deepRose }]}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.btn, { backgroundColor: draft.trim() ? palette.deepRose : palette.petalBlush, flex: 1 }]}
              disabled={!draft.trim()}
              onPress={onSubmit}>
              <Text style={[styles.btnText, { color: draft.trim() ? palette.white : palette.deepRose }]}>
                {editingId != null ? 'Update' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </Card>

        <Card title={`All notes (${notes.length})`}>
          {notes.length === 0 ? (
            <Text style={styles.empty}>No notes yet — write your first one above.</Text>
          ) : (
            notes.map((n) => (
              <Pressable key={n.id} onPress={() => onEdit(n)} onLongPress={() => onDelete(n)} style={styles.noteRow}>
                <Text style={styles.noteContent}>{n.content}</Text>
                <View style={styles.noteMetaRow}>
                  <Text style={styles.noteDate}>{format(new Date(n.date), 'MMM d, yyyy')}</Text>
                  {n.tags && <Text style={styles.noteTags}>#{n.tags.split(',').map((s) => s.trim()).join(' #')}</Text>}
                </View>
              </Pressable>
            ))
          )}
          {notes.length > 0 && <Text style={styles.hint}>Tap to edit · Long-press to delete</Text>}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 14, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: palette.ink, letterSpacing: -0.5 },
  input: {
    borderRadius: 12,
    backgroundColor: palette.cream,
    padding: 12,
    fontSize: 14,
    color: palette.ink,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 14 },
  empty: { color: palette.inkSoft, fontSize: 14, fontStyle: 'italic' },
  noteRow: { paddingVertical: 10, borderBottomColor: palette.petalBlush, borderBottomWidth: StyleSheet.hairlineWidth },
  noteContent: { fontSize: 15, color: palette.ink, lineHeight: 21 },
  noteMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  noteDate: { fontSize: 12, color: palette.inkSoft },
  noteTags: { fontSize: 12, color: palette.deepRose },
  hint: { fontSize: 11, color: palette.inkSoft, marginTop: 10, textAlign: 'center' },
});
