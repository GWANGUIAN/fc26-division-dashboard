const ANNOUNCEMENT_TITLE_STORAGE_KEY = "fc26-pass-announcement-title";
const ANNOUNCEMENT_TITLE_FONT_SIZE_STORAGE_KEY = "fc26-pass-announcement-title-font-size";

export const ANNOUNCEMENT_TITLE_DEFAULT = "잔디동 합격자 발표";

export const ANNOUNCEMENT_TITLE_FONT_SIZE_DEFAULT = 40;
export const ANNOUNCEMENT_TITLE_FONT_SIZE_MIN = 20;
export const ANNOUNCEMENT_TITLE_FONT_SIZE_MAX = 72;

export function loadAnnouncementTitle(): string {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_TITLE_STORAGE_KEY);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : ANNOUNCEMENT_TITLE_DEFAULT;
  } catch {
    return ANNOUNCEMENT_TITLE_DEFAULT;
  }
}

export function saveAnnouncementTitle(title: string) {
  try {
    localStorage.setItem(ANNOUNCEMENT_TITLE_STORAGE_KEY, title);
  } catch {
    /* ignore quota/private-browsing errors */
  }
}

export function loadAnnouncementTitleFontSize(): number {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_TITLE_FONT_SIZE_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (
      Number.isFinite(parsed) &&
      parsed >= ANNOUNCEMENT_TITLE_FONT_SIZE_MIN &&
      parsed <= ANNOUNCEMENT_TITLE_FONT_SIZE_MAX
    ) {
      return parsed;
    }
    return ANNOUNCEMENT_TITLE_FONT_SIZE_DEFAULT;
  } catch {
    return ANNOUNCEMENT_TITLE_FONT_SIZE_DEFAULT;
  }
}

export function saveAnnouncementTitleFontSize(fontSize: number) {
  try {
    localStorage.setItem(ANNOUNCEMENT_TITLE_FONT_SIZE_STORAGE_KEY, String(fontSize));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
