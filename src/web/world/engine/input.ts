// Keyboard input for the world (docs/world/01 §2). Keys are matched by `KeyboardEvent.code`, so WASD
// keeps working while a Korean IME is active (where `event.key` would be "ㅈㅁㄴㅇ"). While the world
// owns the keyboard, game keys are swallowed with preventDefault so arrows/Space never scroll the page.

export type Action = "up" | "down" | "left" | "right" | "run" | "interact" | "menu" | "log" | "map";

export const KEY_ACTIONS: Readonly<Record<string, Action>> = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ShiftLeft: "run", ShiftRight: "run",
  KeyE: "interact", Space: "interact", Enter: "interact", NumpadEnter: "interact",
  Escape: "menu",
  KeyJ: "log",
  KeyM: "map",
};

export function actionForCode(code: string): Action | undefined {
  return KEY_ACTIONS[code];
}

/** Unit-length (or zero) movement direction from the held actions; opposite keys cancel out. */
export function moveVector(held: ReadonlySet<Action>): { x: number; y: number } {
  const x = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
  const y = (held.has("down") ? 1 : 0) - (held.has("up") ? 1 : 0);
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}

/** Typing into a field must never move the character or trigger world shortcuts. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export interface InputController {
  attach(): void;
  detach(): void;
  /** Currently held? (movement, run) */
  isDown(action: Action): boolean;
  /** True once per key press (edge). Reading consumes it. */
  consumePressed(action: Action): boolean;
  move(): { x: number; y: number };
  /** Drops all held/pressed state (focus lost, modal opened, scene change). */
  reset(): void;
  /** While false (dialogue/modal owns the keyboard) actions read as not held/pressed. */
  setEnabled(enabled: boolean): void;
}

export function createInput(target: Window = window): InputController {
  const held = new Set<Action>();
  const pressed = new Set<Action>();
  let enabled = true;
  let attached = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.metaKey || isEditableTarget(event.target)) return;
    const action = actionForCode(event.code);
    if (!action || action === "menu") return; // Esc belongs to the overlay (close / later a menu stack)
    event.preventDefault();
    if (!held.has(action)) pressed.add(action);
    held.add(action);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    const action = actionForCode(event.code);
    if (!action) return;
    if (action !== "menu") event.preventDefault();
    held.delete(action);
  };
  const reset = () => {
    held.clear();
    pressed.clear();
  };
  const onVisibility = () => {
    if (document.hidden) reset();
  };

  return {
    attach() {
      if (attached) return;
      attached = true;
      // Capture phase so the world sees keys before page-level handlers, and holds shift-release etc.
      target.addEventListener("keydown", onKeyDown, true);
      target.addEventListener("keyup", onKeyUp, true);
      target.addEventListener("blur", reset);
      document.addEventListener("visibilitychange", onVisibility);
    },
    detach() {
      if (!attached) return;
      attached = false;
      target.removeEventListener("keydown", onKeyDown, true);
      target.removeEventListener("keyup", onKeyUp, true);
      target.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", onVisibility);
      reset();
    },
    isDown: (action) => enabled && held.has(action),
    consumePressed(action) {
      const was = pressed.delete(action);
      return enabled && was;
    },
    move: () => (enabled ? moveVector(held) : { x: 0, y: 0 }),
    reset,
    setEnabled(next) {
      if (next === enabled) return;
      enabled = next;
      // Keys pressed while a dialogue owned the keyboard must not leak into the world when it comes back.
      reset();
    },
  };
}
