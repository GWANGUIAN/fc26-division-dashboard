// Cabinet inventory overlay (docs/pitch/13 §5), pushed on top of the locker room. Left: the character wearing the
// selected (not yet saved) items, turning through its directions; right: tabs (모자 / 얼굴 / 등 / 펫) with an item grid.
// Selecting a slot only previews it; 적용 saves the loadout for this character (data/equipment.ts). All art is optional:
// missing images fall back to plain shapes, so the screen works before `ui/inv-*` is delivered.

import { loadPitchInventoryPrefs, savePitchInventoryPrefs } from "../../storage";
import { clipDef, frameAt, frameRect } from "../data/animations";
import type { PitchCharacter } from "../data/characters";
import {
  EQUIP_SHEETS,
  INVENTORY_TABS,
  TAB_LABELS,
  equipItem,
  isEmptyLoadout,
  loadLoadout,
  petDef,
  sameLoadout,
  saveLoadout,
  tabEntries,
  type InventoryTab,
  type Loadout,
} from "../data/equipment";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import type { AssetImage, PitchAssets } from "../engine/assets";
import { drawEquippedFrame, headAnchor } from "../engine/equipment";
import type { KeyInput, PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawNineSlice, stripRect } from "../engine/sprite";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { createPet, drawPet, PET_CELL, type PetState } from "../game/pet";
import { cellBounds, iconScale } from "../ui/iconBounds";
import {
  AUTO_BUTTON,
  BUTTON_LABELS,
  BUTTON_ORDER,
  BUTTON_RECTS,
  HINT_POS,
  INFO_CARD,
  INV_TITLE,
  INV_WINDOW,
  LIST_PANEL,
  PAGER_LABEL,
  PAGER_NEXT,
  PAGER_PREV,
  POSE_BUTTON,
  PREVIEW_FOOT,
  PREVIEW_PANEL,
  PREVIEW_SCALE,
  ROTATE_NEXT,
  ROTATE_PREV,
  SLOTS_PER_PAGE,
  SLOT_SIZE,
  STAGE_RECT,
  TAB_RECTS,
  hitInventory,
  moveCursor,
  pageCountFor,
  slotRect,
  type InventoryButton,
  type InventoryHit,
  type Rect,
} from "../ui/inventoryLayout";

/** How long one direction of the preview is shown while it turns by itself. */
export const PREVIEW_TURN_SECONDS = 1.6;
const SPARKLE_FPS = 14;
const SPARKLE_FRAMES = 6;
const CLOSE_ARM_SECONDS = 2.5;

export const PREVIEW_VIEWS = [
  { dir: "down", mirror: false },
  { dir: "side", mirror: false },
  { dir: "up", mirror: false },
  { dir: "side", mirror: true },
] as const;

const COLORS = { navy: "#0a0a1a", panel: "#0d1a33", panel2: "#12254a", gold: "#ffd23f", mint: "#2ee8b6", dim: "#7f8fb8", slot: "#16284d" } as const;

export interface InventorySceneParams {
  character: PitchCharacter;
  /** Called after 적용 saved a new loadout (the locker room refreshes its player and pet). */
  onApply?(loadout: Loadout): void;
  /** Called when the overlay closes (the cabinet door shuts). */
  onClose?(): void;
}

