export interface QuipTier {
  minScore: number;
  maxScore: number;
  lines: string[];
}

export const KICKUPS_TOP_TIER_MIN_SCORE = 40;

/** Score-40+ quips reference either name at random via the "{name}" placeholder below. */
export const KICKUPS_NAME_POOL = ["문모모", "라리양"];

export const KICKUPS_QUIPS: QuipTier[] = [
  {
    minScore: 0,
    maxScore: 0,
    lines: ["0회. 잔디동 합격은커녕 입구컷"],
  },
  {
    minScore: 1,
    maxScore: 5,
    lines: ["잔디동 합격 불투명"],
  },
  {
    minScore: 6,
    maxScore: 10,
    lines: ["잔디동 합격 조건 충족"],
  },
  {
    minScore: 11,
    maxScore: 15,
    lines: ["잔디동 상현급 실력", "발끝 감각 살아있네"],
  },
  {
    minScore: 16,
    maxScore: 25,
    lines: ["잔디동 에이스급 실력", "이 정도면 문모모한테 리스펙 받을 수도"],
  },
  {
    minScore: 26,
    maxScore: 32,
    lines: ["잔디동 반장급 실력", "{name}도 놀랄 발재간"],
  },
  {
    minScore: 33,
    maxScore: 39,
    lines: [
      "잔디동 운영급 실력",
      "{name}급... 인정할 수밖에 없다",
      "이 정도면 SOOP 1황 도전권",
    ],
  },
  {
    minScore: KICKUPS_TOP_TIER_MIN_SCORE,
    maxScore: Infinity,
    lines: [
      "잔디동 회장",
      "{name}급 리프팅. 진짜 1황 나셨습니다",
      "이건 그냥 {name} 본인 아니야?",
    ],
  },
];

export function pickQuip(score: number, isNewRecord: boolean): string {
  const tier = KICKUPS_QUIPS.find((t) => score >= t.minScore && score <= t.maxScore) ?? KICKUPS_QUIPS[0];
  const line = tier.lines[Math.floor(Math.random() * tier.lines.length)];
  const named = line.includes("{name}")
    ? line.replaceAll("{name}", KICKUPS_NAME_POOL[Math.floor(Math.random() * KICKUPS_NAME_POOL.length)])
    : line;
  return isNewRecord ? `${named} (신기록!)` : named;
}
