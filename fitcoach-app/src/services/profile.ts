// src/services/profile.ts
// 프로필 AsyncStorage 저장/로드

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_PROFILE, PROFILE_STORAGE_KEY } from '../types/profile';

export const getProfile = async (): Promise<UserProfile> => {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as UserProfile;
    // 누락 필드는 DEFAULT_PROFILE 값으로 보강
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch (e) {
    console.error('[profile] getProfile 실패:', e);
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const current = await getProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('[profile] saveProfile 실패:', e);
    throw e;
  }
};

export const resetProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (e) {
    console.error('[profile] resetProfile 실패:', e);
  }
};
