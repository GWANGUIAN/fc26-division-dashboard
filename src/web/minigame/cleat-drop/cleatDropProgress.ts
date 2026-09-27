// Cleat Drop progress (docs/minigame-cleat-drop.md §5): stage clears and attempt counts, kept in localStorage.
// Follows src/web/pitch/game/foreverProgress.ts's shape: a versioned JSON blob + a validating parser + an
// in-memory fallback. load/save never throw — a blocked or broken store falls back to the last value held in
// memory, and damaged data falls back to a fresh start.

import { STAGE_COUNT } from "./cleatDropStages";

export const CLEAT_DROP_PROGRESS_KEY = "fc26-cleat-drop-progress";

export interface CleatDropProgress {
  version: 1;
  /** length STAGE_COUNT, index = stage - 1. */
  cleared: boolean[];
  /** Total attempts across all stages (successes and failures both count). */
  attempts: number;
  /** length STAGE_COUNT, per-stage attempt counts. */
  attemptsByStage: number[];
}

export function defaultProgress(): CleatDropProgress {
  return {
    version: 1,
    cleared: Array(STAGE_COUNT).fill(false),
    attempts: 0,
    attemptsByStage: Array(STAGE_COUNT).fill(0),
  };
}

export function isAllCleared(progress: CleatDropProgress): boolean {
  return progress.cleared.every(Boolean);
}

const isInt = (value: unknown, min: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min;
const isBoolArrayOf = (value: unknown, length: number): value is boolean[] =>
  Array.isArray(value) && value.length === length && value.every((entry) => typeof entry === "boolean");
const isIntArrayOf = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((entry) => isInt(entry, 0));

/** Validates raw JSON text; anything wrong (bad JSON, wrong version, wrong shapes/lengths) gives a fresh start. */
export function parseProgress(raw: string | null): CleatDropProgress {
  if (!raw) return defaultProgress();
  try {
    const data = JSON.parse(raw) as Partial<CleatDropProgress> | null;
    if (!data || typeof data !== "object" || data.version !== 1) return defaultProgress();
    if (!isBoolArrayOf(data.cleared, STAGE_COUNT)) return defaultProgress();
    if (!isInt(data.attempts, 0)) return defaultProgress();
    if (!isIntArrayOf(data.attemptsByStage, STAGE_COUNT)) return defaultProgress();
    return { version: 1, cleared: data.cleared, attempts: data.attempts, attemptsByStage: data.attemptsByStage };
  } catch {
    return defaultProgress();
  }
}

let memoryProgress: CleatDropProgress | null = null;

export function loadProgress(): CleatDropProgress {
  try {
    const raw = localStorage.getItem(CLEAT_DROP_PROGRESS_KEY);
    if (raw !== null) return (memoryProgress = parseProgress(raw));
  } catch {
    /* storage blocked: use what this session already holds */
  }
  return memoryProgress ?? defaultProgress();
}

export function saveProgress(progress: CleatDropProgress): void {
  memoryProgress = progress;
  try {
    localStorage.setItem(CLEAT_DROP_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* storage blocked or full: the memory copy still serves this session */
  }
}

/** Tests only: forgets the in-memory copy. */
export function resetProgressMemory(): void {
  memoryProgress = null;
}
