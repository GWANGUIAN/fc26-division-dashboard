import type { LineupPlayer, MatchDay, MatchLineup, PlayerRankingEntry } from "./types";

export const JANDY_TEAM_LOGO = "/team/team-jandy.webp";
export const JECHO_TEAM_LOGO = "/team/team-jecho.webp";

/** 9/11 경기 VOD — 3경기와 우왁굳 피드백이 전부 이 한 영상 안의 구간들이다. */
const MATCH_VOD_URL = "https://vod.sooplive.com/player/206803485";

/** 잔디동은 9/11 3경기 모두 같은 라인업으로 뛰었다. playerId는 roster.yaml slug. */
const JANDY_LINEUP: MatchLineup = {
  teamLabel: "잔디동",
  teamLogoUrl: JANDY_TEAM_LOGO,
  slots: [
    { playerId: "janine95kim", position: "GK" },
    { playerId: "tleod1818", position: "FB" },
    { playerId: "haepalin", position: "CB" },
    { playerId: "sjh4018", position: "CB" },
    { playerId: "lina0108", position: "FB" },
    { playerId: "doormomo", position: "CDM" },
    { playerId: "bboringirl", position: "CM" },
    { playerId: "kaksjak0730", position: "CM" },
    { playerId: "tdnlamuron", position: "WF" },
    { playerId: "ju010228", position: "ST" },
    { playerId: "hachi97", position: "WF" },
  ],
};

/**
 * "제초동" 상대팀 선수들. 1차는 합격했지만 2차에서 탈락한 인원들이라
 * passedSecondRound 롤업(=passedStreamers)에는 없지만, roster.yaml 자체에는
 * soopId가 있어 그걸로 아바타를 붙였다. CUSTOM_TEST_SCHEDULE_STREAMERS
 * (../testScheduleData.ts)와 같은 이유로 별도 하드코딩 목록으로 관리한다.
 */
export const JECHO_PLAYERS: LineupPlayer[] = [
  { id: "jecho-gamzagabi", displayName: "감자가비", soopId: "doki0818" },
  { id: "jecho-younggam", displayName: "영감___", soopId: "y0unggam" },
  { id: "jecho-mangya", displayName: "망야_", soopId: "habee511" },
  { id: "jecho-chebi", displayName: "체비", soopId: "chebi2" },
  { id: "jecho-nanamun", displayName: "나나문", soopId: "nanamoon777" },
  { id: "jecho-kurosha", displayName: "쿠로샤", soopId: "kur0ch4t" },
  { id: "jecho-ddalgishoumong", displayName: "딸기슈몽이♡", soopId: "ddalgishoux" },
  { id: "jecho-danchu", displayName: "단츄♪", soopId: "danchu17" },
  { id: "jecho-reuni", displayName: "르니", soopId: "leuni158" },
  { id: "jecho-heumnyang", displayName: "흠냥b", soopId: "ttu0221" },
  { id: "jecho-nanwoni", displayName: "난워니-_-+", soopId: "whiteone325" },
  { id: "jecho-seolbindal", displayName: "설빈달", soopId: "nsnowthemoon" },
];

/**
 * 9/11 제초동전 3경기. 스코어/영상 링크/골 타임라인(시간)은 실제 방송 타임스탬프
 * 기준. 득점자/어시스트는 아직 미확정이라 "득점자 미정"으로 비워둠 — 추후 실제
 * 이름으로 교체 예정. 화면에는 MatchRecordSection에 전달되는 passedStreamers
 * 목록에서 이름/아바타를 찾아 JANDY_LINEUP의 playerId(roster.yaml slug)와 붙인다.
 */
