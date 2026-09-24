// Playable field characters (docs/pitch/01 §8, 03 §3·§5). The registry holds all 12 in the select-screen order of
// 03 §3 (same order as `characterIds.ts`). Values are hard-coded here on purpose (no import from the world modules).

import { DEFAULT_PITCH_CHARACTER, loadPitchCharacter, savePitchCharacter } from "../../storage";

export type PositionKey = "GK" | "CB" | "FB" | "CDM" | "CM" | "WF" | "ST" | "MGR";

export interface PitchCharacter {
  /** Also the asset key stem: `characters/<id>-atlas`. */
  id: string;
  name: string;
  /** Short label shown in the HUD (03 §2-1 "현재 캐릭터 판"). */
  positionLabel: string;
  position: PositionKey;
  /** Accent colour for plates / dust tint. */
  themeColor: string;
  /** The character's own click sound (the streamer card's sfx in public/sfxes), played when the pick is confirmed. */
  sfx: string;
}

export const DEFAULT_CHARACTER_ID = DEFAULT_PITCH_CHARACTER;

/** Korean labels for the plates; the stat axes of P6 are keyed by `PositionKey`. */
export const POSITION_LABELS: Readonly<Record<PositionKey, string>> = {
  GK: "골키퍼",
  CB: "센터백",
  FB: "풀백",
  CDM: "수비형 미드",
  CM: "미드필더",
  WF: "윙",
  ST: "스트라이커",
  MGR: "감독",
};

const character = (id: string, name: string, position: PositionKey, themeColor: string, sfx: string): PitchCharacter => ({
  id,
  name,
  positionLabel: POSITION_LABELS[position],
  position,
  themeColor,
  sfx,
});

/** 03 §3 order, fixed: 우왁굳, 재닌, 뽀린걸, 핑구, 문모모, 하치, 한결, 쥬멩이, 해파린, 빙밍, 다시바, 리냐. */
export const PITCH_CHARACTERS: readonly PitchCharacter[] = [
  character("woowakgood", "우왁굳", "MGR", "#3ee6c1", "/sfxes/woowakgood.mp3"),
  character("janine95kim", "재닌", "GK", "#4f8dff", "/sfxes/jaenin.mp3"),
  character("bboringirl", "뽀린걸", "CM", "#ff4d6d", "/sfxes/bboringirl.mp3"),
  character("sjh4018", "핑구", "CB", "#5ac8ff", "/sfxes/pinggu.mp3"),
  character("doormomo", "문모모", "CDM", "#a06bff", "/sfxes/doormomo.mp3"),
  character("hachi97", "하치", "WF", "#e8e6ff", "/sfxes/hachi.mp3"),
  character("kaksjak0730", "한결", "CM", "#4ff0b0", "/sfxes/hangyeul.mp3"),
  character("ju010228", "쥬멩이", "ST", "#6ddc5a", "/sfxes/jyumenge.mp3"),
  character("haepalin", "해파린", "CB", "#9fa8ff", "/sfxes/haeparin.mp3"),
  character("tleod1818", "빙밍", "FB", "#2fbf71", "/sfxes/bingming.mp3"),
  character("tdnlamuron", "다시바", "WF", "#ff9a3d", "/sfxes/dashiba.mp3"),
  character("lina0108", "리냐", "FB", "#ff6b8a", "/sfxes/linya.mp3"),
];

export function isKnownCharacterId(id: string): boolean {
  return PITCH_CHARACTERS.some((entry) => entry.id === id);
}

export function characterIndex(id: string): number {
  return Math.max(0, PITCH_CHARACTERS.findIndex((entry) => entry.id === id));
}

export function getCharacter(id: string): PitchCharacter {
  return PITCH_CHARACTERS.find((entry) => entry.id === id) ?? PITCH_CHARACTERS[0]!;
}

export interface StoredCharacterDeps {
  load?: () => string;
  save?: (id: string) => void;
}

/**
 * The saved character, checked against the registry. `loadPitchCharacter` only validates the shape, so an id that
 * is well-formed but unknown (a removed or renamed character, a hand-edited value) is overwritten with the default.
 */
export function resolveStoredCharacter({ load = loadPitchCharacter, save = savePitchCharacter }: StoredCharacterDeps = {}): PitchCharacter {
  const id = load();
  if (isKnownCharacterId(id)) return getCharacter(id);
  save(DEFAULT_CHARACTER_ID);
  return getCharacter(DEFAULT_CHARACTER_ID);
}
