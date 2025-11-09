import { SavedUserData } from '../types';

const STORAGE_KEY = 'senku_kukaijo_user_data';

export const saveUserData = (data: Omit<SavedUserData, 'timestamp'>): void => {
  const savedData: SavedUserData = {
    ...data,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
};

export const loadUserData = (): SavedUserData | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const parsed: SavedUserData = JSON.parse(data);
    // 24時間以内のデータのみ有効
    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved data:', e);
  }

  return null;
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
