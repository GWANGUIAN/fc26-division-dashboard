import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import type { WorldSettings } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { stepVolume } from "./stepVolume";

interface TitleScreenProps {
  hasSave: boolean;
  ended?: boolean;
  audio: WorldAudioLike;
  settings: WorldSettings;
  onSettings: (settings: WorldSettings) => void;
  /** The settings page is showing instead of the main menu (lifted so Esc can step back, `state/escape.ts`). */
  settingsOpen: boolean;
  onSettingsOpen: (open: boolean) => void;
  onContinue: () => void;
  onNew: () => void;
  onExit: () => void;
  debug: boolean;
}

/** Fireflies drifting behind the menu: fixed positions (percent of the screen) so every visit looks the same. */
const FIREFLIES = [
  { left: 9, top: 64, dx: 10, dy: -16, duration: 6.4, delay: 0 },
  { left: 17, top: 28, dx: -8, dy: 12, duration: 7.2, delay: 1.1 },
  { left: 24, top: 82, dx: 12, dy: -10, duration: 5.6, delay: 2.3 },
  { left: 33, top: 46, dx: -10, dy: -14, duration: 8, delay: 0.6 },
  { left: 68, top: 40, dx: 9, dy: 14, duration: 6.8, delay: 1.7 },
  { left: 77, top: 76, dx: -12, dy: -12, duration: 7.6, delay: 0.3 },
  { left: 86, top: 24, dx: 8, dy: 16, duration: 5.9, delay: 2.6 },
  { left: 92, top: 58, dx: -9, dy: -14, duration: 6.6, delay: 1.4 },
] as const;

/** Leaves drifting down behind the menu (only with ui/title-leaf): left in percent, size is 12 or 24 so the sprite scales by a whole number. */
const LEAVES = [
  { left: 6, size: 24, sway: 14, duration: 17, delay: 0 },
  { left: 19, size: 12, sway: -10, duration: 21, delay: 6 },
  { left: 31, size: 12, sway: 12, duration: 19, delay: 11 },
  { left: 73, size: 12, sway: -12, duration: 20, delay: 3 },
  { left: 84, size: 24, sway: 10, duration: 18, delay: 9 },
  { left: 95, size: 12, sway: -8, duration: 22, delay: 14 },
] as const;

