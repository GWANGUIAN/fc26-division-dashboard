import { useRef, useState, type KeyboardEvent } from "react";
import { getWorldAssetUrl } from "../worldAssets";
import { buttonProps } from "./buttonProps";

interface TitleScreenProps {
  hasSave: boolean;
  onContinue: () => void;
  onNew: () => void;
  onExit: () => void;
  debug: boolean;
}

export function TitleScreen({ hasSave, onContinue, onNew, onExit, debug }: TitleScreenProps) {
  const art = getWorldAssetUrl("ui/title-bg");
  const emblem = getWorldAssetUrl("ui/logo-emblem");
  const listRef = useRef<HTMLDivElement>(null);
  // "새로 시작" wipes the save, so with an existing save it asks once more before doing it.
  const [confirmNew, setConfirmNew] = useState(false);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }

  function handleNew() {
    if (hasSave && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    onNew();
  }

  return (
    <div className="world-title" style={art ? { backgroundImage: `url(${art})` } : undefined}>
      <div className="world-title__panel">
        {emblem ? <img className="world-title__emblem" src={emblem} alt="" draggable={false} /> : <div className="world-title__emblem world-title__emblem--fallback" aria-hidden="true">🌱</div>}
        <h1 className="world-title__logo">잔디동 월드</h1>
        <div className="world-title__menu" ref={listRef} onKeyDown={moveFocus}>
          {hasSave && (
            <button type="button" {...buttonProps("primary")} onClick={onContinue} autoFocus>
              이어하기
            </button>
          )}
          <button
            type="button"
            {...buttonProps(hasSave ? "secondary" : "primary")}
            onClick={handleNew}
            onBlur={() => setConfirmNew(false)}
            autoFocus={!hasSave}
          >
            {confirmNew ? "저장이 지워져요. 정말?" : "새로 시작"}
          </button>
          <button type="button" {...buttonProps("secondary")} onClick={onExit}>
            나가기
          </button>
        </div>
        <p className="world-title__hint">↑↓ 선택 · Enter 확인 · Esc 나가기</p>
        {debug && <p className="world-title__debug">worldDebug · 새로 시작하면 캐릭터 선택 → 프롤로그 → 집에서 시작</p>}
      </div>
    </div>
  );
}
