import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/cards/Card';
import { palette } from '@/theme/colors';
import { font } from '@/theme/font';
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
    <Screen>
      <Text style={styles.title}>Notes</Text>

      <Card title={editingId ? 'Edit note' : 'New note'} subtitle={format(new Date(), 'EEEE, MMM d')}>
        <TextInput
          style={[styles.input, { minHeight: 110 }]}
          placeholder="Anything to remember? Things she said, gift ideas, patterns..."
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontFamily: font.extrabold, color: palette.ink, letterSpacing: -0.7 },
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
  btnText: { fontFamily: font.bold, fontSize: 14 },
  empty: { color: palette.inkSoft, fontSize: 14, fontStyle: 'italic' },
  noteRow: { paddingVertical: 10, borderBottomColor: palette.petalBlush, borderBottomWidth: StyleSheet.hairlineWidth },
  noteContent: { fontSize: 15, color: palette.ink, lineHeight: 21 },
  noteMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  noteDate: { fontSize: 12, color: palette.inkSoft },
  noteTags: { fontSize: 12, color: palette.deepRose },
  hint: { fontSize: 11, color: palette.inkSoft, marginTop: 10, textAlign: 'center' },
});
