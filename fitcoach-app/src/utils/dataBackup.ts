// src/utils/dataBackup.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupBundle {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
}

/**
 * Export all FitCoach data from AsyncStorage
 * Returns a JSON-serializable object containing every key-value pair.
 */
export const exportAllData = async (): Promise<BackupBundle> => {
  const allKeys = await AsyncStorage.getAllKeys();
  const fitcoachKeys = allKeys.filter(k => k.startsWith('@FitCoach'));
  const pairs = await AsyncStorage.multiGet(fitcoachKeys);

  const data: Record<string, any> = {};
  for (const [key, value] of pairs) {
    if (value === null) continue;
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value; // fallback to raw string
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
};

/**
 * Restore from a previously exported BackupBundle.
 * Overwrites any existing FitCoach data.
 */
export const importAllData = async (bundle: BackupBundle): Promise<number> => {
  if (!bundle?.data) throw new Error('Invalid backup bundle');
  const entries = Object.entries(bundle.data);
  const pairs: [string, string][] = entries.map(([k, v]) => [
    k,
    typeof v === 'string' ? v : JSON.stringify(v),
  ]);
  await AsyncStorage.multiSet(pairs);
  return pairs.length;
};

/**
 * Delete all FitCoach data (use with caution — for testing/reset).
 */
export const clearAllData = async (): Promise<number> => {
  const allKeys = await AsyncStorage.getAllKeys();
  const fitcoachKeys = allKeys.filter(k => k.startsWith('@FitCoach'));
  await AsyncStorage.multiRemove(fitcoachKeys);
  return fitcoachKeys.length;
};
