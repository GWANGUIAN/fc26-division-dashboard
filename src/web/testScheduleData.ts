import type { StreamerRecord } from "../shared/model.js";

/**
 * 2차 테스트 일정 (9/4, 9/5, 9/7) — 스프레드시트에서 수기로 옮긴 고정 데이터.
 * 각 날짜는 빈 줄을 기준으로 위/아래 두 팀으로 나뉘며, 여기 적힌 포지션은
 * roster.yaml의 hopedPosition1/2(희망 포지션)와 별개로 이번 테스트에 배정된
 * 포지션이다. streamerId가 없는 슬롯은 아직 채워지지 않은 "대기인원" 자리.
 */
export interface TestScheduleSlot {
  /** StreamerRecord.id (roster slug) 또는 CUSTOM_TEST_SCHEDULE_STREAMERS의 id. 미배정 "대기인원" 자리는 생략. */
  streamerId?: string;
  /** 이번 테스트에 배정된 포지션 코드 (예: "ST", "CDM"). */
  position: string;
}

export interface TestScheduleTeam {
  label: string;
  slots: TestScheduleSlot[];
}

/** 같은 날짜에 여러 경기가 있을 때(예: 9/5의 1경기/2경기) 토글로 전환할 수 있는 한 경기 분량의 팀 편성. */
export interface TestScheduleGame {
  /** 토글에 표시할 라벨 (예: "1경기"). */
  label: string;
  teams: TestScheduleTeam[];
}

export interface TestScheduleDate {
  /** 화면에 표시할 짧은 날짜 라벨 (예: "9/4"). */
  date: string;
  /** 가장 가까운 날짜를 계산하기 위한 ISO 날짜 (YYYY-MM-DD). */
  isoDate: string;
  /** 하루에 경기가 하나뿐일 때의 팀 편성. `games`가 있으면 대신 그쪽을 사용한다. */
  teams?: TestScheduleTeam[];
  /** 하루에 경기가 여러 개일 때(예: 9/5) 각 경기별 팀 편성. 있으면 토글 UI가 표시된다. */
  games?: TestScheduleGame[];
  /** 확정된 일정이라 포메이션 화면의 자리 편성(클릭 배정/교체/비우기)을 막을 때 true. */
  locked?: boolean;
}

/** `entry.games`가 있으면 그대로, 없으면 `entry.teams`를 단일 경기로 감싸 반환한다. */
export function gamesForDate(entry: TestScheduleDate): TestScheduleGame[] {
  return entry.games ?? [{ label: entry.date, teams: entry.teams ?? [] }];
}

/**
 * roster.yaml에 없는 게스트 참가자. 9/4 일정에서만 쓰이며, id는
 * TestScheduleSlot.streamerId로 참조한다.
 */
export const CUSTOM_TEST_SCHEDULE_STREAMERS: StreamerRecord[] = [
  {
    id: "custom-picaon",
    displayName: "피카온",
    cafeAliases: [],
    profileImageUrl: "/profiles/profile_picaon.webp",
    autoUpdate: false,
    overridePolicy: "auto",
    currentDivision: 0,
    isMapped: true,
  },
  {
    id: "custom-wakgood",
    displayName: "우왁굳",
    cafeAliases: [],
    profileImageUrl: "/profiles/profile_wakgood.webp",
    autoUpdate: false,
    overridePolicy: "auto",
    currentDivision: 0,
    isMapped: true,
  },
  {
    // 프로필 사진이 아직 없어 "?" 기본 아바타로 표시된다. 나중에 사진이 생기면 profileImageUrl을 채운다.
    id: "custom-landers",
    displayName: "랜더스",
    cafeAliases: [],
    autoUpdate: false,
    overridePolicy: "auto",
    currentDivision: 0,
    isMapped: true,
  },
];

