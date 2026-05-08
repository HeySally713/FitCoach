// src/utils/streak.ts
// 운동 스트릭(연속 운동 일수) 계산

import { WorkoutSession } from '../types/workout';

/**
 * 연속 운동 일수 계산 (Duolingo 스타일)
 * - 오늘 운동 O → 오늘부터 거꾸로 연속 일수
 * - 오늘 운동 X, 어제 O → 어제부터 거꾸로 연속 일수 (자정 지나기 전까지 유지)
 * - 그제 이전까지만 → 0 (스트릭 끊김)
 */
export const calculateStreak = (sessions: WorkoutSession[]): number => {
  if (sessions.length === 0) return 0;

  // 운동한 날짜를 Set으로 (YYYY-MM-DD 형식)
  const dateSet = new Set(sessions.map((s) => s.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 시작점: 오늘 운동했으면 오늘부터, 안 했으면 어제부터
  const cursor = new Date(today);
  if (!dateSet.has(formatDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    // 어제도 안 했으면 스트릭 0
    if (!dateSet.has(formatDate(cursor))) return 0;
  }

  // 연속 일수 카운트
  let streak = 0;
  while (dateSet.has(formatDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

/**
 * 오늘 운동했는지 여부 (UI 강조용)
 */
export const didWorkoutToday = (sessions: WorkoutSession[]): boolean => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return sessions.some((s) => s.date === todayStr);
};

