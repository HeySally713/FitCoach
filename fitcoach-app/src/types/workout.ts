// src/types/workout.ts
// 운동 기록 관련 타입 정의

import { ExerciseCategory, EquipmentType } from './exercise';

// ===== 세트 1개 =====
export interface WorkoutSet {
  setNumber: number;
  
  // 웨이트 운동 (기존)
  weight?: number;       // optional로 변경
  reps?: number;         // optional로 변경
  
  // 유산소 공통
  duration?: number;     // 시간(분)
  distance?: number;     // 거리(km)
  speed?: number;        // 속도(km/h)
  
  // 트레드밀 인클라인
  incline?: number;      // 경사도(%)
  
  // 줄넘기/스텝머신/계단
  jumpCount?: number;    // 줄넘기 횟수
  stepCount?: number;    // 스텝 걸음수
  floorCount?: number;   // 계단 층수
  
  // 요가
  poseName?: string;     // 자세 이름
  holdSeconds?: number;  // 유지 시간(초)
  
  // 자동 계산
  pace?: string;         // "6:30" (분:초/km)
  calories?: number;     // kcal
  
  // 워치 연동 (Step I 대비)
  heartRateAvg?: number;
  heartRateMax?: number;
  
  completed: boolean;
}


// ===== 운동 1종목 (벤치프레스 등) =====
export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  equipmentType: EquipmentType;
  bodyPart?: BodyPart;        // 👈 이 줄 추가 (옵셔널 필드)
  intensity?: WorkoutIntensity;  // ← 추가
  memo?: string;                 // ← 추가 (선택)
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

// 운동 강도 (5단계 이모지)
export type WorkoutIntensity = 'very_easy' | 'easy' | 'normal' | 'hard' | 'very_hard';

export const INTENSITY_OPTIONS: WorkoutIntensity[] = [
  'very_easy', 'easy', 'normal', 'hard', 'very_hard'
];

export const INTENSITY_EMOJI: Record<WorkoutIntensity, string> = {
  very_easy: '😎',
  easy: '😊',
  normal: '😐',
  hard: '😓',
  very_hard: '😣',
};

export const INTENSITY_LABEL: Record<WorkoutIntensity, string> = {
  very_easy: '매우 가벼움',
  easy: '가벼움',
  normal: '보통',
  hard: '힘듦',
  very_hard: '매우 힘듦',
};
