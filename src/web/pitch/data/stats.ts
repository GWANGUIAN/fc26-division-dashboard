// Stat sheets for the locker-room hexagon (docs/pitch/03 §5, 11). Names, descriptions, judging criteria and detail
// items are decided (11 §3~§5); the ability NUMBERS are not, so every `values` entry is null ("???", flat 60% polygon,
// COMING SOON ribbon). Field positions = 3 shared common axes + 3 position-specific ones; GK = six GK-only axes;
// the manager (MGR) has no definition yet and keeps six "???" axes.
//
// When the numbers are decided, fill ONLY `values` of each sheet in `STAT_SHEETS` (0..100 per axis, same order as
// `axes`); `ui/hexagon.ts` and `scenes/StatScene.ts` read everything from `statSheetFor()`.
// Completeness and composition are enforced by `__tests__/stats.test.ts`.

import type { PositionKey } from "./characters";

export type { PositionKey };

export const POSITION_KEYS = ["GK", "CB", "FB", "CDM", "CM", "WF", "ST", "MGR"] as const satisfies readonly PositionKey[];

/** A hexagon has six axes, listed from 12 o'clock clockwise. */
export const STAT_AXIS_COUNT = 6;

/** What every not-yet-decided text shows. */
export const STAT_PLACEHOLDER = "???";

export type StatKind = "common" | "unique";

/** A detail item of an axis (e.g. "탈압박 패스" under 탈압박). */
export interface StatSub {
  title: string;
  /** Extra one-line explanation. */
  text?: string;
  plus?: string;
  minus?: string;
  /** Shown as chips. */
  children?: readonly string[];
}

export interface StatAxis {
  id: string;
  /** Hexagon label and panel title, at most 6 characters (the label plate is 72px wide). */
  label: string;
  kind: StatKind;
  description: string;
  /** Judging criteria: what raises / lowers the stat. */
  plus?: string;
  minus?: string;
  subs?: readonly StatSub[];
}

export type StatAxes = readonly [StatAxis, StatAxis, StatAxis, StatAxis, StatAxis, StatAxis];

export interface StatSheet {
  position: PositionKey;
  /** Index 0 is the top axis (12 o'clock); the rest follow clockwise. */
  axes: StatAxes;
  /** One value per axis, 0..100; `null` = not decided ("???"). */
  values: readonly (number | null)[];
}

// ---- common axes (one object each, shared by the six field positions) ----

export const COMMON_POSITIONING: StatAxis = {
  id: "common-positioning",
  label: "위치선정",
  kind: "common",
  description: "전술적으로 올바른 위치에 서 있는 능력",
  plus: "전술적으로 위치했을 경우",
  minus: "위치하지 못했을 경우",
  subs: [
    { title: "수비 오프더 볼 위치선정", text: "수비 스탯이 있는 포지션은 제외" },
    { title: "공격 오프더 볼 위치선정" },
    { title: "스위칭 판단" },
  ],
};

export const COMMON_PRESS_ESCAPE: StatAxis = {
  id: "common-press-escape",
  label: "탈압박",
  kind: "common",
  description: "압박 속에서 패스와 볼 컨트롤로 빠져나오는 능력",
  subs: [
    {
      title: "탈압박 패스",
      plus: "탈압박 패스가 필요한 상황에서 이행 시",
      minus: "이행하지 못하거나 뺏길 시(유지 혹은 −)",
      children: ["리턴패스", "롱패스", "백패스"],
    },
    {
      title: "볼 컨트롤",
      plus: "볼을 빼앗기지 않을 경우",
      minus: "빼앗길 경우",
      children: ["볼키핑", "개인기", "드리블"],
    },
  ],
};

