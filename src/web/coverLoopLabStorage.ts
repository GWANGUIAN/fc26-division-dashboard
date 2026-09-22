// CoverLoopStage.tsx 전용 localStorage 영속화 — playlistStorage.ts와 같은
// try/catch read/write 패턴을 그대로 쓴다.
const LAST_PLAYBACK_KEY = "fc26-cover-loop-last-playback-v1";
const REPEAT_MODE_KEY = "fc26-cover-loop-repeat-mode-v1";
const VOLUME_KEY = "fc26-cover-loop-volume-v1";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private-browsing errors */
  }
}

export type CoverLoopLastPlayback = {
  trackId: string;
  seconds: number;
};

/** 마지막으로 재생하던 곡 id와 그 시점의 재생 위치(유튜브 원본 재생 시각). */
export function loadCoverLoopLastPlayback(): CoverLoopLastPlayback | null {
  const raw = readStorage(LAST_PLAYBACK_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CoverLoopLastPlayback>;
    if (typeof parsed.trackId !== "string" || typeof parsed.seconds !== "number" || !Number.isFinite(parsed.seconds)) {
      return null;
    }
    return { trackId: parsed.trackId, seconds: Math.max(0, parsed.seconds) };
  } catch {
    return null;
  }
}

export function saveCoverLoopLastPlayback(trackId: string, seconds: number) {
  if (!Number.isFinite(seconds)) return;
  writeStorage(LAST_PLAYBACK_KEY, JSON.stringify({ trackId, seconds: Math.max(0, seconds) }));
}

export type CoverLoopRepeatMode = "off" | "all" | "one";

export function loadCoverLoopRepeatMode(): CoverLoopRepeatMode {
  const raw = readStorage(REPEAT_MODE_KEY);
  return raw === "off" || raw === "all" || raw === "one" ? raw : "all";
}

export function saveCoverLoopRepeatMode(mode: CoverLoopRepeatMode) {
  writeStorage(REPEAT_MODE_KEY, mode);
}

const DEFAULT_VOLUME = 80;

export function loadCoverLoopVolume(): number {
  const raw = readStorage(VOLUME_KEY);
  if (raw === null) return DEFAULT_VOLUME;
  const value = Number(raw);
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function saveCoverLoopVolume(volume: number) {
  if (!Number.isFinite(volume)) return;
  writeStorage(VOLUME_KEY, String(Math.min(100, Math.max(0, Math.round(volume)))));
}
