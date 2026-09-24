// Gameplay numbers (docs/pitch/02 §2·§3). Change a value here and in the matching 02 table together
// (README "변경 전파 프로토콜"). Coordinates are logical 960×540 px, time in seconds.

/** Play area for a foot position (02 §2): nothing may stand behind the goal line (y 150) or off the pitch. */
export const PLAY_AREA = { minX: 40, maxX: 920, minY: 178, maxY: 510 } as const;

export const SPAWN = { x: 480, y: 440 } as const;

/** Goal line and mouth (02 §2). Used for the shooting distance in P3. */
export const GOAL = { lineY: 150, centerX: 480, minX: 360, maxX: 600 } as const;

export const MOVE = {
  /** Top speed while running / holding Shift, px/s. */
  runSpeed: 200,
  sprintSpeed: 290,
  accel: 1400,
  decel: 1800,
  /** Vertical speed multiplier (3/4 perspective). */
  yFactor: 0.75,
  /** Below this speed the `idle` clip plays, else `run`. */
  idleSpeed: 8,
  /** Run clip frame rate scales with speed between these (fps at idleSpeed → fps at sprintSpeed). */
  runFpsMin: 6,
  runFpsMax: 12,
} as const;

/** `depthScale(y) = 0.85 + 0.25 × clamp((y−178)/332, 0, 1)` — farther (higher up) is smaller. */
export const DEPTH = { base: 0.85, range: 0.25, y0: 178, span: 332 } as const;

export const DRIBBLE = {
  /** Ball rests this far in front of the feet while running. */
  touchDistance: 28,
  /** Follow stiffness (rad/s, critically damped). */
  followK: 18,
  /** Damping ratio of the follow spring (1 = critical, no overshoot; lower lets the ball swing past the target). */
  followDamping: 1,
  /** While sprinting the ball is pushed further ahead and follows more slowly. */
  sprintTouchDistance: 44,
  sprintFollowK: 9,
  sprintFollowDamping: 0.15,
  /** Ball this far from the feet (px) while carried → possession is lost. */
  looseDistance: 90,
  /** A loose ball within this range of the feet is taken again. */
  regainDistance: 20,
  /** Friction of a loose ball (velocity × e^(−friction·t)). */
  looseFriction: 4.0,
  /** A loose ball slower than this stops dead. */
  stopSpeed: 4,
  /** Trapping animation after regaining the ball. */
  trapSeconds: 0.15,
  /** After going out, the ball waits this long before resetting to the spawn. */
  deadSeconds: 0.6,
  /** Ball animation: strip frames advanced per px rolled (8 frames ≈ one turn of a 16px ball). */
  spinFramesPerPx: 0.16,
} as const;

/** Only a carried ball within this distance of the goal center can be shot (P3). */
export const SHOOT_MAX_DISTANCE = 520;

/** Goal mouth in gameplay units (02 §2): width W between the posts, height `goalH` in z px. */
export const GOAL_MOUTH = { width: 240, height: 80 } as const;

/**
 * Screen mapping of the goal plane (02 §2): gameplay puts the goal line at y 150, but the goal art stands on the
 * pitch's end line, so a shot's ground track ends at screen y 118 and a height of z px is drawn `z × zScale` up.
 */
export const GOAL_SCREEN = { planeY: 118, zScale: 74 / 80, keeperY: 128, xScale: 150 / 240 } as const;

/** Gameplay x (goal mouth 240 wide, keeper range 375~585) → screen x: the goal art is only ~130px between its posts. */
export function goalScreenX(x: number) {
  return 480 + (x - 480) * GOAL_SCREEN.xScale;
}

/** Three-step shot (02 §4). Debug panel edits a copy, so shot functions take the tuning as an argument. */
export interface ShotTuning {
  aimSeconds: number;
  powerSeconds: number;
  /** Each of the aim / power stages is cancelled after this long. */
  timeoutSeconds: number;
  /** Aim range extends this fraction of W past each post. */
  overshoot: number;
  sweetMin: number;
  sweetMax: number;
  speedMin: number;
  speedMax: number;
  /** h = goalH × (hBase + hRange × (p/100)^hExp); above `overPower` it gains (p − overPower) × overSlope. */
  hBase: number;
  hRange: number;
  hExp: number;
  overPower: number;
  overSlope: number;
  /** Jitter σ = jitterBase·W × (1 + |p−jitterPower|/jitterSpan) × (0.8 + dist/jitterDist) × (1 + |angle|/jitterAngle). */
  jitterBase: number;
  jitterPower: number;
  jitterSpan: number;
  jitterDist: number;
  jitterAngle: number;
  sweetJitter: number;
  /** Extra visual lob: peak height = arc × dist × (p/100). 02 §4 has no power factor; this keeps soft shots on the grass. */
  arc: number;
  postTolerance: number;
  barTolerance: number;
  /** Seconds the kick animation plays before the state returns to idle. */
  kickSeconds: number;
}

export const SHOT: Readonly<ShotTuning> = {
  aimSeconds: 1.1,
  powerSeconds: 1.8,
  timeoutSeconds: 3,
  overshoot: 0.12,
  sweetMin: 78,
  sweetMax: 92,
  speedMin: 420,
  speedMax: 1100,
  hBase: 0.12,
  hRange: 0.88,
  hExp: 1.2,
  overPower: 92,
  overSlope: 2.4,
  jitterBase: 0.06,
  jitterPower: 85,
  jitterSpan: 40,
  jitterDist: 500,
  jitterAngle: 60,
  sweetJitter: 0.6,
  arc: 0.16,
  postTolerance: 6,
  barTolerance: 6,
  kickSeconds: 0.25,
};

