// Character select overlay (docs/pitch/03 §3). Pushed on top of the pitch (which pauses underneath): 12 cards in a 6×2
// grid, the cursor character's hero + idle→run preview, name plate, confirm / cancel. `select` assets load lazily on
// open (skeleton cards until then). Confirm loads the `char:<id>` group first — the card shows a loader ball — and
// only after it succeeds is the choice saved and applied; a failed load keeps the current character.

import { clipDef, frameAt, frameRect } from "../data/animations";
import { PITCH_CHARACTERS, characterIndex, type PitchCharacter } from "../data/characters";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import type { AssetGroupName, AssetImage, PitchAssets } from "../engine/assets";
import type { KeyInput, PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawFrame, drawNineSlice, drawStripFrame } from "../engine/sprite";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { savePitchCharacter } from "../../storage";
import { cardAt, cardRect, moveCursor, stepCursor, type GridDir } from "./selectGrid";

type Rect = { x: number; y: number; w: number; h: number };
type ButtonId = "dashboard" | "cancel" | "confirm" | "prev" | "next";

// The dashboard button keeps its pitch position (03 §0); values mirror PitchScene.DASHBOARD_BUTTON.
export const SELECT_DASHBOARD_BUTTON: Rect = { x: 732, y: 16, w: 212, h: 48 };
export const SELECT_CONFIRM_BUTTON: Rect = { x: 720, y: 440, w: 216, h: 48 };
export const SELECT_CANCEL_BUTTON: Rect = { x: 496, y: 440, w: 200, h: 48 };
/** Row arrows flank the name plate (the grid itself reaches x=936, so there is no room beside the cards). */
export const SELECT_PREV_BUTTON: Rect = { x: 284, y: 392, w: 32, h: 32 };
export const SELECT_NEXT_BUTTON: Rect = { x: 924, y: 392, w: 32, h: 32 };
export const SELECT_NAME_PLATE: Rect = { x: 320, y: 388, w: 600, h: 40 };

const BUTTONS: ReadonlyArray<{ id: ButtonId; rect: Rect }> = [
  { id: "dashboard", rect: SELECT_DASHBOARD_BUTTON },
  { id: "confirm", rect: SELECT_CONFIRM_BUTTON },
  { id: "cancel", rect: SELECT_CANCEL_BUTTON },
  { id: "prev", rect: SELECT_PREV_BUTTON },
  { id: "next", rect: SELECT_NEXT_BUTTON },
];

export const OPEN_FADE_SECONDS = 0.15;
export const OPEN_SLIDE_SECONDS = 0.2;
export const DOUBLE_CLICK_SECONDS = 0.4;
/** The cursor must rest this long on a card before its atlas is fetched for the run preview. */
export const PREVIEW_DWELL_SECONDS = 0.25;
export const FAIL_TOAST_SECONDS = 2.2;

const HERO_CENTER_X = 215;
const HERO_MAX_HEIGHT = 290;
const HERO_BOTTOM_Y = 340;
const PREVIEW_FOOT_Y = 452;
const PREVIEW_SCALE = 0.8;
/** Idle for 1.2s, then run for 1.2s, looping (03 §3 "idle→run"). */
const PREVIEW_IDLE_SECONDS = 1.2;
const PREVIEW_CYCLE_SECONDS = 2.4;

const groupOf = (id: string): AssetGroupName => `char:${id}`;
const atlasKey = (id: string) => `characters/${id}-atlas`;

const inside = (rect: Rect, x: number, y: number) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;

export interface CharacterSelectParams {
  /** The character the pitch plays right now. */
  currentId: string;
  /** Called once the new character's group is loaded and its id saved; the pitch swaps sprites and resets. */
  onApply(character: PitchCharacter): void;
  /** Test hook. */
  save?: (id: string) => void;
}

