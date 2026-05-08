// src/types/profile.ts
// 사용자 프로필 (체중, 키, 목표, 환경 등) - 칼로리 계산, 통계, 추천 엔진용

import { BodyPart } from './workout';

export type FitnessGoal =
  | 'weight_loss'      // 체중감소
  | 'muscle_gain'      // 근육증가
  | 'health'           // 건강관리
  | 'endurance'        // 체력향상
  | 'flexibility'      // 유연성/자세교정
  | 'maintenance';     // 현상유지

export type ExperienceLevel = '초급' | '중급' | '고급';

export type WorkoutEnvironment = 'gym' | 'home' | 'outdoor';

export interface UserProfile {
  // === 필수 ===
  weightKg: number;
  updatedAt: string;

  // === 기본 신체 정보 (E-7 입력) ===
  heightCm?: number;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other';

  // === 목표 & 빈도 (E-7 확장형 입력) ===
  goal?: FitnessGoal;
  weeklyFrequency?: number;        // 주 N회 (1~7)
  sessionDurationMin?: number;     // 회당 목표 분
  experience?: ExperienceLevel;
  environments?: WorkoutEnvironment[];
  targetWeightKg?: number;

  // === 추천 엔진 고도화용 (E-8+, 일단 타입만) ===
  injuries?: string[];
  preferredBodyParts?: BodyPart[];
  dislikedExercises?: string[];
}

// 옵션 상수 (UI에서 사용)
export const FITNESS_GOAL_OPTIONS: { value: FitnessGoal; label: string; emoji: string }[] = [
  { value: 'weight_loss',  label: '체중감소',     emoji: '🔥' },
  { value: 'muscle_gain',  label: '근육증가',     emoji: '💪' },
  { value: 'health',       label: '건강관리',     emoji: '❤️' },
  { value: 'endurance',    label: '체력향상',     emoji: '🏃' },
  { value: 'flexibility',  label: '유연성/자세', emoji: '🧘' },
  { value: 'maintenance',  label: '현상유지',     emoji: '⚖️' },
];

export const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['초급', '중급', '고급'];

export const ENVIRONMENT_OPTIONS: { value: WorkoutEnvironment; label: string; emoji: string }[] = [
  { value: 'gym',     label: '헬스장', emoji: '🏋️' },
  { value: 'home',    label: '홈트',   emoji: '🏠' },
  { value: 'outdoor', label: '야외',   emoji: '🌳' },
];

export const GENDER_OPTIONS: { value: 'male' | 'female' | 'other'; label: string }[] = [
  { value: 'male',   label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other',  label: '기타' },
];

export const DEFAULT_PROFILE: UserProfile = {
  weightKg: 70,
  weeklyFrequency: 3,
  sessionDurationMin: 60,
  experience: '초급',
  environments: ['gym'],
  updatedAt: new Date().toISOString(),
};

export const PROFILE_STORAGE_KEY = '@FitCoach/profile';
