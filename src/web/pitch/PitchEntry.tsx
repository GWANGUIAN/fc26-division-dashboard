import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { PITCH_FALLBACK_NOTICE, setEntryNotice } from "../entryNotice";
import { resumeGlobalMusic, suspendGlobalMusic } from "../musicControl";
import { createLoop } from "../world/engine/loop";
import { PitchAudio } from "./audio/pitchAudio";
import { createPitchAssets } from "./engine/assets";
import { createInput, isIgnoredTarget } from "./engine/input";
import { createSceneManager, type CursorKind } from "./engine/sceneManager";
import { BACKDROP_COLOR, LOGICAL_HEIGHT, LOGICAL_WIDTH, createStage } from "./engine/stage";
import { FramePerf, countDrawImage, drawPerfOverlay, formatPerfLine } from "./engine/perf";
import { ensurePixelFont } from "./engine/text";
import { loadPitchSettings } from "../storage";
import { LoadingScene } from "./scenes/LoadingScene";
import { pitchDebugEnabled } from "./scenes/pitchDebug";

// Dashboard popups opened from the locker room (jukebox = playlist, whiteboard = squad manager). Lazy so the pitch chunk stays small.
const CoverLoopPlaylistOverlay = lazy(() => import("../CoverLoopPlaylistOverlay").then((m) => ({ default: m.CoverLoopPlaylistOverlay })));
const PitchSquadPopup = lazy(() => import("./PitchSquadPopup"));

type PopupKind = "playlist" | "squad";

const SKIP_LINK_STYLE = {
  position: "absolute",
  left: 8,
  top: 8,
  zIndex: 1,
  padding: "6px 10px",
  font: "12px 'Galmuri11', monospace",
  color: "#f7f7ff",
  background: "#0a0a1a",
  border: "1px solid #3ee6c1",
  transform: "translateY(-200%)",
} as const;

/**
 * The pitch mode entry (lazy chunk). Owns the canvas, the loop and everything they need; any failure while
 * starting or running falls back to the dashboard (docs/pitch/01 §9). The dashboard is not mounted here,
 * so it fetches nothing while the pitch is open.
 */
