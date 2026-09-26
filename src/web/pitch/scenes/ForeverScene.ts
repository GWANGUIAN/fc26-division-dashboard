// Jandi Forever hub map (docs/forever/02 §3-§6): walk around with the pet, talk to the NPCs, take quests, hit rabbits, DING!,
// cast the hearthstone or ride the griffin back to the pitch. Every sprite is optional: without art the map is drawn as flat
// colours, labelled circles and text marks, so nothing here waits for an image.

import { clipDef, frameRect } from "../data/animations";
import { resolveStoredCharacter, type PitchCharacter } from "../data/characters";
import { loadLoadout, type Loadout } from "../data/equipment";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import type { PitchSfxId } from "../audio/sfxMap";
import type { AssetImage, PitchAssets } from "../engine/assets";
import { drawEquippedFrame } from "../engine/equipment";
import type { KeyInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawStripFrame } from "../engine/sprite";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import {
  ACHIEVEMENT_TOAST_SECONDS, CAST_LOOP_SECONDS, CAST_SECONDS, CHAT_LINE_SECONDS, CHAT_MAX_LINES, DING_SECONDS, FOREVER_MAPS, FOREVER_MAP_ELWYNN,
  GRIFFIN_SECONDS, MOB_NAMES, MOB_RESPAWN_SECONDS, PORTAL_FPS, PORTAL_PRELOAD_RADIUS, PORTAL_SECONDS, WORLD_CHAT_LINES, WORLD_CHAT_MAX_SECONDS,
  WORLD_CHAT_MIN_SECONDS, foreverTargetAt, mobAt,
  type ForeverMapDef, type ForeverMapId, type ForeverMobKind, type ForeverMobSpot, type ForeverNpcDef, type ForeverTarget,
} from "../game/forever";
import {
  ACHIEVEMENTS, QUESTS, QUEST_ORDER, acceptQuest, advanceQuest, completeQuest, grantAchievement, loadProgress, questMarkFor, questOffered,
  questProgress, questReady, saveProgress, xpToNext, type AchievementId, type ForeverProgress, type QuestDef, type QuestId, type QuestMark,
} from "../game/foreverProgress";
import { LOCKER_PLAYER_SCALE, resolveBoxes } from "../game/locker";
import { createPet, drawPet, resetPet, updatePet, type PetState } from "../game/pet";
import { createPlayer, playerPose, stepPlayer, type PlayerState } from "../game/player";
import { depthScale } from "../game/tuning";
import { drawPrompt } from "./hudCommon";
import { DummyShootScene } from "./DummyShootScene";
import { ForeverLetterScene } from "./ForeverLetterScene";
import { QuestPopupScene, type QuestPopupParams } from "./ForeverQuestScene";
import type { PitchEnterParams } from "./LockerScene";

