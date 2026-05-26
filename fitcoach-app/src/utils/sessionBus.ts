// src/utils/sessionBus.ts
type SessionEvent =
  | { type: 'openExercise'; exerciseId: string };

type Listener = (event: SessionEvent) => void;
const listeners = new Set<Listener>();

export const sessionBus = {
  emit(event: SessionEvent) {
    listeners.forEach((l) => l(event));
  },
  on(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