export const MATCH_RECORDS: MatchDay[] = [
  {
    isoDate: "2026-09-11",
    dateLabel: "9/11",
    opponentName: "제초동",
    opponentLogoUrl: JECHO_TEAM_LOGO,
    // 06:04:09 — 그날 3경기를 총평하는 우왁굳 피드백 구간 (같은 VOD).
    wakgoodReviewVideoUrl: `${MATCH_VOD_URL}?change_second=21849`,
    games: [
      {
        id: "2026-09-11-1",
        label: "1경기",
        jandyScore: 3,
        opponentScore: 0,
        videoUrl: MATCH_VOD_URL,
        startSeconds: 13276, // 03:41:16
        jandyLineup: JANDY_LINEUP,
        opponentLineup: {
          teamLabel: "제초동",
          teamLogoUrl: JECHO_TEAM_LOGO,
          slots: [
            { playerId: "jecho-gamzagabi", position: "GK" },
            { playerId: "jecho-danchu", position: "LB" },
            { playerId: "jecho-reuni", position: "CB" },
            { playerId: "jecho-heumnyang", position: "CB" },
            { playerId: "jecho-nanwoni", position: "RB" },
            { playerId: "jecho-chebi", position: "LM" },
            { playerId: "jecho-nanamun", position: "CM" },
            { playerId: "jecho-kurosha", position: "CM" },
            { playerId: "jecho-ddalgishoumong", position: "RM" },
            { playerId: "jecho-younggam", position: "ST" },
            { playerId: "jecho-mangya", position: "ST" },
          ],
        },
        timeline: [
          {
            id: "2026-09-11-1-g1",
            team: "jandy",
            scorerId: "kaksjak0730",
            scorerName: "한결___",
            assistId: "lina0108",
            assistName: "리냐_LINYA",
            minuteLabel: "38",
            seconds: 13612, // 03:46:52
          },
          {
            id: "2026-09-11-1-g2",
            team: "jandy",
            scorerId: "ju010228",
            scorerName: "쥬멩이",
            assistId: "doormomo",
            assistName: "문모모",
            minuteLabel: "50",
            seconds: 13778, // 03:49:38
          },
          {
            id: "2026-09-11-1-g3",
            team: "jandy",
            scorerId: "bboringirl",
            scorerName: "뽀린걸",
            assistId: "kaksjak0730",
            assistName: "한결___",
            minuteLabel: "59",
            seconds: 13870, // 03:51:10
          },
        ],
      },
      {
        id: "2026-09-11-2",
        label: "2경기",
        jandyScore: 2,
        opponentScore: 0,
        videoUrl: MATCH_VOD_URL,
        startSeconds: 14548, // 04:02:28
        jandyLineup: JANDY_LINEUP,
        opponentLineup: {
          teamLabel: "제초동",
          teamLogoUrl: JECHO_TEAM_LOGO,
          slots: [
            { playerId: "jecho-gamzagabi", position: "GK" },
            { playerId: "jecho-danchu", position: "LB" },
            { playerId: "jecho-heumnyang", position: "CB" },
            { playerId: "jecho-reuni", position: "CB" },
            { playerId: "jecho-nanwoni", position: "RB" },
            { playerId: "jecho-nanamun", position: "CM" },
            { playerId: "jecho-seolbindal", position: "CM" },
            { playerId: "jecho-kurosha", position: "CM" },
            { playerId: "jecho-chebi", position: "LW" },
            { playerId: "jecho-mangya", position: "ST" },
            { playerId: "jecho-ddalgishoumong", position: "RW" },
          ],
        },
        timeline: [
          {
            id: "2026-09-11-2-g1",
            team: "jandy",
            scorerId: "bboringirl",
            scorerName: "뽀린걸",
            assistId: "kaksjak0730",
            assistName: "한결___",
            minuteLabel: "15",
            seconds: 14715, // 04:05:15
          },
          {
            id: "2026-09-11-2-g2",
            team: "jandy",
            scorerId: "kaksjak0730",
            scorerName: "한결___",
            isPenalty: true,
            minuteLabel: "48",
            seconds: 15072, // 04:11:12 (PK)
          },
        ],
      },
      {
        id: "2026-09-11-3",
        label: "3경기",
        jandyScore: 6,
        opponentScore: 2,
        videoUrl: MATCH_VOD_URL,
        startSeconds: 15852, // 04:24:12
        jandyLineup: JANDY_LINEUP,
        opponentLineup: {
          teamLabel: "제초동",
          teamLogoUrl: JECHO_TEAM_LOGO,
          slots: [
            { playerId: "jecho-gamzagabi", position: "GK" },
            { playerId: "jecho-danchu", position: "LB" },
            { playerId: "jecho-reuni", position: "CB" },
            { playerId: "jecho-heumnyang", position: "CB" },
            { playerId: "jecho-nanwoni", position: "RB" },
            { playerId: "jecho-chebi", position: "LM" },
            { playerId: "jecho-nanamun", position: "CM" },
            { playerId: "jecho-kurosha", position: "CM" },
            { playerId: "jecho-ddalgishoumong", position: "RM" },
            { playerId: "jecho-younggam", position: "ST" },
            { playerId: "jecho-mangya", position: "ST" },
          ],
        },
        timeline: [
          {
            id: "2026-09-11-3-g1",
            team: "jandy",
            scorerId: "ju010228",
            scorerName: "쥬멩이",
            assistId: "bboringirl",
            assistName: "뽀린걸",
            minuteLabel: "6",
            seconds: 15898, // 04:24:58
          },
          {
            id: "2026-09-11-3-g2",
            team: "jandy",
            scorerId: "kaksjak0730",
            scorerName: "한결___",
            assistId: "tdnlamuron",
            assistName: "다시바",
            minuteLabel: "9",
            seconds: 15937, // 04:25:37
          },
          {
            id: "2026-09-11-3-g3",
            team: "jandy",
            scorerId: "ju010228",
            scorerName: "쥬멩이",
            assistId: "kaksjak0730",
            assistName: "한결___",
            minuteLabel: "15",
            seconds: 16001, // 04:26:41
          },
          {
            id: "2026-09-11-3-g4",
            team: "opponent",
            scorerId: "jecho-younggam",
            scorerName: "영감___",
            assistId: "jecho-seolbindal",
            assistName: "설빈달",
            minuteLabel: "38",
            seconds: 16253, // 04:30:53 (제초동 골)
          },
          {
            id: "2026-09-11-3-g5",
            team: "jandy",
            scorerId: "ju010228",
            scorerName: "쥬멩이",
            assistId: "kaksjak0730",
            assistName: "한결___",
            minuteLabel: "53",
            seconds: 16465, // 04:34:25
          },
          {
            id: "2026-09-11-3-g6",
            team: "jandy",
            scorerId: "ju010228",
            scorerName: "쥬멩이",
            assistId: "doormomo",
            assistName: "문모모",
            minuteLabel: "61",
            seconds: 16546, // 04:35:46
          },
          {
            id: "2026-09-11-3-g7",
            team: "jandy",
            scorerId: "bboringirl",
            scorerName: "뽀린걸",
            assistId: "ju010228",
            assistName: "쥬멩이",
            minuteLabel: "65",
            seconds: 16596, // 04:36:36
          },
          {
            id: "2026-09-11-3-g8",
            team: "opponent",
            scorerId: "jecho-younggam",
            scorerName: "영감___",
            assistId: "jecho-mangya",
            assistName: "망야_",
            minuteLabel: "86",
            seconds: 16790, // 04:39:50 (제초동 골)
          },
        ],
      },
    ],
  },
];

