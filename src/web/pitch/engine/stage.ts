// 960×540 logical canvas, letterboxed (contain) inside its container (docs/pitch/01 §3-1).

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;
export const BACKDROP_COLOR = "#05060f";

export interface StageMetrics {
  /** CSS pixels of the visible logical stage. */
  cssWidth: number;
  cssHeight: number;
  /** Offset of the stage inside the container, CSS pixels. */
  left: number;
  top: number;
  /** CSS pixels per logical pixel. */
  cssScale: number;
  /** Backing-store pixels per logical pixel: clamp(floor(cssScale × dpr), 1, 2). */
  renderScale: number;
}

export function computeStageMetrics(containerWidth: number, containerHeight: number, devicePixelRatio = 1): StageMetrics {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const cssScale = Math.max(0.01, Math.min(containerWidth / LOGICAL_WIDTH, containerHeight / LOGICAL_HEIGHT));
  const cssWidth = LOGICAL_WIDTH * cssScale;
  const cssHeight = LOGICAL_HEIGHT * cssScale;
  return {
    cssWidth,
    cssHeight,
    left: (containerWidth - cssWidth) / 2,
    top: (containerHeight - cssHeight) / 2,
    cssScale,
    renderScale: Math.min(2, Math.max(1, Math.floor(cssScale * dpr))),
  };
}

export interface ClientRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LogicalPoint {
  x: number;
  y: number;
}

/** Client (viewport) coordinates → logical 960×540 coordinates, given the canvas element's bounding rect. */
export function toLogical(rect: ClientRect, clientX: number, clientY: number): LogicalPoint {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
    y: ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT,
  };
}

export interface Stage {
  readonly canvas: HTMLCanvasElement;
  readonly metrics: StageMetrics;
  /** Resets the transform to logical units (and pixel-crisp sampling), returns the context. Call once per frame. */
  beginFrame(): CanvasRenderingContext2D;
  toLogical(clientX: number, clientY: number): LogicalPoint;
  destroy(): void;
}

/** Throws when a 2D context cannot be obtained; the caller falls back to the dashboard. */
export function createStage(container: HTMLElement): Stage {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context is not available");

  canvas.style.position = "absolute";
  canvas.style.imageRendering = "pixelated";
  canvas.style.touchAction = "none";
  canvas.style.outline = "none";
  container.appendChild(canvas);

  let metrics = computeStageMetrics(container.clientWidth, container.clientHeight, window.devicePixelRatio);

  const apply = () => {
    metrics = computeStageMetrics(container.clientWidth, container.clientHeight, window.devicePixelRatio);
    const width = LOGICAL_WIDTH * metrics.renderScale;
    const height = LOGICAL_HEIGHT * metrics.renderScale;
    // Assigning width/height clears the canvas and resets context state, so only do it on a real change.
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    canvas.style.width = `${metrics.cssWidth}px`;
    canvas.style.height = `${metrics.cssHeight}px`;
    canvas.style.left = `${metrics.left}px`;
    canvas.style.top = `${metrics.top}px`;
  };
  apply();

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
  observer?.observe(container);
  if (!observer) window.addEventListener("resize", apply);

  return {
    canvas,
    get metrics() {
      return metrics;
    },
    beginFrame() {
      ctx.setTransform(metrics.renderScale, 0, 0, metrics.renderScale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      return ctx;
    },
    toLogical(clientX, clientY) {
      return toLogical(canvas.getBoundingClientRect(), clientX, clientY);
    },
    destroy() {
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", apply);
      canvas.remove();
    },
  };
}
