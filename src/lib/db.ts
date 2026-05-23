import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bloom.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cycles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_date TEXT NOT NULL UNIQUE,
          end_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS moods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          phase TEXT NOT NULL,
          mood TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          content TEXT NOT NULL,
          tags TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_moods_date ON moods(date);
        CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);
      `);
      const seeded = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['avg_cycle_length']
      );
      if (!seeded) {
        await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['avg_cycle_length', '28']);
        await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['luteal_length', '14']);
      }
      return db;
    });
  }
  return dbPromise;
}

export type Cycle = {
  id: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Mood = {
  id: number;
  date: string;
  phase: string;
  mood: string;
  note: string | null;
  created_at: string;
};

export type Note = {
  id: number;
  date: string;
  content: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function listCycles(limit = 50): Promise<Cycle[]> {
  const db = await getDb();
  return db.getAllAsync<Cycle>('SELECT * FROM cycles ORDER BY start_date DESC LIMIT ?', [limit]);
}

export async function addCycle(startDate: string, endDate?: string | null, notes?: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO cycles (start_date, end_date, notes) VALUES (?, ?, ?) ON CONFLICT(start_date) DO UPDATE SET end_date = excluded.end_date, notes = excluded.notes',
    [startDate, endDate ?? null, notes ?? null]
  );
}

export async function deleteCycle(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cycles WHERE id = ?', [id]);
}

export async function listMoods(limit = 100): Promise<Mood[]> {
  const db = await getDb();
  return db.getAllAsync<Mood>('SELECT * FROM moods ORDER BY date DESC, id DESC LIMIT ?', [limit]);
}

export async function addMood(date: string, phase: string, mood: string, note?: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO moods (date, phase, mood, note) VALUES (?, ?, ?, ?)', [date, phase, mood, note ?? null]);
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY date DESC, id DESC');
}

export async function addNote(date: string, content: string, tags?: string | null): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync('INSERT INTO notes (date, content, tags) VALUES (?, ?, ?)', [date, content, tags ?? null]);
  return result.lastInsertRowId;
}

export async function updateNote(id: number, content: string, tags?: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE notes SET content = ?, tags = ?, updated_at = datetime('now') WHERE id = ?",
    [content, tags ?? null, id]
  );
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}
