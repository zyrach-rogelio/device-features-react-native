import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelEntry } from '../types';

const STORAGE_KEY = '@travel_diary:entries';

export async function getEntries(): Promise<TravelEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TravelEntry[];
  } catch (error) {
    console.error('[Storage] Failed to get entries:', error);
    return [];
  }
}

export async function saveEntries(entries: TravelEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[Storage] Failed to save entries:', error);
    throw new Error('Could not save entries to storage.');
  }
}

export async function addEntry(entry: TravelEntry): Promise<TravelEntry[]> {
  const existing = await getEntries();
  const updated = [entry, ...existing];
  await saveEntries(updated);
  return updated;
}

export async function removeEntryById(id: string): Promise<TravelEntry[]> {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid entry ID provided.');
  }
  const existing = await getEntries();
  const updated = existing.filter((e) => e.id !== id);
  await saveEntries(updated);
  return updated;
}