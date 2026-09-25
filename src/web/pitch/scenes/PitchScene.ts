// The pitch (docs/pitch/02 §2·§3·§4·§6·§7, 03 §2). P2: run / sprint / dribble with the real sprites, HUD shell,
// control hints, focus notice, R reset. P3: Space three-step shot, the AI keeper, result / score / reset sequence and
// the ?pitchDebug=1 tools. P4: four skill moves (Z X C V) + the style gauge that drives the keeper's Tier, juice
// (camera shake, hit stop, confetti, sparkles, crowd bounce), sound and the lifetime stats. The character picker
// arrives in P5. Every asset is optional: a missing image is drawn as a plain shape.

import { getCharacter, resolveStoredCharacter, type PitchCharacter } from "../data/characters";
import { clipDef, frameAt, frameRect } from "../data/animations";
import { loadLoadout, type Loadout } from "../data/equipment";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import { kickSfx, type PitchSfxId } from "../audio/sfxMap";
import { createEffectPool, drawEffects } from "../engine/effects";
import { createParticlePool, particleProgress } from "../engine/particles";
import type { AssetImage, PitchAssets } from "../engine/assets";
import type { PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawEquippedFrame } from "../engine/equipment";
import { drawFrame, drawNineSlice, drawStripFrame } from "../engine/sprite";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { approach } from "../engine/tween";
import { ballArrived, ballSpinFrame, createBall, launchBall, releaseBall, resetBall, stepBall } from "../game/ball";
import {
  createKeeper,
  keeperPose,
  planSave,
  resetKeeper,
  resolveKeeper,
  startDive,
  stepKeeper,
  type SavePlan,
  type StyleTier,
} from "../game/keeper";
import { ballExit, beginFlight, createMatch, fadeAlpha, registerResult, resolveShot, stepMatch, type ShotResult } from "../game/match";
import { GATE, GATE_SCALE, GATE_SPAWN, gateDistance } from "../game/locker";
import { createPet, drawPet, resetPet, updatePet, type PetState } from "../game/pet";
import { createPlayer, playerPose, playerSpeed, resetPlayer, stepPlayer, type MoveInput } from "../game/player";
import { createRng, type Rng } from "../game/rng";
import {
  canCancelSkill,
  cancelSkill,
  consumeStyle,
  createSkills,
  resetSkills,
  skillForKey,
  skillHop,
  skillPose,
  startSkill,
  stepSkills,
  styleTierOf,
  type SkillId,
} from "../game/skills";
import { recordShot } from "../game/stats";
import { cancelShot, computeShot, createShot, pressShot, resetShot, stepShot, type ShotFlight } from "../game/shot";
import {
  DRIBBLE,
  DUST,
  GOAL,
  GOAL_SCREEN,
  goalScreenX,
  JUICE,
  KEEPER,
  MATCH,
  MOVE,
  PLAY_AREA,
  SHOOT_MAX_DISTANCE,
  SHOT,
  SKILLS,
  clamp,
  depthScale,
  type KeeperTuning,
  type ShotTuning,
} from "../game/tuning";
import { loadPitchSettings, loadPitchStats, savePitchSettings, savePitchStats, type PitchStats } from "../../storage";
import { CharacterSelectScene } from "./CharacterSelectScene";
import { drawPrompt } from "./hudCommon";
import { LockerScene, type PitchEnterParams } from "./LockerScene";
import { VolumePanel } from "../ui/volumePanel";
import { PitchDebug, pitchDebugEnabled } from "./pitchDebug";
import { drawAimBar, drawAimGuide, drawNetRipple, drawPowerBar, drawResultBanner, drawSweetRing, drawTooFar } from "./shotHud";
import { drawCallout, drawSkillLabel, drawStyleMeter, type CalloutKind } from "./styleHud";

export const DASHBOARD_BUTTON = { x: 732, y: 16, w: 212, h: 48 } as const;
export const CHANGE_BUTTON = { x: 732, y: 72, w: 212, h: 40 } as const;
export const SOUND_BUTTON = { x: 684, y: 20, w: 40, h: 40 } as const;
/** The art has 46px of empty margin on its left, so x = 16 − 46 puts the visible plate edge at x = 16 (same as the STREAK plate). */
export const SCOREBOARD = { x: -30, y: 16, w: 232, h: 64 } as const;
const HUD_LEFT = 16;
export const CHARACTER_PLATE = { x: 732, y: 118, w: 212, h: 24 } as const;
export const LEAVE_FADE_SECONDS = 0.2;
export const TOAST_SECONDS = 1.8;

type Rect = { x: number; y: number; w: number; h: number };
type ButtonId = "dashboard" | "change" | "sound";

const BUTTONS: ReadonlyArray<{ id: ButtonId; rect: Rect }> = [
  { id: "dashboard", rect: DASHBOARD_BUTTON },
  { id: "change", rect: CHANGE_BUTTON },
  { id: "sound", rect: SOUND_BUTTON },
];

// Visual goal placement: the posts stand on the end line of the pitch art. Gameplay coordinates (GOAL.lineY) stay as in 02.
const GOAL_SPRITE = { x: 330, y: 44 } as const;
/** The keeper stands in front of the net, so it is drawn after the goal's front layer (its x follows the keeper state). */
const KEEPER_FOOT_Y = GOAL_SCREEN.keeperY;
const TRAIL_LENGTH = 8;
const TRAIL_INTERVAL = 0.018;

/** The far corner arcs in the pitch art: flag foot positions. */
const FLAG_CORNERS_X = [180, 781] as const;
const FLAG_FOOT_Y = 112;

/** Height of the stands in the pitch art: the strip that bounces with the crowd. */
const STANDS_HEIGHT = 72;
const CONFETTI_COLORS = ["#ffd23f", "#3ee6c1", "#ff4d6d", "#f7f7ff", "#5aa9ff"] as const;

/** A skill key pressed this early before the previous move may end is not lost. */
const SKILL_BUFFER_SECONDS = 1.2;

const KEY_CAPTIONS: Readonly<Record<string, string>> = { "key-shift": "SHIFT", "key-space-up": "SPACE" };
/** The control-hint row keeps its bottom spot; the locker-room gate (tile y 316~482) stands on top of it. */
const HINT_ROW_Y = 490;
const HINT_LEFT = 16;
const HINT_ITEMS: ReadonlyArray<{ keys: readonly string[]; label: string }> = [
  { keys: ["key-arrow-left", "key-arrow-up", "key-arrow-down", "key-arrow-right"], label: "이동" },
  { keys: ["key-shift"], label: "스프린트" },
  { keys: ["key-space-up"], label: "슛(조준→파워)" },
  { keys: ["Z", "X", "C", "V"], label: "개인기" },
  { keys: ["R"], label: "리셋" },
];

export function pointInRect(rect: Rect, x: number, y: number) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

const pad2 = (n: number) => String(Math.max(0, Math.min(99, n))).padStart(2, "0");

/** What survives a trip through the locker room (the next `PitchScene` is a new instance). */
interface PitchCarry {
  match: { goals: number; saves: number; streak: number; bestStreak: number; shots: number };
  hintsVisible: boolean;
}
let carry: PitchCarry | null = null;

