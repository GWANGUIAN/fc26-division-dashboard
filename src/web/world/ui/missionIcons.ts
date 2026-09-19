import { BADGES, type MissionDef } from "../data/missionDefs";
import type { MissionStatus } from "../types";

/** `ui/` asset key of the icon that stands for a mission in the log and the tracker (docs/world/06 §5 `mi-*`). */
export function missionIconKey(def: MissionDef, status: MissionStatus): string {
  if (status === "ready") return "ui/mi-ready";
  if (status === "completed") return "ui/mi-done";
  switch (def.kind) {
    case "talk":
    case "talk_chain":
      return "ui/mi-talk";
    case "card_reveal":
    case "card_variant":
      return "ui/mi-card";
    case "minigame_best":
      return def.game === "kickups" ? "ui/mi-kickups" : def.game === "freekick" ? "ui/mi-freekick" : def.game === "cardmatch" ? "ui/mi-cardmatch" : "ui/mi-sum10";
    case "collect":
      return "ui/mi-collect";
    case "delivery":
      return "ui/mi-delivery";
    case "kick_goals":
      return "ui/mi-kickups";
    case "time_trial":
    case "finale":
      return "ui/mi-progress";
  }
}

export const STATUS_LABEL: Record<MissionStatus, string> = {
  locked: "잠김",
  available: "새 미션",
  active: "진행 중",
  ready: "보고하기",
  completed: "완료",
};

/** "잔디 조각 +1 · 뱃지 「첫 한 판」" — what finishing the mission gives. */
export function rewardText(def: MissionDef): string {
  const parts: string[] = [];
  if (def.main && (def.reward.shard ?? 0) > 0) parts.push(`잔디 조각 +${def.reward.shard}`);
  if (def.reward.badge) parts.push(`뱃지 「${BADGES[def.reward.badge]?.label ?? def.reward.badge}」`);
  if (def.reward.flags?.includes("main-open")) parts.push("메인 미션 열림");
  return parts.length > 0 ? parts.join(" · ") : "—";
}