export const TEST_SCHEDULE: TestScheduleDate[] = [
  {
    date: "9/4",
    isoDate: "2026-09-04",
    locked: true,
    teams: [
      {
        label: "2팀",
        slots: [
          { streamerId: "y0unggam", position: "ST" },
          { streamerId: "ddalgishoux", position: "WF" },
          { streamerId: "alice427", position: "WF" },
          { streamerId: "sookbong777", position: "CM" },
          { streamerId: "kaksjak0730", position: "CM" },
          { streamerId: "kirababy2", position: "CDM" },
          { streamerId: "ttu0221", position: "CB" },
          { streamerId: "dokkhye0000", position: "CB" },
          { streamerId: "custom-wakgood", position: "FB" },
          { streamerId: "lina0108", position: "FB" },
          { streamerId: "custom-picaon", position: "GK" },
        ],
      },
      {
        label: "1팀",
        slots: [
          { streamerId: "sjh4018", position: "CB" },
          { streamerId: "haepalin", position: "CB" },
          { streamerId: "tleod1818", position: "FB" },
          { streamerId: "sircharlee", position: "FB" },
          { streamerId: "nsnowthemoon", position: "CDM" },
          { streamerId: "been11060", position: "CM" },
          { streamerId: "kur0ch4t", position: "CM" },
          { streamerId: "ditosak", position: "WF" },
          { streamerId: "esoj001", position: "WF" },
          { streamerId: "hobal115end", position: "ST" },
          { streamerId: "janine95kim", position: "GK" },
        ],
      },
    ],
  },
  {
    date: "9/5",
    isoDate: "2026-09-05",
    locked: true,
    games: [
      {
        label: "1경기",
        teams: [
          {
            label: "2팀",
            slots: [
              { streamerId: "yourdarky", position: "ST" },
              { streamerId: "chebi2", position: "WF" },
              { streamerId: "tdnlamuron", position: "WF" },
              { streamerId: "nanamoon777", position: "CM" },
              { streamerId: "kirababy2", position: "CM" },
              { streamerId: "doormomo", position: "CDM" },
              { streamerId: "ttu0221", position: "CB" },
              { streamerId: "dokkhye0000", position: "CB" },
              { streamerId: "lina0108", position: "FB" },
              { streamerId: "secretto486", position: "FB" },
              { streamerId: "custom-landers", position: "GK" },
            ],
          },
          {
            label: "1팀",
            slots: [
              { streamerId: "gofl2237", position: "ST" },
              { streamerId: "nlsb9718", position: "RW" },
              { streamerId: "aryenne", position: "WF" },
              { streamerId: "zzimio3o", position: "CM" },
              { streamerId: "bboringirl", position: "CM" },
              { streamerId: "villlo", position: "CDM" },
              { streamerId: "custom-wakgood", position: "CB" },
              { streamerId: "leuni158", position: "CB" },
              { streamerId: "etwo22", position: "FB" },
              { streamerId: "danchu17", position: "FB" },
              { streamerId: "custom-picaon", position: "GK" },
            ],
          },
        ],
      },
      {
        label: "2경기",
        teams: [
          {
            label: "2팀",
            slots: [
              { streamerId: "yourdarky", position: "ST" },
              { streamerId: "chebi2", position: "WF" },
              { streamerId: "tdnlamuron", position: "WF" },
              { streamerId: "nanamoon777", position: "CM" },
              { streamerId: "jejong5", position: "CM" },
              { streamerId: "doormomo", position: "CDM" },
              { streamerId: "secymyong", position: "CB" },
              { streamerId: "haepalin", position: "CB" },
              { streamerId: "whiteone325", position: "FB" },
              { streamerId: "secretto486", position: "FB" },
              { streamerId: "custom-landers", position: "GK" },
            ],
          },
          {
            label: "1팀",
            slots: [
              { streamerId: "gofl2237", position: "ST" },
              { streamerId: "aryenne", position: "WF" },
              { streamerId: "nlsb9718", position: "WF" },
              { streamerId: "zzimio3o", position: "CM" },
              { streamerId: "bboringirl", position: "CM" },
              { streamerId: "villlo", position: "CDM" },
              { streamerId: "custom-wakgood", position: "CB" },
              { streamerId: "leuni158", position: "CB" },
              { streamerId: "etwo22", position: "FB" },
              { streamerId: "danchu17", position: "FB" },
              { streamerId: "custom-picaon", position: "GK" },
            ],
          },
        ],
      },
    ],
  },
  {
    date: "9/7",
    isoDate: "2026-09-07",
    teams: [
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
      {
        label: "1팀",
        slots: [
          { streamerId: "ju010228", position: "ST" },
          { streamerId: "jejong5", position: "WF" },
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
    ],
  },
];

/** One game a streamer actually appears in — `gameLabel` is only set for a date with multiple games. */
export interface StreamerMatchAppearance {
  date: string;
  gameLabel?: string;
}

/**
 * 어떤 스트리머가 실제로 배정된 경기들만 모아서 반환한다. 9/5처럼 하루에
 * 경기가 여러 개인 날짜는 실제로 뛴 경기 중 하나에만 배정됐을 때만
 * gameLabel이 붙는다(예: 1경기만 뛰었으면 "9/5 1경기"). 두 경기를 모두
 * 뛴 경우는 굳이 나누지 않고 날짜 하나로만("9/5") 표기한다.
 */
export function matchAppearancesForStreamer(
  streamerId: string,
  schedule: TestScheduleDate[] = TEST_SCHEDULE,
): StreamerMatchAppearance[] {
  const appearances: StreamerMatchAppearance[] = [];
  for (const entry of schedule) {
    const games = gamesForDate(entry);
    const playedGames = games.filter((game) =>
      game.teams.some((team) =>
        team.slots.some((slot) => slot.streamerId === streamerId),
      ),
    );
    if (playedGames.length === 0) continue;
    if (playedGames.length === 1 && games.length > 1) {
      appearances.push({ date: entry.date, gameLabel: playedGames[0].label });
    } else {
      appearances.push({ date: entry.date });
    }
  }
  return appearances;
}

/** Distinct date labels (e.g. "9/4") a streamer is scheduled for, regardless of which game. */
export function matchDatesForStreamer(
  streamerId: string,
  schedule: TestScheduleDate[] = TEST_SCHEDULE,
): Set<string> {
  return new Set(
    matchAppearancesForStreamer(streamerId, schedule).map((a) => a.date),
  );
}

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
