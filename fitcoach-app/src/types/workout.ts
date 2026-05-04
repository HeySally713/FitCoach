// src/types/workout.ts
// 운동 기록 관련 타입 정의

import { ExerciseCategory, EquipmentType } from './exercise';

// ===== 세트 1개 =====
export interface WorkoutSet {
  setNumber: number;
  weight: number;        // kg (bodyweight면 0)
  reps: number;          // 횟수
  completed: boolean;
}

// ===== 운동 1종목 (벤치프레스 등) =====
export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  equipmentType: EquipmentType;
  bodyPart?: BodyPart;        // 👈 이 줄 추가 (옵셔널 필드)
  sets: WorkoutSet[];
  completedAt: string;
}

// ===== 하루 운동 세션 =====
export interface WorkoutSession {
  sessionId: string;
  date: string;          // YYYY-MM-DD
  exercises: WorkoutExercise[];
}

// ===== 운동 부위 분류 =====
export type BodyPart =
  | '가슴'
  | '등'
  | '하체'
  | '어깨'
  | '팔'
  | '코어'
  | '전신'
  | '요가'
  | '유산소'
  | '기타';

// ===== AsyncStorage 키 =====
export const WORKOUT_STORAGE_KEY = '@FitCoach/workouts';


// ===== 부위 선택지 (UI에서 사용) =====
export const BODY_PART_OPTIONS: BodyPart[] = [
  '가슴',
  '등',
  '하체',
  '어깨',
  '팔',
  '코어',
  '전신',
  '요가',
  '유산소',
  '기타',
];

// ===== 부위별 이모지 =====
export const BODY_PART_EMOJI: Record<BodyPart, string> = {
  가슴: '💪',
  등: '🏋️',
  하체: '🦵',
  어깨: '🤸',
  팔: '💪',
  코어: '🔥',
  전신: '⚡',
  요가: '🧘',
  유산소: '🏃',
  기타: '🏃‍♂️',
};
