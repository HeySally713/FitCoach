// src/utils/calorie.ts
// MET 기반 칼로리 계산 + 페이스/속도 계산 유틸

/**
 * MET (Metabolic Equivalent of Task) 값
 * 출처: Compendium of Physical Activities (2011)
 * 칼로리 = 체중(kg) × MET × 시간(h)
 */

// ===== 고정 MET (요가, 계단, 줄넘기 등) =====
const FIXED_MET: Record<string, number> = {
// 요가
  '요가': 2.5,
  '플로우 요가': 4.0,
  '하타 요가': 2.5,
  '빈야사': 4.0,
  
  // 계단/줄넘기
  '천국의 계단': 9.0,
  '스텝머신': 8.8,
  '줄넘기': 12.3,
  
  // 홈트 + 유산소 겸용 (격렬)
  '하이니': 8.0,           // ← 변경
  'High Knee': 8.0,        // ← 추가
  '점핑잭': 8.0,           // ← 변경 (Jack Step에서)
  'Burpee': 8.0,
  '버피': 8.0,             // ← 추가
  'HIIT 운동': 8.5,        // ← 추가
};

/**
 * 걷기/러닝 속도 → MET 매핑
 * @param speedKmh - 시속 km
 */
const getRunningMet = (speedKmh: number): number => {
  if (speedKmh < 3) return 2.0;        // 매우 느린 걷기
  if (speedKmh < 5) return 2.8;        // 느린 걷기
  if (speedKmh < 6) return 3.5;        // 보통 걷기
  if (speedKmh < 7) return 4.3;        // 빠른 걷기
  if (speedKmh < 8) return 6.0;        // 조깅
  if (speedKmh < 10) return 8.3;       // 러닝
  if (speedKmh < 12) return 10.0;      // 빠른 러닝
  if (speedKmh < 14) return 11.5;      // 매우 빠른 러닝
  return 12.8;                          // 스프린트
};

/**
 * 사이클 속도 → MET 매핑
 */
const getCyclingMet = (speedKmh: number): number => {
  if (speedKmh < 15) return 4.0;       // 가벼운 사이클
  if (speedKmh < 20) return 6.8;       // 보통
  if (speedKmh < 25) return 8.0;       // 빠른
  if (speedKmh < 30) return 10.0;      // 매우 빠른
  return 12.0;                          // 경기 수준
};

/**
 * 운동별 MET 값 계산
 * @param exerciseName - 운동 이름 (예: '러닝머신', '사이클', '요가')
 * @param speedKmh - 속도 (선택, 트레드밀/사이클 등)
 * @param inclinePercent - 경사도 % (선택, 인클라인 트레드밀)
 */
export const getMetByActivity = (
  exerciseName: string,
  speedKmh?: number,
  inclinePercent?: number
): number => {
  // 1. 고정 MET 먼저 확인
  if (FIXED_MET[exerciseName] !== undefined) {
    return FIXED_MET[exerciseName];
  }
  
  // 2. 트레드밀/걷기/야외러닝 - 속도 기반
  if (
    exerciseName.includes('러닝머신') ||
    exerciseName.includes('트레드밀') ||
    exerciseName.includes('걷기') ||
    exerciseName.includes('러닝') ||
    exerciseName.includes('야외')
  ) {
    const baseMet = getRunningMet(speedKmh ?? 6);
    // 인클라인 보정: MET × (1 + 경사% × 0.1)
    if (inclinePercent && inclinePercent > 0) {
      return baseMet * (1 + inclinePercent * 0.1);
    }
    return baseMet;
  }
  
  // 3. 사이클 - 속도 기반
  if (exerciseName.includes('사이클') || exerciseName.includes('자전거')) {
    return getCyclingMet(speedKmh ?? 18);
  }
  
  // 4. 기타 (가중평균 기본값)
  return 5.0;
};

/**
 * 칼로리 계산
 * 공식: 체중(kg) × MET × 시간(h)
 * @param met - MET 값
 * @param weightKg - 체중 (kg)
 * @param durationMin - 시간 (분)
 */
export const calculateCalories = (
  met: number,
  weightKg: number,
  durationMin: number
): number => {
  if (durationMin <= 0 || weightKg <= 0) return 0;
  const hours = durationMin / 60;
  return Math.round(met * weightKg * hours);
};

/**
 * 페이스 계산 (러닝/걷기용)
 * @param distanceKm - 거리 (km)
 * @param durationMin - 시간 (분)
 * @returns "6:30" 형식 (분:초/km)
 */
export const calculatePace = (
  distanceKm: number,
  durationMin: number
): string => {
  if (distanceKm <= 0 || durationMin <= 0) return '-';
  const paceMinPerKm = durationMin / distanceKm;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * 속도 계산 (사이클용)
 * @returns km/h (소수점 1자리)
 */
export const calculateSpeed = (
  distanceKm: number,
  durationMin: number
): number => {
  if (distanceKm <= 0 || durationMin <= 0) return 0;
  return Number(((distanceKm / durationMin) * 60).toFixed(1));
};

/**
 * 운동 이름으로 페이스 vs 속도 표시 결정
 * @returns 'pace' (러닝/걷기) | 'speed' (사이클)
 */
export const getDisplayUnit = (exerciseName: string): 'pace' | 'speed' => {
  if (
    exerciseName.includes('사이클') ||
    exerciseName.includes('자전거')
  ) {
    return 'speed';
  }
  return 'pace';
};

/**
 * 운동 종합 표시용 헬퍼
 * @example formatCardioSummary('러닝머신', 30, 5.2, 7.5) 
 *          → "30분 · 5.2km · 7:30 페이스 · 245kcal"
 */
export const formatCardioSummary = (
  exerciseName: string,
  durationMin?: number,
  distanceKm?: number,
  calories?: number
): string => {
  const parts: string[] = [];
  
  if (durationMin) parts.push(`${durationMin}분`);
  if (distanceKm) parts.push(`${distanceKm}km`);
  
  if (distanceKm && durationMin) {
    const unit = getDisplayUnit(exerciseName);
    if (unit === 'pace') {
      parts.push(`${calculatePace(distanceKm, durationMin)} 페이스`);
    } else {
      parts.push(`${calculateSpeed(distanceKm, durationMin)}km/h`);
    }
  }
  
  if (calories) parts.push(`🔥 ${calories}kcal`);
  
  return parts.join(' · ');
};
