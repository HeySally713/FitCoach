// src/hooks/useWorkoutHistory.ts
// 운동 기록 조회 + 자동 새로고침 훅

import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '../types/workout';
import { getAllSessions } from '../services/storage';

export interface UseWorkoutHistoryResult {
  sessions: WorkoutSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorkoutHistory(): UseWorkoutHistoryResult {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (e) {
      console.error('[useWorkoutHistory] 조회 실패:', e);
      setError('운동 기록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, error, refresh };
}
