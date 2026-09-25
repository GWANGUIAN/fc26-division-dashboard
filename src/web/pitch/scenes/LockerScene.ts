// Locker room (docs/pitch/03 §4): walk around (no ball), bump into the furniture, use the stat analyzer for the
// hexagon overlay (`StatScene`) and leave through the exit door back to the pitch gate. The `locker` asset group is
// fetched by the pitch when the player nears the gate (and again here, which is instant once loaded); until it is
// there the room shows a loading plate. Every asset is optional: missing art becomes plain shapes.

import { clipDef, frameRect } from "../data/animations";
import { resolveStoredCharacter, type PitchCharacter } from "../data/characters";
import { loadLoadout, type Loadout } from "../data/equipment";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import type { AssetImage, PitchAssets } from "../engine/assets";
import type { KeyInput, PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawEquippedFrame } from "../engine/equipment";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { ANALYZER, CABINET, EXIT_CORRIDOR, LOCKER_PLAYER_SCALE, JUKEBOX, LOCKER_SPAWN, PROP_SCALE, nearAnalyzer, nearCabinet, nearExit, nearJukebox, nearWhiteboard, resolveBoxes, WHITEBOARD } from "../game/locker";
import { createPet, drawPet, resetPet, updatePet, type PetState } from "../game/pet";
import { createPlayer, playerPose, stepPlayer, type PlayerState } from "../game/player";
import { PLAY_AREA, depthScale } from "../game/tuning";
import { CharacterSelectScene } from "./CharacterSelectScene";
import { VolumePanel } from "../ui/volumePanel";
import { drawHudButtons, soundState, drawPrompt, hudButtonAt, syncSoundState, toggleSound, type HudButtonId } from "./hudCommon";
import { InventoryScene } from "./InventoryScene";
import { StatScene } from "./StatScene";

const HUD_BUTTONS: readonly HudButtonId[] = ["dashboard", "change", "sound"];

/** The analyzer's screen is dark for this long after entering the room, then it powers on (OFF → IDLE). */
export const ANALYZER_POWER_ON_SECONDS = 0.5;
/** Extra time the analyzer keeps its ACTIVE look after the overlay closes. */
const ACTIVE_AFTERGLOW_SECONDS = 0.25;
/** Movement bounds while walking in the locker room: the pitch bounds, but deep enough for the exit tunnel (resolveBoxes then trims the floor). */
const LOCKER_STEP_AREA = { ...PLAY_AREA, maxY: EXIT_CORRIDOR.maxY };
const INTERACT_KEYS: ReadonlySet<string> = new Set(["KeyE", "Enter", "NumpadEnter"]);

interface Prop {
  key: string;
  /** Bottom-centre anchor of the sprite on the floor. */
  x: number;
  y: number;
  /** Mirrored left-right. */
  flip?: boolean;
}

/** Furniture sprites, each drawn `PROP_SCALE`× (the back row is not walkable; the kit bag has a box in `game/locker.ts`). */
const PROPS: readonly Prop[] = [
  { key: "env/cooler", x: 256, y: 190, flip: true },
  { key: "env/whiteboard", x: WHITEBOARD.baseX, y: WHITEBOARD.baseY, flip: true },
  { key: "env/bootrack", x: 580, y: 217 },
  { key: "env/locker-unit", x: 677, y: 238 },
  { key: "env/locker-unit-open", x: 760, y: 240 },
  { key: "env/kitbag", x: 775, y: 420 },
];

/** The analyzer and the jukebox are stateful, so they are drawn by their own methods (`prop: null`). */
type DrawEntry = { y: number; prop: Prop | null; special?: "analyzer" | "jukebox" };

/** Draw order of the static furniture, back to front by base y. */
const DRAW_ORDER: readonly DrawEntry[] = (
  [
    ...PROPS.map((prop): DrawEntry => ({ y: prop.y, prop })),
    { y: ANALYZER.baseY, prop: null, special: "analyzer" },
    { y: JUKEBOX.baseY, prop: null, special: "jukebox" },
  ] satisfies DrawEntry[]
).sort((a, b) => a.y - b.y);