/** AI goalkeeper (02 §6). `react`/`diveSpeed`/`maxReach`/`predErr`/`bodyReach` are the difficulty variables D. */
export interface KeeperTuning {
  react: number;
  diveSpeed: number;
  maxReach: number;
  predErr: number;
  /** Fixed reach of body and arms added to the dive reach (the dive alone cannot cover a sweet-spot shot). */
  bodyReach: number;
  /** Dive reach is scaled by 1 + N(0, reachSpread) (floor 0.4): a dive is never exactly as long as the model says. */
  reachSpread: number;
  /** Within this horizontal distance (px) the keeper does not need to guess the direction. */
  centerZone: number;
  /** Sweet-spot shots shorten the reach to this fraction. */
  sweetReach: number;
  /** Style Tier 0 / 1 / 2 (02 §5): extra reaction time (s), prediction error multiplier, chance the keeper is completely fooled. */
  tierReact: readonly [number, number, number];
  tierPredErr: readonly [number, number, number];
  tierFooled: readonly [number, number, number];
  /** Positioning (ready / track). */
  follow: number;
  followClamp: number;
  maxSpeed: number;
  accel: number;
  hesitateChance: number;
  hesitateSeconds: number;
  /** Seconds between hesitation rolls. */
  hesitateInterval: number;
  /** Keeper x range while diving / tracking. */
  minX: number;
  maxX: number;
}

export const KEEPER: Readonly<KeeperTuning> = {
  react: 0.2,
  diveSpeed: 328,
  maxReach: 92,
  predErr: 0.08,
  bodyReach: 13.5,
  reachSpread: 0.23,
  centerZone: 30,
  sweetReach: 0.95,
  tierReact: [0, 0.1, 0.2],
  tierPredErr: [1, 1.25, 1.5],
  tierFooled: [0, 0, 0.08],
  follow: 0.35,
  followClamp: 60,
  maxSpeed: 180,
  accel: 900,
  hesitateChance: 0.05,
  hesitateSeconds: 0.3,
  hesitateInterval: 0.25,
  minX: 375,
  maxX: 585,
};

/** Result sequence (02 §7): banner + celebration, then a short fade to the reset. */
export const MATCH = { resultSeconds: 2.0, fadeSeconds: 0.3, bannerSeconds: 1.4, tooFarSeconds: 0.7 } as const;

export const DUST = {
  capacity: 48,
  runInterval: 0.09,
  sprintInterval: 0.045,
  life: 0.35,
} as const;


export function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

export function depthScale(y: number) {
  return DEPTH.base + DEPTH.range * clamp((y - DEPTH.y0) / DEPTH.span, 0, 1);
}

// ---- P4: skills, style gauge, presentation (docs/pitch/02 §5·§7) ----

export type SkillId = "stepover" | "roulette" | "rainbow" | "elastico";

export interface SkillDef {
  /** `event.code` of the key (02 §1). */
  code: string;
  /** Short key label for the HUD. */
  key: string;
  label: string;
  /** Atlas clip name (`skill_<id>`). */
  clip: `skill_${SkillId}`;
  /** Seconds the move lasts. */
  duration: number;
  /** Forward travel in px (the y part is scaled by MOVE.yFactor). */
  move: number;
  /** Style gained before the chain multiplier. */
  style: number;
  /** Peak height of the hop in screen px (the rainbow flick jumps). */
  hop: number;
}

export const SKILLS: Readonly<Record<SkillId, SkillDef>> = {
  stepover: { code: "KeyZ", key: "Z", label: "스텝오버", clip: "skill_stepover", duration: 0.45, move: 48, style: 25, hop: 0 },
  roulette: { code: "KeyX", key: "X", label: "룰렛", clip: "skill_roulette", duration: 0.55, move: 60, style: 35, hop: 0 },
  rainbow: { code: "KeyC", key: "C", label: "레인보우 플릭", clip: "skill_rainbow", duration: 0.7, move: 72, style: 45, hop: 22 },
  elastico: { code: "KeyV", key: "V", label: "엘라스티코", clip: "skill_elastico", duration: 0.55, move: 56, style: 50, hop: 0 },
};

export const SKILL_IDS: readonly SkillId[] = ["stepover", "roulette", "rainbow", "elastico"];

/** Cooldown / chain / gauge rules (02 §5). Cooldown counts from the end of a move. */
export const STYLE = {
  cooldown: 0.5,
  /** The last part of a move can be cut short by a shot. */
  cancelWindow: 0.15,
  /** A different move within this many seconds after the previous one chains. */
  chainWindow: 2.0,
  chainBonus: 1.5,
  repeatPenalty: 0.5,
  max: 100,
  /** The gauge starts to drain this long after the last gain, at `decayPerSecond`. */
  decayDelay: 2.0,
  decayPerSecond: 15,
  tier1: 50,
  tier2: 80,
  /** Combo pips shown on the meter. */
  pips: 5,
} as const;

/** Camera shake, hit stop and effect timings (02 §7). */
export const JUICE = {
  goalShake: 6,
  goalShakeSeconds: 0.25,
  postShake: 3,
  postShakeSeconds: 0.15,
  goalHitstop: 0.06,
  confetti: 36,
  crowdFlashSeconds: 0.4,
  calloutSeconds: 1.1,
  skillLabelSeconds: 0.9,
} as const;
