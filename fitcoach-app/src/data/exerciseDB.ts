// src/data/exerciseDB.ts
import bundle from './exerciseDB.json';
import { DBExercise, GoalTarget } from '../types/recommendation';

// Cast through `unknown` because TS infers JSON shapes too literally
export const EXERCISES: DBExercise[] = (bundle as unknown as { exercises: DBExercise[] }).exercises;
export const GOAL_TARGETS: GoalTarget[] = (bundle as unknown as { goal_targets: GoalTarget[] }).goal_targets;

export const findById = (id: string): DBExercise | undefined =>
  EXERCISES.find(e => e.exercise_id === id);

export const getGoalTarget = (goal: string): GoalTarget | undefined =>
  GOAL_TARGETS.find(g => g.goal === goal);
