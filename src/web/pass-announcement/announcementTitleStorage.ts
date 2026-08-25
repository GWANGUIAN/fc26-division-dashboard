const ANNOUNCEMENT_TITLE_STORAGE_KEY = "fc26-pass-announcement-title";

export const ANNOUNCEMENT_TITLE_DEFAULT = "잔디동 합격자 발표";

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
