import { repeatEvent } from "./state/repeatContent";
import { claimDaily } from "./state/daily";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { X } from "lucide-react";
import "./world.css";
import "./world-ui.css";
import "./world-mission.css";
import { resumeGlobalMusic, suspendGlobalMusic } from "../musicControl";
import { SOOP_LIVE_ENABLED } from "../useSoopLiveStreamers";
import { GroupPhotoOverlay } from "../group-photo/GroupPhotoOverlay";
import { hasTotyCard } from "../toty-card/totyCardAssets";
import { WorldAudio, type BgmId } from "./audio/worldAudio";
import { WorldCanvas } from "./WorldCanvas";
import { isWorldDebug } from "./debug";
import { FINALE_SCRIPT } from "./data/dialogueData";
import { STINGER_SKIP_GUARD_MS } from "./data/stingerData";
import { MINIGAME_INFO, finaleRoundGoal, getMissionDef, missionDefsFor, totalShardsFor } from "./data/missionDefs";
import { getCast } from "./data/worldCast";
import { ambienceIdFor } from "./engine/ambience";
import type { DebugPick, SaveStore, WorldEngine, WorldEvents } from "./engine/world";
import type { RunEvent } from "./engine/runs";
import { parseAction } from "./state/actions";
import { buildBackwalkDialogue, withBackwalk } from "./state/backwalk";
import { heldGoldenBalls } from "./state/finaleBalls";
import { COACH_DONE, nextCoachStep, type CoachEvent } from "./state/coach";
import type { DialogueEffect, DialogueNode } from "./state/dialogue";
import { resolveEscape, type EndingStage, type OverlayPhase, type PauseView } from "./state/escape";
import {
  acceptMission, applyMissionEvent, completeMission, completeTalk, defaultTracked, missionViews, restartMission, type RewardResult,
} from "./state/missions";
import { initialWorldCardVariant } from "./state/cardTheme";
import { asProgress, describeProgress, finaleRoundOutcome, type MissionEvent } from "./state/missionEval";
import { missionObjectiveTarget, navigationNpcTarget, routeMissionTarget } from "./state/missionNavigation";
import { buildCheerDialogue, buildConversation, buildEndingDialogue, buildExamineDialogue } from "./state/npcDialogue";
import { OnAirTracker, openOnAirLink } from "./state/onAir";
import { ENDING_SEEN_FLAG, STADIUM_OPEN_FLAG, endingPending, withEndingFlags } from "./state/story";
import {
  PROLOGUE_DONE_FLAG, createNewGameSave, isContinuableSave, loadWorldSave, loadWorldSettings, saveWorldSave, saveWorldSettings,
} from "./storage";
import { STAGE_HEIGHT, STAGE_WIDTH, computeStageLayout, type StageLayout } from "./stageLayout";
import type { CastId, MinigameRoundResult, SceneId, WorldSave, WorldSettings } from "./types";
import { CharacterSelect } from "./ui/CharacterSelect";
import { CoachMarks } from "./ui/CoachMarks";
import { GrassRushModal } from "./arcade/GrassRushModal";
import { CollectionBook } from "./ui/CollectionBook";
import { DailyBoard } from "./ui/DailyBoard";
import { DebugPanel } from "./ui/DebugPanel";
import { DialogueBox } from "./ui/DialogueBox";
import { EndingOverlay } from "./ui/EndingOverlay";
import { GoldBallCounter } from "./ui/GoldBallCounter";
import { Hud } from "./ui/Hud";
import { LoadingScreen } from "./ui/LoadingScreen";
import { MissionLog } from "./ui/MissionLog";
import { PauseMenu } from "./ui/PauseMenu";
import { Prologue } from "./ui/Prologue";
import { StingerOverlay, preloadStingerImages } from "./ui/StingerOverlay";
import { TitleScreen } from "./ui/TitleScreen";
import { ToastLayer, useToasts } from "./ui/Toast";
import { WorldModals, type DashboardBridge, type WorldModal } from "./ui/WorldModals";
import { WorldAssets, assetKeysForGroup } from "./worldAssets";
import { GameFrame } from "./ui/GameFrame";

export type { DashboardBridge } from "./ui/WorldModals";

/** Shown for a moment even when everything is cached, so the loading screen never just flashes. */
const MIN_LOADING_MS = 600;
/** The first conversations show the "E 다음 · Esc 닫기" hint (docs/world/02 §4). */
const HINT_CONVERSATIONS = 3;
/** Shards needed for the brighter field music (docs/world/07 §1). */
const LUSH_MUSIC_SHARDS = 5;
/** Toasts of one reward (mission done → shard → badge) are staggered so each can be read. */
const REWARD_TOAST_GAP_MS = 900;

interface Session {
  playerId: CastId;
  store: SaveStore;
}

