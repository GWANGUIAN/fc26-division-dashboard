import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import "./world.css";
import { resumeGlobalMusic, suspendGlobalMusic } from "../musicControl";
import { WorldCanvas } from "./WorldCanvas";
import { isWorldDebug } from "./debug";
import { clearWorldSave, createDefaultSave, loadWorldSave } from "./storage";
import { STAGE_HEIGHT, STAGE_WIDTH, computeStageLayout, type StageLayout } from "./stageLayout";
import type { CastId, WorldSave } from "./types";
import { LoadingScreen } from "./ui/LoadingScreen";
import { TitleScreen } from "./ui/TitleScreen";
import { WorldAssets, assetKeysForGroup } from "./worldAssets";

/** Shown for a moment even when everything is cached, so the loading screen never just flashes. */
const MIN_LOADING_MS = 600;

/** S1 has no character select yet (S2): every new game plays as this member. */
const S1_DEFAULT_PLAYER: CastId = "janine95kim";

type Phase = "boot" | "title" | "core" | "play";

interface Session {
  playerId: CastId;
  save: WorldSave;
}

/** Locks the page behind the overlay from scrolling while it's open (same pattern as FortunePopup). */
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

/**
 * Esc leaves the world from every screen for now. It listens in the capture phase and stops the
 * event so page-level Esc handlers underneath never also fire. S3 replaces this with a stack
 * (dialogue/modal first, then pause menu) — docs/world/08 §5 #3.
 */
function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.code !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", close, true);
    return () => window.removeEventListener("keydown", close, true);
  }, [onClose]);
}

function useStageLayout(): StageLayout {
  const [layout, setLayout] = useState(() => computeStageLayout(window.innerWidth, window.innerHeight, window.devicePixelRatio));
  useLayoutEffect(() => {
    const update = () => setLayout(computeStageLayout(window.innerWidth, window.innerHeight, window.devicePixelRatio));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return layout;
}

export default function WorldOverlay({ onClose }: { onClose: () => void }) {
  const debug = useMemo(() => isWorldDebug(), []);
  const assets = useMemo(() => new WorldAssets(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = useStageLayout();
  const [phase, setPhase] = useState<Phase>("boot");
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [savedGame] = useState(() => loadWorldSave());

  useBodyScrollLock();
  useEscapeToClose(onClose);

  // The visitor's own YouTube music pauses while the world is open and comes back afterwards.
  useEffect(() => {
    suspendGlobalMusic();
    return resumeGlobalMusic;
  }, []);

  // Keyboard-only game: pull focus off the floating button that opened us.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => () => assets.dispose(), [assets]);

  // boot group -> title
  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    let cancelled = false;
    void assets.load(assetKeysForGroup("boot", null), (done, total) => setProgress(total === 0 ? 1 : done / total), controller.signal).then(async () => {
      const remaining = MIN_LOADING_MS - (performance.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (!cancelled) setPhase("title");
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assets]);

  // core group -> play
  useEffect(() => {
    if (phase !== "core" || !session) return;
    const controller = new AbortController();
    const startedAt = performance.now();
    let cancelled = false;
    setProgress(0);
    void assets.load(assetKeysForGroup("core", session.playerId), (done, total) => setProgress(total === 0 ? 1 : done / total), controller.signal).then(async () => {
      const remaining = MIN_LOADING_MS - (performance.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (!cancelled) setPhase("play");
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [phase, session, assets]);

  function startGame(mode: "continue" | "new") {
    if (mode === "continue" && savedGame) {
      setSession({ playerId: savedGame.player ?? S1_DEFAULT_PLAYER, save: savedGame });
    } else {
      clearWorldSave();
      setSession({ playerId: S1_DEFAULT_PLAYER, save: { ...createDefaultSave(), player: S1_DEFAULT_PLAYER } });
    }
    setPhase("core");
  }

  return (
    <div ref={rootRef} className="world-overlay" role="dialog" aria-modal="true" aria-label="잔디동 월드" tabIndex={-1}>
      <div
        className="world-stage"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.cssScale})`,
        }}
      >
        {(phase === "boot" || phase === "core") && <LoadingScreen progress={progress} />}
        {phase === "title" && (
          <TitleScreen
            hasSave={savedGame !== null}
            onContinue={() => startGame("continue")}
            onNew={() => startGame("new")}
            onExit={onClose}
            debug={debug}
          />
        )}
        {phase === "play" && session && (
          <>
            <WorldCanvas
              key={session.playerId}
              assets={assets}
              playerId={session.playerId}
              save={session.save}
              debug={debug}
              scaleLabel={`${layout.deviceScale}x device px (css ${layout.cssScale.toFixed(2)})`}
            />
            <p className="world-hint">방향키/WASD 이동 · Shift 달리기 · Esc 나가기</p>
          </>
        )}
      </div>
      <button type="button" className="world-overlay__close" onClick={onClose} aria-label="월드 나가기 (Esc)">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