const INTERACT_KEYS: ReadonlySet<string> = new Set(["KeyE", "Enter", "NumpadEnter"]);
const MOVE_KEYS: readonly string[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
/** The zone banner stays up this long after entering. */
export const ZONE_BANNER_SECONDS = 3;
export const ZONE_NAME = FOREVER_MAP_ELWYNN.zoneName;
export const GUILD_TAG = "<잔디동>";
/** Rest line of the innkeeper when he has no quest to talk about (01 dialogue drafts). */
const INNKEEPER_REST = "휴식 상태입니다. 다음 골 경험치 +100%.";
const LEROY_CHARGE = "잠깐만, 나 아직 스트레칭 안 했는데! ...리로이이이 잔킨스!";

const PLACEHOLDER_LABELS: Readonly<Record<ForeverTarget, string>> = {
  questgiver: "퀘스트",
  leroy: "리로이",
  innkeeper: "여관",
  flightmaster: "그리핀",
  mailbox: "우편함",
  dummy: "허수아비",
  hearthstone: "잔디석",
  portal: "포털",
};

/** The prompt of the portal depends on where it leads. */
const PORTAL_LABELS: Readonly<Record<ForeverMapId, string>> = { elwynn: "몬스터 초원으로", field: "성문 광장으로", orgrimmar: "포털" };

/** Body size of the drop shadow under each monster. */
const MOB_SHADOW: Readonly<Record<ForeverMobKind, number>> = { rabbit: 14, boar: 24, murloc: 20, kobold: 16 };

const PROMPT_LABELS: Readonly<Record<Exclude<ForeverTarget, "portal"> | "mob", string>> = {
  questgiver: "대화",
  leroy: "대화",
  innkeeper: "대화",
  flightmaster: "그리핀 비행",
  mailbox: "우편함",
  dummy: "허수아비",
  hearthstone: "귀환",
  mob: "처치",
};

/** What E would act on: a static spot, or `mob_<index>` (0-based, index into the map's `mobs`) for a live monster. */
export type ForeverInteraction = ForeverTarget | `mob_${number}`;

export type ChatChannel = "world" | "guild" | "party" | "system" | "npc";
const CHAT_COLORS: Readonly<Record<ChatChannel, string>> = { world: "#ff9a3c", guild: "#6be36b", party: "#5aa8ff", system: "#ffd23f", npc: "#ffe9a8" };
const CHAT_PREFIX: Readonly<Record<ChatChannel, string>> = { world: "[월드] ", guild: "[길드] ", party: "[파티] ", system: "", npc: "" };
const QUEST_MARK_KEYS: Readonly<Record<QuestMark, string>> = { available: "ui/forever-quest-available", progress: "ui/forever-quest-progress", complete: "ui/forever-quest-complete" };

interface ChatLine {
  channel: ChatChannel;
  text: string;
  born: number;
}

interface Toast {
  name: string;
  left: number;
}

export interface ForeverParams {
  /** Builds the pitch scene to return to (a factory so this file never imports `PitchScene`). */
  createPitch(): Scene;
  /** Randomness for the world chat (tests pass a fixed source). */
  random?(): number;
  /** Map to start on (default: the first). */
  map?: ForeverMapId;
}

interface Drawable {
  y: number;
  /** Ties: props first, then the actors standing on them. */
  layer: number;
  draw(): void;
}

export class ForeverScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly params: ForeverParams;
  private character: PitchCharacter = resolveStoredCharacter();
  private map: ForeverMapDef;
  private readonly player: PlayerState;
  private readonly pet: PetState;
  private loadout: Loadout = {};
  private clock = 0;
  private exiting = false;

  private progress: ForeverProgress = loadProgress();
  private readonly chat: ChatLine[] = [];
  private nextWorldChat = 0;
  private mobAlive: boolean[];
  private mobBack: number[];
  /** Maps whose art group was already requested from the portal preload. */
  private readonly portalRequested = new Set<ForeverMapId>();
  /** Clock time the current zone banner started at. */
  private bannerAt = 0;
  /** Hearthstone cast in progress: seconds cast so far and the time to the next repeat of the cast sound. */
  private cast: { elapsed: number; loopIn: number } | null = null;
  /** Griffin flight in progress. */
  private flight: { elapsed: number; to: "pitch" | ForeverMapId; ready: boolean; kind: "griffin" | "portal" } | null = null;
  private ding: { elapsed: number; level: number } | null = null;
  private toast: Toast | null = null;
  private readonly toastQueue: string[] = [];

  constructor(params: ForeverParams) {
    this.params = params;
    this.map = FOREVER_MAPS[params.map ?? "elwynn"];
    this.player = createPlayer(this.map.spawn.x, this.map.spawn.y);
    this.pet = createPet(this.map.spawn.x, this.map.spawn.y);
    this.mobAlive = this.map.mobs.map(() => true);
    this.mobBack = this.map.mobs.map(() => 0);
    // enters facing up, toward the square
    this.player.fx = 0;
    this.player.fy = -1;
  }

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    this.character = resolveStoredCharacter();
    this.loadout = loadLoadout(this.character.id);
    this.progress = loadProgress();
    resetPet(this.pet, this.player.x, this.player.y);
    if (this.loadout.pet) void this.assets.loadGroup(`pets:${this.character.id}`).catch(() => undefined);
    this.audio.playBgm("forever");
    this.audio.playSfx("forever-zone-enter");
    this.say("system", `${this.map.zoneName}에 입장했습니다.`);
    this.say("guild", `잔디동: 어서 오세요, ${this.character.name}님!`);
    this.scheduleWorldChat();
  }

  exit() {
    this.audio.stopSfx("forever-cast-loop");
    this.ctx?.host.setCursor("default");
  }

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  private random() {
    return (this.params.random ?? Math.random)();
  }

  // ---- read-only state (used by the tests and the HUD) ----

  get level() {
    return this.progress.level;
  }

  get castSeconds(): number | null {
    return this.cast ? this.cast.elapsed : null;
  }

  get dinging() {
    return this.ding !== null;
  }

  get mapId(): ForeverMapId {
    return this.map.id;
  }

  get flying() {
    return this.flight !== null;
  }

  progressSnapshot(): ForeverProgress {
    return this.progress;
  }

  chatLines(): string[] {
    return this.chat.map((line) => `${CHAT_PREFIX[line.channel]}${line.text}`);
  }

  /** Alive state of the monsters, index-aligned with the map's `mobs`. */
  mobsAlive(): readonly boolean[] {
    return this.mobAlive;
  }

  /** The unread letter waits in the mailbox (the sprite and the icon show it). */
  get letterWaiting() {
    return !this.progress.letterRead;
  }

  // ---- chat / toast / progress ----

  private say(channel: ChatChannel, text: string) {
    this.chat.push({ channel, text, born: this.clock });
    while (this.chat.length > CHAT_MAX_LINES) this.chat.shift();
    if (channel === "world") this.audio.playSfx("forever-chat");
  }

  private scheduleWorldChat() {
    this.nextWorldChat = this.clock + WORLD_CHAT_MIN_SECONDS + this.random() * (WORLD_CHAT_MAX_SECONDS - WORLD_CHAT_MIN_SECONDS);
  }

  private commit(next: ForeverProgress) {
    this.progress = next;
    saveProgress(next);
  }

  private sfx(id: PitchSfxId) {
    this.audio.playSfx(id);
  }

  private earn(id: AchievementId) {
    const granted = grantAchievement(this.progress, id);
    if (!granted.added) return;
    this.commit(granted.progress);
    this.say("system", `업적 달성: ${ACHIEVEMENTS[id].name}`);
    this.toastQueue.push(id);
  }

  private triggerDing(level: number) {
    this.ding = { elapsed: 0, level };
    this.sfx("forever-ding");
    this.say("system", `축하합니다! 레벨 ${level}에 도달했습니다.`);
    if (level >= 2) this.earn("level2");
  }

  // ---- interaction ----

  private busy() {
    return this.exiting || this.ctx?.manager.transitionProgress != null || this.cast !== null || this.flight !== null;
  }

  /** What a press of E would do right now: a monster or spot in reach, or null while the scene is busy. */
  interaction(): ForeverInteraction | null {
    if (this.busy()) return null;
    const mob = mobAt(this.player.x, this.player.y, this.mobAlive, this.map.mobs);
    if (mob >= 0) return `mob_${mob}`;
    return foreverTargetAt(this.player.x, this.player.y, this.map.zones);
  }

  onKey(e: KeyInput) {
    if (this.exiting) return;
    if (this.cast && MOVE_KEYS.includes(e.code)) {
      this.cancelCast();
      return;
    }
    if (!INTERACT_KEYS.has(e.code) || this.busy()) return;
    const target = this.interaction();
    if (!target) return;
    if (target.startsWith("mob_")) this.hitMob(Number(target.slice(4)));
    else this.interact(target as ForeverTarget);
  }

  private interact(target: ForeverTarget) {
    switch (target) {
      case "hearthstone":
        this.startCast();
        break;
      case "flightmaster":
        this.openFlightMenu();
        break;
      case "questgiver":
      case "leroy":
      case "innkeeper":
        this.talkTo(target);
        break;
      case "mailbox":
        this.openLetter();
        break;
      case "portal":
        this.usePortal();
        break;
      case "dummy":
        this.ctx?.manager.push(new DummyShootScene());
        break;
    }
  }

  private npcName(id: string) {
    return this.map.npcs.find((npc) => npc.id === id)?.name ?? id;
  }

  private talkTo(npc: "questgiver" | "leroy" | "innkeeper") {
    this.sfx("forever-npc-greet");
    if (!this.map.quests) {
      this.say("npc", `${this.npcName(npc)}: ${this.map.talk[npc] ?? "..."}`);
      return;
    }
    // 1. hand something in (a talk quest is handed in by speaking to its NPC)
    for (const id of QUEST_ORDER) {
      const def = QUESTS[id];
      if (def.turnIn !== npc || questProgress(this.progress, id).state !== "active") continue;
      if (def.kind === "talk" && !questReady(this.progress, id)) this.commit(advanceQuest(this.progress, id, def.goal));
      if (questReady(this.progress, id)) {
        this.openQuest(def, "turnin");
        return;
      }
    }
    // 2. offer a quest
    for (const id of QUEST_ORDER) {
      if (QUESTS[id].giver === npc && questOffered(this.progress, id)) {
        this.openQuest(QUESTS[id], "offer");
        return;
      }
    }
    // 3. remind of an open quest
    for (const id of QUEST_ORDER) {
      if (QUESTS[id].turnIn === npc && questProgress(this.progress, id).state === "active") {
        this.openQuest(QUESTS[id], "info");
        return;
      }
    }
    // 4. small talk
    if (npc === "leroy") {
      this.say("npc", `${this.npcName(npc)}: ${LEROY_CHARGE}`);
      this.sfx("forever-leroy-charge");
    } else if (npc === "innkeeper") this.say("npc", `${this.npcName(npc)}: ${INNKEEPER_REST}`);
    else this.say("npc", `${this.npcName(npc)}: 오늘은 더 맡길 임무가 없네. 잔디밭을 즐기게.`);
  }

  private openQuest(def: QuestDef, mode: "offer" | "turnin" | "info") {
    const ctx = this.ctx;
    if (!ctx) return;
    const body = mode === "offer" ? def.offer : mode === "turnin" ? def.finish : def.progress;
    const count = questProgress(this.progress, def.id).count;
    const params: QuestPopupParams = {
      mode,
      title: def.name,
      body: mode === "info" && def.goal > 1 ? `${body} (${count}/${def.goal})` : body,
      reward: mode === "info" ? undefined : def.reward,
      onConfirm: () => (mode === "offer" ? this.acceptQuest(def.id) : this.turnInQuest(def.id)),
    };
    ctx.manager.push(new QuestPopupScene(params));
  }

  private acceptQuest(id: QuestId) {
    const next = acceptQuest(this.progress, id);
    if (next === this.progress) return;
    this.commit(next);
    this.sfx("forever-quest-accept");
    this.say("system", `퀘스트 수락: 「${QUESTS[id].name}」`);
  }

  private turnInQuest(id: QuestId) {
    const done = completeQuest(this.progress, id);
    if (done.progress === this.progress) return;
    this.commit(done.progress);
    this.sfx("forever-quest-complete");
    this.say("system", `퀘스트 완료: 「${QUESTS[id].name}」`);
    if (id === "q_leroy") this.say("npc", `${this.npcName("leroy")}: ${LEROY_CHARGE}`);
    if (done.achievement) {
      this.say("system", `업적 달성: ${ACHIEVEMENTS[done.achievement].name}`);
      this.toastQueue.push(done.achievement);
    }
    // xp is paid inside `completeQuest`; only the announcements are left
    const def = QUESTS[id];
    if (def.xp > 0) this.say("system", `경험치 ${def.xp}을(를) 획득했습니다.`);
    const level = done.levelsGained[done.levelsGained.length - 1];
    if (level !== undefined) this.triggerDing(level);
  }

  /** The mailbox: the letter to Woowakgood opens on top of the map; the first reading is announced in the chat and remembered. */
  private openLetter() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.sfx("forever-mailbox");
    if (!this.progress.letterRead) {
      this.commit({ ...this.progress, letterRead: true });
      this.say("system", "우편함: 우왁굳에게 온 편지를 읽었습니다.");
    }
    ctx.manager.push(new ForeverLetterScene());
  }

  private usePortal() {
    const portal = this.map.portal;
    if (portal) this.startFlight(portal.to, "portal");
  }

  private hitMob(index: number) {
    const spot = this.map.mobs[index];
    if (!spot || !this.mobAlive[index]) return;
    this.mobAlive[index] = false;
    this.mobBack[index] = MOB_RESPAWN_SECONDS;
    if (spot.kind !== "rabbit") {
      this.sfx("forever-mob-defeat");
      if (spot.kind === "murloc") this.sfx("forever-murloc");
      this.say("system", `${MOB_NAMES[spot.kind]}을(를) 처치했습니다.`);
      return;
    }
    this.sfx("forever-rabbit-hit");
    const before = questProgress(this.progress, "q_rabbits");
    const next = advanceQuest(this.progress, "q_rabbits");
    if (next === this.progress) {
      this.say("system", "토끼를 처치했습니다.");
      return;
    }
    this.commit(next);
    this.sfx("forever-quest-progress");
    const goal = QUESTS.q_rabbits.goal;
    this.say("system", `토끼 처치: ${before.count + 1}/${goal}`);
    if (questReady(next, "q_rabbits")) this.say("system", `목표 달성: ${this.npcName("questgiver")}에게 돌아가세요.`);
  }

  // ---- hearthstone cast / griffin ----

  private startCast() {
    if (this.cast) return;
    this.cast = { elapsed: 0, loopIn: CAST_LOOP_SECONDS };
    this.sfx("forever-cast-loop");
    this.say("system", "잔디석 귀환을 시전합니다...");
  }

  private cancelCast() {
    if (!this.cast) return;
    this.cast = null;
    this.audio.stopSfx("forever-cast-loop");
    this.sfx("forever-cast-cancel");
    this.say("system", "시전이 취소되었습니다.");
  }

  private completeCast() {
    this.cast = null;
    this.audio.stopSfx("forever-cast-loop");
    // the hearth quest counts the recall; it is handed in at the innkeeper on the next visit
    this.commit(advanceQuest(this.progress, "q_hearth"));
    this.sfx("forever-cast-complete");
    this.leaveToPitch();
  }

  /** The flight master menu: back to the pitch, or over to the other map. */
  private openFlightMenu() {
    const ctx = this.ctx;
    if (!ctx) return;
    const other = FOREVER_MAPS[this.map.flightTo];
    ctx.manager.push(
      new QuestPopupScene({
        mode: "menu",
        title: "비행 조련사",
        body: "",
        options: [
          { label: "피치로 돌아가기", onPick: () => this.startFlight("pitch") },
          { label: `${other.zoneName.split(" — ")[0]}(으)로 이동`, onPick: () => this.startFlight(other.id) },
        ],
      }),
    );
  }

  private startFlight(to: "pitch" | ForeverMapId, kind: "griffin" | "portal" = "griffin") {
    if (this.flight) return;
    const group = to === "pitch" ? null : FOREVER_MAPS[to].group;
    const flight = { elapsed: 0, to, ready: !group || group === this.map.group, kind };
    this.flight = flight;
    // the other map art is fetched while the griffin flies; a failed load still lets the map open (placeholder art)
    if (!flight.ready && group && this.assets) {
      const done = () => void (flight.ready = true);
      this.assets.loadGroup(group).then(done, done);
    }
    if (kind === "portal") this.sfx("forever-portal-enter");
    else {
      this.sfx("forever-griffin");
      this.say("system", "그리핀 비행 중…");
    }
  }

  /** Lands on `id`: new floor, spawn, rabbits and banner; the chat and the progress stay. */
  private switchMap(id: ForeverMapId) {
    this.map = FOREVER_MAPS[id];
    this.flight = null;
    this.cast = null;
    Object.assign(this.player, { x: this.map.spawn.x, y: this.map.spawn.y, vx: 0, vy: 0, fx: 0, fy: -1 });
    resetPet(this.pet, this.player.x, this.player.y);
    this.mobAlive = this.map.mobs.map(() => true);
    this.mobBack = this.map.mobs.map(() => 0);
    this.bannerAt = this.clock;
    this.sfx("forever-zone-enter");
    this.say("system", `${this.map.zoneName}에 도착했습니다.`);
  }

  private leaveToPitch() {
    const ctx = this.ctx;
    if (!ctx || this.exiting || ctx.manager.transitionProgress !== null) return;
    this.exiting = true;
    const params: PitchEnterParams = { fromForever: true };
    ctx.manager.replace(this.params.createPitch(), params, { transition: "wipe" });
  }

  // ---- frame ----

  update(dt: number) {
    this.clock += dt;
    const host = this.ctx?.host;
    const p = this.player;
    const frozen = !host || this.exiting || this.ctx?.manager.transitionProgress != null || this.cast !== null || this.flight !== null;
    const down = (code: string) => (host?.input.isDown(code) ? 1 : 0);
    stepPlayer(p, frozen ? { dx: 0, dy: 0, sprint: false } : { dx: down("ArrowRight") - down("ArrowLeft"), dy: down("ArrowDown") - down("ArrowUp"), sprint: false }, dt, this.map.area);
    resolveBoxes(p, this.map.colliders, undefined, this.map.area);
    updatePet(this.pet, p, dt, Math.abs(p.fx) > 0.3 ? Math.sign(p.fx) : 0);

    this.updateCast(dt, down);
    this.updateFlight(dt);
    this.preloadPortal();
    this.updateMobs(dt);
    this.updateEffects(dt);
    if (this.clock >= this.nextWorldChat && !this.exiting) {
      this.say("world", WORLD_CHAT_LINES[Math.floor(this.random() * WORLD_CHAT_LINES.length) % WORLD_CHAT_LINES.length]!);
      this.scheduleWorldChat();
    }
  }

  private updateCast(dt: number, down: (code: string) => number) {
    const cast = this.cast;
    if (!cast) return;
    if (MOVE_KEYS.some((code) => down(code))) {
      this.cancelCast();
      return;
    }
    cast.elapsed += dt;
    cast.loopIn -= dt;
    if (cast.loopIn <= 0 && cast.elapsed < CAST_SECONDS) {
      cast.loopIn += CAST_LOOP_SECONDS;
      this.sfx("forever-cast-loop");
    }
    if (cast.elapsed >= CAST_SECONDS) this.completeCast();
  }

  private updateFlight(dt: number) {
    if (!this.flight) return;
    this.flight.elapsed += dt;
    if (this.flight.elapsed < (this.flight.kind === "portal" ? PORTAL_SECONDS : GRIFFIN_SECONDS)) return;
    if (this.flight.to === "pitch") this.leaveToPitch();
    else if (this.flight.ready) this.switchMap(this.flight.to);
  }

  private updateMobs(dt: number) {
    for (let i = 0; i < this.mobAlive.length; i++) {
      if (this.mobAlive[i]) continue;
      this.mobBack[i]! -= dt;
      if (this.mobBack[i]! <= 0) this.mobAlive[i] = true;
    }
  }

  /** Near the portal the art group of its destination is fetched, so the walk through only has to fade. A failed load still opens the map. */
  private preloadPortal() {
    const portal = this.map.portal;
    const zone = this.map.zones.portal;
    if (!portal || !zone || this.portalRequested.has(portal.to) || !this.assets) return;
    if (Math.hypot(this.player.x - zone.x, this.player.y - zone.y) >= PORTAL_PRELOAD_RADIUS) return;
    const group = FOREVER_MAPS[portal.to].group;
    if (group === this.map.group) return;
    this.portalRequested.add(portal.to);
    void this.assets.loadGroup(group).catch(() => undefined);
  }

  private updateEffects(dt: number) {
    if (this.ding) {
      this.ding.elapsed += dt;
      if (this.ding.elapsed >= DING_SECONDS) this.ding = null;
    }
    if (this.toast) {
      this.toast.left -= dt;
      if (this.toast.left <= 0) this.toast = null;
    }
    if (!this.toast && this.toastQueue.length > 0) {
      const id = this.toastQueue.shift() as AchievementId;
      this.toast = { name: id, left: ACHIEVEMENT_TOAST_SECONDS };
      this.sfx("forever-achievement");
    }
  }

  render(g: CanvasRenderingContext2D) {
    const bg = this.image(this.map.bg);
    if (bg) g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    else this.drawPlaceholderMap(g);
    this.drawSorted(g);
    this.drawOverheads(g);
    this.drawDing(g);
    this.drawBanner(g);
    this.drawToast(g);
    this.drawChat(g);
    this.drawXpBar(g);
    this.drawCastBar(g);
    drawText(g, "방향키 이동 · E 상호작용", 16, 526, { size: 10, color: "#9fe9ff", baseline: "middle" });
    this.drawInteractPrompt(g);
    this.drawFlight(g);
  }

  /** Head top of the player in the scene's units (the prompt and the name plate sit above it). */
  private headTop() {
    const p = this.player;
    return p.y - Math.round(86 * depthScale(p.y) * LOCKER_PLAYER_SCALE);
  }

  private drawInteractPrompt(g: CanvasRenderingContext2D) {
    const target = this.interaction();
    if (!target) return;
    const label = target.startsWith("mob_") ? PROMPT_LABELS.mob : target === "portal" ? PORTAL_LABELS[this.map.id] : PROMPT_LABELS[target as Exclude<ForeverTarget, "portal">];
    drawPrompt(g, this.image("ui/dialog-small"), "E", label, this.player.x, this.headTop() - 26, this.clock);
  }

  /** Flat ground, the colliders as dark blocks and the interaction spots as labelled circles. */
  private drawPlaceholderMap(g: CanvasRenderingContext2D) {
    const red = this.map.id === "orgrimmar";
    g.fillStyle = red ? "#3a1a10" : "#16321c";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.fillStyle = red ? "#5a2c18" : this.map.id === "field" ? "#2a5a2a" : "#1f4a28";
    g.fillRect(0, this.map.area.minY - 30, LOGICAL_WIDTH, LOGICAL_HEIGHT - (this.map.area.minY - 30));
    g.fillStyle = "#0a0a1a";
    for (const box of this.map.colliders) g.fillRect(box.x, box.y, box.w, box.h);
    const active = this.interaction();
    for (const id of Object.keys(this.map.zones) as ForeverTarget[]) {
      const zone = this.map.zones[id];
      if (!zone) continue;
      g.beginPath();
      g.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
      g.fillStyle = id === active ? "rgba(255, 210, 63, 0.25)" : "rgba(255, 255, 255, 0.08)";
      g.fill();
      drawText(g, PLACEHOLDER_LABELS[id], zone.x, zone.y, { size: 10, color: id === active ? TEXT_COLORS.gold : "#9fe9ff", align: "center", baseline: "middle" });
    }
  }

  private drawBanner(g: CanvasRenderingContext2D) {
    const age = this.clock - this.bannerAt;
    if (age >= ZONE_BANNER_SECONDS) return;
    const fade = Math.min(1, (ZONE_BANNER_SECONDS - age) / 0.5);
    g.save();
    g.globalAlpha = fade;
    g.font = "20px Galmuri11, monospace";
    const w = Math.ceil(g.measureText(this.map.zoneName).width) + 24;
    g.fillStyle = "rgba(10, 10, 26, 0.85)";
    g.fillRect(Math.round(LOGICAL_WIDTH / 2 - w / 2), 24, w, 32);
    drawText(g, this.map.zoneName, LOGICAL_WIDTH / 2, 40, { size: 20, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    g.restore();
  }

  /** Props, the portal, NPCs, monsters, the player and the pet back to front by their feet y. */
  private drawSorted(g: CanvasRenderingContext2D) {
    const items: Drawable[] = [{ y: this.player.y, layer: 1, draw: () => this.drawPlayer(g) }];
    if (this.loadout.pet) items.push({ y: this.pet.y, layer: 1, draw: () => this.drawPetSprite(g) });
    for (const prop of this.map.props) {
      items.push({
        y: prop.y,
        layer: 0,
        draw: () => {
          // the mailbox shows the letter sticking out until it has been read
          const id = prop.id === "mailbox" && this.letterWaiting ? "mailbox-mail" : prop.id;
          const image = this.image(`env/forever-prop-${id}`) ?? this.image(`env/forever-prop-${prop.id}`);
          if (image) g.drawImage(image, Math.round(prop.x - image.width / 2), Math.round(prop.y - image.height));
        },
      });
    }
    const portal = this.map.portal;
    if (portal) items.push({ y: portal.y, layer: 0, draw: () => this.drawPortal(g, portal) });
    for (const npc of this.map.npcs) items.push({ y: npc.y, layer: 1, draw: () => this.drawNpc(g, npc) });
    this.map.mobs.forEach((spot, index) => {
      if (this.mobAlive[index]) items.push({ y: spot.y, layer: 1, draw: () => this.drawMob(g, spot, index) });
    });
    items.sort((a, b) => a.y - b.y || a.layer - b.layer);
    for (const item of items) item.draw();
  }

  private idleFrame(offset: number) {
    return Math.floor(this.clock * 2 + offset) % 2;
  }

  private drawNpc(g: CanvasRenderingContext2D, npc: ForeverNpcDef) {
    const sheet = this.image(npc.sprite);
    g.fillStyle = "rgba(5, 8, 20, 0.35)";
    g.beginPath();
    g.ellipse(npc.x, npc.y, 20, 6, 0, 0, Math.PI * 2);
    g.fill();
    if (sheet) {
      drawStripFrame(g, sheet, 2, this.idleFrame(npc.x / 97), npc.x, npc.y);
      return;
    }
    g.fillStyle = "#0a0a1a";
    g.fillRect(npc.x - 13, npc.y - 62, 26, 62);
    g.fillStyle = npc.color ?? "#5aa8ff";
    g.fillRect(npc.x - 11, npc.y - 60, 22, 58);
  }

  private drawMob(g: CanvasRenderingContext2D, spot: ForeverMobSpot, index: number) {
    const sheet = this.image(`characters/forever-mob-${spot.kind}`);
    g.fillStyle = "rgba(5, 8, 20, 0.3)";
    g.beginPath();
    g.ellipse(spot.x, spot.y, MOB_SHADOW[spot.kind], 4, 0, 0, Math.PI * 2);
    g.fill();
    if (sheet) drawStripFrame(g, sheet, 2, this.idleFrame(index * 0.37), spot.x, spot.y);
    else {
      g.fillStyle = spot.kind === "rabbit" ? "#e8e0d0" : "#8a6a4a";
      g.fillRect(spot.x - 8, spot.y - 14, 16, 14);
    }
  }

  /** The 3-frame swirl of a portal (one still frame with reduced motion), base point on the ground. */
  private drawPortal(g: CanvasRenderingContext2D, portal: { sprite: string; x: number; y: number }) {
    const sheet = this.image(portal.sprite);
    if (!sheet) {
      g.fillStyle = "#0a0a1a";
      g.fillRect(portal.x - 32, portal.y - 76, 64, 76);
      g.fillStyle = "#6a5cff";
      g.fillRect(portal.x - 28, portal.y - 72, 56, 68);
      return;
    }
    const reduced = this.ctx?.host.reducedMotion?.() ?? false;
    drawStripFrame(g, sheet, 3, reduced ? 0 : Math.floor(this.clock * PORTAL_FPS) % 3, portal.x, portal.y);
  }

  private drawPetSprite(g: CanvasRenderingContext2D) {
    const petId = this.loadout.pet;
    if (!petId) return;
    drawPet(g, this.image(`pets/pet-${petId}`), this.pet, depthScale(this.pet.y) * LOCKER_PLAYER_SCALE);
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

  // ---- overlays ----

  /** Name plates, the guild tag and the quest marks: drawn above everything so no sprite hides them. */
  private drawOverheads(g: CanvasRenderingContext2D) {
    for (const npc of this.map.npcs) {
      drawText(g, npc.name, npc.x, npc.y - 88, { size: 10, color: npc.color ?? "#fff3b0", align: "center", baseline: "middle" });
      const mark = this.map.quests ? questMarkFor(this.progress, npc.id) : null;
      if (mark) this.drawMark(g, mark, npc.x, npc.y - 96, npc.id);
    }
    if (this.letterWaiting) {
      for (const prop of this.map.props) if (prop.id === "mailbox") this.drawMailIcon(g, prop.x, prop.y - 70);
    }
    const p = this.player;
    const top = this.headTop();
    drawText(g, GUILD_TAG, p.x, top - 22, { size: 10, color: "#6be36b", align: "center", baseline: "middle" });
    drawText(g, this.character.name, p.x, top - 10, { size: 10, align: "center", baseline: "middle" });
  }

  /** The envelope bobbing over the mailbox while its letter is unread. */
  private drawMailIcon(g: CanvasRenderingContext2D, x: number, bottom: number) {
    const bob = Math.round(Math.sin(this.clock * 4) * 2);
    const image = this.image("ui/forever-mail-icon");
    if (image) g.drawImage(image, Math.round(x - image.width / 2), Math.round(bottom - image.height + bob));
    else drawText(g, "편지", x, bottom - 8 + bob, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
  }

  private drawMark(g: CanvasRenderingContext2D, mark: QuestMark, x: number, bottom: number, seed: string) {
    const bob = Math.round(Math.sin(this.clock * 4 + seed.length) * 2);
    const image = this.image(QUEST_MARK_KEYS[mark]);
    if (image) {
      g.drawImage(image, Math.round(x - image.width / 2), Math.round(bottom - image.height + bob));
      return;
    }
    const yellow = mark !== "progress";
    drawText(g, mark === "available" ? "!" : "?", x, bottom - 14 + bob, { size: 24, color: yellow ? TEXT_COLORS.gold : "#9aa0ad", align: "center", baseline: "middle" });
  }

  private drawDing(g: CanvasRenderingContext2D) {
    const ding = this.ding;
    if (!ding) return;
    const t = ding.elapsed / DING_SECONDS;
    const fade = Math.min(1, (1 - t) / 0.25);
    const p = this.player;
    const pillar = this.image("ui/forever-ding-pillar");
    const burst = this.image("ui/forever-ding-burst");
    g.save();
    g.globalAlpha = Math.max(0, fade);
    if (pillar) g.drawImage(pillar, Math.round(p.x - pillar.width / 2), Math.round(p.y - pillar.height * 1.5), pillar.width, pillar.height * 1.5);
    if (burst) {
      const size = Math.round(burst.width * (1 + t * 1.2));
      g.drawImage(burst, Math.round(p.x - size / 2), Math.round(p.y - 48 - size / 2), size, size);
    }
    g.restore();
    const pop = Math.min(1, t / 0.15);
    g.save();
    g.globalAlpha = Math.max(0, fade);
    drawText(g, "DING!", LOGICAL_WIDTH / 2, 190 - Math.round(t * 20), { size: Math.round(24 + 28 * pop), color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    drawText(g, `레벨 ${ding.level}`, LOGICAL_WIDTH / 2, 232 - Math.round(t * 20), { size: 14, align: "center", baseline: "middle" });
    g.restore();
  }

  private drawToast(g: CanvasRenderingContext2D) {
    const toast = this.toast;
    if (!toast) return;
    const def = ACHIEVEMENTS[toast.name as AchievementId];
    const fade = Math.min(1, toast.left / 0.4, (ACHIEVEMENT_TOAST_SECONDS - toast.left) / 0.3);
    const x = Math.round((LOGICAL_WIDTH - 240) / 2);
    const y = 66;
    g.save();
    g.globalAlpha = Math.max(0, fade);
    const plate = this.image("ui/forever-toast");
    if (plate) g.drawImage(plate, x, y, 240, 120);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(x + 4, y + 26, 232, 68);
      g.fillStyle = "#3d4f6b";
      g.fillRect(x + 6, y + 28, 228, 64);
    }
    // the silver plate of the art spans about x 104..232, y 32..88 of the 240×120 sheet
    const cx = x + 168;
    drawText(g, "업적 달성!", cx, y + 48, { size: 10, color: "#8a4b00", align: "center", baseline: "middle", shadow: false });
    drawText(g, def?.name ?? toast.name, cx, y + 68, { size: 11, color: "#0a0a1a", align: "center", baseline: "middle", shadow: false });
    g.restore();
  }

  private drawChat(g: CanvasRenderingContext2D) {
    const visible = this.chat.filter((line) => this.clock - line.born < CHAT_LINE_SECONDS);
    if (visible.length === 0) return;
    const alphaOf = (line: ChatLine) => Math.max(0, Math.min(1, CHAT_LINE_SECONDS - (this.clock - line.born)));
    const strongest = Math.max(...visible.map(alphaOf));
    const rowH = 15;
    const bottom = 512;
    g.save();
    g.globalAlpha = 0.5 * strongest;
    g.fillStyle = "#05060f";
    g.fillRect(8, bottom - visible.length * rowH - 6, 380, visible.length * rowH + 10);
    g.restore();
    visible.forEach((line, index) => {
      g.save();
      g.globalAlpha = alphaOf(line);
      drawText(g, `${CHAT_PREFIX[line.channel]}${line.text}`, 14, bottom - (visible.length - 1 - index) * rowH - 6, { size: 10, color: CHAT_COLORS[line.channel], baseline: "middle" });
      g.restore();
    });
  }

  /** A framed bar: `image` (240×80 art) at `scale`, its dark inside filled by `ratio` with `color`, and `label` centred on it. */
  private drawBar(g: CanvasRenderingContext2D, key: string, cx: number, top: number, scale: number, ratio: number, color: string, label: string) {
    const w = Math.round(240 * scale);
    const h = Math.round(80 * scale);
    const left = Math.round(cx - w / 2);
    const image = this.image(key);
    // the dark inside of the art spans about x 9..91 %, y 34..66 % of the sheet
    const ix = left + Math.round(w * 0.09);
    const iy = top + Math.round(h * 0.34);
    const iw = Math.round(w * 0.82);
    const ih = Math.round(h * 0.32);
    if (image) g.drawImage(image, left, top, w, h);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(ix - 3, iy - 3, iw + 6, ih + 6);
    }
    g.fillStyle = "#0e1526";
    g.fillRect(ix, iy, iw, ih);
    g.fillStyle = color;
    g.fillRect(ix, iy, Math.round(iw * Math.max(0, Math.min(1, ratio))), ih);
    drawText(g, label, cx, iy + Math.round(ih / 2), { size: 10, align: "center", baseline: "middle" });
  }

  private drawXpBar(g: CanvasRenderingContext2D) {
    const next = xpToNext(this.progress.level);
    this.drawBar(g, "ui/forever-xp-bar", 480, 470, 0.75, this.progress.xp / next, "#8a5cff", `Lv.${this.progress.level}  ${this.progress.xp}/${next}`);
  }

  private drawCastBar(g: CanvasRenderingContext2D) {
    const cast = this.cast;
    if (!cast) return;
    const left = Math.max(0, CAST_SECONDS - cast.elapsed);
    this.drawBar(g, "ui/forever-cast-bar", 480, 396, 1, cast.elapsed / CAST_SECONDS, TEXT_COLORS.gold, `잔디석 귀환 ${left.toFixed(1)}`);
  }

  private drawFlight(g: CanvasRenderingContext2D) {
    const flight = this.flight;
    if (!flight) return;
    const t = Math.min(1, flight.elapsed / (flight.kind === "portal" ? PORTAL_SECONDS : GRIFFIN_SECONDS));
    g.save();
    g.globalAlpha = Math.min(1, t * 1.6);
    g.fillStyle = "#05060f";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (flight.kind === "griffin") drawText(g, "그리핀 비행 중…", LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, { size: 20, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    g.restore();
  }
}
