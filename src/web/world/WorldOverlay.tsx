import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import "./world.css";
import "./world-ui.css";
import { resumeGlobalMusic, suspendGlobalMusic } from "../musicControl";
import { WorldAudio, type BgmId } from "./audio/worldAudio";
import { WorldCanvas } from "./WorldCanvas";
import { isWorldDebug } from "./debug";
import { getCast } from "./data/worldCast";
import { buildExamineDialogue, buildNpcDialogue } from "./data/placeholderDialogue";
import type { DebugPick, SaveStore, WorldEngine, WorldEvents } from "./engine/world";
import { COACH_DONE, nextCoachStep, type CoachEvent } from "./state/coach";
import type { DialogueNode } from "./state/dialogue";
import { resolveEscape, type OverlayPhase } from "./state/escape";
import { PROLOGUE_DONE_FLAG, createNewGameSave, isContinuableSave, loadWorldSave, loadWorldSettings, saveWorldSave } from "./storage";
import { STAGE_HEIGHT, STAGE_WIDTH, computeStageLayout, type StageLayout } from "./stageLayout";
import type { CastId, SceneId } from "./types";
import { CharacterSelect } from "./ui/CharacterSelect";
import { CoachMarks } from "./ui/CoachMarks";
import { DebugPanel } from "./ui/DebugPanel";
import { DialogueBox } from "./ui/DialogueBox";
import { LoadingScreen } from "./ui/LoadingScreen";
import { Prologue } from "./ui/Prologue";
import { TitleScreen } from "./ui/TitleScreen";
import { ToastLayer, useToasts } from "./ui/Toast";
import { WorldAssets, assetKeysForGroup } from "./worldAssets";

/** Shown for a moment even when everything is cached, so the loading screen never just flashes. */
const MIN_LOADING_MS = 600;
/** The first conversations show the "E 다음 · Esc 닫기" hint (docs/world/02 §4). */
const HINT_CONVERSATIONS = 3;
/** Shards needed for the brighter field music (docs/world/07 §1). */
const LUSH_MUSIC_SHARDS = 5;

interface Session {
  playerId: CastId;
  store: SaveStore;
}

interface ActiveDialogue {
  node: DialogueNode;
  /** Cast member the conversation is with (null for a read-only object). */
  cast: CastId | null;
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
 * Esc goes to the topmost open piece of UI only (`resolveEscape`); it listens in the capture phase and
 * stops the event so page-level Esc handlers underneath never also fire.
 */
function useEscapeKey(handlerRef: { current: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.code !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      handlerRef.current();
    };
    window.addEventListener("keydown", close, true);
    return () => window.removeEventListener("keydown", close, true);
  }, [handlerRef]);
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

/** Music for a place: an interior's own track, or the field music (by progress) with the district's track first. */
function bgmFor(scene: SceneId, zoneBgm: string | undefined, shards: number): BgmId[] {
  if (scene === "interior:arcade") return ["arcade", "interior"];
  if (scene === "interior:stadium") return ["stadium", "interior"];
  if (scene !== "overworld") return ["interior"];
  const field: BgmId = shards >= LUSH_MUSIC_SHARDS ? "field-lush" : "field-withered";
  return zoneBgm && zoneBgm.startsWith("region-") ? [zoneBgm as BgmId, field] : [field];
}

