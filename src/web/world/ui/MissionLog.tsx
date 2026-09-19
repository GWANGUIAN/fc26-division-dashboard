import { useMemo, useState, type CSSProperties } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import { getCast } from "../data/worldCast";
import type { MissionView } from "../state/missions";
import { getWorldAssetUrl } from "../worldAssets";
import { STATUS_LABEL, missionIconKey, rewardText } from "./missionIcons";
import { CONFIRM_CODES, DOWN_CODES, LEFT_CODES, RIGHT_CODES, UP_CODES, useWorldKeys } from "./useWorldKeys";

interface MissionLogProps {
  views: readonly MissionView[];
  trackedId: string | null;
  audio: WorldAudioLike;
  /** Pick the mission the HUD tracker follows. */
  onTrack: (id: string) => void;
  onClose: () => void;
}

type Tab = "open" | "done";
const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "진행" },
  { id: "done", label: "완료" },
];

/** ready first, then active, then new — completed ones stay in their own tab. */
const ORDER: Record<string, number> = { ready: 0, active: 1, available: 2, completed: 3, locked: 4 };

/**
 * Mission log (J): every mission the player has met, in two tabs, with the goal, where to go, the progress and
 * the reward of the highlighted one on the right (docs/world/06 §8). ↑↓ pick, ←→ switch tab, E/Enter follow
 * the mission in the HUD tracker, J or Esc close.
 */
export function MissionLog({ views, trackedId, audio, onTrack, onClose }: MissionLogProps) {
  const [tab, setTab] = useState<Tab>("open");
  const [index, setIndex] = useState(0);

  const shown = useMemo(
    () =>
      views
        .filter((view) => (tab === "done" ? view.status === "completed" : view.status !== "completed"))
        .sort((a, b) => ORDER[a.status] - ORDER[b.status] || Number(b.def.main) - Number(a.def.main)),
    [views, tab],
  );
  const current = shown[Math.min(index, Math.max(0, shown.length - 1))];

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    audio.playSfx("ui-move");
    setTab(next);
    setIndex(0);
  };

  useWorldKeys((code) => {
    if (code === "KeyJ") {
      audio.playSfx("ui-close");
      onClose();
      return true;
    }
    if (UP_CODES.has(code) || DOWN_CODES.has(code)) {
      if (shown.length > 0) {
        audio.playSfx("ui-move");
        setIndex((value) => (Math.min(value, shown.length - 1) + (UP_CODES.has(code) ? -1 : 1) + shown.length) % shown.length);
      }
      return true;
    }
    if (LEFT_CODES.has(code) || RIGHT_CODES.has(code) || code === "Tab") {
      switchTab(tab === "open" ? "done" : "open");
      return true;
    }
    if (CONFIRM_CODES.has(code)) {
      if (current && current.status !== "completed") {
        audio.playSfx("ui-select");
        onTrack(current.def.id);
      }
      return true;
    }
    return false;
  });

  const panel = getWorldAssetUrl("ui/panel-parchment");
  const tabOn = getWorldAssetUrl("ui/tab-active");
  const tabOff = getWorldAssetUrl("ui/tab-normal");
  const style = {
    ...(panel ? { "--frame-log": `url(${panel})` } : {}),
    ...(tabOn ? { "--frame-tab-on": `url(${tabOn})` } : {}),
    ...(tabOff ? { "--frame-tab": `url(${tabOff})` } : {}),
  } as CSSProperties;

  return (
    <div className="world-veil" onClick={onClose}>
      <section className={`world-log${panel ? " world-log--art" : ""}`} style={style} role="dialog" aria-label="미션 로그" onClick={(event) => event.stopPropagation()}>
        <header className="world-log__head">
          <h2>미션 로그</h2>
          <div className="world-log__tabs" role="tablist">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                className={`world-log__tab${tab === entry.id ? " is-on" : ""}${tabOn && tabOff ? " world-log__tab--art" : ""}`}
                onClick={() => switchTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </header>

        <div className="world-log__body">
          <ul className="world-log__list" role="listbox" aria-label="미션 목록">
            {shown.length === 0 && <li className="world-log__empty">{tab === "done" ? "아직 끝낸 미션이 없어요." : "받을 수 있는 미션이 없어요."}</li>}
            {shown.map((view, position) => {
              const icon = getWorldAssetUrl(missionIconKey(view.def, view.status));
              const on = view === current;
              return (
                <li
                  key={view.def.id}
                  role="option"
                  aria-selected={on}
                  className={`world-log__row${on ? " is-on" : ""} is-${view.status}`}
                  onMouseEnter={() => setIndex(position)}
                  onClick={() => {
                    setIndex(position);
                    if (view.status !== "completed") {
                      audio.playSfx("ui-select");
                      onTrack(view.def.id);
                    }
                  }}
                >
                  {icon ? <img src={icon} alt="" draggable={false} /> : <span className="world-log__icon-fallback" aria-hidden="true" />}
                  <span className="world-log__row-text">
                    <strong>{view.def.title}</strong>
                    <small>{getCast(view.def.giver).displayName}{view.def.main ? "" : view.def.tutorial ? " · 튜토리얼" : " · 서브"}</small>
                  </span>
                  {trackedId === view.def.id && <span className="world-log__tracked" title="트래커에 표시 중">★</span>}
                </li>
              );
            })}
          </ul>

          <div className="world-log__detail" aria-live="polite">
            {current ? (
              <>
                <p className={`world-log__status is-${current.status}`}>{STATUS_LABEL[current.status]}</p>
                <h3>{current.def.title}</h3>
                <p className="world-log__objective">{current.def.objective}</p>
                <dl>
                  <dt>의뢰인</dt>
                  <dd>{getCast(current.def.giver).displayName}</dd>
                  <dt>장소</dt>
                  <dd>{current.def.hint}</dd>
                  {current.progressText && (
                    <>
                      <dt>진행</dt>
                      <dd>{current.progressText}</dd>
                    </>
                  )}
                  <dt>보상</dt>
                  <dd>{rewardText(current.def)}</dd>
                </dl>
                {current.status === "ready" && <p className="world-log__call">{getCast(current.def.giver).displayName}에게 돌아가 보고하세요!</p>}
              </>
            ) : (
              <p className="world-log__empty">미션을 고르면 자세한 내용이 나와요.</p>
            )}
          </div>
        </div>
        <footer className="world-log__foot">↑↓ 선택 · ←→ 탭 · E 트래커에 표시 · J/Esc 닫기</footer>
      </section>
    </div>
  );
}
