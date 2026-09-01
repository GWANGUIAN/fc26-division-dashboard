/**
 * 2차 테스트 일정 (9/4, 9/5, 9/7) — 스프레드시트에서 수기로 옮긴 고정 데이터.
 * 각 날짜는 빈 줄을 기준으로 위/아래 두 팀으로 나뉘며, 여기 적힌 포지션은
 * roster.yaml의 hopedPosition1/2(희망 포지션)와 별개로 이번 테스트에 배정된
 * 포지션이다. streamerId가 없는 슬롯은 아직 채워지지 않은 "대기인원" 자리.
 */
export interface TestScheduleSlot {
  /** StreamerRecord.id (roster slug). 미배정 "대기인원" 자리는 생략. */
  streamerId?: string;
  /** 이번 테스트에 배정된 포지션 코드 (예: "ST", "CDM"). */
  position: string;
}

export interface TestScheduleTeam {
  label: string;
  slots: TestScheduleSlot[];
}

export interface TestScheduleDate {
  /** 화면에 표시할 짧은 날짜 라벨 (예: "9/4"). */
  date: string;
  /** 가장 가까운 날짜를 계산하기 위한 ISO 날짜 (YYYY-MM-DD). */
  isoDate: string;
  teams: TestScheduleTeam[];
}

export const TEST_SCHEDULE: TestScheduleDate[] = [
  {
    date: "9/4",
    isoDate: "2026-09-04",
    teams: [
      {
        label: "1팀",
        slots: [
          { streamerId: "haepalin", position: "CB" },
          { streamerId: "sjh4018", position: "CB" },
          { streamerId: "sircharlee", position: "FB" },
          { streamerId: "tleod1818", position: "FB" },
          { streamerId: "nsnowthemoon", position: "CDM" },
          { streamerId: "kur0ch4t", position: "CM" },
          { streamerId: "been11060", position: "CM" },
          { streamerId: "esoj001", position: "WF" },
          { streamerId: "ditosak", position: "WF" },
          { streamerId: "hobal115end", position: "ST" },
          { streamerId: "janine95kim", position: "GK" },
        ],
      },
      {
        label: "2팀",
        slots: [
          { streamerId: "y0unggam", position: "ST" },
          { streamerId: "alice427", position: "WF" },
          { streamerId: "ddalgishoux", position: "WF" },
          { streamerId: "kaksjak0730", position: "CM" },
          { streamerId: "sookbong777", position: "CM" },
          { streamerId: "kirababy2", position: "CDM" },
          { streamerId: "dokkhye0000", position: "CB" },
          { streamerId: "ttu0221", position: "CB" },
          { streamerId: "lina0108", position: "FB" },
          { position: "FB" },
          { streamerId: "janine95kim", position: "GK" },
        ],
      },
    ],
  },
  {
    date: "9/5",
    isoDate: "2026-09-05",
    teams: [
      {
        label: "1팀",
        slots: [
          { streamerId: "gofl2237", position: "ST" },
          { streamerId: "aryenne", position: "RW" },
          { streamerId: "nlsb9718", position: "WF" },
          { streamerId: "bboringirl", position: "CM" },
          { streamerId: "zzimio3o", position: "CM" },
          { streamerId: "villlo", position: "CDM" },
          { streamerId: "leuni158", position: "CB" },
          { position: "CB" },
          { streamerId: "danchu17", position: "FB" },
          { streamerId: "etwo22", position: "FB" },
        ],
      },
      {
        label: "2팀",
        slots: [
          { streamerId: "yourdarky", position: "ST" },
          { streamerId: "tdnlamuron", position: "WF" },
          { streamerId: "jejong5", position: "WF" },
          { streamerId: "nanamoon777", position: "CM" },
          { position: "CM" },
          { streamerId: "doormomo", position: "CDM" },
          { streamerId: "secretto486", position: "FB" },
          { position: "FB" },
          { position: "CB" },
          { position: "CB" },
        ],
      },
    ],
  },
  {
    date: "9/7",
    isoDate: "2026-09-07",
    teams: [
      {
        label: "1팀",
        slots: [
          { streamerId: "ju010228", position: "ST" },
          { streamerId: "chebi2", position: "WF" },
          { streamerId: "hachi97", position: "WF" },
          { position: "CM" },
          { position: "CM" },
          { streamerId: "toocats", position: "CDM" },
          { position: "CB" },
          { position: "CB" },
          { streamerId: "secymyong", position: "FB" },
          { position: "FB" },
          { streamerId: "janine95kim", position: "GK" },
        ],
      },
      {
        label: "2팀",
        slots: [
          { streamerId: "habee511", position: "ST" },
          { streamerId: "cjstkdbsl3", position: "WF" },
          { streamerId: "hikicomoring", position: "WF" },
          { position: "CM" },
          { position: "CM" },
          { position: "CDM" },
          { position: "CB" },
          { position: "CB" },
          { streamerId: "whiteone325", position: "FB" },
          { position: "FB" },
          { streamerId: "janine95kim", position: "GK" },
        ],
      },
    ],
  },
];

/** Index of the schedule date closest to `today` (ties resolve to the earlier date). */
export function nearestScheduleDateIndex(
  schedule: TestScheduleDate[] = TEST_SCHEDULE,
  today: Date = new Date(),
): number {
  const todayMs = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  let bestIndex = 0;
  let bestDiff = Infinity;
  schedule.forEach((entry, index) => {
    const [year, month, day] = entry.isoDate.split("-").map(Number);
    const entryMs = new Date(year, month - 1, day).getTime();
    const diff = Math.abs(entryMs - todayMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });
  return bestIndex;
}