export default function WorldOverlay({ onClose }: { onClose: () => void }) {
  const debug = useMemo(() => isWorldDebug(), []);
  const assets = useMemo(() => new WorldAssets(), []);
  const audio = useMemo(() => new WorldAudio(loadWorldSettings()), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = useStageLayout();
  const [phase, setPhase] = useState<OverlayPhase>("boot");
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [pendingPlayer, setPendingPlayer] = useState<CastId | null>(null);
  const [savedGame] = useState(() => {
    const saved = loadWorldSave();
    return isContinuableSave(saved) ? saved : null;
  });

  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [coachStep, setCoachStep] = useState(0);
  const { toasts, push: pushToast } = useToasts();
  const engineRef = useRef<WorldEngine | null>(null);
  const [engine, setEngine] = useState<WorldEngine | null>(null);
  const [currentScene, setCurrentScene] = useState<SceneId>("overworld");
  const [debugPick, setDebugPick] = useState<DebugPick | null>(null);

  useBodyScrollLock();

  // The visitor's own YouTube music pauses while the world is open and comes back afterwards.
  useEffect(() => {
    suspendGlobalMusic();
    return resumeGlobalMusic;
  }, []);

  // Keyboard-only game: pull focus off the floating button that opened us.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    audio.reset();
    return () => {
      audio.dispose();
      assets.dispose();
    };
  }, [assets, audio]);

  // Menu music until the world takes over (the engine reports the scene once it starts).
  useEffect(() => {
    if (phase === "title" || phase === "select" || phase === "prologue") audio.playBgm(["title"]);
  }, [phase, audio]);

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
    const keys = assetKeysForGroup("core", session.playerId, session.store.save.scene);
    audio.preloadSfx(["ui-move", "ui-select", "dialog-tick", "dialog-next", "dialog-open", "door-open", "door-close", "step-grass", "step-stone", "step-wood", "examine", "interact-ping"]);
    void assets.load(keys, (done, total) => setProgress(total === 0 ? 1 : done / total), controller.signal).then(async () => {
      const remaining = MIN_LOADING_MS - (performance.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (!cancelled) setPhase("play");
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [phase, session, assets, audio]);

  // ── flow ────────────────────────────────────────────────────────────────────────────────

  function startContinue() {
    if (!savedGame || !savedGame.player) return;
    setCoachStep(savedGame.coachDone ? COACH_DONE : 0);
    setSession({ playerId: savedGame.player, store: { save: savedGame } });
    setPhase("core");
  }

  function startNew() {
    // The old save stays untouched until a character is confirmed and the prologue is over (see finishPrologue).
    setPhase("select");
  }

  function confirmCharacter(id: CastId) {
    setPendingPlayer(id);
    setPhase("prologue");
  }

  function finishPrologue() {
    if (!pendingPlayer) {
      setPhase("select");
      return;
    }
    const save = { ...createNewGameSave(pendingPlayer), flags: { [PROLOGUE_DONE_FLAG]: true as const } };
    saveWorldSave(save);
    setCoachStep(0);
    setDialogue(null);
    setSession({ playerId: pendingPlayer, store: { save } });
    setPhase("core");
  }

  // ── in-world events (called by the engine) ───────────────────────────────────────────────

  const store = session?.store;

  // Handlers read the latest step/dialogue from refs so no side effect runs inside a state updater.
  const coachRef = useRef(coachStep);
  coachRef.current = coachStep;
  const dialogueRef = useRef(dialogue);
  dialogueRef.current = dialogue;

  const advanceCoach = useCallback(
    (event: CoachEvent) => {
      const current = coachRef.current;
      const next = nextCoachStep(current, event);
      if (next === current) return;
      coachRef.current = next;
      setCoachStep(next);
      if (next >= COACH_DONE && store) store.save = { ...store.save, coachDone: true };
    },
    [store],
  );

  const closeDialogue = useCallback(() => {
    const current = dialogueRef.current;
    if (!current) return;
    dialogueRef.current = null;
    setDialogue(null);
    engineRef.current?.closeInteraction();
    if (current.cast) advanceCoach({ type: "talked", cast: current.cast });
  }, [advanceCoach]);

  const eventsRef = useRef<WorldEvents>({});
  eventsRef.current = {
    onInteract(target) {
      if (!store) return;
      if (target.kind === "npc") {
        const cast = getCast(target.cast);
        const talked = store.save.talked[cast.id] ?? 0;
        store.save = { ...store.save, talked: { ...store.save.talked, [cast.id]: talked + 1 } };
        setDialogue({ node: buildNpcDialogue(cast, talked), cast: cast.id });
      } else {
        setDialogue({ node: buildExamineDialogue(target.text), cast: null });
      }
    },
    onZoneEnter(zone) {
      pushToast(zone.name, zone.tint);
      if (store) audio.playBgm(bgmFor("overworld", zone.bgm, store.save.shards));
    },
    onSceneChange(scene) {
      setCurrentScene(scene);
      if (store && scene !== "overworld") audio.playBgm(bgmFor(scene, undefined, store.save.shards));
    },
    onWalked(tiles) {
      advanceCoach({ type: "walked", tiles });
    },
    onLogKey() {
      // The mission log itself is S3; the key already counts for the tutorial.
      pushToast("미션 로그는 곧 열려요");
      advanceCoach({ type: "log" });
    },
    onDebugPick: setDebugPick,
  };

  const handleEngine = useCallback((next: WorldEngine | null) => {
    engineRef.current = next;
    setEngine(next);
  }, []);

  // Coach step C2 points at the elder.
  useEffect(() => {
    engine?.setHighlight(phase === "play" && coachStep === 1 ? "elder" : null);
  }, [engine, phase, coachStep]);

  // ── Esc ─────────────────────────────────────────────────────────────────────────────────

  const coachActive = phase === "play" && coachStep < COACH_DONE;
  const escapeRef = useRef<() => void>(() => {});
  escapeRef.current = () => {
    switch (resolveEscape({ phase, dialogueOpen: dialogue !== null, coachActive })) {
      case "close-dialogue":
        closeDialogue();
        break;
      case "skip-coach":
        coachRef.current = COACH_DONE;
        setCoachStep(COACH_DONE);
        if (store) store.save = { ...store.save, coachDone: true };
        break;
      case "back-to-title":
        setPhase("title");
        break;
      case "skip-prologue":
        finishPrologue();
        break;
      case "close-world":
        onClose();
        break;
    }
  };
  useEscapeKey(escapeRef);

  const playerCast = session ? getCast(session.playerId) : null;
  const talkedTotal = store ? Object.values(store.save.talked).reduce((sum, n) => sum + n, 0) : 0;

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
          <TitleScreen hasSave={savedGame !== null} onContinue={startContinue} onNew={startNew} onExit={onClose} debug={debug} />
        )}
        {phase === "select" && <CharacterSelect audio={audio} onConfirm={confirmCharacter} onBack={() => setPhase("title")} />}
        {phase === "prologue" && pendingPlayer && (
          <Prologue playerName={getCast(pendingPlayer).displayName} audio={audio} debug={debug} onDone={finishPrologue} />
        )}
        {phase === "play" && session && playerCast && (
          <>
            <WorldCanvas
              key={session.playerId}
              assets={assets}
              playerId={session.playerId}
              store={session.store}
              debug={debug}
              audio={audio}
              eventsRef={eventsRef}
              onEngine={handleEngine}
              scaleLabel={`${layout.deviceScale}x device px (css ${layout.cssScale.toFixed(2)})`}
            />
            {!dialogue && <p className="world-hint">방향키/WASD 이동 · Shift 달리기 · E 상호작용 · Esc 나가기</p>}
            <CoachMarks step={coachStep} />
            <ToastLayer toasts={toasts} />
            {dialogue && (
              <DialogueBox
                key={`${dialogue.cast ?? "object"}-${talkedTotal}`}
                node={dialogue.node}
                playerName={playerCast.displayName}
                audio={audio}
                showHint={talkedTotal <= HINT_CONVERSATIONS}
                onClose={closeDialogue}
              />
            )}
          </>
        )}
      </div>
      <button type="button" className="world-overlay__close" onClick={onClose} aria-label="월드 나가기 (Esc)">
        <X aria-hidden="true" />
      </button>
      {debug && phase === "play" && <DebugPanel engine={engine} scene={currentScene} pick={debugPick} />}
    </div>
  );
}
