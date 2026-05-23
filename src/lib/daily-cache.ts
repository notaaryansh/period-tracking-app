import { getDb } from './db';
import { fetchDaily, type DailyInput, type DailyPayload } from './openai';

async function readCache(date: string): Promise<DailyPayload | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [`daily:${date}`]);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as DailyPayload;
  } catch {
    return null;
  }
}

async function writeCache(date: string, payload: DailyPayload): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [`daily:${date}`, JSON.stringify(payload)]
  );
}

export async function getDaily(input: DailyInput, force = false): Promise<DailyPayload> {
  if (!force) {
    const cached = await readCache(input.date);
    if (cached) return cached;
  }
  const fresh = await fetchDaily(input);
  await writeCache(input.date, fresh);
  return fresh;
}