/** The jukebox spins and plays notes at this rate while the playlist popup is open (and briefly after). */
const JUKEBOX_FRAMES = 3;
const JUKEBOX_FPS = 4;
const JUKEBOX_AFTERGLOW_SECONDS = 0.6;

export interface LockerParams {
  /** Builds the pitch scene to return to (kept as a factory so this file never imports `PitchScene`). */
  createPitch(): Scene;
  /** Fixed character instead of the stored one (the `?pitchFit=1&char=` tool); it is not saved. */
  character?: PitchCharacter;
  /** Opens the cabinet inventory as soon as the room is ready (the `?pitchFit=1` tool). */
  openInventory?: boolean;
}

/** What the pitch is told when it is entered from the locker room. */
export interface PitchEnterParams {
  fromLocker?: boolean;
}

export type LockerTarget = "analyzer" | "cabinet" | "playlist" | "squad" | "exit" | null;

/** Which interaction a spot offers; the analyzer wins where the circles ever overlap, then the cabinet, the jukebox and the whiteboard. */
export function lockerTargetAt(x: number, y: number): LockerTarget {
  if (nearAnalyzer(x, y)) return "analyzer";
  if (nearCabinet(x, y)) return "cabinet";
  if (nearJukebox(x, y)) return "playlist";
  if (nearWhiteboard(x, y)) return "squad";
  if (nearExit(x, y)) return "exit";
  return null;
}

/** The closed locker unit that is the player's cabinet (game/locker.ts CABINET); it shows the open sprite while the inventory is up. */
const CABINET_PROP_KEY = "env/locker-unit";

