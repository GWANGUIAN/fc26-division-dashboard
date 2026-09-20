import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SILENT_AUDIO, type WorldAudioLike } from "../audio/worldAudio";
import { BADGES } from "../data/missionDefs";
import { dailyTaskViews, kstDate, msUntilDailyReset, refreshDaily } from "../state/daily";
import type { WorldSave } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { BadgeIcon } from "./BadgeIcon";
import { buttonProps } from "./buttonProps";
import { dailyTaskIconKeys } from "./missionIcons";
import { firstAsset, panelArt } from "./panelArt";
import { CONFIRM_CODES, useWorldKeys } from "./useWorldKeys";
import "./board-codex.css";

const STAMP_DAYS = 30;
const MILESTONES = [7, 14, 30] as const;

const pad = (value: number) => String(value).padStart(2, "0");
function clock(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

interface DailyBoardProps {
  save: WorldSave;
  /** Optional so a render test needs no sound. */
  audio?: WorldAudioLike;
  onClaim: (date: string) => void;
  onClose: () => void;
}

/**
 * The plaza board (docs/world/17): today's three training tasks pinned on a paper — open ones cream with an empty
 * box, finished ones green and struck through with a check — the 30-day stamp card, the 7 / 14 / 30 day badges and
 * the claim button. E / Enter / Space claim the stamp, Esc (handled by the overlay) or a click outside closes.
 */
export function DailyBoard({ save, audio = SILENT_AUDIO, onClaim, onClose }: DailyBoardProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const daily = refreshDaily(save, now).daily;
  const views = dailyTaskViews(daily);
  const doneCount = views.filter((view) => view.done).length;
  const ended = Boolean(save.flags["ending-seen"]);
  const ready = daily.date === kstDate(now) && views.length === 3 && doneCount === 3;
  const claimed = daily.stamps.includes(daily.date);
  const canClaim = ended && ready && !claimed;
  const stamps = daily.stamps.length;
  const filled = Math.min(stamps, STAMP_DAYS);

  // The stamp that was just pressed drops onto its cell.
  const [fresh, setFresh] = useState(false);
  const wasClaimed = useRef(claimed);
  useEffect(() => {
    if (claimed && !wasClaimed.current) setFresh(true);
    wasClaimed.current = claimed;
  }, [claimed]);

  const claim = () => {
    if (canClaim) onClaim(daily.date);
    else if (!claimed) audio.playSfx("ui-error");
  };

  useWorldKeys((code, event) => {
    if (!CONFIRM_CODES.has(code)) return false;
    if (!event.repeat) claim();
    return true;
  });

  const { style: artStyle, has } = panelArt({
    "frame-panel": "ui/panel-frame",
    "frame-stamp": "ui/stamp-card",
    // The daily kit (docs/world/17): optional, each group is used only when all of it exists.
    "task-todo": "ui/daily-task-todo",
    "task-done": "ui/daily-task-done",
    "task-box": "ui/daily-box",
    "slot-empty": "ui/daily-slot-empty",
    "slot-next": "ui/daily-slot-next",
    "slot-bonus": "ui/daily-slot-bonus",
  });
  const taskArt = has["task-todo"] && has["task-done"];
  const slotArt = has["slot-empty"] && has["slot-next"] && has["slot-bonus"];
  const mark = getWorldAssetUrl("ui/stamp-mark");
  const check = getWorldAssetUrl("ui/check-badge");
  const lock = getWorldAssetUrl("ui/mi-locked");
  const close = getWorldAssetUrl("ui/mn-close");
  const sparkle = getWorldAssetUrl("ui/sparkle-ring");
  const primary = buttonProps("primary");
  const disabledArt = getWorldAssetUrl("ui/btn-primary-disabled");
  const claimStyle = { ...primary.style, ...(disabledArt ? { "--btn-disabled": `url(${disabledArt})` } : {}) } as CSSProperties;

  const hint = !ended
    ? "엔딩 후 잔디 코치의 일일 훈련이 열려요"
    : claimed
      ? "오늘 훈련 끝! 내일 KST 자정에 새 훈련이 나와요"
      : ready
        ? "세 훈련을 모두 마쳤어요! 스탬프를 받아가세요"
        : "세 훈련을 모두 마치면 스탬프를 받을 수 있어요";

  return (
    <div className="world-veil" onClick={onClose}>
      <section
        className={`world-daily${has["frame-panel"] ? " world-daily--art" : ""}`}
        style={artStyle}
        role="dialog"
        aria-label="광장 일일 게시판"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="world-daily__head">
          <h2>광장 일일 게시판</h2>
          <p className="world-daily__clock">
            {daily.date} · 새 훈련까지 <time>{clock(msUntilDailyReset(now))}</time>
          </p>
          <button type="button" className="world-daily__close" onClick={onClose} aria-label="닫기">
            {close ? <img src={close} alt="" draggable={false} /> : "×"}
          </button>
        </header>

        <div className={`world-daily__body${ended ? "" : " is-locked"}`}>
          <section className={`world-daily__paper${has["frame-stamp"] ? " world-daily__paper--art" : ""}`} aria-label="오늘의 훈련">
            <div className="world-daily__sheet">
              <h3>
                오늘의 훈련 <em className={doneCount === 3 ? "is-all" : ""}>{doneCount}/3</em>
              </h3>
              <ul className="world-daily__tasks">
                {views.map((view) => {
                  const icon = firstAsset(...dailyTaskIconKeys(view.task));
                  return (
                    <li key={view.task.id} className={`world-daily__task is-${view.done ? "done" : "todo"}${taskArt ? " world-daily__task--art" : ""}`}>
                      {icon ? <img className="world-daily__task-icon" src={icon} alt="" draggable={false} /> : <span className="world-daily__task-icon" aria-hidden="true" />}
                      <span className="world-daily__task-text">{view.task.label}</span>
                      <span className="world-daily__task-state">
                        {view.done ? check ? <img src={check} alt="" draggable={false} /> : <i className="world-daily__tick">✓</i> : <i className={`world-daily__box${has["task-box"] ? " world-daily__box--art" : ""}`} aria-hidden="true" />}
                        <b>{view.done ? "완료" : view.progress ? `${view.progress.have}/${view.progress.need}` : "진행"}</b>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {!ended && (
              <div className="world-daily__lock">
                {lock && <img src={lock} alt="" draggable={false} />}
                <p>엔딩 후 열려요</p>
              </div>
            )}
          </section>

          <section className={`world-daily__card${has["frame-stamp"] ? " world-daily__card--art" : ""}`} aria-label="30일 스탬프 카드">
            <ol className={`world-daily__stamps${slotArt ? " is-art" : ""}`}>
              {Array.from({ length: STAMP_DAYS }, (_, index) => {
                const day = index + 1;
                const stamped = index < filled;
                const next = index === stamps && !claimed;
                const isFresh = fresh && stamped && index === stamps - 1;
                const state = stamped ? "is-stamped" : next ? "is-next" : "";
                return (
                  <li key={day} className={`world-daily__slot ${state}${(MILESTONES as readonly number[]).includes(day) ? " is-milestone" : ""}${isFresh ? " is-fresh" : ""}`}>
                    {stamped ? (
                      <>
                        {isFresh && sparkle && <img className="world-daily__burst" src={sparkle} alt="" draggable={false} />}
                        {mark ? <img className="world-daily__mark" src={mark} alt="" draggable={false} /> : <i className="world-daily__mark world-daily__mark--css">●</i>}
                        <span className="world-sr-only">{day}일 완료</span>
                      </>
                    ) : (
                      <span className="world-daily__day">{day}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <footer className="world-daily__foot">
          <ul className="world-daily__rewards" aria-label="스탬프 보상 뱃지">
            {MILESTONES.map((day) => {
              const badge = BADGES[`daily-${day}`];
              const earned = Boolean(save.flags[`badge:${badge.id}`]);
              return (
                <li key={day} className={earned ? "is-earned" : ""}>
                  <BadgeIcon badge={badge} earned={earned} />
                  <span>
                    <b>{day}일</b>
                    <small>{earned ? "획득!" : `${Math.max(0, day - stamps)}일 남음`}</small>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="world-daily__total" role="status">
            누적 <b>{stamps}</b>일
          </p>
          <button
            type="button"
            className={`${primary.className} world-daily__claim${canClaim ? " is-ready" : ""}`}
            style={claimStyle}
            disabled={!canClaim}
            onClick={claim}
          >
            {claimed ? "오늘 수령 완료" : "스탬프 받기"}
          </button>
        </footer>
        <p className={`world-daily__hint${canClaim ? " is-ready" : ""}`}>
          <span>{hint}</span>
          <span className="world-daily__keys">
            {canClaim && (
              <>
                <kbd className="world-key">E</kbd> 받기
              </>
            )}
            <kbd className="world-key">Esc</kbd> 닫기
          </span>
        </p>
      </section>
    </div>
  );
}
