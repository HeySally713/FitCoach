// src/utils/editBus.ts
// Cross-screen event bus for "edit past exercise" feature

import { WorkoutExercise } from '../types/workout';

export interface EditRequest {
  date: string;
  exercise: WorkoutExercise;
}

type Listener = (req: EditRequest) => void;
const listeners = new Set<Listener>();

export const editBus = {
  emit(req: EditRequest) {
    listeners.forEach((l) => l(req));
  },
  on(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
