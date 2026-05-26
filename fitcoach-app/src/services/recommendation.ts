// src/services/recommendation.ts
import { UserProfile, FitnessGoal, ExperienceLevel } from '../types/profile';
import {
  DBExercise, MovementPattern, RoutineExercise, DailyWorkout,
  WeeklyPlan, SplitType, GoalTarget, ExerciseCategory,
} from '../types/recommendation';
import { EXERCISES, getGoalTarget, findById } from '../data/exerciseDB';

// ─────────────────────────────────────────
// 0. SEEDED RANDOMNESS for weekly rotation
// ─────────────────────────────────────────

// Simple deterministic PRNG (Mulberry32). Same seed → same sequence.
const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Returns the ISO week number (1-53) of a given date.
// Same week (Mon-Sun) → same number.
export const getISOWeek = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Build a stable seed from year + week + goal + frequency.
// Goal/frequency are mixed in so different users with different goals
// don't all see the same exact rotation each week.
const buildWeeklySeed = (date: Date, goal: string, frequency: number): number => {
  const week = getISOWeek(date);
  const year = date.getFullYear();
  const goalHash = goal.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return Math.abs(year * 1000 + week * 13 + goalHash + frequency * 7);
};


// ─────────────────────────────────────────
// 1. FILTER — environment, difficulty, safety
// ─────────────────────────────────────────
const DIFFICULTY_RANK: Record<ExperienceLevel, number> = { '초급': 1, '중급': 2, '고급': 3 };

const filterCandidates = (profile: UserProfile): DBExercise[] => {
  const userLevel = DIFFICULTY_RANK[profile.experience ?? '초급'];
  const envs = profile.environments ?? ['gym'];
  const injuries = profile.injuries ?? [];

  return EXERCISES.filter(ex => {
    // (a) Environment match (gym users can do home; home users can't do gym)
    if (envs.includes('gym')) {
      // gym user: anything except outdoor cardio (still allowed if they checked outdoor)
      if (ex.location === 'outdoor' && !envs.includes('outdoor')) return false;
    } else {
      if (!envs.includes(ex.location)) return false;
    }

    // (b) Difficulty: at most one level above user
    if (DIFFICULTY_RANK[ex.difficulty] > userLevel + 1) return false;

    // (c) Beginner safety filter for 초급
    if (userLevel === 1 && ex.tags?.beginner_safe === false) return false;

    // (d) Injury-based contraindications
    if (injuries.includes('knee')   && ex.tags?.knee_friendly === false)   return false;
    if (injuries.includes('back')   && ex.tags?.back_friendly === false)   return false;
    if (injuries.includes('shoulder') && ex.tags?.shoulder_friendly === false) return false;

    // (e) Disliked exercises
    if (profile.dislikedExercises?.includes(ex.exercise_id)) return false;

    // (f) Spotter requirement when training alone (assume yes for MVP)
    if (ex.tags?.requires_spotter === true && userLevel < 3) return false;

    return true;
  });
};

// ─────────────────────────────────────────
// 2. SCORE — goal score + diversity bonus
// ─────────────────────────────────────────
const scoreExercise = (ex: DBExercise, goal: FitnessGoal, preferredParts: string[]): number => {
  const base = ex.goal_scores[goal] ?? 5;
  let bonus = 0;
  // preferred body parts boost
  if (preferredParts.length > 0) {
    const match = ex.primary_muscles.some(m =>
      preferredParts.some(p => m.includes(p))
    );
    if (match) bonus += 1.5;
  }
  // compound movements get a small universal bonus (efficiency)
  if (ex.tags?.is_compound) bonus += 0.5;
  return base + bonus;
};

// ─────────────────────────────────────────
// 3. SPLIT — choose layout based on frequency + goal
// ─────────────────────────────────────────
const chooseSplit = (goal: FitnessGoal, frequency: number): SplitType => {
  if (goal === 'flexibility') return 'flexibility_focus';
  if (goal === 'endurance' && frequency <= 3) return 'cardio_focus';
  if (frequency <= 2) return 'full_body';
  if (frequency === 3) return 'full_body';
  if (frequency === 4) return 'upper_lower';
  return 'push_pull_legs'; // 5+ days
};