interface ActiveDialogue {
  node: DialogueNode;
  /** Cast member the conversation is with (null for a read-only object). */
  cast: CastId | null;
  /** Mission effects applied when the conversation ends (a report is paid out here). */
  endEffects: DialogueEffect[];
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
 * stops the event so page-level Esc handlers underneath (the minigame modals' own `useEscape`) never also fire.
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

/** Music for a place: an interior's own track (the showdown has its boss theme), or the field music (by progress) with the district's track first. */
function bgmFor(scene: SceneId, zoneBgm: string | undefined, save: Pick<WorldSave, "shards" | "flags">): BgmId[] {
  if (scene === "interior:arcade") return ["arcade", "interior"];
  if (scene === "interior:stadium") return save.flags[STADIUM_OPEN_FLAG] && !save.flags[ENDING_SEEN_FLAG] ? ["boss", "stadium", "interior"] : ["stadium", "interior"];
  if (scene !== "overworld") return ["interior"];
  const field: BgmId = save.shards >= LUSH_MUSIC_SHARDS ? "field-lush" : "field-withered";
  return zoneBgm && zoneBgm.startsWith("region-") ? [zoneBgm as BgmId, field] : [field];
}

/** The save with its player set: mission logic needs it (a session save always has one). */
const withPlayer = (save: WorldSave, player: CastId): WorldSave => (save.player === player ? save : { ...save, player });

export default function WorldOverlay({ onClose, dashboard }: { onClose: () => void; dashboard: DashboardBridge }) {
  const debug = useMemo(() => isWorldDebug(), []);
  const assets = useMemo(() => new WorldAssets(), []);
  const [settings, setSettings] = useState<WorldSettings>(() => loadWorldSettings());
  const audio = useMemo(() => new WorldAudio(settings), []); // eslint-disable-line react-hooks/exhaustive-deps -- the settings are pushed with setSettings below
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = useStageLayout();
  const [phase, setPhase] = useState<OverlayPhase>("boot");
  const [titleSettingsOpen, setTitleSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [pendingPlayer, setPendingPlayer] = useState<CastId | null>(null);
  const readContinuable = () => {
    const saved = loadWorldSave();
    return isContinuableSave(saved) ? saved : null;
  };
  const [savedGame, setSavedGame] = useState(readContinuable);

  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [coachStep, setCoachStep] = useState(0);
  const [modal, setModal] = useState<WorldModal | null>(null);
  const [pauseView, setPauseView] = useState<PauseView>("closed");
  const [logOpen, setLogOpen] = useState(false);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  /** The ending cut (docs/world/02 §9) and the trophy room's framed photo. */
  const [ending, setEnding] = useState<EndingStage | null>(null);
  const [framePhoto, setFramePhoto] = useState(false);
  /** Bumped whenever the save changes, so the HUD, log and menu re-render (the save itself lives in `store`). */
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const { toasts, push: pushToast } = useToasts();
  const engineRef = useRef<WorldEngine | null>(null);
  const [engine, setEngine] = useState<WorldEngine | null>(null);
  const [currentScene, setCurrentScene] = useState<SceneId>("overworld");
  /** Timed attempts change their immediate target without necessarily changing the saved mission state. */
  const [navigationRevision, refreshNavigation] = useReducer((n: number) => n + 1, 0);
  const [debugPick, setDebugPick] = useState<DebugPick | null>(null);
  const bgmRef = useRef<BgmId[]>(["title"]);
  const rewardTimers = useRef<number[]>([]);
  /** The minigame of a showdown round the player just chose; it opens once the conversation is closed. */
  const pendingRound = useRef<MinigameRoundResult["game"] | null>(null);
  const modalRef = useRef<WorldModal | null>(null);
  /** When the post-credits stinger began: an Esc within the guard window is the tail of the press that ended the credits. */
  const stingerStartedAt = useRef(0);

  useBodyScrollLock();

  // The ON AIR signs over the member houses: SOOP live status is read every 2 minutes, only while the world
  // is open (this component only exists then) and, like the dashboard's LIVE rail, only when SOOP lookups are enabled.
  const onAir = useMemo(() => new OnAirTracker(), []);
  useEffect(() => {
    if (!SOOP_LIVE_ENABLED) return;
    onAir.start();
    return () => onAir.stop();
  }, [onAir]);

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
    const timers = rewardTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      audio.dispose();
      assets.dispose();
    };
  }, [assets, audio]);

  const playBgm = useCallback(
    (ids: BgmId[]) => {
      bgmRef.current = ids;
      audio.playBgm(ids);
    },
    [audio],
  );

