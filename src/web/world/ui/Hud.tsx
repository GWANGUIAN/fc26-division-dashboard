import type { CSSProperties } from "react";
import { getCast } from "../data/worldCast";
import type { MissionView } from "../state/missions";
import { getWorldAssetUrl } from "../worldAssets";
import { missionIconKey } from "./missionIcons";

const SLOTS = 10;

interface HudProps {
  /** Grass shards won (0–10). */
  shards: number;
  /** The mission shown in the tracker, if any. */
  tracked: MissionView | null;
  /** Opens the journal from the visible tracker as well as from J. */
  onOpenLog?: () => void;
}

/**
 * Always-on HUD (docs/world/06 §8): the grass-shard gauge and the tracker with the current goal, top-left.
 * The timers of a running delivery / trial / kick challenge are drawn on the canvas, not here.
 */
export function Hud({ shards, tracked, onOpenLog }: HudProps) {
  const gauge = getWorldAssetUrl("ui/shard-gauge");
  const tracker = getWorldAssetUrl("ui/hud-tracker");
  const filled = getWorldAssetUrl("ui/shard-filled");
  const icon = tracked ? getWorldAssetUrl(missionIconKey(tracked.def, tracked.status)) : undefined;
  const style = {
    ...(gauge ? { "--hud-gauge": `url(${gauge})` } : {}),
    ...(tracker ? { "--hud-tracker": `url(${tracker})` } : {}),
  } as CSSProperties;

  const detail = tracked
    ? tracked.status === "ready"
      ? `${getCast(tracked.def.giver).displayName}에게 보고하세요!`
      : tracked.status === "available"
        ? `${getCast(tracked.def.giver).displayName}에게 말을 걸어 보세요`
        : tracked.progressText || tracked.def.objective
    : "미션 로그에서 다음 목표를 확인하세요";

  return (
    <div className="world-hud" style={style}>
      <div className={`world-gauge${gauge ? " world-gauge--art" : ""}`} role="img" aria-label={`잔디 조각 ${shards}/${SLOTS}`}>
        {Array.from({ length: SLOTS }, (_, index) => (
          <span key={index} className={`world-gauge__slot${index < shards ? " is-full" : ""}`}>
            {index < shards && filled && <img src={filled} alt="" draggable={false} />}
          </span>
        ))}
        <span className="world-gauge__count" aria-hidden="true">{shards}/{SLOTS}</span>
      </div>
      <button
        type="button"
        className={`world-tracker${tracker ? " world-tracker--art" : ""}${tracked?.status === "ready" ? " is-ready" : ""}`}
        onClick={onOpenLog}
        aria-label="미션 로그 열기"
      >
          {icon && <img className="world-tracker__icon" src={icon} alt="" draggable={false} />}
          <div className="world-tracker__text">
            <strong>{tracked?.def.title ?? "미션 트래커"}</strong>
            <span>{detail}</span>
          </div>
      </button>
    </div>
  );
}
