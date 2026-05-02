// src/types/exercise.ts
// 운동 데이터 관련 타입 정의

export type ExerciseCategory = 'gym' | 'home' | 'yoga' | 'cardio';

export type EquipmentType = 'machine' | 'freeweight' | 'bodyweight' | 'yoga' | 'cardio';

export type ExerciseLevel = '초급' | '중급' | '고급';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipmentType: EquipmentType;
  target: string;
  level: ExerciseLevel;
  videoId: string;
}

export type CardioDuration = 10 | 20 | 30 | 40;

export const CARDIO_DURATIONS: CardioDuration[] = [10, 20, 30, 40];
