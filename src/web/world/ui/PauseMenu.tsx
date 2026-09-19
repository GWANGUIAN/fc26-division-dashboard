import { useState, type CSSProperties } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import type { PauseView } from "../state/escape";
import type { WorldSettings } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { buttonProps } from "./buttonProps";
import { CONFIRM_CODES, DOWN_CODES, LEFT_CODES, RIGHT_CODES, UP_CODES, useWorldKeys } from "./useWorldKeys";
import { WorldCredits } from "./WorldCredits";

interface PauseMenuProps {
  view: Exclude<PauseView, "closed">;
  onView: (view: Exclude<PauseView, "closed">) => void;
  settings: WorldSettings;
  onSettings: (settings: WorldSettings) => void;
  audio: WorldAudioLike;
  onResume: () => void;
  onLog: () => void;
  onGuide: () => void;
  onNewGame: () => void;
  onExit: () => void;
}

interface Item {
  id: string;
  label: string;
  icon?: string;
  run: () => void;
}

const VOLUME_STEP = 5;
const clampVolume = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Pause menu (Esc when nothing else is open, docs/world/06 §8): resume, mission log, settings (music and
 * sound effects), the tutorial guide again, a new game (asks first) and leaving the world. Esc steps back
 * one page and finally closes it (`state/escape.ts`).
 */
export function PauseMenu({ view, onView, settings, onSettings, audio, onResume, onLog, onGuide, onNewGame, onExit }: PauseMenuProps) {
  const [cursor, setCursor] = useState(0);

  const main: Item[] = [
    { id: "resume", label: "이어하기", icon: "ui/mn-resume", run: onResume },
    { id: "log", label: "미션 로그 (J)", icon: "ui/mn-log", run: onLog },
    { id: "settings", label: "설정", icon: "ui/mn-settings", run: () => go("settings") },
    { id: "credits", label: "크레딧", icon: "ui/mn-map", run: () => go("credits") },
    { id: "guide", label: "가이드 다시 보기", icon: "ui/mn-guide", run: onGuide },
    { id: "new", label: "새로 시작", icon: "ui/mn-new", run: () => go("confirm-new") },
    { id: "exit", label: "월드 나가기", icon: "ui/mn-exit", run: onExit },
  ];
  const settingsItems: Item[] = [
    { id: "bgm", label: `배경음악 ${settings.bgm ? "켜짐" : "꺼짐"}`, icon: settings.bgm ? "ui/mn-sound-on" : "ui/mn-sound-off", run: () => onSettings({ ...settings, bgm: !settings.bgm }) },
    { id: "bgmVolume", label: "음악 볼륨", run: () => {} },
    { id: "sfx", label: `효과음 ${settings.sfx ? "켜짐" : "꺼짐"}`, icon: settings.sfx ? "ui/mn-sound-on" : "ui/mn-sound-off", run: () => onSettings({ ...settings, sfx: !settings.sfx }) },
    { id: "sfxVolume", label: "효과음 볼륨", run: () => {} },
    { id: "back", label: "뒤로", icon: "ui/mn-back", run: () => go("main") },
  ];
  const confirmItems: Item[] = [
    { id: "cancel", label: "취소", icon: "ui/mn-back", run: () => go("main") },
    { id: "yes", label: "새로 시작", icon: "ui/mn-new", run: onNewGame },
  ];
  const items = view === "main" ? main : view === "settings" ? settingsItems : view === "credits" ? [] : confirmItems;
  const at = Math.min(cursor, items.length - 1);

  function go(next: Exclude<PauseView, "closed">) {
    audio.playSfx("ui-select");
    setCursor(0);
    onView(next);
  }

  function nudge(id: string, direction: -1 | 1) {
    if (id === "bgmVolume") onSettings({ ...settings, bgmVolume: clampVolume(settings.bgmVolume + direction * VOLUME_STEP) });
    else if (id === "sfxVolume") onSettings({ ...settings, sfxVolume: clampVolume(settings.sfxVolume + direction * VOLUME_STEP) });
    else return false;
    audio.playSfx("ui-move");
    return true;
  }

  useWorldKeys((code) => {
    if (UP_CODES.has(code) || DOWN_CODES.has(code)) {
      audio.playSfx("ui-move");
      setCursor((at + (UP_CODES.has(code) ? -1 : 1) + items.length) % items.length);
      return true;
    }
    if (LEFT_CODES.has(code) || RIGHT_CODES.has(code)) return nudge(items[at].id, LEFT_CODES.has(code) ? -1 : 1) || true;
    if (CONFIRM_CODES.has(code)) {
      const item = items[at];
      if (item.id !== "bgmVolume" && item.id !== "sfxVolume") item.run();
      return true;
    }
    return false;
  });

  const frame = getWorldAssetUrl("ui/panel-frame");
  const style = frame ? ({ "--frame-panel": `url(${frame})` } as CSSProperties) : undefined;
  const title = view === "main" ? "메뉴" : view === "settings" ? "설정" : view === "credits" ? "크레딧" : "새로 시작";

  return (
    <div className="world-veil" onClick={onResume}>
      <section className={`world-pause${frame ? " world-pause--art" : ""}`} style={style} role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <h2 className="world-pause__title">{title}</h2>
        {view === "confirm-new" && (
          <p className="world-pause__note">캐릭터를 다시 고르고 프롤로그가 끝날 때까지 지금 기록은 그대로 남아 있어요. 계속할까요?</p>
        )}
        {view === "credits" && <WorldCredits />}
        {items.length > 0 && <ul className="world-pause__list">
          {items.map((item, position) => {
            const icon = item.icon ? getWorldAssetUrl(item.icon) : undefined;
            const isVolume = item.id === "bgmVolume" || item.id === "sfxVolume";
            const volume = item.id === "bgmVolume" ? settings.bgmVolume : item.id === "sfxVolume" ? settings.sfxVolume : null;
            if (isVolume) return (
              <li key={item.id}>
                <div
                  className={`world-pause__volume${position === at ? " is-on" : ""}`}
                  onMouseEnter={() => setCursor(position)}
                >
                  <span className="world-pause__volume-label">{item.label}</span>
                  <button
                    type="button"
                    {...buttonProps("secondary")}
                    className={`${buttonProps("secondary").className} world-pause__arrow`}
                    aria-label={`${item.label} 낮추기`}
                    onClick={() => nudge(item.id, -1)}
                  >◀</button>
                  <output aria-label={`${item.label} ${volume}`}>{volume}</output>
                  <button
                    type="button"
                    {...buttonProps("secondary")}
                    className={`${buttonProps("secondary").className} world-pause__arrow`}
                    aria-label={`${item.label} 높이기`}
                    onClick={() => nudge(item.id, 1)}
                  >▶</button>
                </div>
              </li>
            );
            return (
              <li key={item.id}>
                <button
                  type="button"
                  {...buttonProps("secondary")}
                  className={`${buttonProps("secondary").className} world-pause__item${position === at ? " is-on" : ""}`}
                  onMouseEnter={() => setCursor(position)}
                  onClick={item.run}
                >
                  {icon && <img src={icon} alt="" draggable={false} />}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>}
        <p className="world-pause__hint">{view === "credits" ? "Esc 뒤로" : <>↑↓ 선택 · E/Enter 확인{view === "settings" ? " · ←→ 볼륨" : ""} · Esc {view === "main" ? "닫기" : "뒤로"}</>}</p>
      </section>
    </div>
  );
}
