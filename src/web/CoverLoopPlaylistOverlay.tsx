import { useEffect, useRef, useState, type RefObject } from "react";
import { X } from "lucide-react";
import "./cover-loop-overlay.css";
import { CoverLoopStage, useReducedMotion } from "./CoverLoopStage";
import { hachiCoverLoopTrack } from "./coverLoopLabData";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}

/** Same pattern as GroupPhotoOverlay/PhotoBoothOverlay: locks the page behind the popup from scrolling. */
function useBodyScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const scrollY = window.scrollY;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

/** Focuses the dialog on open and returns focus to whatever opened it (the PlaylistToggle button) on close. */
function useFocusReturn(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    rootRef.current?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, [rootRef]);
}

const MOUSE_HIDE_DELAY_MS = 2500;
const TOUCH_HIDE_DELAY_MS = 3000;

export function CoverLoopPlaylistOverlay({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  // reduced-motion: 자동 fade 시간을 없애고 닫기 버튼을 항상 보이게 한다.
  const [controlsVisible, setControlsVisible] = useState(() => reducedMotion);
  const visibleRef = useRef(controlsVisible);
  visibleRef.current = controlsVisible;
  const hideTimerRef = useRef<number | undefined>(undefined);
  const closeFocusedRef = useRef(false);

  useEscape(onClose);
  useBodyScrollLock();
  useFocusReturn(rootRef);

  useEffect(() => {
    if (reducedMotion) setControlsVisible(true);
  }, [reducedMotion]);

  useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

  function armHide(delayMs: number) {
    if (reducedMotion) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!closeFocusedRef.current) setControlsVisible(false);
    }, delayMs);
  }

  function reveal(delayMs: number) {
    if (reducedMotion) return;
    if (!visibleRef.current) setControlsVisible(true);
    armHide(delayMs);
  }

  // 마우스 hover(pointermove/pointerenter)만 대상 — 터치는 아래 handlePointerDown이 따로 처리한다.
  function handlePointerMove(event: React.PointerEvent) {
    if (event.pointerType === "mouse") reveal(MOUSE_HIDE_DELAY_MS);
  }

  // 팝업이 열리며 접근성을 위해 root에 프로그램 방식으로 포커스를 줄 때도 이 핸들러가
  // 걸리므로, 그 자체(target === root)는 "키보드 입력"으로 치지 않는다 — 안 그러면 처음
  // 열자마자 닫기 버튼이 잠깐 보였다 사라지게 된다.
  function handleFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (event.target === rootRef.current) return;
    reveal(MOUSE_HIDE_DELAY_MS);
  }

  function handleCloseFocus() {
    closeFocusedRef.current = true;
    window.clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
  }

  function handleCloseBlur() {
    closeFocusedRef.current = false;
    armHide(MOUSE_HIDE_DELAY_MS);
  }

  // 터치: 첫 탭으로 controls-visible을 토글한다. 닫기 버튼 자체나 하단 플레이어 컨트롤을
  // 누른 탭은 각자의 onClick이 처리하므로 여기서는 제외한다.
  function handlePointerDown(event: React.PointerEvent) {
    if (event.pointerType !== "touch") return;
    const target = event.target as HTMLElement;
    if (target.closest(".cover-loop-overlay__close, .cover-loop-lab__player")) return;
    if (visibleRef.current) {
      window.clearTimeout(hideTimerRef.current);
      setControlsVisible(false);
    } else {
      reveal(TOUCH_HIDE_DELAY_MS);
    }
  }

  return (
    <div
      ref={rootRef}
      className="cover-loop-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="잔디동 플레이리스트"
      tabIndex={-1}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerMove}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
    >
      <CoverLoopStage track={hachiCoverLoopTrack} index={1} />
      <button
        type="button"
        className={`cover-loop-overlay__close${controlsVisible ? " cover-loop-overlay__close--visible" : ""}`}
        onClick={onClose}
        onFocus={handleCloseFocus}
        onBlur={handleCloseBlur}
        aria-label="플레이리스트 닫기"
      >
        <X aria-hidden="true" />
        <span>닫기</span>
      </button>
    </div>
  );
}
