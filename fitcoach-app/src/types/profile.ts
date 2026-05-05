// src/types/profile.ts
// 사용자 프로필 (체중, 키, 목표 등) - 칼로리 계산 및 통계용

export interface UserProfile {
  weightKg: number;        // 체중 (칼로리 계산용)
  heightCm?: number;       // 키 (선택, BMI 계산용)
  birthYear?: number;      // 출생연도 (선택, 연령대별 권장 심박수용)
  gender?: 'male' | 'female' | 'other';
  weeklyGoal?: number;     // 주간 운동 목표 횟수 (기본 3)
  updatedAt: string;       // ISO date
}

export const DEFAULT_PROFILE: UserProfile = {
  weightKg: 70,
  weeklyGoal: 3,
  updatedAt: new Date().toISOString(),
};

export const PROFILE_STORAGE_KEY = '@FitCoach/profile';