// Movement pattern groups for each split's focus day
const PATTERN_GROUPS: Record<string, MovementPattern[]> = {
  push:  ['horizontal_push','vertical_push','horizontal_push_iso','elbow_extension'],
  pull:  ['horizontal_pull','vertical_pull','horizontal_pull_iso','elbow_flexion','scapular_elevation'],
  legs:  ['squat','hip_hinge','lunge','hip_extension','knee_extension','knee_flexion','calf_raise' as MovementPattern],
  upper: ['horizontal_push','vertical_push','horizontal_pull','vertical_pull','elbow_flexion','elbow_extension','shoulder_abduction'],
  lower: ['squat','hip_hinge','lunge','hip_extension','knee_extension','knee_flexion'],
  core:  ['trunk_flexion','trunk_rotation','isometric','hip_flexion'],
  cardio:['cardio_steady','cardio_hiit'],
  flex:  ['flexibility','balance','recovery'],
  full:  ['squat','hip_hinge','horizontal_push','horizontal_pull','vertical_push','vertical_pull','isometric'],
};

// ─────────────────────────────────────────
// 4. PICK — top-N by score, with diversity guard
// ─────────────────────────────────────────
const pickForPatterns = (
  pool: DBExercise[],
  patterns: MovementPattern[],
  count: number,
  goal: FitnessGoal,
  preferredParts: string[],
  excludeIds: Set<string>,
  rng: () => number,        // ← NEW
): DBExercise[] => {
  const picked: DBExercise[] = [];
  const usedPatterns = new Set<MovementPattern>();

  // Score + small random jitter so ties shuffle deterministically per week
  const ranked = pool
    .filter(ex => patterns.includes(ex.movement_pattern))
    .filter(ex => !excludeIds.has(ex.exercise_id))
    .map(ex => ({
      ex,
      score: scoreExercise(ex, goal, preferredParts) + rng() * 1.5,  // ← jitter
    }))
    .sort((a, b) => b.score - a.score);

  // First pass: one per unique pattern (diversity)
  for (const { ex } of ranked) {
    if (picked.length >= count) break;
    if (!usedPatterns.has(ex.movement_pattern)) {
      picked.push(ex);
      usedPatterns.add(ex.movement_pattern);
    }
  }
  // Second pass: fill remaining
  for (const { ex } of ranked) {
    if (picked.length >= count) break;
    if (!picked.includes(ex)) picked.push(ex);
  }
  return picked;
};

// ─────────────────────────────────────────
// 5. PRESCRIBE — convert DB exercise → RoutineExercise
// ─────────────────────────────────────────
const prescribeStrength = (ex: DBExercise, target: GoalTarget): RoutineExercise => ({
  exerciseId: ex.exercise_id,
  nameKo: ex.name_ko,
  category: ex.category,
  movementPattern: ex.movement_pattern,
  sets: Math.round((target.sets_min + target.sets_max) / 2),
  reps: `${target.reps_min}-${target.reps_max}`,
  restSec: target.rest_sec,
  videoId: ex.video_id ?? '',
});

const prescribeCardio = (ex: DBExercise, durationMin: number): RoutineExercise => ({
  exerciseId: ex.exercise_id,
  nameKo: ex.name_ko,
  category: ex.category,
  movementPattern: ex.movement_pattern,
  sets: 1,
  reps: `${durationMin}min`,
  restSec: 0,
  videoId: ex.video_id ?? '',
  notes: ex.movement_pattern === 'cardio_hiit' ? 'HIIT - 강도 위주' : '중강도 유지',
});

const prescribeFlexibility = (ex: DBExercise): RoutineExercise => ({
  exerciseId: ex.exercise_id,
  nameKo: ex.name_ko,
  category: ex.category,
  movementPattern: ex.movement_pattern,
  sets: 2,
  reps: '30sec',
  restSec: 15,
  videoId: ex.video_id ?? '',
});

// ─────────────────────────────────────────
// 6. ESTIMATION — duration & calories per day
// ─────────────────────────────────────────
const estimateDay = (exs: RoutineExercise[], userWeightKg: number): { min: number; kcal: number } => {
  let min = 0;
  let kcal = 0;
  for (const re of exs) {
    const ex = findById(re.exerciseId);
    if (!ex) continue;
    let durationMin = 0;
    if (re.reps.endsWith('min')) durationMin = parseInt(re.reps);
    else if (re.reps.endsWith('sec')) durationMin = (parseInt(re.reps) * re.sets) / 60;
    else durationMin = re.sets * 2 + (re.sets * re.restSec) / 60; // ~2min work per set
    min += durationMin;
    kcal += (ex.met * 3.5 * userWeightKg / 200) * durationMin;
  }
  return { min: Math.round(min), kcal: Math.round(kcal) };
};

