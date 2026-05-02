// src/hooks/useExerciseVideos.ts
// 운동별 YouTube 영상을 검색하고 30일 캐싱하는 커스텀 훅

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  searchExerciseVideos,
  ExerciseVideo,
  SearchVideosParams,
} from '../services/youtube';

// ===== 캐시 설정 =====
const CACHE_PREFIX = '@FitCoach/videoCache/';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

interface CachedEntry {
  videos: ExerciseVideo[];
  cachedAt: number; // timestamp
}

// 캐시 키 생성 (cardio는 duration까지 포함)
function buildCacheKey(params: SearchVideosParams): string {
  if (params.equipmentType === 'cardio' && params.cardioDuration) {
    return `${CACHE_PREFIX}${params.exerciseName}__${params.cardioDuration}min`;
  }
  return `${CACHE_PREFIX}${params.exerciseName}`;
}

// ===== 캐시 읽기 =====
async function readCache(key: string): Promise<ExerciseVideo[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const entry: CachedEntry = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;

    if (age > CACHE_TTL_MS) {
      // 30일 지난 캐시 → 무효
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.videos;
  } catch (err) {
    console.warn('[Cache] 읽기 실패:', err);
    return null;
  }
}

// ===== 캐시 쓰기 =====
async function writeCache(key: string, videos: ExerciseVideo[]): Promise<void> {
  try {
    const entry: CachedEntry = {
      videos,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn('[Cache] 쓰기 실패:', err);
  }
}

// ===== Hook =====
export interface UseExerciseVideosResult {
  videos: ExerciseVideo[];
  loading: boolean;
  error: string | null;
}

/**
 * 운동 정보로 YouTube 영상을 검색하고 30일 캐싱하는 훅
 * @param params 검색 파라미터 (null이면 검색 안 함)
 */
export function useExerciseVideos(
  params: SearchVideosParams | null
): UseExerciseVideosResult {
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params) {
      setVideos([]);
      setError(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const cacheKey = buildCacheKey(params);

    const loadVideos = async () => {
      setLoading(true);
      setError(null);

      // 1. 캐시 확인
      const cached = await readCache(cacheKey);
      if (cached && !isCancelled) {
        console.log(`[Cache] HIT: ${cacheKey}`);
        setVideos(cached);
        setLoading(false);
        return;
      }

      // 2. 캐시 미스 → API 호출
      console.log(`[Cache] MISS: ${cacheKey}`);
      try {
        const results = await searchExerciseVideos(params);

        if (isCancelled) return;

        if (results.length === 0) {
          setError('관련 영상을 찾지 못했어요.');
          setVideos([]);
        } else {
          await writeCache(cacheKey, results);
          setVideos(results);
        }
      } catch (err) {
        if (isCancelled) return;
        setError('영상을 불러오는 중 오류가 발생했어요.');
        setVideos([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadVideos();

    return () => {
      isCancelled = true;
    };
  }, [
    params?.exerciseName,
    params?.equipmentType,
    params?.cardioDuration,
  ]);

  return { videos, loading, error };
}