export const COMMON_PASSING: StatAxis = {
  id: "common-passing",
  label: "패스",
  kind: "common",
  description: "전술적으로 의미 있는 패스를 이행하는 능력",
  plus: "전술적 패스 이행 시",
  minus: "이행하지 못할 시",
  subs: [
    { title: "시야 (패스 판단)", text: "패스를 꼭 해야 하는 곳을 인지하는 능력" },
    { title: "패스 정확도", text: "실제로 패스를 성공시키는 능력, 혹은 의미 있게 시도하는 능력" },
  ],
};

export const COMMON_AXES = [COMMON_POSITIONING, COMMON_PRESS_ESCAPE, COMMON_PASSING] as const;

// ---- position-specific axes (11 §4) ----

/** ST · WF · CM share this one. */
export const GOAL_FINISHING: StatAxis = {
  id: "unique-goal-finishing",
  label: "골 결정력",
  kind: "unique",
  description: "넣어야 될 골을 넣는 능력",
  plus: "넣어야 될 골을 넣었을 시",
  minus: "못 넣었을 시",
};

const ST_HOLDING: StatAxis = {
  id: "st-holding",
  label: "홀딩 판단",
  kind: "unique",
  description: "홀딩이 필요한 상황에서 홀딩하거나 홀딩 포지션을 잡는 판단 능력",
  plus: "홀딩해야 하는 상황에서 홀딩하거나 홀딩 포지션을 잡을 시",
  minus: "기타 유지 혹은 −",
};

const ST_CREATION: StatAxis = {
  id: "st-creation",
  label: "창조",
  kind: "unique",
  description: "의외성 있는 플레이와 다양한 기술로 기점이 되거나 스스로 골 찬스를 만들어 내는 능력",
};

const WF_DRIBBLE_BREAK: StatAxis = {
  id: "wf-dribble-break",
  label: "돌파",
  kind: "unique",
  description: "상대 선수를 제치거나 벗기는 능력",
};

const WF_CREATION: StatAxis = {
  id: "wf-creation",
  label: "창조",
  kind: "unique",
  description: "의외성, 크리에이티브하게 상황을 스스로 만드는 능력. 엔드라인까지 쇄도하거나 측면에서 개인기 등으로 상황을 창출한다",
};

/** CB · FB. */
export const CLEARING: StatAxis = {
  id: "unique-clearing",
  label: "클리어",
  kind: "unique",
  description: "볼을 쓸데없이 끌지 않고 안전하게 클리어해야 하는 상황에 대한 정확한 판단 능력",
};

/** CB · FB · CDM share this wording. */
export const CREATION_DEFENDER: StatAxis = {
  id: "unique-creation-defender",
  label: "창조",
  kind: "unique",
  description: "의외성, 공격 가담 및 스위칭, 드리블 등으로 상황을 스스로 만드는 능력",
};

/** CB · FB. */
export const DEFENDING_BACK: StatAxis = {
  id: "unique-defending-back",
  label: "수비",
  kind: "unique",
  description: "볼을 뺏어야 하는 상황에서 뺏을 수 있는 능력, 커버력 등",
};

const CM_CREATION: StatAxis = {
  id: "cm-creation",
  label: "창조",
  kind: "unique",
  description: "패스를 하거나 전진해야 하는 상황이 아닐 때를 파악하고 조율하는 능력, 스스로 상황을 만드는 능력",
};

const CM_DEFENDING: StatAxis = {
  id: "cm-defending",
  label: "수비",
  kind: "unique",
  description: "중미도 수비를 가담해야 할 상황 판단, 가로채기 능력 등",
};

const CDM_COORDINATION: StatAxis = {
  id: "cdm-coordination",
  label: "조율",
  kind: "unique",
  description: "포백으로 갈지, 전진할지, 왼쪽으로 갈지 오른쪽으로 돌릴지 판단하는 능력, 풀백 이용 능력 등",
};

const CDM_DEFENDING: StatAxis = {
  id: "cdm-defending",
  label: "수비",
  kind: "unique",
  description: "포백을 커버하는 능력, 수비 능력 등",
};

