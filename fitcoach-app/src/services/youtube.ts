// src/services/youtube.ts
// YouTube Data API v3로 운동 코칭 영상을 검색하는 서비스

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

// ===== 메인 함수 =====
export async function searchExerciseVideos(
  exerciseName: string
): Promise<ExerciseVideo[]> {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('[YouTube Service] API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    return [];
  }

  const query = `${exerciseName} 하는 법`;

  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&maxResults=10` +
    `&q=${encodeURIComponent(query)}` +
    `&type=video` +
    `&relevanceLanguage=ko` +
    `&order=relevance` +
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

    const videos: ExerciseVideo[] = data.items
      .filter((item) => {
        if (!item.id.videoId) return false;
        const title = item.snippet.title.toLowerCase();
        if (title.includes('광고') || title.includes('[ad]') || title.includes('(ad)')) {
          return false;
        }
        return true;
      })
      .slice(0, 5)
      .map((item) => ({
        videoId: item.id.videoId!,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
      }));

    return videos;
  } catch (error) {
    console.error('[YouTube Service] 영상 검색 실패:', error);
    return [];
  }
}