  // Menu music until the world takes over (the engine reports the scene once it starts).
  useEffect(() => {
    if (phase === "title" || phase === "select" || phase === "prologue") playBgm(["title"]);
  }, [phase, playBgm]);

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
    audio.preloadSfx([
      "ui-move", "ui-select", "dialog-tick", "dialog-next", "dialog-open", "door-open", "door-close", "door-bell", "step-grass", "step-stone", "step-wood", "bump", "examine", "interact-ping",
      "mission-accept", "mission-ready", "mission-complete", "shard-get", "pickup", "parcel-get", "checkpoint", "ball-kick", "ball-net", "cat-meow", "dog-bark", "mower-rev",
      "rush-jump", "rush-slide", "rush-hit", "rush-collect", "rush-gameover",
    ]);
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

  function resetPlayUi() {
    setDialogue(null);
    setModal(null);
    setLogOpen(false);
    setPauseView("closed");
    setTrackedId(null);
    setEnding(null);
    setFramePhoto(false);
    pendingRound.current = null;
  }

  function startContinue() {
    if (!savedGame || !savedGame.player) return;
    setCoachStep(savedGame.coachDone ? COACH_DONE : 0);
    resetPlayUi();
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
    resetPlayUi();
    setSession({ playerId: pendingPlayer, store: { save } });
    setPhase("core");
  }

  /** Pause menu → 새로 시작: back to the character select; the current save stays until a new prologue ends. */
  function startNewFromMenu() {
    engineRef.current?.cancelRuns();
    persist();
    setSavedGame(readContinuable());
    resetPlayUi();
    setPhase("select");
  }

  // ── save helpers ────────────────────────────────────────────────────────────────────────

  const store = session?.store;
  const playerId = session?.playerId ?? null;
  const save = store && playerId ? withPlayer(store.save, playerId) : null;
  const views = save ? missionViews(save) : [];
  const tracked = views.find((view) => view.def.id === trackedId && view.status !== "completed") ?? defaultTracked(views);

  /** Writes the save (with the current position) to storage right away. */
  const persist = useCallback(() => {
    if (!store) return;
    const where = engineRef.current?.getState();
    saveWorldSave(where ? { ...store.save, ...where } : store.save);
  }, [store]);

  /** Replaces the save through a pure update, persists it and re-renders. The engine notices the new reference on its next frame. */
  const commit = useCallback(
    (update: (current: WorldSave) => WorldSave) => {
      if (!store || !playerId) return;
      const next = update(withPlayer(store.save, playerId));
      if (next === store.save) return;
      store.save = next;
      persist();
      bump();
    },
    [store, playerId, persist],
  );

  // ── missions ────────────────────────────────────────────────────────────────────────────

  /** Toasts spaced out so a mission, its shard and a badge each get read. */
  const pushSequence = useCallback(
    (items: { text: string; accent?: string; sfx?: Parameters<WorldAudio["playSfx"]>[0] }[]) => {
      items.forEach((item, index) => {
        const run = () => {
          pushToast(item.text, item.accent);
          if (item.sfx) audio.playSfx(item.sfx);
        };
        if (index === 0) run();
        else rewardTimers.current.push(window.setTimeout(run, index * REWARD_TOAST_GAP_MS));
      });
    },
    [audio, pushToast],
  );

  const announceReward = useCallback(
    (reward: RewardResult) => {
      const total = totalShardsFor(store?.save.player ?? null);
      const items: { text: string; accent?: string; sfx?: Parameters<WorldAudio["playSfx"]>[0] }[] = [
        { text: `미션 완료: ${reward.mission.title}`, accent: "#ffd54a", sfx: "mission-complete" },
      ];
      if (reward.shard) items.push({ text: `잔디 조각 획득! (${reward.shardsAfter}/${total})`, accent: "#00e9ae", sfx: "shard-get" });
      for (const badge of reward.badges) items.push({ text: `뱃지 획득: 「${badge.label}」`, accent: "#ffb454", sfx: "badge-get" });
      if (reward.shard && reward.shardsAfter >= total) setTrackedId("m-89-director-report");
      if (reward.shard && reward.shardsAfter >= total) items.push({ text: "최종 미션 생성: 우왁굳 감독에게 보고하세요", accent: "#00e9ae", sfx: "shard-restore" });
      if (reward.flags.includes(STADIUM_OPEN_FLAG)) items.push({ text: "스타디움 문이 열렸어요! 결전이 기다립니다", accent: "#ffd54a", sfx: "mission-ready" });
      pushSequence(items);
    },
    [pushSequence, store],
  );

  /** Feeds a world event to the missions, announcing every mission whose goal it just met. */
  const dispatch = useCallback(
    (event: MissionEvent) => {
      if (!store || !playerId) return;
      const result = applyMissionEvent(repeatEvent(withPlayer(store.save, playerId), event, Date.now()), event);
      if (result.save === store.save) return;
      commit(() => result.save);
      for (const change of result.changes) {
        const def = getMissionDef(change.id);
        if (!def) continue;
        pushSequence([{ text: `목표 달성! ${getCast(def.giver).displayName}에게 보고하세요 (${def.title})`, accent: "#ffd54a", sfx: "mission-ready" }]);
      }
    },
    [commit, playerId, pushSequence, store],
  );

