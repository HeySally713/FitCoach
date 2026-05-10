// src/utils/stats.ts
// 운동 기록 통계 계산 유틸

import { WorkoutSession, WorkoutExercise } from '../types/workout';

export type StatsPeriod = 'week' | 'month' | 'year';

export interface WeeklyStats {
  workoutDays: number;        // 운동한 날 수
  totalDurationMin: number;   // 총 운동 시간 (cardio + 추정 weight)
  totalCalories: number;      // 총 칼로리 (cardio만)
  totalSets: number;          // 총 세트 수 (weight만)
  goalDays: number;           // 목표 횟수 (프로필)
  achievementRate: number;    // 달성률 0~1
}

export interface CategoryStats {
  category: string;
  label: string;
  emoji: string;
  count: number;              // 운동 횟수 (exercise 단위)
  durationMin: number;
  calories: number;
  bodyPartBreakdown: { bodyPart: string; count: number }[];
}

export interface WeekBucket {
  weekLabel: string;          // "5/5~5/11"
  weekStart: string;          // ISO date
  count: number;              // 운동 일수
  totalDurationMin: number;
  totalCalories: number;
}

export interface TopExercise {
  exerciseName: string;
  count: number;              // 등장 횟수
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  reps: number;
  date: string;
}

// ─── 기간 필터 ────────────────────────────────────────────

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 이번 주 월요일 ~ 일요일 */
const getWeekRange = (base: Date = new Date()): [Date, Date] => {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0(Sun) ~ 6(Sat)
  const diff = day === 0 ? -6 : 1 - day; // 월요일로
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return [start, end];
};

/** 이번 달 1일 ~ 말일 */
const getMonthRange = (base: Date = new Date()): [Date, Date] => {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return [start, end];
};

/** 올해 1월 1일 ~ 12월 31일 */
const getYearRange = (base: Date = new Date()): [Date, Date] => {
  const start = new Date(base.getFullYear(), 0, 1);
  const end = new Date(base.getFullYear(), 11, 31, 23, 59, 59, 999);
  return [start, end];
};

export const filterSessionsByPeriod = (
  sessions: WorkoutSession[],
  period: StatsPeriod,
): WorkoutSession[] => {
  const [start, end] = period === 'week'
    ? getWeekRange()
    : period === 'month'
    ? getMonthRange()
    : getYearRange();
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return sessions.filter((s) => s.date >= startStr && s.date <= endStr);
};

// ─── 운동 시간 추정 (weight) ──────────────────────────────
// weight 운동은 duration이 없으므로 세트당 평균 시간으로 추정
const ESTIMATED_MIN_PER_SET = 2; // 세트당 2분 (휴식 포함)

const getExerciseDuration = (ex: WorkoutExercise): number => {
  if (ex.equipmentType === 'cardio') {
    return ex.sets.reduce((sum, s) => sum + (s.duration ?? 0), 0);
  }
  return ex.sets.length * ESTIMATED_MIN_PER_SET;
};

const getExerciseCalories = (ex: WorkoutExercise): number => {
  if (ex.equipmentType === 'cardio') {
    return ex.sets.reduce((sum, s) => sum + (s.calories ?? 0), 0);
  }
  return 0; // weight 운동은 칼로리 미계산 (추후 MET 추정 가능)
};

// ─── 1. 주간 요약 ────────────────────────────────────────

export const getWeeklyStats = (
  sessions: WorkoutSession[],
  weeklyGoal: number = 3,
): WeeklyStats => {
  const filtered = filterSessionsByPeriod(sessions, 'week');
  const workoutDays = filtered.length;
  let totalDurationMin = 0;
  let totalCalories = 0;
  let totalSets = 0;

  filtered.forEach((session) => {
    session.exercises.forEach((ex) => {
      totalDurationMin += getExerciseDuration(ex);
      totalCalories += getExerciseCalories(ex);
      if (ex.equipmentType !== 'cardio') {
        totalSets += ex.sets.length;
      }
    });
  });

  return {
    workoutDays,
    totalDurationMin: Math.round(totalDurationMin),
    totalCalories: Math.round(totalCalories),
    totalSets,
    goalDays: weeklyGoal,
    achievementRate: weeklyGoal > 0 ? Math.min(workoutDays / weeklyGoal, 1) : 0,
  };
};