export class InventoryScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly params: InventorySceneParams;
  private saved: Loadout;
  private draft: Loadout;
  private tab: InventoryTab = "hat";
  private page = 0;
  private cursor = -1;
  private hover: InventoryHit | null = null;
  private pressed: InventoryHit | null = null;

  private clock = 0;
  private viewIndex = 0;
  private viewClock = 0;
  private auto = loadPitchInventoryPrefs().autoTurn;
  private running = false;
  private sparkle = -1;
  private armedFor = 0;
  private closed = false;
  private readonly pet: PetState = createPet(0, 0);

  constructor(params: InventorySceneParams) {
    this.params = params;
    this.saved = loadLoadout(params.character.id);
    this.draft = { ...this.saved };
  }

  // ---- state the tests and the locker room read ----

  get currentTab(): InventoryTab {
    return this.tab;
  }
  get draftLoadout(): Loadout {
    return { ...this.draft };
  }
  get savedLoadout(): Loadout {
    return { ...this.saved };
  }
  get hasChanges(): boolean {
    return !sameLoadout(this.draft, this.saved);
  }
  get selectedIndex(): number {
    return this.cursor;
  }
  get pageIndex(): number {
    return this.page;
  }
  get autoTurning(): boolean {
    return this.auto;
  }
  get previewView() {
    return PREVIEW_VIEWS[this.viewIndex];
  }

  private get entries() {
    return tabEntries(this.tab, this.params.character.id);
  }
  private get pages() {
    return pageCountFor(this.entries.length);
  }

  // ---- lifecycle ----

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    // the pet art of this character (the locker room already loaded the equipped one); missing groups are fine
    void this.assets.loadGroup(`pets:${this.params.character.id}`).catch(() => undefined);
    this.audio.playSfx("ui-select");
    ctx.host.announce?.(`인벤토리. ${this.params.character.name} 꾸미기. 방향키로 고르고 엔터로 미리 착용, A로 적용, Esc로 닫습니다.`);
  }

  exit() {
    this.closed = true;
    this.ctx?.host.setCursor("default");
    this.ctx?.host.announce?.("");
    this.params.onClose?.();
  }

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  // ---- actions ----

  private setTab(tab: InventoryTab) {
    if (tab === this.tab) return;
    this.tab = tab;
    this.page = 0;
    this.cursor = -1;
    this.audio.playSfx("ui-click");
    this.announceTab();
  }

  private setPage(page: number) {
    const next = Math.min(this.pages - 1, Math.max(0, page));
    if (next === this.page) return;
    this.page = next;
    this.audio.playSfx("ui-click");
  }

  private moveCursorTo(index: number) {
    if (index < 0) return;
    this.cursor = index;
    this.page = Math.floor(index / SLOTS_PER_PAGE);
    this.audio.playSfx("ui-cursor");
  }

  /** Slot press / Enter: previews the entry, or takes it off the preview again when it is already there. */
  toggleEntry(index: number) {
    const entry = this.entries[index];
    if (!entry) return;
    this.cursor = index;
    if (this.draft[this.tab] === entry.id) {
      delete this.draft[this.tab];
      this.audio.playSfx("ui-back");
      this.ctx?.host.announce?.(`${entry.name} 미리보기 해제`);
    } else {
      this.draft[this.tab] = entry.id;
      this.audio.playSfx("ui-select");
      this.sparkle = 0;
      this.ctx?.host.announce?.(`${entry.name} 미리 착용${entry.exclusive ? " (전용)" : ""}. A 키로 적용합니다.`);
    }
    this.armedFor = 0;
  }

  apply() {
    if (!this.hasChanges) return;
    saveLoadout(this.params.character.id, this.draft);
    this.saved = loadLoadout(this.params.character.id);
    this.draft = { ...this.saved };
    this.sparkle = 0;
    this.armedFor = 0;
    this.audio.playSfx("ui-select");
    this.ctx?.host.announce?.("적용했어요");
    this.params.onApply?.({ ...this.saved });
  }

  /** 해제: takes the current tab's slot off the preview. */
  unequipTab() {
    if (!this.draft[this.tab]) return;
    delete this.draft[this.tab];
    this.armedFor = 0;
    this.audio.playSfx("ui-back");
  }

  clearAll() {
    if (isEmptyLoadout(this.draft)) return;
    this.draft = {};
    this.armedFor = 0;
    this.audio.playSfx("ui-back");
  }

  /** Esc / 닫기: unsaved changes need a second press within a few seconds. */
  requestClose() {
    if (this.closed) return;
    if (this.hasChanges && this.armedFor <= 0) {
      this.armedFor = CLOSE_ARM_SECONDS;
      this.audio.playSfx("ui-hover");
      return;
    }
    this.audio.playSfx("ui-back");
    this.ctx?.manager.pop();
  }

  private turn(step: -1 | 1) {
    this.viewIndex = (this.viewIndex + step + PREVIEW_VIEWS.length) % PREVIEW_VIEWS.length;
    this.viewClock = 0;
    this.audio.playSfx("ui-click");
  }

  private announceTab() {
    this.ctx?.host.announce?.(`${TAB_LABELS[this.tab]} 탭, ${this.entries.length}개`);
  }

  private press(hit: InventoryHit) {
    switch (hit.kind) {
      case "tab":
        this.setTab(hit.tab);
        break;
      case "slot":
        this.toggleEntry(hit.index);
        break;
      case "pager":
        this.setPage(this.page + hit.step);
        break;
      case "rotate":
        this.turn(hit.step);
        break;
      case "pose":
        this.running = !this.running;
        this.audio.playSfx("ui-click");
        break;
      case "auto":
        this.auto = !this.auto;
        savePitchInventoryPrefs({ autoTurn: this.auto });
        this.audio.playSfx("ui-click");
        break;
      case "button":
        this.audio.playSfx("ui-click");
        if (hit.id === "apply") this.apply();
        else if (hit.id === "unequip") this.unequipTab();
        else if (hit.id === "clear") this.clearAll();
        else this.requestClose();
    }
  }

  // ---- update / input ----

  update(dt: number) {
    this.clock += dt;
    if (this.armedFor > 0) this.armedFor = Math.max(0, this.armedFor - dt);
    if (this.sparkle >= 0) {
      this.sparkle += dt;
      if (this.sparkle * SPARKLE_FPS >= SPARKLE_FRAMES) this.sparkle = -1;
    }
    const reduced = this.ctx?.host.reducedMotion?.() ?? false;
    if (this.auto && !reduced) {
      this.viewClock += dt;
      if (this.viewClock >= PREVIEW_TURN_SECONDS) {
        this.viewClock = 0;
        this.viewIndex = (this.viewIndex + 1) % PREVIEW_VIEWS.length;
      }
    }
    this.pet.clock = this.clock;
  }

  onKey(e: KeyInput) {
    switch (e.code) {
      case "Escape":
        this.requestClose();
        return;
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        this.moveCursorTo(moveCursor(this.cursor, e.code, this.entries.length));
        return;
      case "Enter":
      case "NumpadEnter":
      case "Space":
        if (this.cursor >= 0) this.toggleEntry(this.cursor);
        return;
      case "KeyA":
        this.apply();
        return;
      case "Tab": {
        const next = INVENTORY_TABS[(INVENTORY_TABS.indexOf(this.tab) + 1) % INVENTORY_TABS.length];
        this.setTab(next);
        return;
      }
      case "Delete":
      case "Backspace":
        this.unequipTab();
        return;
      case "KeyQ":
        this.turn(-1);
        return;
      case "KeyE":
        this.turn(1);
        return;
      case "KeyR":
        this.running = !this.running;
    }
  }

  onPointer(e: PointerInput) {
    const hit = hitInventory(e.x, e.y, this.entries.length, this.pages, this.page);
    if (JSON.stringify(hit) !== JSON.stringify(this.hover)) {
      if (hit) this.audio.playSfx("ui-hover");
      this.hover = hit;
      this.ctx?.host.setCursor(hit ? "pointer" : "default");
    }
    if (e.type === "down") this.pressed = hit;
    if (e.type === "up") {
      const pressed = this.pressed;
      this.pressed = null;
      if (pressed && hit && JSON.stringify(pressed) === JSON.stringify(hit)) this.press(hit);
    }
  }

  // ---- render ----

  render(g: CanvasRenderingContext2D) {
    g.save();
    g.globalAlpha = 0.72;
    g.fillStyle = "#05060f";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.restore();
    this.drawFrame(g);
    drawText(g, `인벤토리 · ${this.params.character.name}`, INV_TITLE.x, INV_TITLE.y, { size: 14, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    this.drawPreview(g);
    this.drawTabs(g);
    this.drawGrid(g);
    this.drawInfoCard(g);
    this.drawButtons(g);
    this.drawHint(g);
  }

  private plate(g: CanvasRenderingContext2D, r: Rect, fill: string, line: string = COLORS.navy) {
    g.fillStyle = line;
    g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    g.fillStyle = fill;
    g.fillRect(r.x, r.y, r.w, r.h);
  }

  private drawFrame(g: CanvasRenderingContext2D) {
    const frame = this.image("ui/inv-frame");
    if (frame) {
      g.drawImage(frame, INV_WINDOW.x, INV_WINDOW.y, INV_WINDOW.w, INV_WINDOW.h);
      return;
    }
    this.plate(g, INV_WINDOW, COLORS.panel, COLORS.gold);
    this.plate(g, PREVIEW_PANEL, "#0a1226");
    this.plate(g, LIST_PANEL, "#0a1226");
  }

  private drawStrip(g: CanvasRenderingContext2D, key: string, frames: number, frame: number, r: Rect): boolean {
    const image = this.image(key) as (AssetImage & { width: number; height: number }) | undefined;
    if (!image) return false;
    const s = stripRect(image.width, image.height, frames, frame);
    g.drawImage(image, s.sx, s.sy, s.sw, s.sh, r.x, r.y, r.w, r.h);
    return true;
  }

  private view() {
    return PREVIEW_VIEWS[this.viewIndex];
  }

  private drawPreview(g: CanvasRenderingContext2D) {
    const stage = this.image("ui/inv-preview-stage");
    if (stage) g.drawImage(stage, STAGE_RECT.x, STAGE_RECT.y, STAGE_RECT.w, STAGE_RECT.h);
    else {
      g.fillStyle = COLORS.panel2;
      g.beginPath();
      g.ellipse(PREVIEW_FOOT.x, PREVIEW_FOOT.y, 78, 20, 0, 0, Math.PI * 2);
      g.fill();
    }
    const id = this.params.character.id;
    const atlas = this.image(`characters/${id}-atlas`);
    const { dir, mirror } = this.view();
    const def = clipDef(this.running ? "run" : "idle", dir);
    const rect = frameRect(def, frameAt(def, this.clock));
    const lookup = (key: string) => this.image(key) as (AssetImage & { width: number; height: number }) | undefined;
    // the pet stands beside the character, on the side it is not turned away from
    const petId = this.draft.pet;
    const petAtlas = petId ? this.image(`pets/pet-${petId}`) : undefined;
    const petX = PREVIEW_FOOT.x + (mirror ? -1 : 1) * -70;
    const petFirst = dir === "up";
    const drawPetNow = () => {
      if (!petAtlas) return;
      this.pet.dir = dir;
      this.pet.mirror = mirror;
      this.pet.moving = this.running;
      drawPet(g, petAtlas, this.pet, PREVIEW_SCALE, petX, PREVIEW_FOOT.y + 6);
    };
    if (petFirst) drawPetNow();
    if (atlas) {
      drawEquippedFrame(g, atlas, rect, id, this.draft, lookup, PREVIEW_FOOT.x, PREVIEW_FOOT.y, { scale: PREVIEW_SCALE, mirror });
    } else {
      g.fillStyle = this.params.character.themeColor;
      g.fillRect(PREVIEW_FOOT.x - 22, PREVIEW_FOOT.y - 110, 44, 110);
    }
    if (!petFirst) drawPetNow();
    if (this.sparkle >= 0) {
      const fx = this.image("fx/fx-equip-sparkle") as (AssetImage & { width: number; height: number }) | undefined;
      const anchor = headAnchor(id, rect);
      const headY = anchor ? PREVIEW_FOOT.y + (anchor.y - 92) * PREVIEW_SCALE : PREVIEW_FOOT.y - 150;
      if (fx) {
        const frame = Math.min(SPARKLE_FRAMES - 1, Math.floor(this.sparkle * SPARKLE_FPS));
        const s = stripRect(fx.width, fx.height, SPARKLE_FRAMES, frame);
        g.drawImage(fx, s.sx, s.sy, s.sw, s.sh, PREVIEW_FOOT.x - s.sw, Math.round(headY - s.sh), s.sw * 2, s.sh * 2);
      }
    }
    // the turn buttons, the pose toggle and the auto-turn toggle under the stage
    for (const [rect2, step] of [[ROTATE_PREV, -1], [ROTATE_NEXT, 1]] as const) {
      const hovered = this.hover?.kind === "rotate" && this.hover.step === step;
      const pressed = this.pressed?.kind === "rotate" && this.pressed.step === step;
      const key = step < 0 ? "ui/inv-arrow-left" : "ui/inv-arrow-right";
      if (!this.drawStrip(g, key, 3, pressed ? 2 : hovered ? 1 : 0, rect2)) {
        this.plate(g, rect2, hovered ? COLORS.panel2 : COLORS.panel, COLORS.gold);
        drawText(g, step < 0 ? "◀" : "▶", rect2.x + rect2.w / 2, rect2.y + rect2.h / 2, { size: 10, align: "center", baseline: "middle" });
      }
    }
    this.smallButton(g, POSE_BUTTON, this.running ? "달리기" : "대기", this.hover?.kind === "pose");
    this.smallButton(g, AUTO_BUTTON, this.auto ? "자동 회전" : "고정", this.hover?.kind === "auto");
  }

  private smallButton(g: CanvasRenderingContext2D, r: Rect, label: string, hovered: boolean) {
    if (!this.drawStrip(g, "ui/inv-btn", 3, hovered ? 1 : 0, r)) this.plate(g, r, hovered ? COLORS.panel2 : COLORS.panel, COLORS.gold);
    drawText(g, label, r.x + r.w / 2, r.y + r.h / 2, { size: 10, align: "center", baseline: "middle" });
  }

  private drawTabs(g: CanvasRenderingContext2D) {
    INVENTORY_TABS.forEach((tab, i) => {
      const r = TAB_RECTS[i];
      const active = tab === this.tab;
      const hovered = this.hover?.kind === "tab" && this.hover.tab === tab;
      const art = this.drawStrip(g, `ui/inv-tab-${tab}`, 3, active ? 2 : hovered ? 1 : 0, r);
      if (!art) this.plate(g, r, active ? "#3a3210" : hovered ? COLORS.panel2 : COLORS.panel, active ? COLORS.gold : COLORS.navy);
      // the art keeps the left 40% for the icon; the fallback has none, so its label is centred
      drawText(g, TAB_LABELS[tab], r.x + (art ? r.w * 0.66 : r.w / 2), r.y + r.h / 2, { size: 12, color: TEXT_COLORS.base, align: "center", baseline: "middle" });
    });
  }

  /** Icon of an entry: the FRONT cut of an item sheet or the first pet frame, drawn at a crisp integer scale where possible. */
  private drawIcon(g: CanvasRenderingContext2D, id: string, r: Rect) {
    let image: (AssetImage & { width: number; height: number }) | undefined;
    let sx = 0;
    let sy = 0;
    let cw = 0;
    let ch = 0;
    if (this.tab === "pet") {
      image = this.image(`pets/pet-${id}`) as typeof image;
      cw = PET_CELL;
      ch = PET_CELL;
    } else {
      const item = equipItem(id);
      const sheet = item && EQUIP_SHEETS[item.sheet];
      if (item && sheet) {
        image = this.image(`equipment/acc-${item.sheet}`) as typeof image;
        [cw, ch] = sheet.cell;
        sy = item.row * ch;
      }
    }
    if (!image) {
      const name = this.tab === "pet" ? petDef(id)?.name : equipItem(id)?.name;
      g.fillStyle = COLORS.dim;
      g.fillRect(r.x + 20, r.y + 20, 24, 24);
      drawText(g, name ?? id, r.x + r.w / 2, r.y + r.h - 8, { size: 8, align: "center", baseline: "middle" });
      return;
    }
    // centre the art itself (hats sit at the bottom of their cell, back items at the top), not the cell
    const bounds = cellBounds(image, sx, sy, cw, ch);
    const k = iconScale(bounds, SLOT_SIZE - 12);
    const w = Math.round(bounds.w * k);
    const h = Math.round(bounds.h * k);
    g.drawImage(image, sx + bounds.x, sy + bounds.y, bounds.w, bounds.h, Math.round(r.x + (r.w - w) / 2), Math.round(r.y + (r.h - h) / 2), w, h);
  }

  private drawGrid(g: CanvasRenderingContext2D) {
    const entries = this.entries;
    for (let i = 0; i < SLOTS_PER_PAGE; i++) {
      const index = this.page * SLOTS_PER_PAGE + i;
      const r = slotRect(i);
      const entry = entries[index];
      const hovered = this.hover?.kind === "slot" && this.hover.index === index;
      const selected = !!entry && this.draft[this.tab] === entry.id;
      const equipped = !!entry && this.saved[this.tab] === entry.id;
      const cursor = index === this.cursor && !!entry;
      // frames of ui/inv-slot: normal, hover, selected, equipped, empty
      const frame = !entry ? 4 : selected ? 2 : equipped ? 3 : hovered || cursor ? 1 : 0;
      if (!this.drawStrip(g, "ui/inv-slot", 5, frame, r)) {
        this.plate(g, r, !entry ? "#0a1226" : selected ? "#3a3210" : hovered || cursor ? COLORS.panel2 : COLORS.slot, selected ? COLORS.gold : equipped ? COLORS.mint : COLORS.navy);
      }
      if (!entry) continue;
      this.drawIcon(g, entry.id, r);
      if (equipped) this.badge(g, "ui/inv-badge-equipped", r.x + r.w - 16, r.y + 2, COLORS.mint);
      if (entry.exclusive) this.badge(g, "ui/inv-badge-exclusive", r.x + 2, r.y + 2, COLORS.gold);
    }
    if (this.pages > 1) {
      for (const [r, step] of [[PAGER_PREV, -1], [PAGER_NEXT, 1]] as const) {
        const hovered = this.hover?.kind === "pager" && this.hover.step === step;
        const key = step < 0 ? "ui/inv-arrow-left" : "ui/inv-arrow-right";
        if (!this.drawStrip(g, key, 3, hovered ? 1 : 0, r)) {
          this.plate(g, r, hovered ? COLORS.panel2 : COLORS.panel, COLORS.gold);
          drawText(g, step < 0 ? "◀" : "▶", r.x + r.w / 2, r.y + r.h / 2, { size: 10, align: "center", baseline: "middle" });
        }
      }
      drawText(g, `${this.page + 1} / ${this.pages}`, PAGER_LABEL.x, PAGER_LABEL.y, { size: 10, align: "center", baseline: "middle" });
    }
  }

  private badge(g: CanvasRenderingContext2D, key: string, x: number, y: number, fallback: string) {
    const image = this.image(key);
    if (image) g.drawImage(image, x, y, 14, 14);
    else {
      g.fillStyle = COLORS.navy;
      g.fillRect(x, y, 12, 12);
      g.fillStyle = fallback;
      g.fillRect(x + 2, y + 2, 8, 8);
    }
  }

  private drawInfoCard(g: CanvasRenderingContext2D) {
    const card = this.image("ui/inv-infocard") as (AssetImage & { width: number; height: number }) | undefined;
    if (card) drawNineSlice(g, card, 12, INFO_CARD.x, INFO_CARD.y, INFO_CARD.w, INFO_CARD.h);
    else this.plate(g, INFO_CARD, COLORS.panel, COLORS.gold);
    const x = INFO_CARD.x + 8;
    const entry = this.entries[this.cursor];
    let y = INFO_CARD.y + 30;
    if (entry) {
      drawText(g, entry.name, x, y, { size: 11, color: TEXT_COLORS.gold, baseline: "middle" });
      y += 16;
      drawText(g, TAB_LABELS[this.tab], x, y, { size: 9, color: COLORS.dim, baseline: "middle" });
      y += 14;
      if (entry.exclusive) {
        drawText(g, `${this.params.character.name} 전용`, x, y, { size: 9, color: COLORS.mint, baseline: "middle" });
        y += 14;
      }
      const state = this.draft[this.tab] === entry.id ? (this.saved[this.tab] === entry.id ? "착용 중" : "적용 전") : "";
      if (state) drawText(g, state, x, y, { size: 9, color: TEXT_COLORS.base, baseline: "middle" });
    } else {
      drawText(g, "아이템을", x, y, { size: 10, color: COLORS.dim, baseline: "middle" });
      drawText(g, "선택하세요", x, y + 14, { size: 10, color: COLORS.dim, baseline: "middle" });
    }
    // what the preview wears, one line per slot
    const base = INFO_CARD.y + 116;
    drawText(g, "현재 조합", x, base, { size: 9, color: COLORS.dim, baseline: "middle" });
    INVENTORY_TABS.forEach((tab, i) => {
      const id = this.draft[tab];
      const name = id ? (tab === "pet" ? petDef(id)?.name : equipItem(id)?.name) : "-";
      const changed = (this.draft[tab] ?? "") !== (this.saved[tab] ?? "");
      drawText(g, `${TAB_LABELS[tab]} ${name ?? "-"}`, x, base + 16 + i * 15, { size: 9, color: changed ? TEXT_COLORS.gold : TEXT_COLORS.base, baseline: "middle" });
    });
  }

  private buttonEnabled(id: InventoryButton): boolean {
    if (id === "apply") return this.hasChanges;
    if (id === "unequip") return !!this.draft[this.tab];
    if (id === "clear") return !isEmptyLoadout(this.draft);
    return true;
  }

  private drawButtons(g: CanvasRenderingContext2D) {
    for (const id of BUTTON_ORDER) {
      const r = BUTTON_RECTS[id];
      const enabled = this.buttonEnabled(id);
      const hovered = enabled && this.hover?.kind === "button" && this.hover.id === id;
      const pressed = enabled && this.pressed?.kind === "button" && this.pressed.id === id;
      g.save();
      if (!enabled) g.globalAlpha = 0.45;
      if (!this.drawStrip(g, "ui/inv-btn", 3, pressed ? 2 : hovered ? 1 : 0, r)) this.plate(g, r, hovered ? COLORS.panel2 : COLORS.panel, id === "apply" && enabled ? COLORS.gold : COLORS.navy);
      const armed = id === "close" && this.armedFor > 0;
      drawText(g, BUTTON_LABELS[id], r.x + r.w / 2, r.y + r.h / 2 + (pressed ? 2 : 0), { size: 12, color: armed ? TEXT_COLORS.coral : id === "apply" && enabled ? TEXT_COLORS.gold : TEXT_COLORS.base, align: "center", baseline: "middle" });
      g.restore();
    }
  }

  private drawHint(g: CanvasRenderingContext2D) {
    if (this.armedFor > 0) {
      drawText(g, "저장하지 않은 변경이 있어요", HINT_POS.x, HINT_POS.y, { size: 10, color: TEXT_COLORS.coral, baseline: "middle" });
      drawText(g, "한 번 더 누르면 닫습니다", HINT_POS.x, HINT_POS.y + 16, { size: 10, color: TEXT_COLORS.coral, baseline: "middle" });
      return;
    }
    drawText(g, "방향키 선택 · Enter 미리 착용 · A 적용", HINT_POS.x, HINT_POS.y, { size: 9, color: "#9fe9ff", baseline: "middle" });
    drawText(g, "Tab 탭 · Q/E 회전 · R 자세 · Esc 닫기", HINT_POS.x, HINT_POS.y + 16, { size: 9, color: "#9fe9ff", baseline: "middle" });
  }
}