  const applyEffect = useCallback(
    (effect: DialogueEffect) => {
      if (!store || !playerId) return;
      if (effect.type === "flags") {
        commit((current) => ({ ...current, flags: { ...current.flags, ...Object.fromEntries(effect.flags.map((flag) => [flag, true as const])) } }));
        if (effect.flags.includes(STADIUM_OPEN_FLAG)) pushSequence([{ text: "스타디움 문이 열렸어요! 결전이 기다립니다", accent: "#ffd54a", sfx: "mission-ready" }]);
        return;
      }
      if (effect.type === "ending-photo") {
        setEnding("photo");
        return;
      }
      if (effect.type === "backwalk") {
        commit((current) => ({ ...current, flags: withBackwalk(current.flags, effect.on) }));
        audio.playSfx(effect.on ? "shard-restore" : "checkpoint");
        return;
      }
      const def = getMissionDef(effect.mission);
      if (!def) return;
      switch (effect.type) {
        case "accept": {
          const next = acceptMission(withPlayer(store.save, playerId), effect.mission);
          if (next === store.save) return;
          commit(() => next);
          pushSequence([{ text: `미션 수락: ${def.title}`, accent: "#5aa8ff", sfx: "mission-accept" }]);
          if (def.kind === "delivery" && def.seconds !== undefined) engineRef.current?.startDelivery(def.id);
          break;
        }
        case "retry":
          // Every round starts from zero: parcels handed over in an earlier, timed-out round do not count.
          commit((current) => restartMission(current, effect.mission));
          engineRef.current?.startDelivery(effect.mission);
          break;
        case "finish-talk": {
          const done = completeTalk(withPlayer(store.save, playerId), effect.mission);
          commit(() => done.save);
          if (done.reward) announceReward(done.reward);
          break;
        }
        case "complete": {
          const done = completeMission(withPlayer(store.save, playerId), effect.mission);
          commit(() => done.save);
          if (done.reward) announceReward(done.reward);
          break;
        }
        case "finale-balls": {
          // The balls clear the round the referee just asked about; the mission checks it can (enough held, not used yet).
          if (def.kind !== "finale" || def.ballSkip === undefined) break;
          const before = asProgress(store.save.missions[def.id]?.progress);
          dispatch({ type: "finale-balls" });
          const after = asProgress(store.save.missions[def.id]?.progress);
          if (!after.balls?.length || after.balls === before.balls) break;
          audio.playSfx("shard-restore");
          pushSequence([{ text: `${after.round ?? 0}라운드 통과! 황금 공 ${def.ballSkip}개 사용 (${after.round ?? 0}/${def.rounds.length})`, accent: "#ffd54a", sfx: "checkpoint" }]);
          break;
        }
        case "start-round": {
          // The round's minigame opens when the conversation closes (the dialogue owns the keyboard until then).
          if (def.kind !== "finale") break;
          const round = def.rounds[asProgress(store.save.missions[def.id]?.progress).round ?? 0];
          if (round) pendingRound.current = round.game;
          break;
        }
      }
    },
    [announceReward, audio, commit, dispatch, playerId, pushSequence, store],
  );

  /** A minigame round of a modal the world itself opened — the only plays that count. */
  const handleRoundEnd = useCallback(
    (result: MinigameRoundResult) => {
      if (modalRef.current?.type !== "minigame" || modalRef.current.game !== result.game) return;
      if (modalRef.current.context !== "finale") {
        dispatch({ type: "minigame", result });
        return;
      }
      // A stadium round: only the round on the card counts, and only from here (an arcade play never moves the showdown).
      const finale = playerId ? missionDefsFor(playerId).find((def) => def.kind === "finale") : undefined;
      if (!finale || finale.kind !== "finale" || !store) return;
      const before = store.save.missions[finale.id]?.progress;
      const outcome = finaleRoundOutcome(finale, before, result);
      if (outcome === "ignored") return;
      const round = asProgress(before).round ?? 0;
      const spec = finale.rounds[round];
      const info = MINIGAME_INFO[spec.game];
      if (outcome === "failed") {
        pushSequence([{ text: `${result.score}${info.unit} — ${finaleRoundGoal(spec, "need")}. 심판에게 다시 말을 걸어 도전하세요`, accent: "#ff6a5a", sfx: "timeup" }]);
        return;
      }
      if (round + 1 < finale.rounds.length) pushSequence([{ text: `${round + 1}라운드 통과! (${round + 1}/${finale.rounds.length})`, accent: "#ffd54a", sfx: "checkpoint" }]);
      dispatch({ type: "finale-round", result });
    },
    [dispatch, playerId, pushSequence, store],
  );
  const handleCardView = useCallback((id: string, variant: string) => { if (modalRef.current?.type === "cards" && modalRef.current.streamerId === id) dispatch({ type: "card-view", cardId: id, variant }); }, [dispatch]);