export class LockerScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly params: LockerParams;
  private character: PitchCharacter = resolveStoredCharacter();
  private readonly player: PlayerState = createPlayer(LOCKER_SPAWN.x, LOCKER_SPAWN.y);

  private clock = 0;
  private ready = false;
  private exiting = false;
  private statOpen = false;
  private inventoryOpen = false;
  private playlistOpen = false;
  private squadOpen = false;
  private jukeboxGlow = 0;
  private autoOpened = false;
  private loadout: Loadout = {};
  private pet: PetState = createPet(LOCKER_SPAWN.x, LOCKER_SPAWN.y);
  private afterglow = 0;
  private hovered: HudButtonId | null = null;
  private pressed: HudButtonId | null = null;

  constructor(params: LockerParams) {
    this.params = params;
    // enters facing up (toward the room), like a player who just came in
    this.player.fx = 0;
    this.player.fy = -1;
  }

  // ---- lifecycle ----

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    this.character = this.params.character ?? resolveStoredCharacter();
    this.refreshLook();
    syncSoundState();
    this.volume = new VolumePanel({
      audio: this.audio,
      setCursor: (kind) => ctx.host.setCursor(kind),
      onChange: (s) => void (soundState.muted = !s.sfxOn && !s.musicOn),
    });
    this.audio.playBgm("locker");
    this.audio.playSfx("gate-close");
    this.ready = this.assets.has?.("env/locker-bg") ?? false;
    if (!this.ready) {
      const done = () => {
        this.ready = true;
      };
      void this.assets.loadGroup("locker").then(done, done);
    }
  }

  exit() {
    this.ctx?.host.setCursor("default");
  }

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  /** Reads the saved loadout of the current character, fetches the pet art it needs and puts the pet next to the player. */
  private refreshLook() {
    this.loadout = loadLoadout(this.character.id);
    resetPet(this.pet, this.player.x, this.player.y);
    if (this.loadout.pet) void this.assets?.loadGroup(`pets:${this.character.id}`).catch(() => undefined);
  }

  // ---- update ----

  private volume: VolumePanel | null = null;

  update(dt: number) {
    this.volume?.update(dt);
    this.clock += dt;
    if (this.afterglow > 0) this.afterglow = Math.max(0, this.afterglow - dt);
    if (this.jukeboxGlow > 0) this.jukeboxGlow = Math.max(0, this.jukeboxGlow - dt);
    if (this.params.openInventory && !this.autoOpened && this.ready && this.ctx?.manager.transitionProgress == null) {
      this.autoOpened = true;
      this.openInventory();
    }
    const host = this.ctx?.host;
    const p = this.player;
    const frozen = !host || this.exiting || this.ctx?.manager.transitionProgress != null;
    const down = (code: string) => (host?.input.isDown(code) ? 1 : 0);
    stepPlayer(p, frozen ? { dx: 0, dy: 0, sprint: false } : { dx: down("ArrowRight") - down("ArrowLeft"), dy: down("ArrowDown") - down("ArrowUp"), sprint: false }, dt, LOCKER_STEP_AREA);
    resolveBoxes(p);
    updatePet(this.pet, p, dt, Math.abs(p.fx) > 0.3 ? Math.sign(p.fx) : 0);
  }

  /** What a press of E would do right now (null while something else owns the input). */
  interaction(): LockerTarget {
    if (this.exiting || this.statOpen || this.inventoryOpen || this.playlistOpen || this.squadOpen || this.ctx?.manager.transitionProgress != null) return null;
    return lockerTargetAt(this.player.x, this.player.y);
  }

  // ---- actions ----

  private openStats() {
    const ctx = this.ctx;
    if (!ctx || this.statOpen) return;
    this.statOpen = true;
    this.afterglow = 0;
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    ctx.manager.push(
      new StatScene({
        character: this.character,
        onClose: () => {
          this.statOpen = false;
          this.afterglow = ACTIVE_AFTERGLOW_SECONDS;
        },
      }),
    );
  }

  private openInventory() {
    const ctx = this.ctx;
    if (!ctx || this.inventoryOpen || this.statOpen) return;
    this.inventoryOpen = true;
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    ctx.manager.push(
      new InventoryScene({
        character: this.character,
        onApply: (loadout) => {
          this.loadout = loadout;
        },
        onClose: () => {
          this.inventoryOpen = false;
          this.refreshLook();
        },
      }),
    );
  }

  /** The full-screen playlist popup lives in React (PitchEntry); the pitch music pauses while it plays. */
  private openPlaylist() {
    const ctx = this.ctx;
    if (!ctx?.host.openPlaylist || this.playlistOpen || this.statOpen || this.inventoryOpen) return;
    this.playlistOpen = true;
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    this.audio.playBgm(null);
    ctx.host.openPlaylist(() => {
      this.playlistOpen = false;
      this.jukeboxGlow = JUKEBOX_AFTERGLOW_SECONDS;
      this.audio.playBgm("locker");
    });
  }

  /** The squad manager popup (the dashboard's squad builder) lives in React (PitchEntry); the game keeps running behind it. */
  private openSquad() {
    const ctx = this.ctx;
    if (!ctx?.host.openSquad || this.squadOpen || this.playlistOpen || this.statOpen || this.inventoryOpen) return;
    this.squadOpen = true;
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    ctx.host.openSquad(() => {
      this.squadOpen = false;
    });
  }

  private leaveToPitch() {
    const ctx = this.ctx;
    if (!ctx || this.exiting || ctx.manager.transitionProgress !== null) return;
    this.exiting = true;
    this.audio.playSfx("gate-open");
    this.audio.playSfx("transition-wipe");
    const params: PitchEnterParams = { fromLocker: true };
    ctx.manager.replace(this.params.createPitch(), params, { transition: "wipe" });
  }

  private openSelect() {
    const ctx = this.ctx;
    if (!ctx || this.exiting || ctx.manager.transitionProgress !== null) return;
    this.hovered = null;
    this.pressed = null;
    ctx.host.setCursor("default");
    ctx.manager.push(
      new CharacterSelectScene({
        currentId: this.character.id,
        onApply: (character) => {
          this.character = character;
          this.refreshLook();
        },
      }),
    );
  }

  private onButton(id: HudButtonId) {
    if (id === "dashboard") {
      this.audio.playSfx("mode-switch");
      this.ctx?.host.goDashboard();
    } else if (id === "sound") toggleSound(this.audio);
    else this.openSelect();
  }

  // ---- input ----

  onKey(e: KeyInput) {
    if (this.exiting) return;
    if (this.volume?.key(e.code)) return;
    if (INTERACT_KEYS.has(e.code)) {
      const target = this.interaction();
      if (target === "analyzer") this.openStats();
      else if (target === "cabinet") this.openInventory();
      else if (target === "playlist") this.openPlaylist();
      else if (target === "squad") this.openSquad();
      else if (target === "exit") this.leaveToPitch();
      return;
    }
    switch (e.code) {
      case "Escape":
        this.leaveToPitch();
        break;
      case "Tab":
        this.openSelect();
        break;
      case "KeyM":
        toggleSound(this.audio);
    }
  }

  onPointer(e: PointerInput) {
    if (this.exiting) return;
    if (this.volume?.pointer(e)) return;
    const hover = hudButtonAt(HUD_BUTTONS, e.x, e.y);
    if (hover !== this.hovered) {
      if (hover) this.audio.playSfx("ui-hover");
      this.hovered = hover;
      this.ctx?.host.setCursor(hover ? "pointer" : "default");
    }
    if (e.type === "down") this.pressed = hover;
    if (e.type === "up") {
      const clicked = this.pressed;
      this.pressed = null;
      if (clicked && clicked === hover) {
        this.audio.playSfx("ui-click");
        this.onButton(clicked);
      }
    }
  }

  // ---- render ----

  render(g: CanvasRenderingContext2D) {
    this.drawBackground(g);
    if (this.ready) {
      this.drawExitGlow(g);
      this.drawSorted(g);
    } else this.drawLoading(g);
    if (!this.statOpen && !this.inventoryOpen) {
      // same translucent navy plate as the pitch's STREAK label
      g.font = "20px Galmuri11, monospace";
      const titleW = Math.ceil(g.measureText("LOCKER ROOM").width) + 20;
      g.fillStyle = "rgba(10, 10, 26, 0.85)";
      g.fillRect(Math.round(LOGICAL_WIDTH / 2 - titleW / 2), 24, titleW, 32);
      drawText(g, "LOCKER ROOM", LOGICAL_WIDTH / 2, 40, { size: 20, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
      // two short lines in the bottom-left wall band (the tunnel mouth takes the middle of the bottom edge)
      drawText(g, "방향키 이동 · E 상호작용", 16, 510, { size: 10, color: "#9fe9ff", baseline: "middle" });
      drawText(g, "Tab 캐릭터 변경 · Esc 나가기", 16, 526, { size: 10, color: "#9fe9ff", baseline: "middle" });
    }
    this.drawInteractHints(g);
    this.drawPromptBubble(g);
    drawHudButtons(g, (key) => this.image(key), HUD_BUTTONS, { hovered: this.hovered, pressed: this.pressed });
    this.volume?.draw(g);
  }

  private drawBackground(g: CanvasRenderingContext2D) {
    const bg = this.image("env/locker-bg");
    if (bg) g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    else {
      g.fillStyle = "#0b1730";
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      g.fillStyle = "#12254a";
      g.fillRect(0, 180, LOGICAL_WIDTH, LOGICAL_HEIGHT - 180);
    }
  }

  private drawLoading(g: CanvasRenderingContext2D) {
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 5);
    g.save();
    g.globalAlpha = pulse;
    drawText(g, "락커룸 불러오는 중…", LOGICAL_WIDTH / 2, 300, { size: 12, align: "center", baseline: "middle" });
    g.restore();
  }

  /** The exit is the tunnel mouth painted into `env/locker-bg` (x 387~572, y 420~540): near it, its warm light pulses brighter. */
  private drawExitGlow(g: CanvasRenderingContext2D) {
    if (this.interaction() !== "exit" && !this.exiting) return;
    g.save();
    g.globalAlpha = 0.1 + 0.06 * Math.sin(this.clock * 6);
    g.fillStyle = "#ffc450";
    g.fillRect(390, 424, 180, 116);
    g.restore();
  }

  /** Props, the analyzer and the player back to front by their feet y. */
  private drawSorted(g: CanvasRenderingContext2D) {
    const movers = [{ y: this.player.y, draw: () => this.drawPlayer(g) }];
    if (this.loadout.pet) movers.push({ y: this.pet.y, draw: () => this.drawPetSprite(g) });
    movers.sort((a, b) => a.y - b.y);
    let next = 0;
    for (const entry of DRAW_ORDER) {
      while (next < movers.length && entry.y > movers[next].y) movers[next++].draw();
      if (entry.prop) this.drawProp(g, entry.prop);
      else if (entry.special === "jukebox") this.drawJukebox(g);
      else this.drawAnalyzer(g);
    }
    while (next < movers.length) movers[next++].draw();
  }

  private drawPetSprite(g: CanvasRenderingContext2D) {
    const petId = this.loadout.pet;
    if (!petId) return;
    drawPet(g, this.image(`pets/pet-${petId}`), this.pet, depthScale(this.pet.y) * LOCKER_PLAYER_SCALE);
  }

  private drawProp(g: CanvasRenderingContext2D, prop: Prop) {
    const image = this.image(prop.key === CABINET_PROP_KEY && this.inventoryOpen ? "env/locker-unit-open" : prop.key);
    if (!image) return;
    const w = Math.round(image.width * PROP_SCALE);
    const h = Math.round(image.height * PROP_SCALE);
    if (prop.flip) {
      g.save();
      g.translate(Math.round(prop.x), 0);
      g.scale(-1, 1);
      g.drawImage(image, -Math.round(w / 2), Math.round(prop.y - h), w, h);
      g.restore();
    } else g.drawImage(image, Math.round(prop.x - w / 2), Math.round(prop.y - h), w, h);
  }

  /** OFF while powering on, ACTIVE while the stat screen is (or just was) open, otherwise IDLE with its glow. */
  analyzerState(): "off" | "idle" | "active" {
    if (this.statOpen || this.afterglow > 0) return "active";
    return this.clock < ANALYZER_POWER_ON_SECONDS ? "off" : "idle";
  }

  private drawAnalyzer(g: CanvasRenderingContext2D) {
    const state = this.analyzerState();
    const sprite = this.image(`env/terminal-${state}`);
    if (sprite) {
      g.drawImage(sprite, Math.round(ANALYZER.baseX - sprite.width / 2), Math.round(ANALYZER.baseY - sprite.height));
      return;
    }
    const w = 96;
    const h = 128;
    g.fillStyle = "#0a0a1a";
    g.fillRect(ANALYZER.baseX - w / 2 - 2, ANALYZER.baseY - h - 2, w + 4, h + 4);
    g.fillStyle = state === "active" ? "#8a6d1a" : state === "idle" ? "#1f5c66" : "#222a3a";
    g.fillRect(ANALYZER.baseX - w / 2, ANALYZER.baseY - h, w, h);
  }

  /** OFF while powering on (like the analyzer), PLAYING while the popup is open (or just was), otherwise IDLE. Drawn mirrored. */
  jukeboxState(): "off" | "idle" | "play" {
    if (this.playlistOpen || this.jukeboxGlow > 0) return "play";
    return this.clock < ANALYZER_POWER_ON_SECONDS ? "off" : "idle";
  }

  private drawJukebox(g: CanvasRenderingContext2D) {
    const state = this.jukeboxState();
    const sprite = this.image(`env/jukebox-${state}`);
    const { baseX, baseY, spriteW: w, spriteH: h } = JUKEBOX;
    if (!sprite) {
      g.fillStyle = "#0a0a1a";
      g.fillRect(baseX - w / 2 - 2, baseY - h - 2, w + 4, h + 4);
      g.fillStyle = state === "play" ? "#8a6d1a" : state === "idle" ? "#1f5c66" : "#222a3a";
      g.fillRect(baseX - w / 2, baseY - h, w, h);
      return;
    }
    const frame = state === "play" ? Math.floor(this.clock * JUKEBOX_FPS) % JUKEBOX_FRAMES : 0;
    const frameW = state === "play" ? Math.round(sprite.width / JUKEBOX_FRAMES) : sprite.width;
    g.save();
    g.translate(Math.round(baseX), 0);
    g.scale(-1, 1);
    g.drawImage(sprite, frame * frameW, 0, frameW, sprite.height, -Math.round(frameW / 2), Math.round(baseY - sprite.height), frameW, sprite.height);
    g.restore();
  }

  private drawPlayer(g: CanvasRenderingContext2D) {
    const p = this.player;
    const scale = depthScale(p.y) * LOCKER_PLAYER_SCALE;
    g.fillStyle = "rgba(5, 8, 20, 0.35)";
    g.beginPath();
    g.ellipse(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(15 * scale)), Math.max(1, Math.round(4.5 * scale)), 0, 0, Math.PI * 2);
    g.fill();
    const atlas = this.image(`characters/${this.character.id}-atlas`);
    if (!atlas) {
      const w = Math.round(22 * scale);
      const h = Math.round(56 * scale);
      g.fillStyle = "#0a0a1a";
      g.fillRect(Math.round(p.x - w / 2) - 2, Math.round(p.y - h) - 2, w + 4, h + 4);
      g.fillStyle = this.character.themeColor;
      g.fillRect(Math.round(p.x - w / 2), Math.round(p.y - h), w, h);
      return;
    }
    const pose = playerPose(p);
    drawEquippedFrame(g, atlas, frameRect(clipDef(pose.clip, pose.dir), pose.frame), this.character.id, this.loadout, (key) => this.image(key) as never, p.x, p.y, { scale, mirror: pose.mirror });
  }

  /**
   * Discoverability: the usable spots (stat analyzer, cabinet, jukebox, whiteboard) get a bobbing label until the
   * player stands in their circle (then the E prompt takes over). Hidden while an overlay or the exit is running.
   */
  private drawInteractHints(g: CanvasRenderingContext2D) {
    if (!this.ready || this.exiting || this.statOpen || this.inventoryOpen || this.playlistOpen || this.squadOpen || this.ctx?.manager.transitionProgress != null) return;
    const active = this.interaction();
    const spots: ReadonlyArray<{ target: LockerTarget; label: string; labelAt: [number, number] }> = [
      { target: "analyzer", label: "스탯 확인", labelAt: [ANALYZER.baseX, 250] },
      { target: "cabinet", label: "인벤토리", labelAt: [CABINET.baseX, 90] },
      { target: "squad", label: "스쿼드 관리", labelAt: [WHITEBOARD.baseX, WHITEBOARD.baseY - 72 * PROP_SCALE + 18] },
      { target: "playlist", label: "플레이리스트", labelAt: [JUKEBOX.baseX, JUKEBOX.baseY - JUKEBOX.spriteH - 22] },
    ];
    const reduced = this.ctx?.host.reducedMotion?.() ?? false;
    for (const spot of spots) {
      if (active === spot.target) continue;
      const bob = reduced ? 0 : Math.round(Math.sin(this.clock * 3) * 2);
      g.font = "10px Galmuri11, monospace";
      const w = Math.ceil(g.measureText(spot.label).width) + 16;
      const x = Math.round(spot.labelAt[0] - w / 2);
      const y = Math.round(spot.labelAt[1]) + bob;
      g.fillStyle = "rgba(10, 10, 26, 0.85)";
      g.fillRect(x, y - 10, w, 20);
      g.strokeStyle = "#ffd23f";
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y - 9.5, w - 1, 19);
      drawText(g, spot.label, spot.labelAt[0], y, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
      // little arrow pointing down at the spot
      g.fillStyle = "#ffd23f";
      g.beginPath();
      g.moveTo(Math.round(spot.labelAt[0]) - 4, y + 11);
      g.lineTo(Math.round(spot.labelAt[0]) + 4, y + 11);
      g.lineTo(Math.round(spot.labelAt[0]), y + 16);
      g.closePath();
      g.fill();
    }
  }

  private drawPromptBubble(g: CanvasRenderingContext2D) {
    const target = this.interaction();
    if (!target) return;
    const p = this.player;
    const label = target === "analyzer" ? "스탯 확인" : target === "cabinet" ? "인벤토리 열기" : target === "playlist" ? "플레이리스트" : target === "squad" ? "스쿼드 관리" : "피치로 나가기";
    drawPrompt(g, this.image("ui/dialog-small"), "E", label, p.x, p.y - Math.round(86 * depthScale(p.y) * LOCKER_PLAYER_SCALE), this.clock);
  }
}
