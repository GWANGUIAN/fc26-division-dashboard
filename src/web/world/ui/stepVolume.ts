const VOLUME_STEP = 5;
/** Volume moves by 1 up to 10 (0..10) and by 5 above it (10, 15, 20 ... 100), so quiet levels stay fine-grained. */
const FINE_VOLUME_MAX = 10;

/** The next volume one notch up (`direction` 1) or down (-1), clamped to 0..100. */
export const stepVolume = (value: number, direction: -1 | 1) => {
  const next = direction > 0
    ? value < FINE_VOLUME_MAX ? value + 1 : (Math.floor(value / VOLUME_STEP) + 1) * VOLUME_STEP
    : value <= FINE_VOLUME_MAX ? value - 1 : (Math.ceil(value / VOLUME_STEP) - 1) * VOLUME_STEP;
  return Math.min(100, Math.max(0, next));
};
