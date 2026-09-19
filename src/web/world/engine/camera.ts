// Camera maths (docs/world/01 §5). Positions are the world-pixel coordinate of the view's top-left.

export interface Camera {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

/**
 * Clamps the view inside the map. A map smaller than the view on an axis is centred instead
 * (the negative offset shows the letterbox).
 */
export function clampCamera(x: number, y: number, view: Size, map: Size): Camera {
  const clampAxis = (value: number, viewLen: number, mapLen: number) =>
    mapLen <= viewLen ? (mapLen - viewLen) / 2 : Math.min(Math.max(value, 0), mapLen - viewLen);
  return { x: clampAxis(x, view.w, map.w), y: clampAxis(y, view.h, map.h) };
}

/** Whole-pixel camera for drawing, so sub-pixel movement never shimmers the pixel art. */
export function snapCamera(camera: Camera): Camera {
  return { x: Math.round(camera.x), y: Math.round(camera.y) };
}

/**
 * One follow step towards centring `target` in the view. `lerp` is the per-frame factor at 60 fps
 * (0.15 in the design doc); `dt` (seconds) makes it frame-rate independent. Pass `snap: true` on
 * scene entry to jump straight to the target. The result is unrounded — keep it as the camera state
 * and draw with `snapCamera()`.
 */
export function followCamera(
  camera: Camera,
  target: { x: number; y: number },
  view: Size,
  map: Size,
  { lerp = 0.15, dt = 1 / 60, snap = false }: { lerp?: number; dt?: number; snap?: boolean } = {},
): Camera {
  const wantedX = target.x - view.w / 2;
  const wantedY = target.y - view.h / 2;
  if (snap) return clampCamera(wantedX, wantedY, view, map);
  const factor = 1 - Math.pow(1 - lerp, dt * 60);
  return clampCamera(camera.x + (wantedX - camera.x) * factor, camera.y + (wantedY - camera.y) * factor, view, map);
}

/** Interior rooms are 640×384 in a 640×360 view: fixed camera with 12px trimmed top and bottom. */
export function interiorCamera(view: Size, room: Size): Camera {
  return { x: Math.round((room.w - view.w) / 2), y: Math.round((room.h - view.h) / 2) };
}