// ─── 2. 카테고리별 통계 + 부위 드릴다운 ──────────────────

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  gym:    { label: '헬스장', emoji: '🏋️' },
  home:   { label: '홈트',   emoji: '🏠' },
  cardio: { label: '유산소', emoji: '🏃' },
  yoga:   { label: '요가',   emoji: '🧘' },
};

export const getCategoryStats = (
  sessions: WorkoutSession[],
  period: StatsPeriod,
): CategoryStats[] => {
  const filtered = filterSessionsByPeriod(sessions, period);

  // category -> exercises 누적
  const map = new Map<string, {
    count: number;
    durationMin: number;
    calories: number;
    bodyParts: Map<string, number>;
  }>();

  filtered.forEach((session) => {
    session.exercises.forEach((ex) => {
      const cat = ex.category || 'gym';
      if (!map.has(cat)) {
        map.set(cat, { count: 0, durationMin: 0, calories: 0, bodyParts: new Map() });
      }
      const bucket = map.get(cat)!;
      bucket.count += 1;
      bucket.durationMin += getExerciseDuration(ex);
      bucket.calories += getExerciseCalories(ex);
      const bp = ex.bodyPart || '미분류';
      bucket.bodyParts.set(bp, (bucket.bodyParts.get(bp) ?? 0) + 1);
    });
  });

  // 모든 카테고리 표시 (값 0이어도)
  return Object.keys(CATEGORY_LABELS).map((cat) => {
    const data = map.get(cat);
    const meta = CATEGORY_LABELS[cat];
    return {
      category: cat,
      label: meta.label,
      emoji: meta.emoji,
      count: data?.count ?? 0,
      durationMin: Math.round(data?.durationMin ?? 0),
      calories: Math.round(data?.calories ?? 0),
      bodyPartBreakdown: data
        ? Array.from(data.bodyParts.entries())
            .map(([bp, c]) => ({ bodyPart: bp, count: c }))
            .sort((a, b) => b.count - a.count)
        : [],
    };
  });
};

// ─── 3. 주간 추이 그래프 ─────────────────────────────────

export const getWeeklyTrend = (
  sessions: WorkoutSession[],
  weekCount: number = 4,
): WeekBucket[] => {
  const buckets: WeekBucket[] = [];
  const today = new Date();

  for (let i = weekCount - 1; i >= 0; i--) {
    const ref = new Date(today);
    ref.setDate(ref.getDate() - i * 7);
    const [start, end] = getWeekRange(ref);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const inRange = sessions.filter((s) => s.date >= startStr && s.date <= endStr);

    let totalDurationMin = 0;
    let totalCalories = 0;
    inRange.forEach((session) => {
      session.exercises.forEach((ex) => {
        totalDurationMin += getExerciseDuration(ex);
        totalCalories += getExerciseCalories(ex);
      });
    });

    const label = `${start.getMonth() + 1}/${start.getDate()}~${end.getMonth() + 1}/${end.getDate()}`;

    buckets.push({
      weekLabel: label,
      weekStart: startStr,
      count: inRange.length,
      totalDurationMin: Math.round(totalDurationMin),
      totalCalories: Math.round(totalCalories),
    });
  }

  return buckets;
};

// ─── 4. 누적 통계 ────────────────────────────────────────

export const getTotalWorkoutDays = (sessions: WorkoutSession[]): number => {
  return new Set(sessions.map((s) => s.date)).size;
};

export const getTopExercises = (
  sessions: WorkoutSession[],
  topN: number = 3,
): TopExercise[] => {
  const counter = new Map<string, number>();
  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      counter.set(ex.exerciseName, (counter.get(ex.exerciseName) ?? 0) + 1);
    });
  });
  return Array.from(counter.entries())
    .map(([name, count]) => ({ exerciseName: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
};

export const getPersonalRecords = (
  sessions: WorkoutSession[],
): PersonalRecord[] => {
  const records = new Map<string, PersonalRecord>();

  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      if (ex.equipmentType === 'cardio') return;
      ex.sets.forEach((s) => {
        if (!s.weight || s.weight <= 0) return;
        const cur = records.get(ex.exerciseName);
        if (!cur || s.weight > cur.maxWeight) {
          records.set(ex.exerciseName, {
            exerciseName: ex.exerciseName,
            maxWeight: s.weight,
            reps: s.reps ?? 0,
            date: session.date,
          });
        }
      });
    });
  });

  return Array.from(records.values()).sort((a, b) => b.maxWeight - a.maxWeight);
};