export class PitchScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private character: PitchCharacter = getCharacter("");
  private readonly player = createPlayer();
  private readonly ball = createBall();
  private readonly dust = createParticlePool(DUST.capacity);
  private dustClock = 0;
  private dustSeed = 0;
  private clock = 0;
  /** Control hints stay on until H hides them. */
  private hintsVisible = true;
  private toast: { text: string; left: number } | null = null;
  private muted = false;

  // P3: shot, keeper and match state. `match` owns the score (GOAL / SAVE / STREAK).
  private readonly shot = createShot();
  private readonly keeper = createKeeper();
  private readonly match = createMatch();
  private rng: Rng = Math.random;
  private shotTuning: ShotTuning = { ...SHOT };
  private keeperTuning: KeeperTuning = { ...KEEPER };
  private flight: ShotFlight | null = null;
  private plan: SavePlan | null = null;
  /** Seconds since the kick (drives the kick clip), or null. */
  private kickClock: number | null = null;
  private tooFarAge: number = MATCH.tooFarSeconds;
  private celebrate: "celebrate_a" | "celebrate_b" = "celebrate_a";
  private ballInNet = false;
  private rippleAge = 1;
  private readonly trail: number[] = [];
  private trailClock = 0;
  private debug: PitchDebug | null = null;

  // P4: skills + style gauge, sound, juice, lifetime stats.
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly skills = createSkills();
  private stats: PitchStats = loadPitchStats();
  /** Gauge value on screen (chases the real one so the meter fills smoothly). */
  private styleShown = 0;
  private callout: { kind: CalloutKind; age: number } | null = null;
  private skillLabel: { text: string; color: string; age: number } | null = null;
  private readonly effects = createEffectPool(24);
  private readonly confetti = createParticlePool(JUICE.confetti);
  private shakeAge = 1;
  private shakeDuration = 1;
  private shakeAmp = 0;
  private hitstop = 0;
  private crowd: { kind: "cheer" | "groan"; age: number } | null = null;
  /** Cosmetic randomness (confetti, jitter) is kept apart from `rng` so effects never change a seeded game. */
  private fxSeed = 12345;
  // sound bookkeeping: what the previous frame looked like
  private prevShotPhase = this.shot.phase;
  private prevBallMode = this.ball.mode;
  private prevSprinting = false;
  private lastRunFrame = -1;
  private stepFlip = false;
  private aimTickIndex = 0;
  /** Seconds until the keeper's dive sound (its reaction delay), or null. */
  private diveSoundIn: number | null = null;
  /** A skill key pressed while a move or its cooldown was running: fires as soon as it may (input buffer). */
  private queuedSkill: { id: SkillId; age: number } | null = null;

  // P6: locker-room gate.
  /** Within the gate's prompt radius (the gate opens). */
  private gateNear = false;
  /** Within the preload radius (glow + arrow, the locker assets are fetched). */
  private gateApproach = false;
  private lockerRequested = false;

  private volume: VolumePanel | null = null;
  private hovered: ButtonId | null = null;
  private pressed: ButtonId | null = null;
  /** Seconds left of the fade-out before switching to the dashboard; null while not leaving. */
  private leaving: number | null = null;

  private staticLayer: HTMLCanvasElement | null = null;
  private readonly order = [0, 1, 2, 3];
  private readonly sortY = [0, 0, 0, 0];
  /** What the current character wears and its pet (docs/pitch/13); items and pet are visual only. */
  private loadout: Loadout = {};
  private readonly pet: PetState = createPet(0, 0);

  enter(ctx: SceneCtx, params?: unknown) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.character = resolveStoredCharacter();
    this.refreshLook();
    const settings = loadPitchSettings();
    this.muted = !settings.sfxOn && !settings.musicOn;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    this.audio.setSettings(settings);
    this.audio.playBgm("pitch");
    this.volume = new VolumePanel({
      audio: this.audio,
      setCursor: (kind) => ctx.host.setCursor(kind),
      onChange: (s) => void (this.muted = !s.sfxOn && !s.musicOn),
    });
    this.stats = loadPitchStats();
    if (pitchDebugEnabled()) this.debug = new PitchDebug(this.shotTuning, this.keeperTuning);
    if ((params as PitchEnterParams | undefined)?.fromLocker) this.arriveFromLocker();
    carry = null;
  }

  /** Back from the locker room: the score and hint state carry over and the player stands in front of the gate, ball at the feet. */
  private arriveFromLocker() {
    if (carry) {
      Object.assign(this.match, carry.match);
      this.hintsVisible = carry.hintsVisible;
    }
    Object.assign(this.player, createPlayer(GATE_SPAWN.x, GATE_SPAWN.y));
    this.player.fx = 1;
    this.player.fy = 0;
    resetPet(this.pet, GATE_SPAWN.x, GATE_SPAWN.y);
    Object.assign(this.ball, createBall(GATE_SPAWN.x + DRIBBLE.touchDistance, GATE_SPAWN.y));
    this.gateNear = gateDistance(GATE_SPAWN.x, GATE_SPAWN.y) <= GATE.promptRadius;
    this.lockerRequested = true;
  }

  /** Test hook: fixes the random source (the game uses Math.random). */
  setRng(rng: Rng | number) {
    this.rng = typeof rng === "number" ? createRng(rng) : rng;
  }

  /** The keeper Tier the style gauge stands for (02 §5); the debug panel's T key overrides it while raised. */
  private styleTier(): StyleTier {
    const forced = this.debug?.tier ?? 0;
    return forced > 0 ? (forced as StyleTier) : styleTierOf(this.skills);
  }

  private reduced() {
    return this.ctx?.host.reducedMotion?.() ?? false;
  }

  /** Cheap deterministic 0..1 for cosmetic effects. */
  private fxRand() {
    this.fxSeed = (this.fxSeed * 1103515245 + 12345) & 0x7fffffff;
    return (this.fxSeed % 10000) / 10000;
  }

  exit() {
    this.audio.stopSfx("power-charge");
    this.ctx?.host.setCursor("default");
    this.staticLayer = null;
  }

  // ---- update ----

  update(dt: number) {
    this.volume?.update(dt);
    this.clock += dt;
    if (this.toast) {
      this.toast.left -= dt;
      if (this.toast.left <= 0) this.toast = null;
    }

    if (this.leaving !== null) {
      this.leaving -= dt;
      if (this.leaving <= 0) {
        this.leaving = null;
        this.ctx?.host.goDashboard();
      }
    }

    this.tickJuice(dt);
    // hit stop: the simulation freezes for a few frames on a goal
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return;
    }

    const drove = this.updateSkills(dt);
    this.flushQueuedSkill(dt);
    if (!drove) stepPlayer(this.player, this.readMoveInput(), dt);
    stepBall(this.ball, this.player, dt);
    this.updateShot(dt);
    this.emitDust(dt);
    this.dust.update(dt, 3);
    updatePet(this.pet, this.player, dt, Math.abs(this.player.fx) > 0.3 ? Math.sign(this.player.fx) : 0);
    this.syncAudio();
    this.updateGate();
  }

  /** Reads the saved loadout of the current character, fetches its pet art and puts the pet next to the player. */
  private refreshLook() {
    this.loadout = loadLoadout(this.character.id);
    resetPet(this.pet, this.player.x, this.player.y);
    if (this.loadout.pet) void this.assets?.loadGroup?.(`pets:${this.character.id}`)?.catch?.(() => undefined);
  }

  /** Gate proximity: opens the gate, and the first time the player gets within the preload radius the locker assets are fetched. */
  private updateGate() {
    const distance = gateDistance(this.player.x, this.player.y);
    this.gateNear = distance <= GATE.promptRadius;
    this.gateApproach = distance < GATE.preloadRadius;
    if (!this.gateApproach || this.lockerRequested) return;
    this.lockerRequested = true;
    const assets = this.assets;
    if (!assets || typeof assets.loadGroup !== "function" || assets.has?.("env/locker-bg")) return;
    assets.loadGroup("locker").catch(() => undefined);
  }

  /** The `E 락커룸` prompt: at the gate, with nothing else going on (no shot, skill, result or transition). */
  private gatePromptVisible() {
    return this.gateNear && this.inputLive() && this.shot.phase === "idle" && this.skills.active === null;
  }

  /** E / Enter at the gate: wipe into the locker room. */
  private enterLocker() {
    const ctx = this.ctx;
    if (!ctx || !this.gatePromptVisible()) return;
    this.audio.playSfx("gate-open");
    this.audio.playSfx("transition-wipe");
    carry = { match: { goals: this.match.goals, saves: this.match.saves, streak: this.match.streak, bestStreak: this.match.bestStreak, shots: this.match.shots }, hintsVisible: this.hintsVisible };
    ctx.manager.replace(new LockerScene({ createPitch: () => new PitchScene() }), undefined, { transition: "wipe" });
  }

  /** Real-time animation timers (they run through the hit stop). */
  private tickJuice(dt: number) {
    this.shakeAge += dt;
    if (this.callout) {
      this.callout.age += dt;
      if (this.callout.age >= JUICE.calloutSeconds) this.callout = null;
    }
    if (this.skillLabel) {
      this.skillLabel.age += dt;
      if (this.skillLabel.age >= JUICE.skillLabelSeconds) this.skillLabel = null;
    }
    if (this.crowd) {
      this.crowd.age += dt;
      if (this.crowd.age >= JUICE.crowdFlashSeconds) this.crowd = null;
    }
    this.styleShown = approach(this.styleShown, this.skills.style, Math.max(60, Math.abs(this.skills.style - this.styleShown) * 6) * dt);
    this.effects.update(dt);
    this.confetti.update(dt, 0.6);
    for (const piece of this.confetti.items) if (piece.active) piece.vy += 320 * dt;
  }

  /** Steps the skill state; returns true when a move's slide drove the player this frame (the keys are then ignored). */
  private updateSkills(dt: number): boolean {
    const s = this.skills;
    const travelling = s.active !== null && !s.whiff;
    // the gauge holds while a shot is being taken or is in the air (aiming must not cost style)
    stepSkills(s, dt, this.shot.phase !== "idle" || this.match.phase !== "play");
    if (!travelling) return false;
    // the move's slide: position from the script, velocity from the step so the ball's spring follows the moving frame
    const p = this.player;
    const nx = clamp(p.x + s.stepX, PLAY_AREA.minX, PLAY_AREA.maxX);
    const ny = clamp(p.y + s.stepY, PLAY_AREA.minY, PLAY_AREA.maxY);
    p.vx = nx === p.x + s.stepX ? s.stepX / dt : 0;
    p.vy = ny === p.y + s.stepY ? s.stepY / dt : 0;
    p.x = nx;
    p.y = ny;
    p.sprinting = false;
    p.idleTime = 0;
    p.runPhase = 0;
    return true;
  }

  private updateShot(dt: number) {
    const { shot, ball, keeper, match } = this;
    this.tooFarAge += dt;
    this.rippleAge += dt;
    if (this.kickClock !== null) this.kickClock += dt;

    if (this.diveSoundIn !== null) {
      this.diveSoundIn -= dt;
      if (this.diveSoundIn <= 0) {
        this.diveSoundIn = null;
        this.audio.playSfx("keeper-dive");
      }
    }

    if (shot.phase === "aim" || shot.phase === "power") {
      // the ball must stay at the player's feet while aiming (R or a stray touch cancels)
      if (ball.mode !== "carried") cancelShot(shot);
      else stepShot(shot, dt, this.shotTuning);
    }

    const looking = ball.mode === "carried" || ball.mode === "loose" ? ball.x : GOAL.centerX;
    stepKeeper(keeper, dt, match.phase === "play" ? looking : GOAL.centerX, this.rng, this.keeperTuning);

    if (match.phase === "flight") {
      this.stepTrail(dt);
      if (ballArrived(ball) && this.flight && this.plan) this.finishShot(this.flight, this.plan);
    }
    if (stepMatch(match, dt) === "reset") this.resetPitch();
  }

  private stepTrail(dt: number) {
    this.trailClock += dt;
    while (this.trailClock >= TRAIL_INTERVAL) {
      this.trailClock -= TRAIL_INTERVAL;
      this.trail.push(this.ball.x, this.ball.y - this.ball.z);
      if (this.trail.length > TRAIL_LENGTH * 2) this.trail.splice(0, 2);
    }
  }

  /** The ball reached the goal plane: decide the result, tell the keeper, and send the ball on its way. */
  private finishShot(flight: ShotFlight, plan: SavePlan) {
    const { ball, keeper, match } = this;
    const result = resolveShot(flight, plan, this.debug?.forced ?? undefined);
    registerResult(match, result);
    resolveKeeper(keeper, result.outcome);
    const exit = ballExit(result, plan, ball.vx, ball.vy, this.rng);
    releaseBall(ball, exit.vx, exit.vy, exit.vz);
    this.ballInNet = exit.inNet;
    if (result.outcome === "GOAL") {
      this.rippleAge = 0;
      this.celebrate = this.rng() < 0.5 ? "celebrate_a" : "celebrate_b";
    }
    this.onShotResult(result);
  }

  /** Every result funnels through here: sound, camera shake, hit stop, effects and the stats save (02 §7). */
  private onShotResult(result: ShotResult) {
    const a = this.audio;
    a.playSfx("banner-in");
    switch (result.outcome) {
      case "GOAL":
        a.playSfx("net-hit");
        a.playSfx("goal-cheer");
        if (result.sweet || this.match.streak >= 3) a.playSfx("celebrate");
        if (result.sweet) a.playSfx("goal-horn");
        this.startShake(JUICE.goalShake, JUICE.goalShakeSeconds);
        this.hitstop = JUICE.goalHitstop;
        this.crowd = { kind: "cheer", age: 0 };
        this.burstConfetti(result.sweet);
        break;
      case "SAVE":
        a.playSfx(result.detail === "PUNCH" ? "save-punch" : result.detail === "DEFLECT" ? "save-deflect" : "save-glove");
        a.playSfx("save-groan");
        this.crowd = { kind: "groan", age: 0 };
        this.effects.spawn({ key: "fx/fx-save-sparkle", frames: 4, x: goalScreenX(this.keeper.x), y: KEEPER_FOOT_Y - 12, vy: -10, life: 0.55, scale: 1.2, color: "#3ee6c1" });
        break;
      case "POST":
        a.playSfx("post-hit");
        a.playSfx("save-groan", 0.6);
        this.startShake(JUICE.postShake, JUICE.postShakeSeconds);
        break;
      case "BAR":
        a.playSfx("bar-hit");
        a.playSfx("save-groan", 0.6);
        this.startShake(JUICE.postShake, JUICE.postShakeSeconds);
        break;
      default:
        a.playSfx("miss-whoosh");
    }
    this.stats = recordShot(this.stats, result.outcome, this.match.bestStreak);
    savePitchStats(this.stats);
  }

  private startShake(amplitude: number, seconds: number) {
    if (this.reduced()) return;
    this.shakeAge = 0;
    this.shakeDuration = seconds;
    this.shakeAmp = amplitude;
  }

  /** Confetti over the goal (art bursts + falling pieces); a sweet-spot goal adds fireworks and light rays. */
  private burstConfetti(sweet: boolean) {
    const cx = GOAL_SPRITE.x + 150;
    const top = GOAL_SPRITE.y + 30;
    for (let i = 0; i < 3; i++) {
      this.effects.spawn({ key: "fx/fx-confetti", frames: 4, x: cx - 60 + i * 60, y: top + 20, vy: -30 - this.fxRand() * 20, life: 0.65 + this.fxRand() * 0.25, scale: 1.4, color: "#ffd23f" });
    }
    if (sweet) {
      this.effects.spawn({ key: "fx/fx-rays", frames: 4, x: cx, y: top + 60, life: 0.8, scale: 2, color: "#ffd23f" });
      this.effects.spawn({ key: "fx/fx-firework", frames: 4, x: cx - 210, y: top + 30, vy: -20, life: 0.9, scale: 1.6, color: "#ffd23f" });
      this.effects.spawn({ key: "fx/fx-firework", frames: 4, x: cx + 210, y: top + 30, vy: -20, life: 0.9, scale: 1.6, color: "#3ee6c1" });
    }
    for (let i = 0; i < JUICE.confetti; i++) {
      const angle = -Math.PI / 2 + (this.fxRand() - 0.5) * 2.2;
      const speed = 90 + this.fxRand() * 190;
      this.confetti.emit(cx + (this.fxRand() - 0.5) * 120, top, Math.cos(angle) * speed, Math.sin(angle) * speed, 1.1 + this.fxRand() * 0.9, 0.6 + this.fxRand() * 0.8);
    }
  }

  /** Input is live: not in a result sequence, a fade-out or a scene transition. */
  private inputLive() {
    return this.match.phase === "play" && this.leaving === null && this.ctx?.manager.transitionProgress == null;
  }

  /** The ball is at the feet and within shooting range. */
  private shotInRange() {
    const { ball } = this;
    return ball.mode === "carried" && Math.hypot(ball.x - GOAL.centerX, ball.y - GOAL.lineY) <= SHOOT_MAX_DISTANCE;
  }

  /** Space: cuts a skill move short in its last 0.15s (02 §5), otherwise takes the next shot step. */
  private onSpace() {
    if (this.skills.active !== null) {
      if (!this.inputLive() || !canCancelSkill(this.skills) || !this.shotInRange()) return;
      cancelSkill(this.skills);
      this.player.vx = 0;
      this.player.vy = 0;
    }
    this.tryShotPress();
  }

  private tryShotPress() {
    const { shot, ball, player } = this;
    if (!this.inputLive()) return;
    if (shot.phase === "idle") {
      if (ball.mode !== "carried") return;
      if (!this.shotInRange()) {
        this.tooFarAge = 0;
        this.audio.playSfx("too-far");
        return;
      }
      pressShot(shot);
      // turn toward the goal and stop: the player is frozen for the whole shot
      player.fx = 0;
      player.fy = -1;
      return;
    }
    if (pressShot(shot) === "release") this.kick();
  }

  private kick() {
    const { shot, ball, keeper, match } = this;
    const flight = computeShot({ ballX: ball.x, ballY: ball.y, aim: shot.aim, power: shot.power }, this.rng, this.shotTuning);
    // the gauge is read for this kick and emptied right away (02 §5)
    const tier = this.styleTier();
    consumeStyle(this.skills);
    const plan = planSave(flight, keeper.x, tier, this.rng, this.keeperTuning, keeper.hesitateLeft);
    const a = this.audio;
    a.stopSfx("power-charge");
    a.playSfx("power-lock");
    a.playSfx(kickSfx(flight.power));
    if (flight.sweet) {
      a.playSfx("power-sweet");
      this.effects.spawn({ key: "fx/fx-star", frames: 4, x: ball.x, y: ball.y - 14, vy: -25, life: 0.5, scale: 1, color: "#ffd23f" });
      this.effects.spawn({ key: "fx/fx-sweet", frames: 4, x: ball.x, y: ball.y - 10, vy: -40, life: 0.6, scale: 2, color: "#ffd23f" });
    }
    this.diveSoundIn = plan.mode === "dive" ? plan.reactDelay : null;
    this.flight = flight;
    this.plan = plan;
    this.kickClock = 0;
    this.trail.length = 0;
    this.trailClock = 0;
    this.ballInNet = false;
    launchBall(ball, flight, this.shotTuning.arc);
    startDive(keeper, plan);
    beginFlight(match);
  }

  private tryStartSkill(id: SkillId) {
    if (!this.inputLive() || this.shot.phase !== "idle") return;
    const { player, ball } = this;
    const start = startSkill(this.skills, id, ball.mode === "carried", player.fx, player.fy);
    if (!start) {
      this.queuedSkill = { id, age: 0 };
      return;
    }
    this.queuedSkill = null;
    const def = SKILLS[id];
    this.audio.playSfx(`skill-${id}` as PitchSfxId);
    if (start.whiff) {
      this.skillLabel = { text: "볼이 없어요", color: TEXT_COLORS.coral, age: 0 };
      return;
    }
    const bonus = start.chained ? " x1.5" : start.repeated ? " x0.5" : "";
    this.skillLabel = { text: `${def.label} +${Math.round(start.gain)}${bonus}`, color: start.chained ? TEXT_COLORS.gold : TEXT_COLORS.base, age: 0 };
    this.audio.playSfx("style-gain");
    this.skillEffect(id);
    if (start.tierAfter > start.tierBefore) {
      this.audio.playSfx("style-tier");
      this.callout = { kind: start.tierAfter === 2 ? "PERFECT" : "STYLE", age: 0 };
      this.effects.spawn({ key: "fx/fx-star", frames: 4, x: player.x, y: player.y - 60, vy: -30, life: 0.6, scale: 1.4, color: "#ffd23f" });
    }
  }

  private flushQueuedSkill(dt: number) {
    const q = this.queuedSkill;
    if (!q) return;
    q.age += dt;
    if (q.age > SKILL_BUFFER_SECONDS || this.shot.phase !== "idle" || this.match.phase !== "play") this.queuedSkill = null;
    else if (this.skills.active === null && this.skills.cooldown <= 0) this.tryStartSkill(q.id);
  }

  /** Each move leaves its own mark so they read differently at a glance. */
  private skillEffect(id: SkillId) {
    const { x, y } = this.player;
    switch (id) {
      case "stepover":
        for (let i = 0; i < 4; i++) this.dust.emit(x + (this.fxRand() - 0.5) * 24, y - 1, (this.fxRand() - 0.5) * 60, -14, DUST.life, 0.8);
        break;
      case "roulette":
        this.effects.spawn({ key: "fx/fx-grass", frames: 4, x, y: y + 2, life: 0.55, scale: 1.2, color: "#7ddc6a" });
        break;
      case "rainbow":
        this.effects.spawn({ key: "fx/fx-star", frames: 4, x, y: y - 76, vy: -20, life: 0.6, scale: 1, color: "#ffd23f" });
        break;
      default:
        this.effects.spawn({ key: "fx/fx-speed", frames: 4, x: x - this.player.fx * 18, y: y + 2, life: 0.4, scale: 1, color: "#3ee6c1" });
    }
  }

  /** Footsteps, touches, sprint and the ball's state changes, judged by what changed since the previous frame. */
  private syncAudio() {
    const { player: p, ball, shot, audio: a } = this;

    // steps at the two foot contacts of the 6-frame run cycle, a touch on the frames in between
    if (this.skills.active === null && playerSpeed(p) >= MOVE.runSpeed * 0.5) {
      const frame = Math.floor(p.runPhase);
      if (frame !== this.lastRunFrame) {
        this.lastRunFrame = frame;
        const f = frame % 6;
        if (f === 0 || f === 3) {
          this.stepFlip = !this.stepFlip;
          a.playSfx(this.stepFlip ? "step-grass-a" : "step-grass-b");
        } else if ((f === 1 || f === 4) && ball.mode === "carried") a.playSfx("ball-touch");
      }
    } else this.lastRunFrame = -1;
    if (p.sprinting && !this.prevSprinting) a.playSfx("sprint-start");
    this.prevSprinting = p.sprinting;

    if (this.match.phase === "play") {
      if (ball.mode === "loose" && this.prevBallMode === "carried") a.playSfx("ball-loose");
      else if (ball.mode === "carried" && this.prevBallMode === "loose") a.playSfx("ball-trap");
      else if (ball.mode === "dead" && this.prevBallMode === "loose") a.playSfx("ball-out");
    }
    this.prevBallMode = ball.mode;

    // shot stages: aim start / tick / lock, the power-charge rise, cancel
    if (shot.phase !== this.prevShotPhase) {
      if (shot.phase === "aim") {
        a.playSfx("aim-start");
        this.aimTickIndex = 0;
      } else if (shot.phase === "power") {
        a.playSfx("aim-lock");
        a.playSfx("power-charge");
      } else if (shot.phase === "idle" && (this.prevShotPhase === "aim" || this.prevShotPhase === "power")) {
        a.stopSfx("power-charge");
        a.playSfx("ui-back");
      }
      this.prevShotPhase = shot.phase;
    }
    if (shot.phase === "aim") {
      // one tick each time the arrow turns around at either end of its sweep
      const index = Math.floor(shot.elapsed / (this.shotTuning.aimSeconds / 2) + 0.5);
      if (index > this.aimTickIndex) {
        this.aimTickIndex = index;
        a.playSfx("aim-tick");
      }
    }
  }

  private readMoveInput(): MoveInput {
    const host = this.ctx?.host;
    // No movement while a transition covers the screen or the scene is fading out.
    if (!host || this.leaving !== null || this.ctx?.manager.transitionProgress != null) return { dx: 0, dy: 0, sprint: false };
    // aiming, powering, the flight and the result sequence all freeze the player
    if (this.shot.phase !== "idle" || this.match.phase !== "play" || this.skills.active !== null) return { dx: 0, dy: 0, sprint: false };
    const down = (code: string) => (host.input.isDown(code) ? 1 : 0);
    return {
      dx: down("ArrowRight") - down("ArrowLeft"),
      dy: down("ArrowDown") - down("ArrowUp"),
      sprint: host.input.isDown("ShiftLeft") || host.input.isDown("ShiftRight"),
    };
  }

  private emitDust(dt: number) {
    const p = this.player;
    const speed = playerSpeed(p);
    if (speed < MOVE.runSpeed * 0.5) {
      this.dustClock = 0;
      return;
    }
    this.dustClock += dt;
    const interval = p.sprinting ? DUST.sprintInterval : DUST.runInterval;
    while (this.dustClock >= interval) {
      this.dustClock -= interval;
      // cheap deterministic jitter, no per-frame allocation
      this.dustSeed = (this.dustSeed * 1103515245 + 12345) & 0x7fffffff;
      const r = (this.dustSeed % 1000) / 1000 - 0.5;
      const size = p.sprinting ? 1 : 0.65;
      this.dust.emit(p.x - p.fx * 6 + r * 8, p.y - 1, -p.vx * 0.12 + r * 20, -p.vy * 0.12 - 10, DUST.life, size);
    }
  }

  /** Player, ball, keeper and shot back to their spots. The score stays. */
  private resetPitch() {
    resetPlayer(this.player);
    resetBall(this.ball);
    resetKeeper(this.keeper);
    resetShot(this.shot);
    resetSkills(this.skills);
    this.queuedSkill = null;
    this.styleShown = 0;
    this.prevShotPhase = "idle";
    this.prevBallMode = "carried";
    this.prevSprinting = false;
    this.lastRunFrame = -1;
    this.diveSoundIn = null;
    this.effects.clear();
    this.confetti.clear();
    this.flight = null;
    this.plan = null;
    this.kickClock = null;
    this.ballInNet = false;
    this.trail.length = 0;
    this.dust.clear();
    this.dustClock = 0;
  }

  /** R: same, and it also abandons a shot that is still in flight or showing its result. */
  private hardReset() {
    this.resetPitch();
    resetPet(this.pet, this.player.x, this.player.y);
    const m = this.match;
    m.phase = "play";
    m.timer = 0;
    m.result = null;
  }

  private showToast(text: string) {
    this.toast = { text, left: TOAST_SECONDS };
  }

  private toggleMute() {
    this.muted = !this.muted;
    const next = { ...loadPitchSettings(), sfxOn: !this.muted, musicOn: !this.muted };
    savePitchSettings(next);
    this.audio.setSettings(next);
    // the click that turns sound back on is the first thing heard
    if (!this.muted) this.audio.playSfx("ui-click");
  }

  // ---- input ----

  onKey(e: { code: string }) {
    if (this.leaving !== null) return;
    if (this.debug?.onKey(e.code)) return;
    if (this.volume?.key(e.code)) return;
    switch (e.code) {
      case "Space":
        this.onSpace();
        break;
      case "Escape":
        cancelShot(this.shot);
        break;
      case "KeyR":
        this.hardReset();
        break;
      case "KeyM":
        this.toggleMute();
        break;
      case "KeyH":
        this.hintsVisible = !this.hintsVisible;
        break;
      case "Backspace":
        // keyboard-only way out (Tab is used by the game, so the DOM skip link is not reachable from the canvas)
        this.leave();
        break;
      case "Tab":
        this.onButton("change");
        break;
      case "KeyE":
      case "Enter":
      case "NumpadEnter":
        this.enterLocker();
        break;
      default: {
        const skill = skillForKey(e.code);
        if (skill) this.tryStartSkill(skill);
      }
    }
  }

  private buttonAt(x: number, y: number): ButtonId | null {
    for (const button of BUTTONS) if (pointInRect(button.rect, x, y)) return button.id;
    return null;
  }

  private onButton(id: ButtonId) {
    if (id === "dashboard") this.leave();
    else if (id === "sound") this.toggleMute();
    else this.openSelect();
  }

  /** Character select overlay (P5). The pitch pauses underneath; a shot being aimed is dropped, not resumed. */
  private openSelect() {
    const ctx = this.ctx;
    if (!ctx || this.leaving !== null || ctx.manager.transitionProgress !== null) return;
    cancelShot(this.shot);
    this.audio.stopSfx("power-charge");
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    ctx.manager.push(new CharacterSelectScene({ currentId: this.character.id, onApply: (character) => this.setCharacter(character) }));
  }

  /** Swaps the playable character (its `char:<id>` group is already loaded). Ball, keeper, skills and effects reset; the score stays. */
  setCharacter(character: PitchCharacter) {
    this.character = character;
    this.hardReset();
    this.refreshLook();
  }

  private leave() {
    if (this.leaving !== null || !this.ctx) return;
    if (this.ctx.manager.transitionProgress !== null) return;
    this.audio.playSfx("mode-switch");
    this.leaving = LEAVE_FADE_SECONDS;
  }

  onPointer(e: PointerInput) {
    if (this.leaving !== null) return;
    if (this.volume?.pointer(e)) return;
    const hover = this.buttonAt(e.x, e.y);
    if (hover !== this.hovered) {
      if (hover) this.audio.playSfx("ui-hover");
      this.hovered = hover;
      this.ctx?.host.setCursor(hover ? "pointer" : "default");
    }
    if (e.type === "down") this.pressed = hover;
    if (e.type === "up") {
      const clicked = this.pressed;
      this.pressed = null;
      if (clicked && clicked === hover) this.onButton(clicked);
    }
  }

  // ---- render ----

  /** Camera shake offset for the world layers (the HUD stays put). Zero once the shake is over or motion is reduced. */
  private shakeOffset(out: { x: number; y: number }) {
    out.x = 0;
    out.y = 0;
    if (this.shakeAge >= this.shakeDuration) return;
    const fall = 1 - this.shakeAge / this.shakeDuration;
    out.x = Math.round(Math.sin(this.shakeAge * 90) * this.shakeAmp * fall);
    out.y = Math.round(Math.cos(this.shakeAge * 130) * this.shakeAmp * 0.6 * fall);
  }

  private readonly shakeTmp = { x: 0, y: 0 };

  render(g: CanvasRenderingContext2D) {
    this.shakeOffset(this.shakeTmp);
    g.save();
    g.translate(this.shakeTmp.x, this.shakeTmp.y);
    this.drawWorld(g);
    g.restore();
    this.drawHud(g);
    this.volume?.draw(g);

    const fade = Math.max(this.leaving !== null ? Math.min(1, 1 - this.leaving / LEAVE_FADE_SECONDS) : 0, fadeAlpha(this.match));
    if (fade > 0) {
      g.save();
      g.globalAlpha = fade;
      g.fillStyle = "#05060f";
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      g.restore();
    }
  }

  private drawWorld(g: CanvasRenderingContext2D) {
    this.drawStaticLayer(g);
    this.drawCrowd(g);
    this.drawCornerFlags(g);
    this.drawGate(g);
    this.drawDust(g);
    // a ball that ended up in the net lies under the front netting
    if (this.ballInNet) {
      this.drawBallShadow(g);
      this.drawBall(g);
    }
    this.drawGoalFront(g);
    drawNetRipple(g, (key) => this.image(key), this.rippleAge, GOAL_SPRITE.x, GOAL_SPRITE.y);
    this.drawActors(g);
    drawEffects(g, this.effects, (key) => this.image(key));
    this.drawConfetti(g);
    this.drawAimGuide(g);
    this.debug?.draw(g, { player: this.player, ball: this.ball, keeper: this.keeper, flight: this.flight, plan: this.plan });
  }

  /** The stands jump on a goal and sag on a save (the static layer's top strip is redrawn shifted). Skipped for reduced motion. */
  private drawCrowd(g: CanvasRenderingContext2D) {
    const crowd = this.crowd;
    if (!crowd || this.reduced() || !this.staticLayer) return;
    const t = crowd.age / JUICE.crowdFlashSeconds;
    const dy = crowd.kind === "cheer" ? -Math.round(Math.abs(Math.sin(t * Math.PI * 3)) * 3) : Math.round(Math.sin(t * Math.PI) * 2);
    if (dy === 0) return;
    g.drawImage(this.staticLayer, 0, 0, LOGICAL_WIDTH, STANDS_HEIGHT, 0, dy, LOGICAL_WIDTH, STANDS_HEIGHT);
    if (crowd.kind === "groan") {
      g.save();
      g.globalAlpha = 0.18 * Math.sin(t * Math.PI);
      g.fillStyle = "#05060f";
      g.fillRect(0, 0, LOGICAL_WIDTH, STANDS_HEIGHT);
      g.restore();
    }
  }

  /** Corner flags at the two far corner arcs of the pitch art; they wave while the crowd cheers (P7, 05 §6 E4). Positions are by eye. */
  private drawCornerFlags(g: CanvasRenderingContext2D) {
    const still = this.image("env/flag");
    if (!still) return;
    const waving = this.crowd?.kind === "cheer" && !this.reduced() && Math.floor(this.clock / 0.15) % 2 === 0;
    const flag = (waving ? this.image("env/flag-wave") : undefined) ?? still;
    for (const cornerX of FLAG_CORNERS_X) g.drawImage(flag, cornerX - flag.width / 2, FLAG_FOOT_Y - flag.height);
  }

  /** Locker-room gate tile: closed, glowing when the player is within 200px (with a bouncing arrow), open within the prompt radius. */
  private drawGate(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = GATE;
    const open = this.gateNear ? this.image("env/gate-open") : undefined;
    const closed = this.image("env/gate-closed");
    if (open) g.drawImage(open, x, y, w, h);
    else if (closed) g.drawImage(closed, x, y, w, h);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(x, y, w, h);
      g.fillStyle = this.gateNear ? "#8a6d1a" : "#1a2b4d";
      g.fillRect(x + 8, y + 16, w - 16, h - 16);
    }
    if (this.gateApproach && !open) {
      const glow = this.image("env/gate-glow");
      if (glow) {
        g.save();
        g.globalAlpha = 0.35 + 0.35 * Math.sin(this.clock * 4);
        g.drawImage(glow, x, y, w, h);
        g.restore();
      }
    }
    const plate = this.image("env/gate-plate");
    const plateW = Math.round((plate?.width ?? 64) * GATE_SCALE);
    const plateH = Math.round((plate?.height ?? 24) * GATE_SCALE);
    const plateX = x + Math.round((w - plateW) / 2) + 1;
    const plateY = y - plateH - 4 + 10;
    if (plate) g.drawImage(plate, plateX, plateY, plateW, plateH);
    drawText(g, "LOCKER", plateX + plateW / 2, plateY + plateH / 2, { size: 10, align: "center", baseline: "middle" });
    if (this.gateApproach) {
      const arrow = this.image("env/gate-arrow");
      const bounce = Math.round(Math.abs(Math.sin(this.clock * 4)) * 4);
      if (arrow) {
        const aw = Math.round(arrow.width * GATE_SCALE);
        const ah = Math.round(arrow.height * GATE_SCALE);
        g.drawImage(arrow, x + Math.round((w - aw) / 2), plateY - ah - 2 - bounce, aw, ah);
      }
    }
  }

  private drawConfetti(g: CanvasRenderingContext2D) {
    if (this.confetti.activeCount === 0) return;
    const items = this.confetti.items;
    for (let i = 0; i < items.length; i++) {
      const piece = items[i]!;
      if (!piece.active) continue;
      const t = particleProgress(piece);
      g.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      g.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
      const flip = Math.sin(piece.age * 14 + i) > 0;
      const w = Math.max(2, Math.round((flip ? 5 : 2) * piece.size));
      const h = Math.max(2, Math.round((flip ? 2 : 5) * piece.size));
      g.fillRect(Math.round(piece.x), Math.round(piece.y), w, h);
    }
    g.globalAlpha = 1;
  }

  private drawAimGuide(g: CanvasRenderingContext2D) {
    if (this.shot.phase !== "aim" && this.shot.phase !== "power") return;
    drawAimGuide(g, (key) => this.image(key), this.shot, this.ball, this.shotTuning, this.clock);
  }

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  /** Pitch + stands + the goal's back half never change: drawn once into an offscreen canvas. */
  private drawStaticLayer(g: CanvasRenderingContext2D) {
    if (!this.staticLayer && typeof document !== "undefined") {
      const layer = document.createElement("canvas");
      layer.width = LOGICAL_WIDTH;
      layer.height = LOGICAL_HEIGHT;
      const lg = layer.getContext("2d");
      if (lg) {
        lg.imageSmoothingEnabled = false;
        this.paintStatic(lg);
        this.staticLayer = layer;
      }
    }
    if (this.staticLayer) g.drawImage(this.staticLayer, 0, 0);
    else this.paintStatic(g);
  }

  private paintStatic(g: CanvasRenderingContext2D) {
    const bg = this.image("env/pitch-bg");
    if (bg) g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    else this.paintPlaceholderPitch(g);
    const back = this.image("env/goal-back");
    if (back) g.drawImage(back, GOAL_SPRITE.x, GOAL_SPRITE.y);
    else if (bg) this.paintPlaceholderGoal(g);
  }

  private paintPlaceholderPitch(g: CanvasRenderingContext2D) {
    g.fillStyle = "#1f7a3a";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.fillStyle = "#238a42";
    for (let i = 0; i < 9; i++) g.fillRect(0, i * 60, LOGICAL_WIDTH, 30);
    g.strokeStyle = "rgba(247, 247, 255, 0.7)";
    g.lineWidth = 2;
    g.strokeRect(200, GOAL.lineY, 560, 180); // penalty box
    g.strokeRect(320, GOAL.lineY, 320, 60); // six-yard box
    g.beginPath();
    g.moveTo(0, GOAL.lineY);
    g.lineTo(LOGICAL_WIDTH, GOAL.lineY);
    g.stroke();
    this.paintPlaceholderGoal(g);
  }

  private paintPlaceholderGoal(g: CanvasRenderingContext2D) {
    g.strokeStyle = "#f7f7ff";
    g.lineWidth = 3;
    g.strokeRect(GOAL.minX, GOAL_SPRITE.y, GOAL.maxX - GOAL.minX, 74);
  }

  private drawGoalFront(g: CanvasRenderingContext2D) {
    const front = this.image("env/goal-front");
    if (front) g.drawImage(front, GOAL_SPRITE.x, GOAL_SPRITE.y);
  }

  private drawDust(g: CanvasRenderingContext2D) {
    if (this.dust.activeCount === 0) return;
    const image = this.image("fx/fx-dust");
    for (const particle of this.dust.items) {
      if (!particle.active) continue;
      const t = particleProgress(particle);
      const alpha = 0.85 * (1 - t);
      if (image) {
        drawStripFrame(g, image, 4, Math.floor(t * 4), particle.x, particle.y + 6, { scale: particle.size * depthScale(particle.y), alpha });
      } else {
        g.save();
        g.globalAlpha = alpha;
        g.fillStyle = "#d8e4c8";
        const r = Math.round(3 * particle.size * (1 + t));
        g.fillRect(Math.round(particle.x) - r, Math.round(particle.y) - r, r * 2, r * 2);
        g.restore();
      }
    }
  }

  /** Keeper, player and ball, drawn back to front by their feet y (stable for ties: keeper, player, ball). */
  private drawActors(g: CanvasRenderingContext2D) {
    const { order, sortY } = this;
    sortY[0] = KEEPER_FOOT_Y;
    sortY[1] = this.player.y;
    sortY[2] = this.ball.y;
    sortY[3] = this.pet.y;
    order[0] = 0;
    order[1] = 1;
    order[2] = 2;
    order[3] = 3;
    for (let i = 1; i < 4; i++) {
      const v = order[i]!;
      let j = i - 1;
      while (j >= 0 && sortY[order[j]!]! > sortY[v]!) {
        order[j + 1] = order[j]!;
        j--;
      }
      order[j + 1] = v;
    }
    // the ball's shadow lies on the grass, under every sprite
    if (!this.ballInNet) this.drawBallShadow(g);
    for (const index of order) {
      if (index === 0) this.drawKeeper(g);
      else if (index === 1) this.drawPlayer(g);
      else if (index === 3) this.drawPetSprite(g);
      else if (!this.ballInNet) this.drawBall(g);
    }
  }

  private drawKeeper(g: CanvasRenderingContext2D) {
    const atlas = this.image("characters/keeper-ai-atlas");
    const scale = depthScale(KEEPER_FOOT_Y);
    const x = Math.round(goalScreenX(this.keeper.x));
    if (!atlas) {
      this.drawPlaceholderBody(g, x, KEEPER_FOOT_Y, scale, "#ff8a3d");
      return;
    }
    const pose = keeperPose(this.keeper);
    drawFrame(g, atlas, frameRect(pose.def, pose.frame), x, KEEPER_FOOT_Y, { scale });
  }

  private drawPlayer(g: CanvasRenderingContext2D) {
    const p = this.player;
    const scale = depthScale(p.y);
    const hop = skillHop(this.skills);
    this.drawShadow(g, p.x, p.y, 15 * scale * (1 - Math.min(0.3, hop / 80)), 4.5 * scale);
    const atlas = this.image(`characters/${this.character.id}-atlas`);
    if (!atlas) {
      this.drawPlaceholderBody(g, p.x, p.y, scale, this.character.themeColor);
      return;
    }
    const cell = this.playerRect();
    drawEquippedFrame(g, atlas, cell.rect, this.character.id, this.loadout, (key) => this.image(key) as never, p.x, p.y - hop, { scale, mirror: cell.mirror });
  }

  private drawPetSprite(g: CanvasRenderingContext2D) {
    const petId = this.loadout.pet;
    if (!petId) return;
    drawPet(g, this.image(`pets/pet-${petId}`), this.pet, depthScale(this.pet.y));
  }

  /** Atlas cell of the player: kick clip after the shot, celebration / disappointment during the result, else idle / run. */
  private playerRect() {
    const p = this.player;
    const { match } = this;
    if (this.kickClock !== null && this.kickClock < this.shotTuning.kickSeconds) {
      const def = clipDef("shoot", "up");
      return { rect: frameRect(def, frameAt(def, this.kickClock)), mirror: false };
    }
    if (match.result && (match.phase === "result" || match.phase === "fade")) {
      const def = clipDef(match.result.outcome === "GOAL" ? this.celebrate : "disappointed", "down");
      return { rect: frameRect(def, frameAt(def, match.timer)), mirror: false };
    }
    const move = skillPose(this.skills);
    if (move) return { rect: frameRect(clipDef(move.clip, move.dir), move.frame), mirror: move.mirror };
    const pose = playerPose(p);
    return { rect: frameRect(clipDef(pose.clip, pose.dir), pose.frame), mirror: pose.mirror };
  }

  private drawPlaceholderBody(g: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
    const w = Math.round(22 * scale);
    const h = Math.round(56 * scale);
    g.fillStyle = "#0a0a1a";
    g.fillRect(Math.round(x - w / 2) - 2, Math.round(y - h) - 2, w + 4, h + 4);
    g.fillStyle = color;
    g.fillRect(Math.round(x - w / 2), Math.round(y - h), w, h);
  }

  private drawShadow(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
    g.fillStyle = "rgba(5, 8, 20, 0.35)";
    g.beginPath();
    g.ellipse(Math.round(x), Math.round(y), Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry)), 0, 0, Math.PI * 2);
    g.fill();
  }

  private drawBallShadow(g: CanvasRenderingContext2D) {
    const b = this.ball;
    if (b.mode === "dead") return;
    // the higher the ball, the smaller its shadow
    const scale = depthScale(b.y) * (1 - Math.min(0.4, b.z / 200));
    const shadow = this.image("env/ball-shadow");
    if (shadow) {
      const w = Math.round(shadow.width * scale);
      const h = Math.round(shadow.height * scale);
      g.drawImage(shadow, Math.round(b.x - w / 2), Math.round(b.y - h / 2), w, h);
    } else {
      this.drawShadow(g, b.x, b.y, 7 * scale, 2.5 * scale);
    }
  }

  private drawBall(g: CanvasRenderingContext2D) {
    const b = this.ball;
    const scale = depthScale(b.y) * (1 + 0.3 * (b.trap / 0.15));
    const sprite = this.image("env/ball-spin");
    // the sprite's bottom sits on the ground point (a couple of px over it so the shadow peeks out), lifted by z
    // the rainbow flick lifts the carried ball with the player's hop
    const bottomY = b.y + 2 - b.z - (b.mode === "carried" ? skillHop(this.skills) * 1.3 : 0);
    this.drawBallTrail(g);
    if (b.mode === "shot" && b.flight && this.flight?.sweet) drawSweetRing(g, (key) => this.image(key), b.x, bottomY - 8 * scale, this.clock);
    if (sprite) {
      drawStripFrame(g, sprite, 8, ballSpinFrame(b, 8), b.x, bottomY, { scale, alpha: b.mode === "dead" ? 0.4 : 1 });
      return;
    }
    const r = Math.max(2, Math.round(6 * scale));
    g.fillStyle = "#0a0a1a";
    g.fillRect(Math.round(b.x) - r - 1, Math.round(bottomY - 2 * r) - 1, 2 * r + 2, 2 * r + 2);
    g.fillStyle = "#f7f7ff";
    g.fillRect(Math.round(b.x) - r, Math.round(bottomY - 2 * r), 2 * r, 2 * r);
  }

  /** Fading afterimages of a ball in flight. */
  private drawBallTrail(g: CanvasRenderingContext2D) {
    const t = this.trail;
    if (this.ball.mode !== "shot" || !this.ball.flight || t.length < 4) return;
    const n = t.length / 2;
    g.save();
    for (let i = 0; i < n - 1; i++) {
      const k = (i + 1) / n;
      g.globalAlpha = 0.5 * k;
      g.fillStyle = this.flight?.sweet ? "#ffd23f" : "#f7f7ff";
      const r = Math.max(1, Math.round(4 * k));
      g.fillRect(Math.round(t[i * 2]!) - r, Math.round(t[i * 2 + 1]! - 6) - r, r * 2, r * 2);
    }
    g.restore();
  }

  // ---- HUD ----

  private drawHud(g: CanvasRenderingContext2D) {
    this.drawScoreboard(g);
    this.drawButtons(g);
    this.drawCharacterPlate(g);
    drawStyleMeter(g, (key) => this.image(key), this.styleShown, this.skills.combo, styleTierOf(this.skills), this.clock);
    if (this.callout) drawCallout(g, (key) => this.image(key), this.callout.kind, this.callout.age);
    if (this.skillLabel) drawSkillLabel(g, this.skillLabel.text, this.player.x, this.player.y, this.skillLabel.age, this.skillLabel.color);
    this.drawShotHud(g);
    if (this.gatePromptVisible()) {
      const p = this.player;
      drawPrompt(g, this.image("ui/dialog-small"), "E", "락커룸", p.x, p.y - Math.round(86 * depthScale(p.y)), this.clock);
    }
    this.drawHints(g);
    this.drawToast(g);
    this.drawFocusNotice(g);
  }

  private drawShotHud(g: CanvasRenderingContext2D) {
    const image = (key: string) => this.image(key);
    const { shot, ball, match } = this;
    if (shot.phase === "aim" || shot.phase === "power") drawAimBar(g, image, shot, ball.x, ball.y, this.shotTuning);
    if (shot.phase === "power") drawPowerBar(g, image, shot, this.shotTuning);
    drawTooFar(g, this.player.x, this.player.y, this.tooFarAge);
    if (match.result && (match.phase === "result" || match.phase === "fade")) {
      const age = match.phase === "result" ? match.timer : MATCH.resultSeconds;
      drawResultBanner(g, image, match.result, age, match.result.outcome === "GOAL" && match.result.sweet);
    }
  }

  private drawScoreboard(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = SCOREBOARD;
    const plate = this.image("ui/scoreboard");
    if (plate) g.drawImage(plate, x, y);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(x, y, w, h);
      g.fillStyle = "#152640";
      g.fillRect(x + 2, y + 2, w - 4, h - 4);
    }
    // slot centres measured against the plate art (goal count left, save count right of the colon)
    drawText(g, pad2(this.match.goals), x + 120, y + 33, { size: 16, color: TEXT_COLORS.amber, align: "center", baseline: "middle" });
    drawText(g, pad2(this.match.saves), x + 160, y + 33, { size: 16, color: TEXT_COLORS.amber, align: "center", baseline: "middle" });
    g.fillStyle = "rgba(10, 10, 26, 0.85)";
    g.fillRect(HUD_LEFT, y + h + 4, 84, 16);
    drawText(g, `연속 골 ${this.match.streak}`, HUD_LEFT + 42, y + h + 12, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
  }

  private buttonFrame(id: ButtonId) {
    if (this.hovered !== id) return 0;
    return this.pressed === id ? 2 : 1;
  }

  private drawButtons(g: CanvasRenderingContext2D) {
    for (const { id, rect } of BUTTONS) {
      const frame = this.buttonFrame(id);
      const key = id === "dashboard" ? "ui/btn-dashboard" : id === "change" ? "ui/btn-change" : "ui/btn-square";
      const strip = this.image(key);
      const oy = frame === 2 ? 2 : 0;
      if (strip) {
        drawStripFrame(g, strip, 3, frame, rect.x + rect.w / 2, rect.y + rect.h + oy);
      } else {
        g.fillStyle = "#0a0a1a";
        g.fillRect(rect.x - 2, rect.y - 2 + oy, rect.w + 4, rect.h + 4);
        g.fillStyle = frame > 0 ? "#1f3a5c" : "#152640";
        g.fillRect(rect.x, rect.y + oy, rect.w, rect.h);
        if (frame > 0) {
          g.strokeStyle = "#3ee6c1";
          g.lineWidth = 2;
          g.strokeRect(rect.x + 1, rect.y + 1 + oy, rect.w - 2, rect.h - 2);
        }
      }
      const cy = rect.y + rect.h / 2 + oy;
      if (id === "dashboard") drawText(g, "잔디동 대시보드로", rect.x + 118, cy + 3, { align: "center", baseline: "middle" });
      else if (id === "change") drawText(g, "캐릭터 변경", rect.x + 115, cy + 2, { align: "center", baseline: "middle" });
      else this.drawSoundIcon(g, rect.x + (rect.w - 24) / 2, rect.y + (rect.h - 24) / 2 + oy);
    }
  }

  private drawSoundIcon(g: CanvasRenderingContext2D, x: number, y: number) {
    const icon = this.image(this.muted ? "ui/icon-sound-off" : "ui/icon-sound-on");
    if (icon) {
      g.drawImage(icon, Math.round(x), Math.round(y));
      return;
    }
    drawText(g, this.muted ? "OFF" : "ON", x + 12, y + 12, { size: 10, align: "center", baseline: "middle" });
  }

  private drawCharacterPlate(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = CHARACTER_PLATE;
    const plate = this.image("ui/nameplate");
    if (plate) drawNineSlice(g, plate, 8, x, y, w, h);
    else {
      g.fillStyle = "rgba(10, 10, 26, 0.85)";
      g.fillRect(x, y, w, h);
    }
    drawText(g, `${this.character.name} · ${this.character.positionLabel}`, x + w / 2, y + h / 2, { size: 10, align: "center", baseline: "middle" });
  }

  private drawHints(g: CanvasRenderingContext2D) {
    // the H toggle label is always there so players can find the controls again
    const helpStyle = { size: 10, color: "#9fe9ff", align: "right", baseline: "middle" } as const;
    drawText(g, this.hintsVisible ? "H  조작법 숨기기" : "H  조작법 보기", 944, 512, helpStyle);
    drawText(g, "Backspace  대시보드", 944, 526, helpStyle);
    if (!this.hintsVisible || this.shot.phase === "aim" || this.shot.phase === "power") return;
    g.save();
    let x = HINT_LEFT;
    for (const item of HINT_ITEMS) {
      for (const key of item.keys) {
        const image = key.startsWith("key-") ? this.image(`ui/${key}`) : this.image("ui/key-up");
        const width = image?.width ?? 32;
        if (image) g.drawImage(image, x, HINT_ROW_Y);
        else {
          g.fillStyle = "#152640";
          g.fillRect(x, HINT_ROW_Y, width, 32);
        }
        // key-shift / key-space are blank caps and the letter keys use the blank square cap: captions are drawn text
        const caption = KEY_CAPTIONS[key] ?? (key.startsWith("key-") ? "" : key);
        if (caption) drawText(g, caption, x + width / 2, HINT_ROW_Y + 10, { size: caption.length > 2 ? 10 : 12, align: "center", baseline: "middle" });
        x += width + 2;
      }
      x += 4;
      drawText(g, item.label, x, HINT_ROW_Y + 16, { size: 12, baseline: "middle" });
      x += Math.ceil(g.measureText(item.label).width) + 20;
    }
    g.restore();
  }

  private drawToast(g: CanvasRenderingContext2D) {
    if (!this.toast) return;
    const alpha = Math.min(1, this.toast.left / 0.3);
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = "rgba(10, 10, 26, 0.92)";
    g.fillRect(340, 124, 280, 32);
    g.strokeStyle = "#3ee6c1";
    g.lineWidth = 2;
    g.strokeRect(341, 125, 278, 30);
    drawText(g, this.toast.text, LOGICAL_WIDTH / 2, 140, { align: "center", baseline: "middle" });
    g.restore();
  }

  private drawFocusNotice(g: CanvasRenderingContext2D) {
    if (this.ctx?.host.hasKeyboardFocus() !== false) return;
    const pulse = 0.65 + 0.35 * Math.sin(this.clock * 4);
    g.save();
    g.globalAlpha = pulse;
    g.fillStyle = "rgba(10, 10, 26, 0.85)";
    g.fillRect(360, 452, 240, 32);
    drawText(g, "클릭해서 시작", LOGICAL_WIDTH / 2, 468, { size: 12, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    g.restore();
  }
}
