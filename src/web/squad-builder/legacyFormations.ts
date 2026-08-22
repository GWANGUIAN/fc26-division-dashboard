import type { FormationPreset } from "./types.js";

const GK = { id: "gk", label: "GK", xPct: 50, yPct: 87 };

/**
 * Slot layouts for formations removed from the picker because they
 * duplicated a base formation under a different name. Kept only so squads
 * saved to localStorage before the removal can have their placements
 * remapped onto the surviving base formation (via remapPlacementsToFormation)
 * instead of being silently dropped. Never shown in the UI.
 */
export const LEGACY_FORMATIONS: Record<
  string,
  { baseId: string; preset: FormationPreset }
> = {
  "4-3-3-2": {
    baseId: "4-3-3",
    preset: {
      id: "4-3-3-2",
      label: "4-3-3 (2)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 60 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 68 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 68 },
        { id: "rb", label: "RB", xPct: 86, yPct: 60 },
        { id: "cm1", label: "CM", xPct: 30, yPct: 38 },
        { id: "cm2", label: "CM", xPct: 50, yPct: 38 },
        { id: "cm3", label: "CM", xPct: 70, yPct: 38 },
        { id: "lw", label: "LW", xPct: 15, yPct: 11 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
        { id: "rw", label: "RW", xPct: 85, yPct: 11 },
      ],
    },
  },
  "4-3-3-3": {
    baseId: "4-3-3",
    preset: {
      id: "4-3-3-3",
      label: "4-3-3 (3)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 67 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 75 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 75 },
        { id: "rb", label: "RB", xPct: 86, yPct: 67 },
        { id: "cdm", label: "CDM", xPct: 50, yPct: 51 },
        { id: "cm1", label: "CM", xPct: 30, yPct: 31 },
        { id: "cm2", label: "CM", xPct: 70, yPct: 31 },
        { id: "lw", label: "LW", xPct: 12, yPct: 11 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
        { id: "rw", label: "RW", xPct: 88, yPct: 11 },
      ],
    },
  },
  "4-3-3-4": {
    baseId: "4-3-3",
    preset: {
      id: "4-3-3-4",
      label: "4-3-3 (4)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 60 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 68 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 68 },
        { id: "rb", label: "RB", xPct: 86, yPct: 60 },
        { id: "cm1", label: "CM", xPct: 30, yPct: 38 },
        { id: "cdm", label: "CDM", xPct: 50, yPct: 38 },
        { id: "cm2", label: "CM", xPct: 70, yPct: 38 },
        { id: "lw", label: "LW", xPct: 16, yPct: 11 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
        { id: "rw", label: "RW", xPct: 84, yPct: 11 },
      ],
    },
  },
  "4-4-2-2": {
    baseId: "4-4-2",
    preset: {
      id: "4-4-2-2",
      label: "4-4-2 (2)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 60 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 68 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 68 },
        { id: "rb", label: "RB", xPct: 86, yPct: 60 },
        { id: "lm", label: "LM", xPct: 14, yPct: 38 },
        { id: "cm1", label: "CM", xPct: 38, yPct: 38 },
        { id: "cm2", label: "CM", xPct: 62, yPct: 38 },
        { id: "rm", label: "RM", xPct: 86, yPct: 38 },
        { id: "st1", label: "ST", xPct: 38, yPct: 11 },
        { id: "st2", label: "ST", xPct: 62, yPct: 11 },
      ],
    },
  },
  "4-5-1-2": {
    baseId: "4-5-1",
    preset: {
      id: "4-5-1-2",
      label: "4-5-1 (2)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 67 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 75 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 75 },
        { id: "rb", label: "RB", xPct: 86, yPct: 67 },
        { id: "cdm1", label: "CDM", xPct: 38, yPct: 51 },
        { id: "cdm2", label: "CDM", xPct: 62, yPct: 51 },
        { id: "lm", label: "LM", xPct: 12, yPct: 31 },
        { id: "cam", label: "CAM", xPct: 50, yPct: 31 },
        { id: "rm", label: "RM", xPct: 88, yPct: 31 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
      ],
    },
  },
  "4-1-2-1-2-2": {
    baseId: "4-1-2-1-2",
    preset: {
      id: "4-1-2-1-2-2",
      label: "4-1-2-1-2 (2)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 71 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 79 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 79 },
        { id: "rb", label: "RB", xPct: 86, yPct: 71 },
        { id: "cdm", label: "CDM", xPct: 50, yPct: 60 },
        { id: "cm1", label: "CM", xPct: 22, yPct: 44 },
        { id: "cm2", label: "CM", xPct: 78, yPct: 44 },
        { id: "cam", label: "CAM", xPct: 50, yPct: 27 },
        { id: "st1", label: "ST", xPct: 40, yPct: 11 },
        { id: "st2", label: "ST", xPct: 60, yPct: 11 },
      ],
    },
  },
  "4-2-3-1-2": {
    baseId: "4-2-3-1",
    preset: {
      id: "4-2-3-1-2",
      label: "4-2-3-1 (2)",
      slots: [
        GK,
        { id: "lb", label: "LB", xPct: 14, yPct: 67 },
        { id: "cb1", label: "CB", xPct: 36, yPct: 75 },
        { id: "cb2", label: "CB", xPct: 64, yPct: 75 },
        { id: "rb", label: "RB", xPct: 86, yPct: 67 },
        { id: "cdm1", label: "CDM", xPct: 38, yPct: 51 },
        { id: "cdm2", label: "CDM", xPct: 62, yPct: 51 },
        { id: "lm", label: "LM", xPct: 15, yPct: 31 },
        { id: "cam", label: "CAM", xPct: 50, yPct: 31 },
        { id: "rm", label: "RM", xPct: 85, yPct: 31 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
      ],
    },
  },
  "3-4-3-2": {
    baseId: "3-4-3",
    preset: {
      id: "3-4-3-2",
      label: "3-4-3 (2)",
      slots: [
        GK,
        { id: "cb1", label: "CB", xPct: 25, yPct: 63 },
        { id: "cb2", label: "CB", xPct: 50, yPct: 66 },
        { id: "cb3", label: "CB", xPct: 75, yPct: 63 },
        { id: "lm", label: "LM", xPct: 12, yPct: 38 },
        { id: "cm1", label: "CM", xPct: 38, yPct: 38 },
        { id: "cm2", label: "CM", xPct: 62, yPct: 38 },
        { id: "rm", label: "RM", xPct: 88, yPct: 38 },
        { id: "lw", label: "LW", xPct: 15, yPct: 11 },
        { id: "st", label: "ST", xPct: 50, yPct: 11 },
        { id: "rw", label: "RW", xPct: 85, yPct: 11 },
      ],
    },
  },
};
