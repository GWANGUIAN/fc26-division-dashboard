import type { FormationPreset, FormationSlot } from "./types.js";

const GK: FormationSlot = { id: "gk", label: "GK", xPct: 50, yPct: 87 };

/**
 * Row bands, evenly spaced from GK (92) to the front line (11), keyed by
 * how many outfield rows a formation has. Even spacing (rather than
 * hand-picked per-formation values) guarantees no single gap ends up
 * disproportionately tight or wide relative to its neighbors.
 */
const ROWS_3 = [65, 38, 11];
const ROWS_4 = [72, 51, 31, 11];
const ROWS_5 = [76, 60, 44, 27, 11];

function back4(y: number): FormationSlot[] {
  return [
    { id: "lb", label: "LB", xPct: 14, yPct: y - 5 },
    { id: "cb1", label: "CB", xPct: 36, yPct: y + 3 },
    { id: "cb2", label: "CB", xPct: 64, yPct: y + 3 },
    { id: "rb", label: "RB", xPct: 86, yPct: y - 5 },
  ];
}

function back3(y: number): FormationSlot[] {
  return [
    { id: "cb1", label: "CB", xPct: 25, yPct: y - 2 },
    { id: "cb2", label: "CB", xPct: 50, yPct: y + 3 },
    { id: "cb3", label: "CB", xPct: 75, yPct: y - 2 },
  ];
}

function back5(y: number): FormationSlot[] {
  return [
    { id: "lwb", label: "LWB", xPct: 8, yPct: y - 12 },
    { id: "cb1", label: "CB", xPct: 30, yPct: y },
    { id: "cb2", label: "CB", xPct: 50, yPct: y + 2 },
    { id: "cb3", label: "CB", xPct: 70, yPct: y },
    { id: "rwb", label: "RWB", xPct: 92, yPct: y - 12 },
  ];
}

