// Field-player ids in select-screen order (docs/pitch/04 §5). Same list as scripts/pitch-art-manifest.json "characters.field".
export const PITCH_CHARACTER_IDS = [
  "woowakgood",
  "janine95kim",
  "bboringirl",
  "sjh4018",
  "doormomo",
  "hachi97",
  "kaksjak0730",
  "ju010228",
  "haepalin",
  "tleod1818",
  "tdnlamuron",
  "lina0108",
] as const;

export type PitchCharacterId = (typeof PITCH_CHARACTER_IDS)[number];