  const handleRunEvent = useCallback(
    (event: RunEvent) => {
      refreshNavigation();
      switch (event.type) {
        case "delivery-start":
          pushSequence([{ text: `택배 ${event.items.length}개를 받았어요! ${event.seconds}초 안에 우편함에 배달하세요`, accent: "#5aa8ff", sfx: "parcel-get" }]);
          break;
        case "delivered": {
          dispatch({ type: "delivered", item: event.item, to: { mailbox: event.mailbox } });
          const def = store ? missionDefsFor(store.save.player).find((entry) => entry.id === event.mission) : undefined;
          const text = def && store ? describeProgress(def, store.save.missions[def.id]?.progress, store.save.collected) : "";
          pushSequence([{ text: `배달 완료! ${text.split(" ·")[0]}`, accent: "#5aa8ff" }]);
          break;
        }
        case "delivery-timeup":
          commit((current) => restartMission(current, event.mission));
          pushSequence([{ text: "시간 초과! 택배를 돌려줬어요. 빙밍에게 다시 말을 걸어 도전하세요", accent: "#ff6a5a", sfx: "timeup" }]);
          break;
        case "trial-start":
          pushSequence([{ text: `출발! ${event.seconds}초 안에 콘 사이를 위·아래로 번갈아 지나가세요`, accent: "#ffb454" }]);
          break;
        case "trial-cone":
          pushSequence([{ text: `콘 접촉! +${event.penalty}초`, accent: "#ff6a5a" }]);
          break;
        case "trial-finished":
          dispatch({ type: "trial-finished", mission: event.mission, seconds: event.seconds });
          if (!event.passed) pushSequence([{ text: `${event.seconds.toFixed(1)}초 — 아쉬워요! 시작 게이트를 다시 지나 재도전`, accent: "#ff6a5a", sfx: "timeup" }]);
          break;
        case "trial-timeup":
          pushSequence([{ text: "시간 초과! 시작 게이트를 다시 지나 재도전", accent: "#ff6a5a", sfx: "timeup" }]);
          break;
        case "kick-start": {
          const def = getMissionDef(event.mission);
          pushSequence([{ text: def?.kind === "kick_goals" ? `${event.seconds}초 안에 ${def.goals}골!` : "킥 챌린지 시작!", accent: "#d9f27a", sfx: "whistle-short" }]);
          break;
        }
        case "kick-goal":
          pushSequence([{ text: `골! ${event.goals}/${event.need}`, accent: "#d9f27a" }]);
          break;
        case "kick-finished":
          dispatch({ type: "kick-finished", mission: event.mission, goals: event.goals });
          if (!event.passed) pushSequence([{ text: `시간 종료 — ${event.goals}골. 공을 차서 다시 도전!`, accent: "#ff6a5a", sfx: "timeup" }]);
          break;
      }
    },
    [dispatch, pushSequence, store],
  );

  // ── in-world events (called by the engine) ───────────────────────────────────────────────

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

  const closeModal = useCallback(() => {
    setModal(null);
    modalRef.current = null;
    engineRef.current?.closeInteraction();
    audio.playBgm(bgmRef.current);
  }, [audio]);

  const openModal = useCallback(
    (next: WorldModal) => {
      setModal(next);
      modalRef.current = next;
      audio.playBgm(next.type === "minigame" && next.game === "rush" ? ["rush"] : null); // Existing games bring their own music.
    },
    [audio],
  );

  const closeDialogue = useCallback(() => {
    const current = dialogueRef.current;
    if (!current) return;
    dialogueRef.current = null;
    setDialogue(null);
    for (const effect of current.endEffects) applyEffect(effect);
    if (current.cast) dispatch({ type: "talk", cast: current.cast });
    engineRef.current?.closeInteraction();
    if (current.cast) advanceCoach({ type: "talked", cast: current.cast });
    const round = pendingRound.current;
    pendingRound.current = null;
    if (round) openModal({ type: "minigame", game: round, context: "finale" });
  }, [advanceCoach, applyEffect, dispatch, openModal]);