interface TitleRowProps {
  label: string;
  index: number;
  cursor: string | undefined;
  danger?: boolean;
  autoFocus?: boolean;
  onClick: () => void;
  onBlur?: () => void;
  onHover: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** One menu row. The selected row (`:focus`) is the only bright one: keyboard arrows and mouse hover both move the focus. */
function TitleRow({ label, index, cursor, danger, autoFocus, onClick, onBlur, onHover }: TitleRowProps) {
  return (
    <button
      type="button"
      className={`world-title__row${danger ? " is-danger" : ""}`}
      style={{ "--i": index } as CSSProperties}
      onClick={onClick}
      onBlur={onBlur}
      onMouseEnter={onHover}
      autoFocus={autoFocus}
    >
      {cursor ? <img className="world-title__cursor" src={cursor} alt="" draggable={false} /> : <span className="world-title__cursor world-title__cursor--glyph" aria-hidden="true">▶</span>}
      <span className="world-title__row-label">{label}</span>
    </button>
  );
}

type VolumeKey = "bgmVolume" | "sfxVolume";

interface VolumeRowProps {
  label: string;
  value: number;
  volumeKey: VolumeKey;
  index: number;
  cursor: string | undefined;
  onStep: (key: VolumeKey, direction: -1 | 1) => void;
  onHover: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** A volume row: the label with `◀ value ▶` beside it. Left/right keys (handled by the menu) and clicks on the arrows both step it. */
function VolumeRow({ label, value, volumeKey, index, cursor, onStep, onHover }: VolumeRowProps) {
  const arrow = (direction: -1 | 1) => (
    <span
      className="world-title__arrow"
      aria-hidden="true"
      onClick={(event) => {
        event.stopPropagation();
        onStep(volumeKey, direction);
      }}
    >
      {direction < 0 ? "◀" : "▶"}
    </span>
  );
  return (
    <button
      type="button"
      className="world-title__row world-title__row--volume"
      style={{ "--i": index } as CSSProperties}
      data-volume={volumeKey}
      aria-label={`${label} ${value}`}
      onMouseEnter={onHover}
    >
      {cursor ? <img className="world-title__cursor" src={cursor} alt="" draggable={false} /> : <span className="world-title__cursor world-title__cursor--glyph" aria-hidden="true">▶</span>}
      <span className="world-title__row-label">{label}</span>
      <span className="world-title__volume">
        {arrow(-1)}
        <span className="world-title__value">{value}</span>
        {arrow(1)}
      </span>
    </button>
  );
}

export function TitleScreen({ hasSave, ended, audio, settings, onSettings, settingsOpen, onSettingsOpen, onContinue, onNew, onExit, debug }: TitleScreenProps) {
  const art = getWorldAssetUrl("ui/title-bg");
  const emblem = getWorldAssetUrl("ui/logo-emblem");
  // Every piece of art below is optional: without it plain CSS draws that piece (docs/world/16-title-menu-redesign.md).
  const frame = getWorldAssetUrl("ui/title-frame");
  const logo = getWorldAssetUrl("ui/title-logo");
  const cursor = getWorldAssetUrl("ui/cursor");
  const windowKit = getWorldAssetUrl("ui/title-window");
  const divider = getWorldAssetUrl("ui/title-divider");
  const leaf = getWorldAssetUrl("ui/title-leaf");
  const sparkle = getWorldAssetUrl("ui/title-sparkle");
  const firefly = getWorldAssetUrl("ui/title-firefly");
  // The menu kit (three row plates) is used as a set; without it the dialogue choice frames stand in.
  const kitNormal = getWorldAssetUrl("ui/title-row-normal");
  const kitSelected = getWorldAssetUrl("ui/title-row-selected");
  const kitPressed = getWorldAssetUrl("ui/title-row-pressed");
  const kit = Boolean(kitNormal && kitSelected && kitPressed);
  const rowNormal = kit ? kitNormal : getWorldAssetUrl("ui/choice-normal");
  const rowSelected = kit ? kitSelected : getWorldAssetUrl("ui/choice-selected");
  const rowPressed = kit ? kitPressed : rowSelected;
  const listRef = useRef<HTMLDivElement>(null);
  // "새로 시작" wipes the save, so with an existing save it asks once more before doing it.
  const [confirmNew, setConfirmNew] = useState(false);

  // Coming back from the settings page, the cursor lands on "설정" again instead of the first row.
  const cameFromSettings = useRef(false);

  function stepSetting(key: VolumeKey, direction: -1 | 1) {
    onSettings({ ...settings, [key]: stepVolume(settings[key], direction) });
    audio.playSfx("ui-move");
  }

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const key = (event.target as HTMLElement).closest<HTMLElement>("[data-volume]")?.dataset.volume as VolumeKey | undefined;
      if (!key) return;
      event.preventDefault();
      stepSetting(key, event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    audio.playSfx("ui-move");
    buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }

  function hover(event: MouseEvent<HTMLButtonElement>) {
    if (document.activeElement === event.currentTarget) return;
    event.currentTarget.focus();
    audio.playSfx("ui-move");
  }

  function handleContinue() {
    audio.playSfx("ui-select");
    onContinue();
  }

  function handleNew() {
    audio.playSfx("ui-select");
    if (hasSave && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    onNew();
  }

  function handleExit() {
    audio.playSfx("ui-cancel");
    onExit();
  }

  function handleSettings() {
    audio.playSfx("ui-select");
    cameFromSettings.current = true;
    onSettingsOpen(true);
  }

  function handleBack() {
    audio.playSfx("ui-cancel");
    onSettingsOpen(false);
  }

  function toggleSetting(key: "bgm" | "sfx") {
    onSettings({ ...settings, [key]: !settings[key] });
    audio.playSfx("ui-select");
  }

  const menuStyle =
    rowNormal && rowSelected ? ({ "--row": `url(${rowNormal})`, "--row-on": `url(${rowSelected})`, "--row-down": `url(${rowPressed})` } as CSSProperties) : undefined;
  const windowFrame = windowKit ?? frame;
  const windowStyle = windowFrame ? ({ "--frame-title": `url(${windowFrame})` } as CSSProperties) : undefined;
  const rootStyle = {
    ...(art ? { backgroundImage: `url(${art})` } : null),
    ...(sparkle ? { "--fx-spark": `url(${sparkle})` } : null),
    ...(firefly ? { "--fx-firefly": `url(${firefly})` } : null),
    ...(leaf ? { "--fx-leaf": `url(${leaf})` } : null),
  } as CSSProperties;
  const returning = cameFromSettings.current;
  type MenuRow = { id: string; volume?: { key: VolumeKey; value: number } } & Omit<TitleRowProps, "index" | "cursor" | "onHover">;
  const mainRows: MenuRow[] = [
    ...(hasSave ? [{ id: "continue", label: "이어하기", onClick: handleContinue, autoFocus: !returning }] : []),
    { id: "new", label: confirmNew ? "저장이 지워져요. 정말?" : "새로 시작", onClick: handleNew, onBlur: () => setConfirmNew(false), autoFocus: !hasSave && !returning, danger: confirmNew },
    { id: "settings", label: "설정", onClick: handleSettings, autoFocus: returning },
    { id: "exit", label: "나가기", onClick: handleExit },
  ];
  const settingsRows: MenuRow[] = [
    { id: "bgm", label: `배경음악 ${settings.bgm ? "켜짐" : "꺼짐"}`, onClick: () => toggleSetting("bgm"), autoFocus: true },
    { id: "bgmVolume", label: "음악 볼륨", onClick: () => {}, volume: { key: "bgmVolume", value: settings.bgmVolume } },
    { id: "sfx", label: `효과음 ${settings.sfx ? "켜짐" : "꺼짐"}`, onClick: () => toggleSetting("sfx") },
    { id: "sfxVolume", label: "효과음 볼륨", onClick: () => {}, volume: { key: "sfxVolume", value: settings.sfxVolume } },
    { id: "back", label: "뒤로", onClick: handleBack },
  ];
  const rows = settingsOpen ? settingsRows : mainRows;

  return (
    <div className={`world-title${ended ? " world-title--restored" : ""}${settingsOpen ? " world-title--settings" : ""}${sparkle ? " world-title--spark-art" : ""}${firefly ? " world-title--firefly-art" : ""}`} style={rootStyle}>
      <div className="world-title__fx" aria-hidden="true">
        {leaf &&
          LEAVES.map((item, index) => (
            <b
              key={index}
              className="world-title__leaf"
              style={{ left: `${item.left}%`, "--size": `${item.size}px`, "--sway": `${item.sway}px`, "--dur": `${item.duration}s`, "--delay": `${item.delay}s` } as CSSProperties}
            />
          ))}
        {FIREFLIES.map((fly, index) => (
          <i
            key={index}
            style={{ left: `${fly.left}%`, top: `${fly.top}%`, "--dx": `${fly.dx}px`, "--dy": `${fly.dy}px`, "--dur": `${fly.duration}s`, "--delay": `${fly.delay}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="world-title__stack">
        <div className="world-title__crest">
          <span className="world-title__rays" aria-hidden="true" />
          {emblem ? <img className="world-title__emblem" src={emblem} alt="" draggable={false} /> : <div className="world-title__emblem world-title__emblem--fallback" aria-hidden="true">🌱</div>}
          <i className="world-title__spark world-title__spark--a" aria-hidden="true" />
          <i className="world-title__spark world-title__spark--b" aria-hidden="true" />
          <i className="world-title__spark world-title__spark--c" aria-hidden="true" />
        </div>
        <h1 className={`world-title__logo${logo ? " world-title__logo--art" : ""}`} data-text="잔디동 월드">
          {logo ? <img src={logo} alt="잔디동 월드" draggable={false} /> : "잔디동 월드"}
        </h1>
        {divider && <img className="world-title__divider" src={divider} alt="" draggable={false} />}
        <div className={`world-title__window${windowFrame ? " world-title__window--art" : ""}${windowKit ? " world-title__window--kit" : ""}`} style={windowStyle}>
          <div className={`world-title__menu${menuStyle ? " world-title__menu--art" : ""}${kit ? " world-title__menu--kit" : ""}`} style={menuStyle} ref={listRef} onKeyDown={moveFocus}>
            {rows.map(({ id, volume, ...row }, index) =>
              volume ? (
                <VolumeRow key={`settings-${id}`} label={row.label} value={volume.value} volumeKey={volume.key} index={index} cursor={cursor} onStep={stepSetting} onHover={hover} />
              ) : (
                <TitleRow key={`${settingsOpen ? "settings" : "main"}-${id}`} {...row} index={index} cursor={cursor} onHover={hover} />
              ),
            )}
          </div>
        </div>
        <p className="world-title__hint">
          <kbd className="world-key">↑↓</kbd> 선택 {settingsOpen && <><kbd className="world-key">←→</kbd> 볼륨 </>}
          <kbd className="world-key">Enter</kbd> 확인 <kbd className="world-key">Esc</kbd> {settingsOpen ? "뒤로" : "나가기"}
        </p>
        {debug && <p className="world-title__debug">worldDebug · 새로 시작하면 캐릭터 선택 → 프롤로그 → 집에서 시작</p>}
      </div>
    </div>
  );
}
