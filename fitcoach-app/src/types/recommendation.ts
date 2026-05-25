// src/types/recommendation.ts
import { FitnessGoal, ExperienceLevel, WorkoutEnvironment } from './profile';

export type MovementPattern =
  | 'horizontal_push' | 'vertical_push' | 'horizontal_push_iso'
  | 'horizontal_pull' | 'vertical_pull' | 'horizontal_pull_iso'
  | 'squat' | 'hip_hinge' | 'lunge'
  | 'hip_extension' | 'hip_abduction' | 'hip_adduction' | 'hip_flexion'
  | 'knee_extension' | 'knee_flexion'
  | 'shoulder_abduction' | 'shoulder_flexion'
  | 'elbow_flexion' | 'elbow_extension' | 'wrist_flexion'
  | 'scapular_elevation'
  | 'trunk_flexion' | 'trunk_rotation' | 'trunk_lateral_flexion'
  | 'isometric' | 'plyometric' | 'full_body' | 'carry'
  | 'cardio_steady' | 'cardio_hiit'
  | 'flexibility' | 'balance' | 'recovery';

export type ExerciseCategory = 'gym' | 'home' | 'yoga' | 'cardio' | 'warmup' | 'cooldown';
export type EquipmentDB = 'machine'|'barbell'|'dumbbell'|'cable'|'smith'|'plate'|'kettlebell'|'bodyweight'|'band'|'cardio'|'yoga';

export interface DBExercise {
  exercise_id: string;
  name_ko: string;
  name_en: string;
  category: ExerciseCategory;
  equipment: EquipmentDB;
  primary_muscles: string[];
  secondary_muscles: string[] | null;
  movement_pattern: MovementPattern;
  difficulty: ExperienceLevel;
  location: WorkoutEnvironment;
  unilateral: boolean;
  regression_id: string | null;
  progression_id: string | null;
  equivalent_id: string | null;
  home_substitute_id: string | null;
  met: number;
  video_id: string | null;
  goal_scores: Record<FitnessGoal, number>;
  tags: Record<string, boolean> | null;
  alternatives: { id: string; reason: string }[];
}

export interface GoalTarget {
  goal: FitnessGoal;
  sets_min: number;
  sets_max: number;
  reps_min: number;
  reps_max: number;
  rest_sec: number;
  rir: number;
  cardio_min_per_week: number;
  strength_days_per_week: number;
  intensity_pct_1rm: number;
}

export type ExercisePhase = 'warmup' | 'main' | 'cardio' | 'cooldown';

export interface RoutineExercise {
  exerciseId: string;
  nameKo: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  sets: number;
  reps: string;
  restSec: number;
  notes?: string;
  videoId: string;
  phase?: ExercisePhase;  // ← add this line
}

export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'cardio_focus' | 'flexibility_focus';

export interface DailyWorkout {
  dayLabel: string;          // "Day 1", "월", etc.
  focus: string;             // "전신", "가슴+삼두", "유산소" etc.
  exercises: RoutineExercise[];
  estimatedDurationMin: number;
  estimatedCalories: number;
}

export interface WeeklyPlan {
  goal: FitnessGoal;
  weeklyFrequency: number;
  splitType: SplitType;
  days: DailyWorkout[];
  notes: string[];           // safety/progression tips
  generatedAt: string;
}
