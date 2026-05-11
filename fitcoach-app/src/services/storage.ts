// src/services/storage.ts
// AsyncStorage 기반 운동 기록 영구 저장 서비스

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WorkoutExercise,
  WorkoutSession,
  WORKOUT_STORAGE_KEY, 
  BodyPart, 
} from '../types/workout';

// ===== 내부 헬퍼 =====

/** YYYY-MM-DD 형식의 오늘 날짜 (로컬 타임존) */
function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 간단한 uuid 생성 (외부 라이브러리 없이) */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 전체 세션 데이터 읽기 (Record<날짜, 세션>) */
async function readAllSessions(): Promise<Record<string, WorkoutSession>> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Storage] 읽기 실패:', error);
    return {};
  }
}

/** 전체 세션 데이터 쓰기 */
async function writeAllSessions(
  sessions: Record<string, WorkoutSession>
): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('[Storage] 쓰기 실패:', error);
    throw error;
  }
}

// ===== 공개 API =====

/**
 * 운동 1종목을 오늘 세션에 저장합니다.
 * - 같은 날짜에 이미 세션 있으면 exercises 배열에 추가
 * - 없으면 새 세션 생성
 */
export async function saveExercise(
  exercise: Omit<WorkoutExercise, 'completedAt'>
): Promise<void> {
  const today = getTodayKey();
  const sessions = await readAllSessions();

  const newExercise: WorkoutExercise = {
    ...exercise,
    completedAt: new Date().toISOString(),
  };

  if (sessions[today]) {
    // 같은 날짜 세션에 추가
    sessions[today].exercises.push(newExercise);
  } else {
    // 새 세션 생성
    sessions[today] = {
      sessionId: generateId(),
      date: today,
      exercises: [newExercise],
    };
  }

  await writeAllSessions(sessions);
  console.log(`[Storage] 저장 완료: ${exercise.exerciseName} (${today})`);
}

/**
 * 모든 세션을 최신 날짜순으로 반환
 */
export async function getAllSessions(): Promise<WorkoutSession[]> {
  const sessions = await readAllSessions();
  return Object.values(sessions).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

/**
 * 특정 날짜의 세션 반환
 */
export async function getSessionByDate(
  date: string
): Promise<WorkoutSession | null> {
  const sessions = await readAllSessions();
  return sessions[date] || null;
}

/**
 * 특정 날짜의 특정 운동 삭제
 */
export async function deleteExercise(
  date: string,
  exerciseIndex: number
): Promise<void> {
  const sessions = await readAllSessions();
  if (!sessions[date]) return;

  sessions[date].exercises.splice(exerciseIndex, 1);

  // 운동이 모두 삭제되면 세션 자체 삭제
  if (sessions[date].exercises.length === 0) {
    delete sessions[date];
  }

  await writeAllSessions(sessions);
  console.log(`[Storage] 삭제 완료: ${date} #${exerciseIndex}`);
}

/**
 * 특정 날짜 세션 전체 삭제
 */
export async function deleteSession(date: string): Promise<void> {
  const sessions = await readAllSessions();
  delete sessions[date];
  await writeAllSessions(sessions);
  console.log(`[Storage] 세션 삭제 완료: ${date}`);
}

/**
 * 특정 날짜의 특정 운동을 새 데이터로 교체
 */
export async function updateExerciseInSession(
  date: string,
  exerciseId: string,
  newExercise: Omit<WorkoutExercise, 'completedAt'>
): Promise<void> {
  const sessions = await readAllSessions();
  if (!sessions[date]) return;

  const idx = sessions[date].exercises.findIndex(
    (ex) => ex.exerciseId === exerciseId
  );
  if (idx < 0) return;

  sessions[date].exercises[idx] = {
    ...newExercise,
    completedAt: sessions[date].exercises[idx].completedAt, // preserve original timestamp
  };

  await writeAllSessions(sessions);
  console.log(`[Storage] 수정 완료: ${date} ${exerciseId}`);
}

/**
 * 오늘 날짜에 해당 운동이 이미 기록되어 있으면 반환
 */
export async function getTodayExercise(
  exerciseId: string
): Promise<WorkoutExercise | null> {
  const today = getTodayKey();
  const sessions = await readAllSessions();
  const session = sessions[today];
  if (!session) return null;
  return session.exercises.find((ex) => ex.exerciseId === exerciseId) || null;
}

/**
 * 오늘 그 운동의 세트 배열을 통째로 교체 (없으면 새로 생성)
 * - 모달에서 기존 세트 수정 + 새 세트 추가 시 사용
 */
export async function upsertTodayExercise(
  exercise: Omit<WorkoutExercise, 'completedAt'>
): Promise<void> {
  const today = getTodayKey();
  const sessions = await readAllSessions();

  const newExercise: WorkoutExercise = {
    ...exercise,
    completedAt: new Date().toISOString(),
  };

  if (!sessions[today]) {
    // 오늘 첫 세션
    sessions[today] = {
      sessionId: generateId(),
      date: today,
      exercises: [newExercise],
    };
  } else {
    const idx = sessions[today].exercises.findIndex(
      (ex) => ex.exerciseId === exercise.exerciseId
    );
    if (idx >= 0) {
      // 기존 운동 → 통째로 교체
      sessions[today].exercises[idx] = newExercise;
    } else {
      // 새 운동 추가
      sessions[today].exercises.push(newExercise);
    }
  }

  await writeAllSessions(sessions);
  console.log(
    `[Storage] upsert 완료: ${exercise.exerciseName} (${today}) - ${exercise.sets.length}세트`
  );
}
/**
 * 특정 운동의 가장 최근 bodyPart를 반환
 * - 모든 세션을 최신순으로 훑어서 해당 exerciseId의 bodyPart를 찾음
 * - 한 번도 분류된 적 없으면 null 반환
 */
export const getRecentBodyPart = async (
  exerciseId: string
): Promise<BodyPart | null> => {
  try {
    const sessions = await getAllSessions(); // 최신순 정렬됨
    for (const session of sessions) {
      const exercise = session.exercises.find(
        (e) => e.exerciseId === exerciseId
      );
      if (exercise && exercise.bodyPart) {
        return exercise.bodyPart;
      }
    }
    return null;
  } catch (error) {
    console.error('[Storage] getRecentBodyPart 실패:', error);
    return null;
  }
};
/**
 * 특정 날짜 세션에서 운동 1개만 삭제
 * - 운동 삭제 후 세션이 비면 세션도 함께 삭제
 */
export const deleteExerciseFromSession = async (
  date: string,
  exerciseId: string
): Promise<void> => {
  try {
    const allSessions = await readAllSessions();
    const session = allSessions[date];
    if (!session) {
      console.warn(`[Storage] 세션 없음: ${date}`);
      return;
    }

    // 해당 운동만 제거
    session.exercises = session.exercises.filter(
      (e) => e.exerciseId !== exerciseId
    );

    if (session.exercises.length === 0) {
      // 세션이 비면 세션 자체 삭제
      delete allSessions[date];
      console.log(`[Storage] 세션 삭제 (운동 0개): ${date}`);
    } else {
      allSessions[date] = session;
      console.log(
        `[Storage] 운동 삭제 완료: ${date} / ${exerciseId}`
      );
    }

    await writeAllSessions(allSessions);
  } catch (error) {
    console.error('[Storage] deleteExerciseFromSession 실패:', error);
    throw error;
  }
};

/**
 * 모든 기록 삭제 (개발/디버깅용)
 */
export async function clearAllWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
  console.log('[Storage] 전체 기록 삭제 완료');
}