/** 모든 경기 기록을 통틀어 이 선수(streamerId)의 골/어시스트 합계 — 자책골은 득점 집계에서 제외. */
export function computeMatchStats(playerId: string): { goals: number; assists: number } {
  let goals = 0;
  let assists = 0;
  for (const day of MATCH_RECORDS) {
    for (const game of day.games) {
      for (const event of game.timeline) {
        if (event.scorerId === playerId && !event.isOwnGoal) goals++;
        if (event.assistId === playerId) assists++;
      }
    }
  }
  return { goals, assists };
}

/**
 * 골이나 어시스트가 하나라도 있는 잔디동 선수 전원(같은 목록)을 골 순/어시 순
 * 두 가지로 정렬해 반환한다 — 탭은 정렬 기준만 바꾸고, 목록 자체는 동일하다.
 */
export function computeJandyPlayerRankings(): {
  byGoals: PlayerRankingEntry[];
  byAssists: PlayerRankingEntry[];
} {
  const jandyIds = new Set(
    JANDY_LINEUP.slots
      .map((slot) => slot.playerId)
      .filter((id): id is string => !!id),
  );
  const stats = new Map<string, { goals: number; assists: number }>();
  const bump = (playerId: string, field: "goals" | "assists") => {
    const entry = stats.get(playerId) ?? { goals: 0, assists: 0 };
    entry[field]++;
    stats.set(playerId, entry);
  };
  for (const day of MATCH_RECORDS) {
    for (const game of day.games) {
      for (const event of game.timeline) {
        if (event.scorerId && jandyIds.has(event.scorerId) && !event.isOwnGoal) {
          bump(event.scorerId, "goals");
        }
        if (event.assistId && jandyIds.has(event.assistId)) {
          bump(event.assistId, "assists");
        }
      }
    }
  }
  const entries = Array.from(stats.entries()).map(([playerId, entry]) => ({
    playerId,
    ...entry,
  }));
  return {
    byGoals: [...entries].sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    byAssists: [...entries].sort((a, b) => b.assists - a.assists || b.goals - a.goals),
  };
}