  const eventsRef = useRef<WorldEvents>({});
  eventsRef.current = {
    onInteract(target) {
      if (!store || !playerId) return;
      if (target.kind === "npc") {
        const cast = getCast(target.cast);
        const talked = store.save.talked[cast.id] ?? 0;
        const conversation = buildConversation({
          cast,
          save: withPlayer(store.save, playerId),
          talked,
          deliveryRunning: engineRef.current?.isDeliveryRunning() ?? false,
          scene: engineRef.current?.getState().scene,
        });
        commit((current) => ({ ...current, talked: { ...current.talked, [cast.id]: talked + 1 } }));
        setDialogue({ node: conversation.node, cast: cast.id, endEffects: conversation.endEffects });
        return;
      }
      if (target.kind === "examine") {
        const action = parseAction(target.action);
        if (action?.type === "minigame") {
          openModal({ type: "minigame", game: action.game });
          return;
        }
        if (action?.type === "group-photo") {
          setFramePhoto(true);
          return;
        }
        // The plaza board (daily training) and the collection book (records, badges, ball guide) are panels, not dialogue.
        if (action?.type === "daily" || action?.type === "collection") {
          openModal({ type: action.type });
          return;
        }
        // The factory's converted conveyor: the same Grass Rush machine on a factory course.
        if (action?.type === "rush-factory") {
          openModal({ type: "minigame", game: "rush", factory: true });
          return;
        }
        if (action?.type === "backwalk-statue") {
          setDialogue({ node: buildBackwalkDialogue(store.save), cast: null, endEffects: [] });
          return;
        }
        if (action?.type === "cheer") {
          setDialogue({ node: buildCheerDialogue(action.cast), cast: null, endEffects: [] });
          return;
        }
        if (action?.type === "cards") {
          // The member's own card first (the tutorial asks for it); the popup itself lets the viewer switch to any other card.
          const streamers = (dashboard.streamers ?? []).filter((entry) => hasTotyCard(entry.id));
          const first = streamers.find((entry) => entry.id === playerId) ?? streamers[0];
          if (first) {
            // Only the active first-card tutorial is pinned to the normal 3D theme. Dashboard and later world opens keep their existing cycle.
            openModal({ type: "cards", streamerId: first.id, initialVariant: initialWorldCardVariant(store.save) });
            return;
          }
          setDialogue({ node: buildExamineDialogue("서랍이 잠겨 있다. 카드 정보를 아직 불러오는 중이다."), cast: null, endEffects: [] });
          return;
        }
        setDialogue({ node: buildExamineDialogue(target.text), cast: null, endEffects: [] });
        return;
      }
      // Pickups and the ball never reach here (the engine handles them without a dialogue); hand the keyboard back just in case.
      engineRef.current?.closeInteraction();
    },
    onPickup(id) {
      if (!store || !playerId) return;
      dispatch({ type: "pickup", id });
      const def = missionDefsFor(playerId).find((entry) => entry.kind === "collect" && entry.items.includes(id));
      if (def) {
        const progressText = describeProgress(def, undefined, store.save.collected);
        pushSequence([{ text: `${progressText}`, accent: "#5ad1ff" }]);
      }
    },
    onRunEvent: handleRunEvent,
    onZoneEnter(zone) {
      // The running-delivery timer shares this area of the stage with region notices.
      // Keep the timer readable while the player is racing between delivery targets.
      if (!engineRef.current?.isDeliveryRunning()) pushToast(zone.name, zone.tint, "region");
      if (store) playBgm(bgmFor("overworld", zone.bgm, store.save));
    },
    onSceneChange(scene) {
      setCurrentScene(scene);
      if (store && scene !== "overworld") playBgm(bgmFor(scene, undefined, store.save));
    },
    onDoorLocked(text) {
      pushToast(text, "#ff9a5a");
    },
    onBloomDone() {
      // The glow has settled: the King's change of heart and the call for the photo (cut 2 and 3).
      const cut = buildEndingDialogue();
      setEnding("dialogue");
      setDialogue({ node: cut.node, cast: null, endEffects: cut.endEffects });
    },
    onWalked(tiles) {
      advanceCoach({ type: "walked", tiles });
    },
    onLogKey() {
      audio.playSfx("ui-open");
      setLogOpen(true);
      advanceCoach({ type: "log" });
    },
    onOnAirClick(soopId, live) {
      // On air: their broadcast in a new tab. Off air: their station in a new window.
      openOnAirLink(soopId, live);
    },
    onDebugPick: setDebugPick,
  };

  const handleEngine = useCallback((next: WorldEngine | null) => {
    engineRef.current = next;
    setEngine(next);
  }, []);

  // The coach owns its step-two arrow; otherwise keep an on-screen/edge arrow on the tracked mission's real next objective.
  useEffect(() => {
    if (!engine || phase !== "play" || !save) {
      engine?.setNavigationTarget(null);
      return;
    }
    const position = engine.getState();
    const target = coachStep === 1
      ? navigationNpcTarget(save, "elder")
      : routeMissionTarget(missionObjectiveTarget(tracked, save, position, engine.getNavigationRuntime()), currentScene, save);
    engine.setNavigationTarget(target);
  }, [engine, phase, coachStep, tracked, save, currentScene, navigationRevision]);