export default function PitchEntry({ onGoDashboard, customCursor = false }: { onGoDashboard: () => void; /** A DOM CursorOverlay draws the pointer, so the canvas must not change the native cursor. */ customCursor?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const goDashboardRef = useRef(onGoDashboard);
  goDashboardRef.current = onGoDashboard;
  const customCursorRef = useRef(customCursor);
  customCursorRef.current = customCursor;
  const [popup, setPopup] = useState<PopupKind | null>(null);
  // Set by the effect below: gives the keyboard back to the game and tells the scene that asked for the popup.
  const popupClosedRef = useRef<() => void>(() => undefined);

  const closePopup = () => {
    setPopup(null);
    popupClosedRef.current();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const fallback = (reason: unknown) => {
      if (disposed) return;
      console.warn("[pitch] falling back to the dashboard:", reason);
      setEntryNotice(PITCH_FALLBACK_NOTICE);
      goDashboardRef.current();
    };

    suspendGlobalMusic();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(container);
    } catch (error) {
      document.body.style.overflow = previousOverflow;
      resumeGlobalMusic();
      fallback(error);
      return;
    }

    const input = createInput();
    input.attach();
    const assets = createPitchAssets();
    const audio = new PitchAudio(loadPitchSettings());
    // Browsers refuse sound until the first key press or click: BGM starts then (docs/pitch/01 §6).
    const unlockAudio = () => audio.unlock();
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    const motionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    // While the popup is up the game must ignore the keyboard (its Esc closes the popup, not the locker room).
    let popupOnClose: (() => void) | null = null;
    popupClosedRef.current = () => {
      input.setEnabled(true);
      const done = popupOnClose;
      popupOnClose = null;
      done?.();
    };
    const openPopup = (kind: PopupKind, onClose: () => void) => {
      if (popupOnClose) return;
      popupOnClose = onClose;
      input.setEnabled(false);
      setPopup(kind);
    };
    const manager = createSceneManager({
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
      reducedMotion: () => motionQuery?.matches ?? false,
      host: {
        assets,
        input,
        audio,
        reducedMotion: () => motionQuery?.matches ?? false,
        announce: (text: string) => {
          if (liveRef.current) liveRef.current.textContent = text;
        },
        hasKeyboardFocus: () => document.hasFocus() && !isIgnoredTarget(document.activeElement),
        goDashboard: () => goDashboardRef.current(),
        openPlaylist: (onClose: () => void) => openPopup("playlist", onClose),
        openSquad: (onClose: () => void) => openPopup("squad", onClose),
        setCursor: (kind: CursorKind) => {
          // CursorOverlay reads this attribute; the native cursor is only touched when no custom pointer is active.
          stage.canvas.dataset.cursorRole = kind;
          if (!customCursorRef.current) stage.canvas.style.cursor = kind;
        },
      },
    });

    // ?pitchDebug=1: frame-time meter (update + render ms, drawImage count) with an overlay and a console line every 5s.
    const perf = pitchDebugEnabled() ? new FramePerf() : null;
    let perfWrapped = false;
    let lastPerfLog = 0;
    const now = () => performance.now();

    const loop = createLoop({
      step: 1 / 60,
      maxFrame: 1 / 20,
      update: (dt) => {
        const t0 = perf ? now() : 0;
        try {
          for (const code of input.drainPresses()) manager.key(code);
          manager.update(dt);
        } catch (error) {
          loop.stop();
          fallback(error);
        }
        if (perf) perf.addUpdate(now() - t0);
      },
      render: () => {
        const t0 = perf ? now() : 0;
        try {
          const g = stage.beginFrame();
          if (perf && !perfWrapped) {
            countDrawImage(g, perf);
            perfWrapped = true;
          }
          manager.render(g);
          if (perf) {
            perf.endFrame(now() - t0);
            const summary = perf.summary();
            drawPerfOverlay(g, summary);
            if (t0 - lastPerfLog > 5000) {
              lastPerfLog = t0;
              console.info(formatPerfLine(summary));
            }
          }
        } catch (error) {
          loop.stop();
          fallback(error);
        }
      },
    });

    // A lost 2D context (GPU reset, out of memory) leaves a blank canvas: hand over to the dashboard instead.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      loop.stop();
      fallback(new Error("canvas context lost"));
    };
    stage.canvas.addEventListener("contextlost", onContextLost);

    const pointer = (type: "move" | "down" | "up") => (event: PointerEvent) => {
      const { x, y } = stage.toLogical(event.clientX, event.clientY);
      manager.pointer({ type, x, y });
    };
    const onMove = pointer("move");
    const onDown = pointer("down");
    // The canvas takes keyboard focus on click, so keys work again after focus sat on the skip link or another window.
    stage.canvas.tabIndex = -1;
    const focusCanvas = () => stage.canvas.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      focusCanvas();
      // keep receiving move/up while a slider is dragged past the canvas edge
      try {
        stage.canvas.setPointerCapture(event.pointerId);
      } catch {
        // synthetic or already released pointer: dragging still works inside the canvas
      }
      onDown(event);
    };
    const onUp = pointer("up");
    stage.canvas.addEventListener("pointermove", onMove);
    stage.canvas.addEventListener("pointerdown", onPointerDown);
    stage.canvas.addEventListener("pointerup", onUp);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      manager.wheel(event.deltaY);
    };
    stage.canvas.addEventListener("wheel", onWheel, { passive: false });

    let started = false;
    const onVisibility = () => {
      if (!started) return;
      if (document.hidden) {
        loop.stop();
        input.reset();
      } else if (!disposed) {
        loop.start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // boot group + pixel font first (nothing to draw without them), then the loading scene takes over.
    void Promise.all([assets.loadGroup("boot"), ensurePixelFont()]).then(([boot]) => {
      if (disposed) return;
      if (boot.failed.length > 0) {
        fallback(new Error(`boot assets failed: ${boot.failed.join(", ")}`));
        return;
      }
      manager.replace(new LoadingScene(), undefined, { transition: "none" });
      focusCanvas();
      started = true;
      if (!document.hidden) loop.start();
    });

    return () => {
      disposed = true;
      loop.stop();
      document.removeEventListener("visibilitychange", onVisibility);
      stage.canvas.removeEventListener("pointermove", onMove);
      stage.canvas.removeEventListener("pointerdown", onPointerDown);
      stage.canvas.removeEventListener("pointerup", onUp);
      stage.canvas.removeEventListener("wheel", onWheel);
      stage.canvas.removeEventListener("contextlost", onContextLost);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
      input.detach();
      manager.dispose();
      audio.dispose();
      assets.dispose();
      stage.destroy();
      document.body.style.overflow = previousOverflow;
      resumeGlobalMusic();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 80, overflow: "hidden", background: BACKDROP_COLOR }}
      role="application"
      aria-label="잔디동 피치 미니게임"
      aria-describedby="pitch-instructions"
    >
      <p
        id="pitch-instructions"
        style={{ position: "absolute", width: 1, height: 1, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
      >
        방향키로 움직이는 축구 미니게임입니다. Space 슛, Z X C V 개인기, E 락커룸, Tab 캐릭터 선택. 피치 화면에서 Backspace 키, 우측 상단 버튼 또는 Skip to dashboard 버튼으로 잔디동 대시보드로 이동할 수 있습니다.
      </p>
      {popup && (
        <Suspense fallback={null}>
          {popup === "playlist" ? <CoverLoopPlaylistOverlay onClose={closePopup} /> : <PitchSquadPopup onClose={closePopup} />}
        </Suspense>
      )}
      <p ref={liveRef} aria-live="polite" style={{ position: "absolute", width: 1, height: 1, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)" }} />
      <button
        type="button"
        style={SKIP_LINK_STYLE}
        onFocus={(event) => (event.currentTarget.style.transform = "none")}
        onBlur={(event) => (event.currentTarget.style.transform = SKIP_LINK_STYLE.transform)}
        onClick={() => onGoDashboard()}
      >
        Skip to dashboard
      </button>
    </div>
  );
}
