// src/hooks/useActiveSession.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
} from '../services/storage';
import type { ActiveSession, DailyWorkout } from '../types/recommendation';

export interface UseActiveSessionResult {
  session: ActiveSession | null;
  loading: boolean;
  /** Start a brand new session for a given day */
  startSession: (dayIndex: number, dayPlan: DailyWorkout) => Promise<ActiveSession>;
  /** Advance to next exercise; returns updated session or null if finished */
  advanceExercise: () => Promise<ActiveSession | null>;
  /** Mark current exercise as completed (does not advance — call advanceExercise after) */
  markCurrentCompleted: () => Promise<void>;
  /** Replace an exercise in the active session */
  swapExercise: (originalId: string, newId: string) => Promise<void>;
  /** End the session early or when finished */
  endSession: () => Promise<void>;
  /** Reload from storage (useful on app foreground) */
  reload: () => Promise<void>;
}

export function useActiveSession(): UseActiveSessionResult {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const s = await getActiveSession();
    setSession(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const startSession = useCallback(
    async (dayIndex: number, dayPlan: DailyWorkout): Promise<ActiveSession> => {
      const newSession: ActiveSession = {
        startedAt: new Date().toISOString(),
        dayIndex,
        dayPlan,
        currentExerciseIndex: 0,
        completedExerciseIds: [],
        swappedExercises: {},
        sessionDate: new Date().toISOString().slice(0, 10),
      };
      await saveActiveSession(newSession);
      setSession(newSession);
      return newSession;
    },
    []
  );

  const markCurrentCompleted = useCallback(async () => {
    if (!session) return;
    const currentEx = session.dayPlan.exercises[session.currentExerciseIndex];
    if (!currentEx) return;
    if (session.completedExerciseIds.includes(currentEx.exerciseId)) return;
    const updated: ActiveSession = {
      ...session,
      completedExerciseIds: [...session.completedExerciseIds, currentEx.exerciseId],
    };
    await saveActiveSession(updated);
    setSession(updated);
  }, [session]);

  const advanceExercise = useCallback(async (): Promise<ActiveSession | null> => {
    if (!session) return null;
    const nextIndex = session.currentExerciseIndex + 1;
    if (nextIndex >= session.dayPlan.exercises.length) {
      // Session finished — caller should handle completion
      return null;
    }
    const updated: ActiveSession = {
      ...session,
      currentExerciseIndex: nextIndex,
    };
    await saveActiveSession(updated);
    setSession(updated);
    return updated;
  }, [session]);

  const swapExercise = useCallback(
    async (originalId: string, newId: string) => {
      if (!session) return;
      const updated: ActiveSession = {
        ...session,
        swappedExercises: {
          ...session.swappedExercises,
          [originalId]: newId,
        },
      };
      await saveActiveSession(updated);
      setSession(updated);
    },
    [session]
  );

  const endSession = useCallback(async () => {
    await clearActiveSession();
    setSession(null);
  }, []);

  return {
    session,
    loading,
    startSession,
    advanceExercise,
    markCurrentCompleted,
    swapExercise,
    endSession,
    reload,
  };
}