  // One place decides whether the world may move: any panel that owns the keyboard blocks it.
  const photoOpen = ending === "photo" || framePhoto;
  const uiOpen = dialogue !== null || modal !== null || logOpen || pauseView !== "closed" || ending !== null || framePhoto;
  useEffect(() => {
    engine?.setUiBlocked(uiOpen);
  }, [engine, uiOpen]);

  // ── the ending (docs/world/02 §9) ────────────────────────────────────────────────────────
  // The showdown's completion sets `finale-won`; the cut then runs bloom → last words → photo → credits and only
  // its very end sets `ending-seen` (and opens the Weeder district). A world closed halfway through starts over from the bloom.
  const endingDue = phase === "play" && save !== null && endingPending(save);
  const busy = dialogue !== null || modal !== null || logOpen || pauseView !== "closed";
  useEffect(() => {
    if (!endingDue || ending !== null || busy || !engine) return;
    setEnding("bloom");
    playBgm(["ending", "stadium", "interior"]);
    preloadStingerImages();
    engine.playBloom();
  }, [endingDue, ending, busy, engine, playBgm]);

  /** The credits are over (or skipped): the post-credits stinger (docs/world/14) runs before the world comes back. */
  function beginStinger() {
    stingerStartedAt.current = performance.now();
    setEnding("stinger");
  }

  function finishEnding() {
    commit((current) => withEndingFlags(current));
    setEnding(null);
    // The stinger switched the ambience to its own night, machine and dawn loops: put the stadium back.
    audio.playAmbience(ambienceIdFor(engineRef.current?.getState().scene ?? "overworld", null));
    if (store) playBgm(bgmFor(engineRef.current?.getState().scene ?? "overworld", undefined, { shards: store.save.shards, flags: { ...store.save.flags, [ENDING_SEEN_FLAG]: true } }));
    pushSequence([
      { text: "제초동 구역의 문이 열렸어요! 남동쪽 게이트로 가 보세요", accent: "#00e9ae", sfx: "shard-restore" },
    ]);
  }

  // ── Esc ─────────────────────────────────────────────────────────────────────────────────