// ---- GK (11 §5): six GK-only axes, no common ones ----

const gkAxis = (id: string, label: string, description: string): StatAxis => ({ id: `gk-${id}`, label, kind: "unique", description });

const GK_AXES: StatAxes = [
  gkAxis("positioning", "위치 선정", "애초에 위치를 잘 잡고 있는지"),
  gkAxis("basic-keeping", "기본 골키핑", "당연히 막아야 하는 걸 막는 능력"),
  gkAxis("advanced-keeping", "상급 골키핑", "먹힐 수도 있는 슛을 막는 능력"),
  gkAxis("distribution", "볼 배급", "누구에게 찰지, 아니면 던질지 정확하고 빠르게 판단하는 능력"),
  gkAxis("passing", "패스", "실제로 패스가 연결되는 능력"),
  gkAxis("penalty", "승부차기", "승부차기 방어율"),
];

// ---- sheets ----

const NO_VALUES: readonly (number | null)[] = [null, null, null, null, null, null];

const fieldSheet = (position: PositionKey, unique: readonly [StatAxis, StatAxis, StatAxis]): StatSheet => ({
  position,
  axes: [...COMMON_AXES, ...unique] as unknown as StatAxes,
  values: NO_VALUES,
});

const placeholderAxis = (position: PositionKey, index: number): StatAxis => ({
  id: `${position.toLowerCase()}-${index + 1}`,
  label: STAT_PLACEHOLDER,
  kind: "unique",
  description: STAT_PLACEHOLDER,
});

const placeholderSheet = (position: PositionKey): StatSheet => ({
  position,
  axes: [0, 1, 2, 3, 4, 5].map((index) => placeholderAxis(position, index)) as unknown as StatAxes,
  values: NO_VALUES,
});

export const STAT_SHEETS: Readonly<Record<PositionKey, StatSheet>> = {
  GK: { position: "GK", axes: GK_AXES, values: NO_VALUES },
  CB: fieldSheet("CB", [CLEARING, CREATION_DEFENDER, DEFENDING_BACK]),
  FB: fieldSheet("FB", [CLEARING, CREATION_DEFENDER, DEFENDING_BACK]),
  CDM: fieldSheet("CDM", [CDM_COORDINATION, CREATION_DEFENDER, CDM_DEFENDING]),
  CM: fieldSheet("CM", [GOAL_FINISHING, CM_CREATION, CM_DEFENDING]),
  WF: fieldSheet("WF", [GOAL_FINISHING, WF_DRIBBLE_BREAK, WF_CREATION]),
  ST: fieldSheet("ST", [GOAL_FINISHING, ST_HOLDING, ST_CREATION]),
  MGR: placeholderSheet("MGR"),
};

export function statSheetFor(position: PositionKey): StatSheet {
  return STAT_SHEETS[position] ?? STAT_SHEETS.MGR;
}

/** Text of the detail panel / plate for an axis: the placeholder when nothing is decided. */
export function axisLabel(sheet: StatSheet, index: number): string {
  return sheet.axes[index]?.label || STAT_PLACEHOLDER;
}

export function axisDescription(sheet: StatSheet, index: number): string {
  return sheet.axes[index]?.description || STAT_PLACEHOLDER;
}

/** True for an axis whose name is not decided yet (the manager's). */
export function isPlaceholderAxis(axis: StatAxis): boolean {
  return axis.label === STAT_PLACEHOLDER;
}

/** True while the sheet has no decided value at all (the COMING SOON ribbon stays up). */
export function isPlaceholderSheet(sheet: StatSheet): boolean {
  return sheet.values.every((value) => value === null);
}

/** Tag text of an axis's kind chip: 공통 / 고유 (GK's own axes read "GK 고유"). */
export function axisTag(axis: StatAxis): string {
  if (axis.kind === "common") return "공통";
  return axis.id.startsWith("gk-") ? "GK 고유" : "고유";
}
