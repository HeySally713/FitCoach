// src/utils/bodyPart.ts
// 운동명 → 운동 부위 자동 분류

import { BodyPart, WorkoutExercise } from '../types/workout';

// 운동명 키워드 매핑 (한국어 + 영어)
const BODY_PART_KEYWORDS: Record<BodyPart, string[]> = {
  가슴: ['벤치', '체스트', '플라이', '딥스', '푸쉬업', '푸시업', '크로스오버', '인클라인', '디클라인'],
  등: ['데드리프트', '데드', '풀업', '턱걸이', '랫풀다운', '로우', '바벨로우', '시티드로우'],
  하체: ['스쿼트', '레그', '런지', '카프', '힙쓰러스트', '레그프레스', '레그익스텐션', '레그컬'],
  어깨: ['숄더', '오버헤드', 'ohp', '레터럴', '프레스', '레이즈', '슈러그', '리어델트'],
  팔: ['컬', '바이셉', '트라이셉', '익스텐션', '해머컬', '킥백', '프리처'],
  코어: ['플랭크', '크런치', '싯업', '레그레이즈', '러시안트위스트', '브이업', '마운틴클라이머'],
  전신: ['버피', '스내치', '클린', '터키시'],
  요가: ['다운독', '워리어', '코브라', '차일드', '브릿지', '캣카우', '트리', '비둘기', '나비'],
  유산소: ['트레드밀', '러닝', '사이클', '바이크', '로잉', '스텝', '계단', '점프'],
  기타: [],
};

// 카테고리 fallback
const CATEGORY_TO_BODY_PART: Record<string, BodyPart> = {
  yoga: '요가',
  cardio: '유산소',
};

/**
 * 운동명에서 운동 부위 추론
 */
export function inferBodyPart(exerciseName: string, category?: string): BodyPart {
  const lower = exerciseName.toLowerCase().replace(/\s/g, '');

  for (const [bodyPart, keywords] of Object.entries(BODY_PART_KEYWORDS) as [BodyPart, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return bodyPart;
    }
  }

  // 카테고리 fallback
  if (category && CATEGORY_TO_BODY_PART[category]) {
    return CATEGORY_TO_BODY_PART[category];
  }

  return '기타';
}

/**
 * 세션의 대표 운동 부위 추론
 * - 가장 많이 등장한 부위
 * - 동률이면 첫 운동 부위
 */
export function inferSessionBodyPart(exercises: WorkoutExercise[]): BodyPart {
  if (exercises.length === 0) return '기타';

  const counts: Partial<Record<BodyPart, number>> = {};
  for (const ex of exercises) {
    const bp = inferBodyPart(ex.exerciseName, ex.category);
    counts[bp] = (counts[bp] || 0) + 1;
  }

  let maxBp: BodyPart = inferBodyPart(exercises[0].exerciseName, exercises[0].category);
  let maxCount = 0;
  for (const [bp, count] of Object.entries(counts) as [BodyPart, number][]) {
    if (count > maxCount) {
      maxCount = count;
      maxBp = bp;
    }
  }

  return maxBp;
}

/**
 * 운동 부위별 이모지
 */
export function getBodyPartEmoji(bodyPart: BodyPart): string {
  const emojis: Record<BodyPart, string> = {
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
  return emojis[bodyPart];
}