  const coachActive = phase === "play" && coachStep < COACH_DONE;
  const escapeRef = useRef<() => void>(() => {});
  escapeRef.current = () => {
    switch (resolveEscape({ phase, dialogueOpen: dialogue !== null, coachActive, modalOpen: modal !== null, pauseView, logOpen, photoOpen, ending, titleSettingsOpen })) {
      case "ignore":
        break;
      case "close-photo":
        if (ending === "photo") setEnding("credits");
        else setFramePhoto(false);
        break;
      case "skip-credits":
        beginStinger();
        break;
      case "skip-stinger":
        if (performance.now() - stingerStartedAt.current >= STINGER_SKIP_GUARD_MS) finishEnding();
        break;
      case "close-modal":
        closeModal();
        break;
      case "pause-back":
        audio.playSfx("ui-cancel");
        setPauseView("main");
        break;
      case "close-pause":
        audio.playSfx("ui-close");
        setPauseView("closed");
        break;
      case "close-log":
        audio.playSfx("ui-close");
        setLogOpen(false);
        break;
      case "close-dialogue":
        closeDialogue();
        break;
      case "skip-coach":
        coachRef.current = COACH_DONE;
        setCoachStep(COACH_DONE);
        if (store) store.save = { ...store.save, coachDone: true };
        break;
      case "open-pause":
        audio.playSfx("ui-open");
        setPauseView("main");
        break;
      case "back-to-title":
        setPhase("title");
        break;
      case "close-title-settings":
        audio.playSfx("ui-cancel");
        setTitleSettingsOpen(false);
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

  const changeSettings = (next: WorldSettings) => {
    setSettings(next);
    audio.setSettings(next);
    saveWorldSettings(next);
  };

  const restartGuide = () => {
    setPauseView("closed");
    coachRef.current = 0;
    setCoachStep(0);
    commit((current) => ({ ...current, coachDone: false }));
  };

  const playerCast = playerId ? getCast(playerId) : null;
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
          <TitleScreen
            ended={Boolean(savedGame?.flags["ending-seen"])}
            hasSave={savedGame !== null}
            audio={audio}
            settings={settings}
            onSettings={changeSettings}
            settingsOpen={titleSettingsOpen}
            onSettingsOpen={setTitleSettingsOpen}
            onContinue={startContinue}
            onNew={startNew}
            onExit={onClose}
            debug={debug}
          />
        )}
        {phase === "select" && <CharacterSelect audio={audio} onConfirm={confirmCharacter} onBack={() => setPhase("title")} />}
        {phase === "prologue" && pendingPlayer && (
          <Prologue playerName={getCast(pendingPlayer).displayName} audio={audio} onDone={finishPrologue} />
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
              onAir={onAir}
              eventsRef={eventsRef}
              onEngine={handleEngine}
              scaleLabel={`${layout.deviceScale}x device px (css ${layout.cssScale.toFixed(2)})`}
            />
            <Hud shards={session.store.save.shards} tracked={tracked} onOpenLog={() => {
              audio.playSfx("ui-open");
              setLogOpen(true);
              advanceCoach({ type: "log" });
            }} />
            <GoldBallCounter count={heldGoldenBalls(session.store.save)} />
            {!dialogue && !logOpen && pauseView === "closed" && <p className="world-hint">방향키/WASD 이동 · Shift 달리기 · E 상호작용 · J 미션 로그 · Esc 메뉴</p>}
            <CoachMarks step={coachStep} />
            <ToastLayer toasts={toasts} />
            {(ending === "bloom" || ending === "credits") && <EndingOverlay stage={ending} lines={FINALE_SCRIPT.credits} onDone={beginStinger} />}
            {ending === "stinger" && <StingerOverlay audio={audio} onDone={finishEnding} />}
            {dialogue && (
              <DialogueBox
                key={`${dialogue.cast ?? "object"}-${talkedTotal}`}
                node={dialogue.node}
                playerName={playerCast.displayName}
                audio={audio}
                showHint={talkedTotal <= HINT_CONVERSATIONS}
                onEffect={applyEffect}
                onClose={closeDialogue}
              />
            )}
            {logOpen && (
              <MissionLog
                views={views}
                trackedId={tracked?.def.id ?? null}
                audio={audio}
                onTrack={(id) => {
                  setTrackedId(id);
                  pushToast("트래커에 표시했어요");
                }}
                onClose={() => setLogOpen(false)}
              />
            )}
            {modal?.type === "daily" && (
              <DailyBoard
                save={save ?? session.store.save}
                audio={audio}
                onClaim={(date) => {
                  const before = session.store.save.daily.stamps.length;
                  commit((current) => claimDaily(current, date, Date.now()));
                  if (session.store.save.daily.stamps.length > before) {
                    dispatch({ type: "daily-claimed" });
                    pushSequence([{ text: "오늘의 스탬프를 받았어요!", sfx: "stamp" }]);
                  }
                }}
                onClose={closeModal}
              />
            )}
            {modal?.type === "minigame" && modal.game === "rush" && (
              <GrassRushModal player={save?.player ?? "janine95kim"} factory={modal.factory} best={save?.bests.rush} onClose={closeModal} onRoundEnd={handleRoundEnd} audio={audio} />
            )}
            {modal?.type === "collection" && <CollectionBook save={save ?? session.store.save} hiddenUnlocked={dashboard.woowakgoodUnlocked} audio={audio} onClose={closeModal} />}
            {pauseView !== "closed" && (
              <PauseMenu
                key={pauseView}
                view={pauseView}
                onView={setPauseView}
                settings={settings}
                onSettings={changeSettings}
                audio={audio}
                onResume={() => setPauseView("closed")}
                onLog={() => {
                  setPauseView("closed");
                  setLogOpen(true);
                }}
                onGuide={restartGuide}
                onNewGame={startNewFromMenu}
                onExit={onClose}
              />
            )}
          </>
        )}
      </div>
      {layout.frame && <GameFrame frame={layout.frame} />}
      {/* The minigames and the card popup keep their own fixed layers; outside the scaled stage they use real pixels. */}
      {phase === "play" && save && (
        <WorldModals
          modal={modal}
          save={save}
          dashboard={dashboard}
          onClose={closeModal}
          onRoundEnd={handleRoundEnd}
          onCardView={handleCardView}
          onSelectCard={(streamerId) => openModal({ type: "cards", streamerId })}
          audio={audio}
        />
      )}
      <button type="button" className="world-overlay__close" onClick={onClose} aria-label="월드 나가기">
        <X aria-hidden="true" />
      </button>
      {phase === "play" && photoOpen && (
        <GroupPhotoOverlay
          passedStreamers={dashboard.groupPhotoStreamers}
          sfxEnabled={dashboard.sfxEnabled}
          sfxVolume={dashboard.sfxVolume}
          onClose={() => (ending === "photo" ? setEnding("credits") : setFramePhoto(false))}
        />
      )}
      {debug && phase === "play" && (
        <DebugPanel
          engine={engine}
          scene={currentScene}
          pick={debugPick}
          save={save}
          onSave={(update) => {
            commit(update);
            engineRef.current?.cancelRuns();
          }}
        />
      )}
    </div>
  );
}
