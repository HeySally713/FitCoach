// src/services/youtube.ts
// YouTube Data API v3로 운동 코칭 영상을 검색하는 서비스
// 카테고리/장비 타입에 따라 검색어를 다르게 구성

import { EquipmentType } from '../types/exercise';

// ===== 타입 정의 =====
export interface ExerciseVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  error?: {
    code: number;
    message: string;
  };
}

// ===== 검색어 생성 로직 =====
/**
 * 운동 종류에 맞는 검색어를 생성합니다.
 * - machine: "{운동명} 하는 법"
 * - freeweight: "{운동명} 자세"
 * - bodyweight: "{운동명} 자세"
 * - yoga: "{운동명} 자세"
 * - cardio: "{운동명} {duration}분"
 */
function buildSearchQuery(
  exerciseName: string,
  equipmentType: EquipmentType,
  cardioDuration?: number
): string {
  switch (equipmentType) {
    case 'machine':
      return `${exerciseName} 하는 법`;
    case 'freeweight':
    case 'bodyweight':
    case 'yoga':
      return `${exerciseName} 자세`;
    case 'cardio':
      return cardioDuration
        ? `${exerciseName} ${cardioDuration}분`
        : `${exerciseName} 운동`;
    default:
      return `${exerciseName} 자세`;
  }
}

// ===== 7년 전 날짜 ISO 8601 형식으로 반환 =====
function getPublishedAfterDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 7);
  return date.toISOString();
}

// ===== 차단 키워드 (제목 기준) =====
const BLOCK_KEYWORDS = [
  '광고',
  '[ad]',
  '(ad)',
  'asmr',
  'challenge',
  '챌린지',
  '먹방',
];

// ===== 메인 함수 =====
export interface SearchVideosParams {
  exerciseName: string;
  equipmentType: EquipmentType;
  cardioDuration?: number; // cardio일 때만 사용
}

export async function searchExerciseVideos(
  params: SearchVideosParams
): Promise<ExerciseVideo[]> {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('[YouTube Service] API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    return [];
  }

  const query = buildSearchQuery(
    params.exerciseName,
    params.equipmentType,
    params.cardioDuration
  );
  const publishedAfter = getPublishedAfterDate();

  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&maxResults=20` +
    `&q=${encodeURIComponent(query)}` +
    `&type=video` +
    `&videoEmbeddable=true` +
    `&videoSyndicated=true` +
    `&relevanceLanguage=ko` +
    `&order=relevance` +
    `&publishedAfter=${encodeURIComponent(publishedAfter)}` +
    `&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data: YouTubeSearchResponse = await response.json();

    if (data.error) {
      console.error('[YouTube Service] API 에러:', data.error.message);
      return [];
    }

    if (!data.items || data.items.length === 0) {
      console.warn('[YouTube Service] 검색 결과가 없습니다:', query);
      return [];
    }

    // 1️⃣ 후보 추출 (제목 필터링)
    const candidates: ExerciseVideo[] = data.items
      .filter((item) => {
        if (!item.id.videoId) return false;
        const titleLower = item.snippet.title.toLowerCase();
        const hasBlockedKeyword = BLOCK_KEYWORDS.some((kw) =>
          titleLower.includes(kw)
        );
        if (hasBlockedKeyword) return false;
        return true;
      })
      .map((item) => ({
        videoId: item.id.videoId!,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
      }));

    // 2️⃣ 임베드 가능 여부 검증
    const verifiedVideos = await verifyEmbeddable(candidates, apiKey);
    const videos = verifiedVideos.slice(0, 5);

    console.log(
      `[YouTube] "${query}" → ${videos.length}개 영상 검색 완료 (검증: ${candidates.length}→${verifiedVideos.length})`
    );
    return videos;
  } catch (error) {
    console.error('[YouTube Service] 영상 검색 실패:', error);
    return [];
  }
}

/**
 * videos.list API로 실제 임베드 가능 여부를 확인합니다.
 * search API의 videoEmbeddable 필터가 부정확한 케이스를 보완합니다.
 */
async function verifyEmbeddable(
  candidates: ExerciseVideo[],
  apiKey: string
): Promise<ExerciseVideo[]> {
  if (candidates.length === 0) return [];

  const ids = candidates.map((v) => v.videoId).join(',');
  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=status` +
    `&id=${ids}` +
    `&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.warn('[YouTube] 검증 실패, 원본 사용:', data.error.message);
      return candidates;
    }

    const embeddableIds = new Set<string>(
      (data.items || [])
        .filter((item: any) => item.status?.embeddable === true)
        .map((item: any) => item.id)
    );

    return candidates.filter((v) => embeddableIds.has(v.videoId));
  } catch (error) {
    console.warn('[YouTube] 검증 중 오류, 원본 사용:', error);
    return candidates;
  }
}