/** Every formation selectable in FC26 Ultimate Team's squad screen. */
export const FORMATIONS: FormationPreset[] = [
  {
    id: "4-3-3",
    label: "4-3-3",
    slots: [
      GK,
      ...back4(ROWS_3[0]),
      { id: "cm1", label: "CM", xPct: 28, yPct: ROWS_3[1] },
      { id: "cdm", label: "CDM", xPct: 50, yPct: ROWS_3[1] + 9 },
      { id: "cm2", label: "CM", xPct: 72, yPct: ROWS_3[1] },
      { id: "lw", label: "LW", xPct: 15, yPct: ROWS_3[2] + 3 },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_3[2] + 3 },
      { id: "rw", label: "RW", xPct: 85, yPct: ROWS_3[2] + 3 },
    ],
  },
  {
    id: "4-4-2",
    label: "4-4-2",
    slots: [
      GK,
      ...back4(ROWS_3[0]),
      { id: "lm", label: "LM", xPct: 14, yPct: ROWS_3[1] },
      { id: "cm1", label: "CM", xPct: 38, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 62, yPct: ROWS_3[1] },
      { id: "rm", label: "RM", xPct: 86, yPct: ROWS_3[1] },
      { id: "st1", label: "ST", xPct: 38, yPct: ROWS_3[2] },
      { id: "st2", label: "ST", xPct: 62, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "4-4-1-1",
    label: "4-4-1-1",
    slots: [
      GK,
      { id: "lb", label: "LB", xPct: 14, yPct: ROWS_4[0] + 1 },
      { id: "cb1", label: "CB", xPct: 36, yPct: ROWS_4[0] + 3 },
      { id: "cb2", label: "CB", xPct: 64, yPct: ROWS_4[0] + 3 },
      { id: "rb", label: "RB", xPct: 86, yPct: ROWS_4[0] + 1 },
      { id: "lm", label: "LM", xPct: 12, yPct: ROWS_4[1] },
      { id: "cm1", label: "CM", xPct: 37, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 63, yPct: ROWS_4[1] },
      { id: "rm", label: "RM", xPct: 88, yPct: ROWS_4[1] },
      { id: "cf", label: "CF", xPct: 50, yPct: ROWS_4[2] + 3 },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-5-1",
    label: "4-5-1",
    slots: [
      GK,
      ...back4(ROWS_3[0]),
      { id: "lm", label: "LM", xPct: 10, yPct: ROWS_3[1] },
      { id: "cm1", label: "CM", xPct: 32, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 50, yPct: ROWS_3[1] },
      { id: "cm3", label: "CM", xPct: 68, yPct: ROWS_3[1] },
      { id: "rm", label: "RM", xPct: 90, yPct: ROWS_3[1] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "4-1-2-1-2",
    label: "4-1-2-1-2",
    slots: [
      GK,
      ...back4(ROWS_5[0]),
      { id: "cdm", label: "CDM", xPct: 50, yPct: ROWS_5[1] },
      { id: "cm1", label: "CM", xPct: 32, yPct: ROWS_5[2] },
      { id: "cm2", label: "CM", xPct: 68, yPct: ROWS_5[2] },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_5[3] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_5[4] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_5[4] },
    ],
  },
  {
    id: "4-1-3-2",
    label: "4-1-3-2",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cdm", label: "CDM", xPct: 50, yPct: ROWS_4[1] },
      { id: "lm", label: "LM", xPct: 15, yPct: ROWS_4[2] },
      { id: "cm", label: "CM", xPct: 50, yPct: ROWS_4[2] },
      { id: "rm", label: "RM", xPct: 85, yPct: ROWS_4[2] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_4[3] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-1-4-1",
    label: "4-1-4-1",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cdm", label: "CDM", xPct: 50, yPct: ROWS_4[1] },
      { id: "lm", label: "LM", xPct: 12, yPct: ROWS_4[2] },
      { id: "cm1", label: "CM", xPct: 37, yPct: ROWS_4[2] },
      { id: "cm2", label: "CM", xPct: 63, yPct: ROWS_4[2] },
      { id: "rm", label: "RM", xPct: 88, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-2-1-3",
    label: "4-2-1-3",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cdm1", label: "CDM", xPct: 38, yPct: ROWS_4[1] },
      { id: "cdm2", label: "CDM", xPct: 62, yPct: ROWS_4[1] },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_4[2] },
      { id: "lw", label: "LW", xPct: 15, yPct: ROWS_4[3] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
      { id: "rw", label: "RW", xPct: 85, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-2-2-2",
    label: "4-2-2-2",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cdm1", label: "CDM", xPct: 38, yPct: ROWS_4[1] },
      { id: "cdm2", label: "CDM", xPct: 62, yPct: ROWS_4[1] },
      { id: "lam", label: "CAM", xPct: 30, yPct: ROWS_4[2] },
      { id: "ram", label: "CAM", xPct: 70, yPct: ROWS_4[2] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_4[3] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cdm1", label: "CDM", xPct: 38, yPct: ROWS_4[1] },
      { id: "cdm2", label: "CDM", xPct: 62, yPct: ROWS_4[1] },
      { id: "lm", label: "LM", xPct: 30, yPct: ROWS_4[2] },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_4[2] },
      { id: "rm", label: "RM", xPct: 70, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-2-4",
    label: "4-2-4",
    slots: [
      GK,
      ...back4(ROWS_3[0]),
      { id: "cm1", label: "CM", xPct: 35, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 65, yPct: ROWS_3[1] },
      { id: "lw", label: "LW", xPct: 12, yPct: ROWS_3[2] },
      { id: "st1", label: "ST", xPct: 38, yPct: ROWS_3[2] },
      { id: "st2", label: "ST", xPct: 62, yPct: ROWS_3[2] },
      { id: "rw", label: "RW", xPct: 88, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "4-3-1-2",
    label: "4-3-1-2",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cm1", label: "CM", xPct: 28, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 50, yPct: ROWS_4[1] },
      { id: "cm3", label: "CM", xPct: 72, yPct: ROWS_4[1] },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_4[2] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_4[3] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "4-3-2-1",
    label: "4-3-2-1",
    slots: [
      GK,
      ...back4(ROWS_4[0]),
      { id: "cm1", label: "CM", xPct: 28, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 50, yPct: ROWS_4[1] },
      { id: "cm3", label: "CM", xPct: 72, yPct: ROWS_4[1] },
      { id: "lf", label: "CF", xPct: 35, yPct: ROWS_4[2] },
      { id: "rf", label: "CF", xPct: 65, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "3-4-1-2",
    label: "3-4-1-2",
    slots: [
      GK,
      { id: "cb1", label: "CB", xPct: 25, yPct: ROWS_4[0] - 8 },
      { id: "cb2", label: "CB", xPct: 50, yPct: ROWS_4[0] - 7 },
      { id: "cb3", label: "CB", xPct: 75, yPct: ROWS_4[0] - 8 },
      { id: "lwb", label: "LWB", xPct: 10, yPct: ROWS_4[1] - 6 },
      { id: "cm1", label: "CM", xPct: 33, yPct: ROWS_4[1] - 6 },
      { id: "cm2", label: "CM", xPct: 67, yPct: ROWS_4[1] - 6 },
      { id: "rwb", label: "RWB", xPct: 90, yPct: ROWS_4[1] - 6 },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_4[2] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_4[3] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "3-4-2-1",
    label: "3-4-2-1",
    slots: [
      GK,
      { id: "cb1", label: "CB", xPct: 25, yPct: 66 },
      { id: "cb2", label: "CB", xPct: 50, yPct: 65 },
      { id: "cb3", label: "CB", xPct: 75, yPct: 66 },
      { id: "lwb", label: "LWB", xPct: 10, yPct: ROWS_4[1] },
      { id: "cm1", label: "CM", xPct: 33, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 67, yPct: ROWS_4[1] },
      { id: "rwb", label: "RWB", xPct: 90, yPct: ROWS_4[1] },
      { id: "lf", label: "CF", xPct: 35, yPct: ROWS_4[2] },
      { id: "rf", label: "CF", xPct: 65, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "3-4-3",
    label: "3-4-3",
    slots: [
      GK,
      ...back3(ROWS_3[0]),
      { id: "lwb", label: "LWB", xPct: 8, yPct: ROWS_3[1] },
      { id: "cm1", label: "CM", xPct: 33, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 67, yPct: ROWS_3[1] },
      { id: "rwb", label: "RWB", xPct: 92, yPct: ROWS_3[1] },
      { id: "lw", label: "LW", xPct: 15, yPct: ROWS_3[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_3[2] },
      { id: "rw", label: "RW", xPct: 85, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "3-5-1-1",
    label: "3-5-1-1",
    slots: [
      GK,
      { id: "cb1", label: "CB", xPct: 25, yPct: ROWS_4[0] - 2 },
      { id: "cb2", label: "CB", xPct: 50, yPct: ROWS_4[0] - 2 },
      { id: "cb3", label: "CB", xPct: 75, yPct: ROWS_4[0] - 2 },
      { id: "lwb", label: "LWB", xPct: 8, yPct: ROWS_4[1] },
      { id: "cm1", label: "CM", xPct: 30, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 50, yPct: ROWS_4[1] },
      { id: "cm3", label: "CM", xPct: 70, yPct: ROWS_4[1] },
      { id: "rwb", label: "RWB", xPct: 92, yPct: ROWS_4[1] },
      { id: "cf", label: "CF", xPct: 50, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    slots: [
      GK,
      { id: "cb1", label: "CB", xPct: 25, yPct: ROWS_3[0] - 2 },
      { id: "cb2", label: "CB", xPct: 50, yPct: ROWS_3[0] + 1 },
      { id: "cb3", label: "CB", xPct: 75, yPct: ROWS_3[0] - 2 },
      { id: "lwb", label: "LWB", xPct: 8, yPct: ROWS_3[1] },
      { id: "cm1", label: "CM", xPct: 32, yPct: ROWS_3[1] },
      { id: "cdm", label: "CDM", xPct: 50, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 68, yPct: ROWS_3[1] },
      { id: "rwb", label: "RWB", xPct: 92, yPct: ROWS_3[1] },
      { id: "st1", label: "ST", xPct: 38, yPct: ROWS_3[2] },
      { id: "st2", label: "ST", xPct: 62, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "5-2-1-2",
    label: "5-2-1-2",
    slots: [
      GK,
      { id: "lwb", label: "LWB", xPct: 8, yPct: 55 },
      { id: "cb1", label: "CB", xPct: 30, yPct: 67 },
      { id: "cb2", label: "CB", xPct: 50, yPct: 66 },
      { id: "cb3", label: "CB", xPct: 70, yPct: 67 },
      { id: "rwb", label: "RWB", xPct: 92, yPct: 55 },
      { id: "cm1", label: "CM", xPct: 38, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 62, yPct: ROWS_4[1] },
      { id: "cam", label: "CAM", xPct: 50, yPct: ROWS_4[2] },
      { id: "st1", label: "ST", xPct: 40, yPct: ROWS_4[3] },
      { id: "st2", label: "ST", xPct: 60, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "5-2-2-1",
    label: "5-2-2-1",
    slots: [
      GK,
      { id: "lwb", label: "LWB", xPct: 8, yPct: 55 },
      { id: "cb1", label: "CB", xPct: 30, yPct: 67 },
      { id: "cb2", label: "CB", xPct: 50, yPct: 66 },
      { id: "cb3", label: "CB", xPct: 70, yPct: 67 },
      { id: "rwb", label: "RWB", xPct: 92, yPct: 55 },
      { id: "cm1", label: "CM", xPct: 38, yPct: ROWS_4[1] },
      { id: "cm2", label: "CM", xPct: 62, yPct: ROWS_4[1] },
      { id: "lf", label: "CF", xPct: 32, yPct: ROWS_4[2] },
      { id: "rf", label: "CF", xPct: 68, yPct: ROWS_4[2] },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_4[3] },
    ],
  },
  {
    id: "5-3-2",
    label: "5-3-2",
    slots: [
      GK,
      ...back5(ROWS_3[0]),
      { id: "cm1", label: "CM", xPct: 30, yPct: ROWS_3[1] },
      { id: "cm2", label: "CM", xPct: 50, yPct: ROWS_3[1] },
      { id: "cm3", label: "CM", xPct: 70, yPct: ROWS_3[1] },
      { id: "st1", label: "ST", xPct: 38, yPct: ROWS_3[2] },
      { id: "st2", label: "ST", xPct: 62, yPct: ROWS_3[2] },
    ],
  },
  {
    id: "5-4-1",
    label: "5-4-1",
    slots: [
      GK,
      ...back5(ROWS_3[0]),
      { id: "lm", label: "LM", xPct: 12, yPct: 30 },
      { id: "cm1", label: "CM", xPct: 37, yPct: 30 },
      { id: "cm2", label: "CM", xPct: 63, yPct: 30 },
      { id: "rm", label: "RM", xPct: 88, yPct: 30 },
      { id: "st", label: "ST", xPct: 50, yPct: ROWS_3[2] },
    ],
  },
];

export const DEFAULT_FORMATION_ID = FORMATIONS[0].id;

export function getFormation(formationId: string): FormationPreset {
  return (
    FORMATIONS.find((formation) => formation.id === formationId) ??
    FORMATIONS[0]
  );
}