export class CharacterSelectScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly params: CharacterSelectParams;

  private activeId: string;
  private cursor: number;
  private clock = 0;
  private age = 0;
  private selectLoading = true;
  private closed = false;

  private hovered: ButtonId | null = null;
  private pressed: ButtonId | null = null;
  private pressedCard = -1;
  private lastClick: { index: number; at: number } | null = null;

  /** The character being loaded after a confirm, or null. Cancel/close invalidates it (its result is then ignored). */
  private pending: { id: string; token: number } | null = null;
  private nextToken = 0;
  private failure: { text: string; left: number } | null = null;

  private dwell = 0;
  /** `char:<id>` groups fetched only for the run preview (never the active character). */
  private readonly previewIds = new Set<string>();
  private readonly previewLoading = new Set<string>();

  constructor(params: CharacterSelectParams) {
    this.params = params;
    this.activeId = params.currentId;
    this.cursor = characterIndex(params.currentId);
  }

  // ---- lifecycle ----

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    this.audio.playSfx("ui-select");
    void this.assets.loadGroup("select").then(
      () => {
        this.selectLoading = false;
      },
      () => {
        this.selectLoading = false;
      },
    );
  }

  exit() {
    this.closed = true;
    this.pending = null;
    this.ctx?.host.setCursor("default");
    for (const id of this.previewIds) if (id !== this.activeId) this.assets?.release(groupOf(id));
    this.previewIds.clear();
    this.assets?.release("select");
  }

  private reduced() {
    return this.ctx?.host.reducedMotion?.() ?? false;
  }

  private cursorCharacter(): PitchCharacter {
    return PITCH_CHARACTERS[this.cursor] ?? PITCH_CHARACTERS[0]!;
  }

  // ---- update ----

  update(dt: number) {
    this.clock += dt;
    this.age += dt;
    if (this.failure) {
      this.failure.left -= dt;
      if (this.failure.left <= 0) this.failure = null;
    }
    this.updatePreview(dt);
  }

  /** After the cursor rests on a card, fetch its atlas for the run preview; only the cursor's atlas stays besides the active one. */
  private updatePreview(dt: number) {
    const assets = this.assets;
    if (!assets || this.pending) return;
    const id = this.cursorCharacter().id;
    if (id === this.activeId || assets.has(atlasKey(id)) || this.previewLoading.has(id)) return;
    this.dwell += dt;
    if (this.dwell < PREVIEW_DWELL_SECONDS) return;
    this.previewLoading.add(id);
    void assets.loadGroup(groupOf(id)).then(
      () => this.previewReady(id),
      () => this.previewReady(id),
    );
  }

  private previewReady(id: string) {
    this.previewLoading.delete(id);
    if (this.closed) {
      if (id !== this.activeId) this.assets?.release(groupOf(id));
      return;
    }
    this.previewIds.add(id);
    const keep = this.cursorCharacter().id;
    for (const other of [...this.previewIds]) {
      if (other === keep || other === this.activeId || other === this.pending?.id) continue;
      this.previewIds.delete(other);
      this.assets?.release(groupOf(other));
    }
  }

  // ---- actions ----

  private setCursor(index: number, sound: boolean) {
    if (index === this.cursor) return;
    this.cursor = index;
    this.dwell = 0;
    if (sound) this.audio.playSfx("ui-cursor");
  }

  private close() {
    if (this.closed) return;
    this.ctx?.manager.pop();
  }

  private cancel() {
    this.audio.playSfx("ui-back");
    this.close();
  }

  /** Enter / confirm button / double click. */
  confirm() {
    if (this.pending || this.closed) return;
    const character = this.cursorCharacter();
    // the character's own sound (same file as its streamer card click)
    this.audio.playFile?.(character.sfx);
    if (character.id === this.activeId) {
      // already in use: nothing to load or reset
      this.close();
      return;
    }
    this.audio.playSfx("ui-select");
    const token = ++this.nextToken;
    this.pending = { id: character.id, token };
    const assets = this.assets;
    if (!assets) return;
    void assets.loadGroup(groupOf(character.id)).then(
      (result) => this.loaded(character, token, result.failed.length === 0 && assets.has(atlasKey(character.id))),
      () => this.loaded(character, token, false),
    );
  }

  private loaded(character: PitchCharacter, token: number, ok: boolean) {
    if (this.pending?.token !== token) {
      // cancelled or closed while loading: drop what was fetched for it
      if (character.id !== this.activeId && !this.previewIds.has(character.id)) this.assets?.release(groupOf(character.id));
      return;
    }
    this.pending = null;
    if (!ok) {
      if (character.id !== this.activeId) this.assets?.release(groupOf(character.id));
      this.failure = { text: "불러오지 못했어요 · 현재 선수 유지", left: FAIL_TOAST_SECONDS };
      this.audio.playSfx("ui-back");
      return;
    }
    const previous = this.activeId;
    (this.params.save ?? savePitchCharacter)(character.id);
    this.activeId = character.id;
    this.previewIds.delete(character.id);
    this.params.onApply(character);
    // the old character's memory goes once the pitch no longer draws it
    this.assets?.release(groupOf(previous));
    this.close();
  }

  // ---- input ----

  onKey(e: KeyInput) {
    switch (e.code) {
      case "Escape":
      case "Tab":
        // cancelling while a load runs just abandons it
        this.pending = null;
        this.cancel();
        return;
      case "Enter":
      case "Space":
      case "NumpadEnter":
        this.confirm();
        return;
    }
    if (this.pending) return;
    const dir = ARROW_DIRS[e.code];
    if (dir) this.setCursor(moveCursor(this.cursor, dir, PITCH_CHARACTERS.length), true);
  }

  private buttonAt(x: number, y: number): ButtonId | null {
    for (const { id, rect } of BUTTONS) if (inside(rect, x, y)) return id;
    return null;
  }

  onPointer(e: PointerInput) {
    const button = this.buttonAt(e.x, e.y);
    const card = button ? -1 : cardAt(e.x, e.y, PITCH_CHARACTERS.length);
    if (button !== this.hovered) {
      if (button) this.audio.playSfx("ui-hover");
      this.hovered = button;
    }
    // hovering only changes the mouse pointer; a click picks the card
    this.ctx?.host.setCursor(button || card >= 0 ? "pointer" : "default");

    if (e.type === "down") {
      this.pressed = button;
      this.pressedCard = card;
      return;
    }
    if (e.type !== "up") return;
    const pressed = this.pressed;
    const pressedCard = this.pressedCard;
    this.pressed = null;
    this.pressedCard = -1;
    if (pressed && pressed === button) {
      this.audio.playSfx("ui-click");
      this.onButton(pressed);
    } else if (pressedCard >= 0 && pressedCard === card) {
      if (!this.pending) this.setCursor(card, true);
      const last = this.lastClick;
      if (last && last.index === card && this.clock - last.at <= DOUBLE_CLICK_SECONDS) {
        this.lastClick = null;
        this.confirm();
      } else {
        this.lastClick = { index: card, at: this.clock };
        this.audio.playSfx("ui-click");
      }
    }
  }

  private onButton(id: ButtonId) {
    switch (id) {
      case "dashboard":
        this.audio.playSfx("mode-switch");
        this.ctx?.host.goDashboard();
        break;
      case "confirm":
        this.confirm();
        break;
      case "cancel":
        this.pending = null;
        this.cancel();
        break;
      case "prev":
      case "next":
        if (!this.pending) this.setCursor(stepCursor(this.cursor, id === "next" ? 1 : -1, PITCH_CHARACTERS.length), true);
    }
  }

  // ---- render ----

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  render(g: CanvasRenderingContext2D) {
    const fade = this.reduced() ? 1 : Math.min(1, this.age / OPEN_FADE_SECONDS);
    const slide = this.reduced() ? 0 : Math.round((1 - Math.min(1, this.age / OPEN_SLIDE_SECONDS)) * 16);
    g.save();
    g.globalAlpha = fade;
    this.drawBackground(g);
    this.drawHero(g);
    g.save();
    g.translate(0, slide);
    drawText(g, "캐릭터 선택", 24, 40, { size: 20, color: TEXT_COLORS.gold, baseline: "middle" });
    for (let i = 0; i < PITCH_CHARACTERS.length; i++) this.drawCard(g, i);
    this.drawNamePlate(g);
    g.restore();
    this.drawButtons(g);
    this.drawFooter(g);
    g.restore();
  }

  private drawBackground(g: CanvasRenderingContext2D) {
    const bg = this.image("keyart/select-bg");
    if (bg) g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    else {
      g.fillStyle = "#0a0f24";
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    g.fillStyle = "rgba(5, 6, 15, 0.6)";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  /** Hero art on the spotlight, with the idle→run preview underneath. */
  private drawHero(g: CanvasRenderingContext2D) {
    const character = this.cursorCharacter();
    g.fillStyle = "rgba(158, 233, 255, 0.10)";
    g.beginPath();
    g.ellipse(HERO_CENTER_X, HERO_BOTTOM_Y, 96, 20, 0, 0, Math.PI * 2);
    g.fill();

    const hero = this.image(`characters/${character.id}-hero`);
    if (hero) {
      const scale = Math.min(1, HERO_MAX_HEIGHT / hero.height);
      const w = Math.round(hero.width * scale);
      const h = Math.round(hero.height * scale);
      g.drawImage(hero, Math.round(HERO_CENTER_X - w / 2), HERO_BOTTOM_Y - h, w, h);
    } else if (this.selectLoading) {
      this.drawSkeleton(g, { x: HERO_CENTER_X - 56, y: HERO_BOTTOM_Y - 250, w: 112, h: 250 });
    } else {
      g.fillStyle = character.themeColor;
      g.globalAlpha *= 0.5;
      g.fillRect(HERO_CENTER_X - 40, HERO_BOTTOM_Y - 200, 80, 200);
      g.globalAlpha /= 0.5;
    }

    const atlas = this.image(atlasKey(character.id));
    if (!atlas) return;
    const t = this.clock % PREVIEW_CYCLE_SECONDS;
    const running = t >= PREVIEW_IDLE_SECONDS;
    const def = clipDef(running ? "run" : "idle", "down");
    drawFrame(g, atlas, frameRect(def, frameAt(def, running ? t - PREVIEW_IDLE_SECONDS : t)), HERO_CENTER_X, PREVIEW_FOOT_Y, { scale: PREVIEW_SCALE });
  }

  private drawSkeleton(g: CanvasRenderingContext2D, rect: Rect) {
    const pulse = 0.55 + 0.25 * Math.sin(this.clock * 4);
    g.save();
    g.globalAlpha *= pulse;
    g.fillStyle = "#1c2a4a";
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.restore();
  }

  private drawCard(g: CanvasRenderingContext2D, index: number) {
    const character = PITCH_CHARACTERS[index]!;
    const rect = cardRect(index);
    const isCursor = index === this.cursor;
    const frameKey = isCursor ? (this.pressedCard === index ? "ui/card-hover" : "ui/card-selected") : "ui/card-normal";
    const lift = isCursor ? -4 : 0;
    const frame = this.image(frameKey);
    const y = rect.y + lift;

    if (frame) g.drawImage(frame, rect.x, y);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(rect.x, y, rect.w, rect.h);
      g.fillStyle = isCursor ? "#1f3a5c" : "#152640";
      g.fillRect(rect.x + 2, y + 2, rect.w - 4, rect.h - 4);
      if (isCursor) {
        g.strokeStyle = TEXT_COLORS.gold;
        g.lineWidth = 2;
        g.strokeRect(rect.x + 1, y + 1, rect.w - 2, rect.h - 2);
      }
    }

    const inner = { x: rect.x + 12, y: y + 16, w: 72, h: 72 };
    const portrait = this.image(`portraits/${character.id}-${isCursor ? "confident" : "neutral"}`);
    if (portrait) g.drawImage(portrait, inner.x, inner.y, inner.w, inner.h);
    else if (this.selectLoading) this.drawSkeleton(g, inner);
    else {
      // no portrait file or it failed to load: a tinted block with the first letter keeps the card usable
      g.fillStyle = character.themeColor;
      g.globalAlpha *= 0.55;
      g.fillRect(inner.x, inner.y, inner.w, inner.h);
      g.globalAlpha /= 0.55;
      drawText(g, character.name.slice(0, 1), inner.x + inner.w / 2, inner.y + inner.h / 2, { size: 32, align: "center", baseline: "middle" });
    }
    drawText(g, character.name, rect.x + rect.w / 2, y + 104, { size: 10, align: "center", baseline: "middle", color: isCursor ? TEXT_COLORS.gold : TEXT_COLORS.base });

    if (character.id === this.activeId) this.drawCurrentTag(g, rect.x + 4, y + 4);
    if (this.pending?.id === character.id) this.drawCardLoader(g, rect.x, y, rect.w, rect.h);
  }

  private drawCurrentTag(g: CanvasRenderingContext2D, x: number, y: number) {
    const tag = this.image("ui/tag-current");
    if (tag) g.drawImage(tag, x, y);
    else {
      g.fillStyle = "#ffd23f";
      g.fillRect(x, y, 56, 16);
    }
    // the art is plain: dark text on the gold plate
    drawText(g, "사용 중", x + 28, y + 9, { size: 8, align: "center", baseline: "middle" });
  }

  /** Dim + spinning ball while the card's `char:<id>` group loads. */
  private drawCardLoader(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    g.fillStyle = "rgba(5, 6, 15, 0.6)";
    g.fillRect(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const spin = this.image("env/ball-spin");
    if (spin) {
      drawStripFrame(g, spin, 8, Math.floor(this.clock * 12) % 8, cx, cy + 16, { scale: 1.5 });
      return;
    }
    g.save();
    g.translate(cx, cy);
    g.rotate(this.clock * 6);
    g.strokeStyle = TEXT_COLORS.gold;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, 12, 0, Math.PI * 1.5);
    g.stroke();
    g.restore();
  }

  private drawNamePlate(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = SELECT_NAME_PLATE;
    const plate = this.image("ui/name-plate");
    if (plate) drawNineSlice(g, plate, 12, x, y, w, h);
    else {
      g.fillStyle = "rgba(10, 10, 26, 0.9)";
      g.fillRect(x, y, w, h);
    }
    const character = this.cursorCharacter();
    drawText(g, `${character.name} · ${character.positionLabel}`, x + 20, y + h / 2 + 2, { size: 16, baseline: "middle" });
    const badge = this.image("ui/pos-badge");
    const bx = x + w - 44;
    const by = y + (h - 32) / 2;
    if (badge) g.drawImage(badge, bx, by);
    else {
      g.fillStyle = character.themeColor;
      g.fillRect(bx, by, 32, 32);
    }
    drawText(g, character.position, bx + 16, by + 17, { size: 10, align: "center", baseline: "middle" });
  }

  private drawButtons(g: CanvasRenderingContext2D) {
    const busy = this.pending !== null;
    // dashboard
    const dash = SELECT_DASHBOARD_BUTTON;
    this.drawStripButton(g, "ui/btn-dashboard", dash, "dashboard", 3);
    drawText(g, "잔디동 대시보드로", dash.x + 118, dash.y + dash.h / 2 + 3, { align: "center", baseline: "middle" });
    // cancel
    const cancel = SELECT_CANCEL_BUTTON;
    this.drawStripButton(g, "ui/btn-return", cancel, "cancel", 3);
    drawText(g, "돌아가기", cancel.x + cancel.w / 2, cancel.y + cancel.h / 2, { align: "center", baseline: "middle" });
    // confirm
    const confirm = SELECT_CONFIRM_BUTTON;
    const down = this.pressed === "confirm" && this.hovered === "confirm";
    const oy = down ? 2 : 0;
    const art = this.image(down ? "ui/confirm-pressed" : "ui/confirm");
    if (art) g.drawImage(art, confirm.x, confirm.y + oy);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(confirm.x - 2, confirm.y - 2 + oy, confirm.w + 4, confirm.h + 4);
      g.fillStyle = this.hovered === "confirm" ? "#3ee6c1" : "#2aa88d";
      g.fillRect(confirm.x, confirm.y + oy, confirm.w, confirm.h);
    }
    const label = busy ? "불러오는 중…" : this.cursorCharacter().id === this.activeId ? "사용 중인 선수" : "이 선수로 시작";
    drawText(g, label, confirm.x + confirm.w / 2, confirm.y + confirm.h / 2 + oy, { align: "center", baseline: "middle" });
    // arrows
    this.drawArrow(g, "prev", "ui/arrow-left");
    this.drawArrow(g, "next", "ui/arrow-right");
  }

  private drawStripButton(g: CanvasRenderingContext2D, key: string, rect: Rect, id: ButtonId, frames: number) {
    const frame = this.hovered !== id ? 0 : this.pressed === id ? 2 : 1;
    const oy = frame === 2 ? 2 : 0;
    const strip = this.image(key);
    if (strip) {
      drawStripFrame(g, strip, frames, frame, rect.x + rect.w / 2, rect.y + rect.h / 2 + strip.height / 2 + oy);
      return;
    }
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

  private drawArrow(g: CanvasRenderingContext2D, id: "prev" | "next", key: string) {
    const rect = id === "prev" ? SELECT_PREV_BUTTON : SELECT_NEXT_BUTTON;
    const pressed = this.pressed === id && this.hovered === id;
    const art = this.image(pressed ? `${key}-pressed` : key);
    if (art) {
      g.drawImage(art, rect.x, rect.y);
      return;
    }
    g.fillStyle = pressed ? "#3ee6c1" : "#152640";
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawText(g, id === "prev" ? "<" : ">", rect.x + 16, rect.y + 16, { align: "center", baseline: "middle" });
  }

  private drawFooter(g: CanvasRenderingContext2D) {
    if (this.failure) {
      const alpha = Math.min(1, this.failure.left / 0.3);
      g.save();
      g.globalAlpha *= alpha;
      g.fillStyle = "rgba(10, 10, 26, 0.92)";
      g.fillRect(320, 500, 300, 28);
      g.strokeStyle = TEXT_COLORS.coral;
      g.lineWidth = 2;
      g.strokeRect(321, 501, 298, 26);
      drawText(g, this.failure.text, 470, 514, { align: "center", baseline: "middle", color: TEXT_COLORS.coral });
      g.restore();
      return;
    }
    drawText(g, "←→↑↓ 이동   Enter 확정   Esc 취소", 24, 514, { size: 10, color: "#9fb0c8", baseline: "middle" });
  }
}

const ARROW_DIRS: Readonly<Record<string, GridDir>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};