// ─────────────────────────────────────────
// 7. BUILD DAYS — per split type
// ─────────────────────────────────────────
const buildDay = (
  label: string, focus: string, patterns: MovementPattern[], count: number,
  pool: DBExercise[], target: GoalTarget, goal: FitnessGoal,
  preferredParts: string[], excludeIds: Set<string>, userWeightKg: number,
  rng: () => number,
  prescribe: (ex: DBExercise) => RoutineExercise = (ex) => prescribeStrength(ex, target),
): DailyWorkout => {
  const picks = pickForPatterns(pool, patterns, count, goal, preferredParts, excludeIds, rng);
  picks.forEach(p => excludeIds.add(p.exercise_id));
  const mainExercises = picks.map(prescribe);

  // === Warm-up: 1 routine at the start ===
  const warmupPool = EXERCISES.filter(e => e.category === 'warmup');
  const warmup = warmupPool.length > 0
    ? warmupPool[Math.floor(rng() * warmupPool.length)]
    : null;
  const warmupEx: RoutineExercise | null = warmup ? {
    exerciseId: warmup.exercise_id,
    nameKo: warmup.name_ko,
    category: warmup.category,
    movementPattern: warmup.movement_pattern,  // ← add
    videoId: warmup.video_id ?? '',            // ← add
    sets: 1,
    reps: '5분',
    restSec: 0,
    notes: '운동 시작 전 워밍업',
    phase: 'warmup',
  } : null;

  // === Cool-down: 1 routine at the end ===
  const cooldownPool = EXERCISES.filter(e => e.category === 'cooldown');
  const cooldown = cooldownPool.length > 0
    ? cooldownPool[Math.floor(rng() * cooldownPool.length)]
    : null;
  const cooldownEx: RoutineExercise | null = cooldown ? {
    exerciseId: cooldown.exercise_id,
    nameKo: cooldown.name_ko,
    category: cooldown.category,
    movementPattern: cooldown.movement_pattern,  // ← add
    videoId: cooldown.video_id ?? '',            // ← add
    sets: 1,
    reps: '5분',
    restSec: 0,
    notes: '운동 마무리 쿨다운',
    phase: 'cooldown',
  } : null;

  // Final ordered list
  const exercises = [
    ...(warmupEx ? [warmupEx] : []),
    ...mainExercises,
    ...(cooldownEx ? [cooldownEx] : []),
  ];

  const { min, kcal } = estimateDay(exercises, userWeightKg);
  // Add 10 minutes for warmup + cooldown (5 each)
  return { dayLabel: label, focus, exercises, estimatedDurationMin: min + 10, estimatedCalories: kcal };
};


