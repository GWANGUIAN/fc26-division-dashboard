/** Same shape as TestScheduleSlot (./testScheduleData.ts) — a lineup spot with an optional position code. */
export interface MatchLineupSlot {
  playerId?: string;
  position: string;
}

export interface MatchLineup {
  teamLabel: string;
  teamLogoUrl: string;
  slots: MatchLineupSlot[];
}

export interface MatchGoalEvent {
  id: string;
  team: "jandy" | "opponent";
  /** roster.yaml slug (잔디동) or a JECHO_PLAYERS id (제초동). */
  scorerId?: string;
  /** Display name — also the fallback when scorerId doesn't resolve to a known player. */
  scorerName: string;
  assistId?: string;
  assistName?: string;
  isOwnGoal?: boolean;
  /** PK로 넣은 골. */
  isPenalty?: boolean;
  /**
   * 화면에 보여줄 득점 시각을 수동으로 적은 텍스트 (예: "23", 추가시간이면
   * "45+2"). 영상 딥링크에 쓰이는 `seconds`(VOD 안에서의 실제 위치)와는
   * 완전히 별개 값 — 실제 경기 시간과 VOD 타임스탬프가 다를 수 있어서 분리했다.
   */
  minuteLabel?: string;
  /** Timestamp (seconds) inside this game's videoUrl — combined as `${videoUrl}?change_second=${seconds}` for the deep link, same convention as JandyVideoSection's chapter links. */
  seconds?: number;
}

export interface MatchGame {
  id: string;
  /** Shown as a tab when a day has more than one game, e.g. "1경기". */
  label: string;
  jandyScore: number;
  opponentScore: number;
  jandyLineup: MatchLineup;
  opponentLineup: MatchLineup;
  timeline: MatchGoalEvent[];
  videoUrl?: string;
  /** Timestamp (seconds) in videoUrl where this game kicks off — used for the "경기 영상 보기" link so it opens right at kickoff instead of the start of the whole VOD. */
  startSeconds?: number;
  /** This game's own 우왁굳 피드백 영상, if it has one distinct from the day's. */
  wakgoodReviewVideoUrl?: string;
}

export interface MatchDay {
  isoDate: string;
  dateLabel: string;
  opponentName: string;
  opponentLogoUrl: string;
  games: MatchGame[];
  /** Falls back for any game in this day that doesn't have its own wakgoodReviewVideoUrl. */
  wakgoodReviewVideoUrl?: string;
}

/** Minimal player shape the lineup pitch/timeline need — a subset of StreamerRecord so opponent-team players (not in roster.yaml) can use the same components. */
export interface LineupPlayer {
  id: string;
  displayName: string;
  soopId?: string;
  profileImageUrl?: string;
}

/** One row of the 골/어시스트 순위 (goal/assist ranking) modal. */
export interface PlayerRankingEntry {
  playerId: string;
  goals: number;
  assists: number;
}
