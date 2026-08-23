export const HANGUL_PATTERN = /[가-힣]/;

export const koreaDateKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

export function formatCafePostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  if (koreaDateKey(date) === koreaDateKey(new Date())) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(date);
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

/**
 * Takes a dateKey (YYYY-MM-DD) rather than an ISO string like its siblings above,
 * since the growth-graph pipeline that calls this already works entirely in dateKey space.
 */
export function formatGrowthAxisDate(dateKey: string): string {
  const today = new Date();
  const todayKey = koreaDateKey(today);
  if (dateKey === todayKey) return "오늘";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === koreaDateKey(yesterday)) return "어제";
  const [, month, day] = dateKey.split("-");
  return `${month}.${day}`;
}

export function formatBoardPostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  const dateKey = koreaDateKey(date);
  const today = new Date();
  if (dateKey === koreaDateKey(today)) {
    return `오늘 ${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date)}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === koreaDateKey(yesterday)) return "어제";
  return formatCafePostDate(value);
}