// ─────────────────────────────────────────
// 8. MAIN ENTRY POINT
// ─────────────────────────────────────────
export const generateWeeklyPlan = (
  profile: UserProfile,
  options?: { manualReroll?: boolean }      // ← NEW
): WeeklyPlan => {
  const goal = profile.goal ?? 'health';
  const frequency = profile.weeklyFrequency ?? 3;
  const userWeightKg = profile.weightKg;
  const preferredParts = profile.preferredBodyParts ?? [];
  const target = getGoalTarget(goal) ?? getGoalTarget('health')!;

  // Seed: weekly by default, randomized when user manually rerolls
  const baseSeed = buildWeeklySeed(new Date(), goal, frequency);
  const seed = options?.manualReroll ? baseSeed + Math.floor(Math.random() * 9999) : baseSeed;
  const rng = seededRandom(seed);

  const pool = filterCandidates(profile);
  const splitType = chooseSplit(goal, frequency);
  const used = new Set<string>();
  const days: DailyWorkout[] = [];

  // Cardio dose per session for goals needing cardio
  const cardioPerSession = Math.ceil((target.cardio_min_per_week ?? 0) / Math.max(frequency, 1));

  const labelFor = (i: number) => `${i + 1}일차`;

  
  if (splitType === 'flexibility_focus') {
    for (let i = 0; i < frequency; i++) {
      days.push(buildDay(
        labelFor(i), '요가/유연성', PATTERN_GROUPS.flex, 6,
        pool, target, goal, preferredParts, used, userWeightKg,
        rng, 
        prescribeFlexibility,
      ));
    }
  } else if (splitType === 'cardio_focus') {
    for (let i = 0; i < frequency; i++) {
      const cardioDay = i % 2 === 0;
      days.push(buildDay(
        labelFor(i),
        cardioDay ? '유산소 (지구력)' : '근지구력 + 코어',
        cardioDay ? PATTERN_GROUPS.cardio : [...PATTERN_GROUPS.full, ...PATTERN_GROUPS.core],
        cardioDay ? 1 : 5,
        pool, target, goal, preferredParts, used, userWeightKg,
        rng, 
        cardioDay ? (ex) => prescribeCardio(ex, cardioPerSession || 30) : undefined,
      ));
    }
  } else if (splitType === 'full_body') {
    for (let i = 0; i < frequency; i++) {
      const day = buildDay(
        labelFor(i * 2), `전신 ${i+1}`, PATTERN_GROUPS.full, 5,
        pool, target, goal, preferredParts, used, userWeightKg,
        rng, 
      );
      // Add cardio finisher if goal needs it
      if (cardioPerSession > 0) {
        const cardioPicks = pickForPatterns(pool, PATTERN_GROUPS.cardio, 1, goal, preferredParts, used, rng);
        cardioPicks.forEach(c => {
          used.add(c.exercise_id);
          day.exercises.push(prescribeCardio(c, cardioPerSession));
        });
        const est = estimateDay(day.exercises, userWeightKg);
        day.estimatedDurationMin = est.min;
        day.estimatedCalories = est.kcal;
      }
      days.push(day);
    }
  } else if (splitType === 'upper_lower') {
    const sequence = ['upper','lower','upper','lower','upper','lower','upper'].slice(0, frequency);
    sequence.forEach((kind, i) => {
      const focus = kind === 'upper' ? '상체' : '하체';
      days.push(buildDay(
        labelFor(i), focus, PATTERN_GROUPS[kind], 5,
        pool, target, goal, preferredParts, used, userWeightKg,
        rng, 
      ));
    });
  } else if (splitType === 'push_pull_legs') {
    const sequence = ['push','pull','legs','push','pull','legs','full'].slice(0, frequency);
    sequence.forEach((kind, i) => {
      const focus = kind === 'push' ? '가슴+삼두+어깨' :
                    kind === 'pull' ? '등+이두' :
                    kind === 'legs' ? '하체' : '전신';
      days.push(buildDay(
        labelFor(i), focus, PATTERN_GROUPS[kind] ?? PATTERN_GROUPS.full, 5,
        pool, target, goal, preferredParts, used, userWeightKg,
        rng, 
      ));
    });
    // PPL repeats - reset 'used' between mesocycles to allow same compounds
    if (frequency > 3) {
      // Already handled by sequence; but reset used after legs for variety
    }
  }

  // Notes (safety + progression)
  const notes: string[] = [];
  if (profile.experience === '초급') {
    notes.push('초급자: 무게보다 자세에 집중하세요.');
    notes.push('첫 주는 RIR 3-4 (여유 있게)로 시작.');
  }
  if (goal === 'weight_loss') {
    notes.push('식단 관리가 운동만큼 중요합니다 (-300~500 kcal/일).');
  }
  if (goal === 'muscle_gain') {
    notes.push('단백질 1.6~2.2 g/체중kg/일 섭취 권장.');
    notes.push('각 세트 RIR 0-2까지 밀어붙이세요.');
  }
  if ((profile.injuries ?? []).length > 0) {
    notes.push(`부상 부위 (${profile.injuries!.join(', ')}) 관련 운동은 자동 제외됨.`);
  }
  notes.push('2주마다 무게 또는 횟수를 5-10% 증량하세요 (점진적 과부하).');

  return {
    goal,
    weeklyFrequency: frequency,
    splitType,
    days,
    notes,
    generatedAt: new Date().toISOString(),
  };
};




export const getAlternatives = (
  current: RoutineExercise,
  environment: 'gym' | 'home',
  count: number = 3
): RoutineExercise[] => {
  const currentDb = EXERCISES.find(e => e.exercise_id === current.exerciseId);
  if (!currentDb) return [];

  // Warmup/cooldown/cardio/yoga ignore environment
  const ignoresEnv = ['warmup', 'cooldown', 'cardio', 'yoga'].includes(currentDb.category);

  const candidates = EXERCISES.filter(e => {
    if (e.exercise_id === current.exerciseId) return false;
    if (e.category !== currentDb.category) return false;
    if (e.movement_pattern !== currentDb.movement_pattern) return false;
    if (!ignoresEnv && e.category !== environment) return false;
    return true;
  });

  // Shuffle and take `count`
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(ex => ({
    exerciseId: ex.exercise_id,
    nameKo: ex.name_ko,
    category: ex.category as any,
    movementPattern: ex.movement_pattern,
    sets: current.sets,
    reps: current.reps,
    restSec: current.restSec,
    notes: current.notes,
    videoId: ex.video_id ?? '',
    phase: current.phase,
  }));
};
