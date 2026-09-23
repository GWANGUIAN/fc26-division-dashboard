// 유튜브 videoId 추출 + oEmbed(공개 API, CORS 허용)로 제목/채널명 조회. 실패(네트워크/CORS/404
// 등)는 전부 조용히 undefined로 삼켜, 호출부가 "직접 입력해주세요" 안내로 폴백할 수 있게 한다.
const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?.*?v=|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{11})/,
];

export function extractYouTubeVideoId(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = pattern.exec(trimmed);
    if (match) return match[1];
  }
  return undefined;
}

export type YouTubeOEmbedInfo = { title: string; author: string };

export async function fetchYouTubeOEmbed(videoId: string): Promise<YouTubeOEmbedInfo | undefined> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`;
    const response = await fetch(endpoint);
    if (!response.ok) return undefined;
    const data = (await response.json()) as { title?: string; author_name?: string };
    if (!data.title) return undefined;
    return { title: data.title, author: data.author_name ?? "" };
  } catch {
    return undefined;
  }
}
