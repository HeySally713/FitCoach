// src/utils/exerciseAdapter.ts
import { DBExercise } from '../types/recommendation';
import { EXERCISES } from '../data/exerciseDB';
import { Exercise, EquipmentType } from '../types/exercise';

// DB equipment values → app's EquipmentType (5 valid values)
const equipmentMap: Record<string, EquipmentType> = {
  machine: 'machine',
  smith: 'machine',
  cable: 'machine',
  plate: 'freeweight',
  barbell: 'freeweight',
  dumbbell: 'freeweight',
  kettlebell: 'freeweight',
  bodyweight: 'bodyweight',
  band: 'bodyweight',
  cardio: 'cardio',
  yoga: 'yoga',
};

export const dbToExercise = (db: DBExercise): Exercise => ({
  id: db.exercise_id,
  name: db.name_ko,
  category: db.category,
  equipmentType: equipmentMap[db.equipment] ?? 'bodyweight',
  target: (db.primary_muscles ?? []).join(', ') || '전신',
  level: db.difficulty,
  videoId: db.video_id ?? '', // empty string when DB has no video
});

export const ALL_EXERCISES: Exercise[] = EXERCISES.map(dbToExercise);

export const findExerciseById = (id: string): Exercise | undefined =>
  ALL_EXERCISES.find(e => e.id === id);

// Group exercises by category — matches the shape used in App.tsx
export const EXERCISES_BY_CATEGORY: Record<string, Exercise[]> = {
  gym: ALL_EXERCISES.filter(e => e.category === 'gym'),
  home: ALL_EXERCISES.filter(e => e.category === 'home'),
  yoga: ALL_EXERCISES.filter(e => e.category === 'yoga'),
  cardio: ALL_EXERCISES.filter(e => e.category === 'cardio'),
};
// src/utils/exerciseAdapter.ts (add to bottom)

// Extended Exercise with searchable fields — used for filtering only
export interface ExerciseSearchable extends Exercise {
  nameEn: string;
  primaryMuscles: string[];
  equipment: string;     // raw DB value: machine, barbell, dumbbell, etc.
}

const dbToExerciseSearchable = (db: DBExercise): ExerciseSearchable => ({
  ...dbToExercise(db),
  nameEn: db.name_en,
  primaryMuscles: db.primary_muscles ?? [],
  equipment: db.equipment,
});

export const ALL_EXERCISES_SEARCHABLE: ExerciseSearchable[] = EXERCISES.map(dbToExerciseSearchable);

export const EXERCISES_BY_CATEGORY_SEARCHABLE: Record<string, ExerciseSearchable[]> = {
  gym:    ALL_EXERCISES_SEARCHABLE.filter(e => e.category === 'gym'),
  home:   ALL_EXERCISES_SEARCHABLE.filter(e => e.category === 'home'),
  yoga:   ALL_EXERCISES_SEARCHABLE.filter(e => e.category === 'yoga'),
  cardio: ALL_EXERCISES_SEARCHABLE.filter(e => e.category === 'cardio'),
};

// Available equipment per category (for chip display)
export const EQUIPMENT_LABELS: Record<string, string> = {
  machine: '🤖 머신',
  smith: '🤖 스미스',
  cable: '🔗 케이블',
  plate: '🏋️ 플레이트',
  barbell: '🏋️ 바벨',
  dumbbell: '💪 덤벨',
  kettlebell: '🔔 케틀벨',
  bodyweight: '🙌 맨몸',
  band: '🎀 밴드',
  cardio: '🏃 유산소',
  yoga: '🧘 요가',
};
