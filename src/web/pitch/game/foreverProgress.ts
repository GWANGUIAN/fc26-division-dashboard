// Jandi Forever progress (docs/forever/02 §4, §5): level, xp, quest states and achievements, kept in localStorage.
// Everything here is pure except `loadProgress`/`saveProgress`, which never throw: a broken or blocked storage falls
// back to the last value held in memory, and damaged data falls back to a fresh start.

export const FOREVER_PROGRESS_KEY = "fc26-forever-progress";

export type QuestId = "q_rabbits" | "q_leroy" | "q_hearth";
export type QuestState = "none" | "active" | "done";
export type AchievementId = "recall" | "leroy" | "level2";

export interface QuestProgress {
  state: QuestState;
  count: number;
}

export interface ForeverProgress {
  version: 1;
  /** From 1. */
  level: number;
  /** Xp gathered towards the next level. */
  xp: number;
  quests: Record<string, QuestProgress>;
  /** Ids of the achievements earned, in the order they were earned. */
  achievements: string[];
  /** The letter of the mailbox has been read (optional field, absent = not yet; docs/forever/07 §1-3). */
  letterRead?: boolean;
}

export interface QuestDef {
  id: QuestId;
  name: string;
  /** NPC that offers the quest. */
  giver: "questgiver" | "innkeeper";
  /** NPC that takes the quest in. */
  turnIn: "questgiver" | "leroy" | "innkeeper";
  /** `kill`: rabbits · `talk`: speak to the turn-in NPC · `hearth`: cast the hearthstone once. */
  kind: "kill" | "talk" | "hearth";
  goal: number;
  xp: number;
  achievement?: AchievementId;
  /** Quest that must be done before this one is offered. */
  requires?: QuestId;
  offer: string;
  progress: string;
  finish: string;
  reward: string;
}

/** Quest data of docs/forever/02 §5, with the dialogue drafts of 01. */
export const QUESTS: Readonly<Record<QuestId, QuestDef>> = {
  q_rabbits: {
    id: "q_rabbits",
    name: "잔디밭의 불청객",
    giver: "questgiver",
    turnIn: "questgiver",
    kind: "kill",
    goal: 5,
    xp: 100,
    offer: "이 잔디밭을 위협하는 토끼 5마리를 처치하게.",
    progress: "토끼는 아직 남아 있네. 5마리를 처치해 주게.",
    finish: "훌륭해! 이제 잔디밭이 한결 조용해졌군.",
    reward: "경험치 100",
  },
  q_leroy: {
    id: "q_leroy",
    name: "리로이를 말려라",
    giver: "questgiver",
    turnIn: "leroy",
    kind: "talk",
    goal: 1,
    xp: 150,
    achievement: "leroy",
    requires: "q_rabbits",
    offer: "광장 저쪽의 리로이 잔킨스가 또 혼자 돌진하려 하네. 가서 말 좀 걸어 주게.",
    progress: "리로이를 찾아가 말을 걸어 주게.",
    finish: "잠깐만, 나 아직 스트레칭 안 했는데! ...적어도 난 치킨이 있잖아!",
    reward: "경험치 150",
  },
  q_hearth: {
    id: "q_hearth",
    name: "집으로 돌아가는 길",
    giver: "innkeeper",
    turnIn: "innkeeper",
    kind: "hearth",
    goal: 1,
    xp: 0,
    achievement: "recall",
    offer: "여행에 지쳤다면 잔디석으로 귀환해 보게. 휴식 상태입니다. 다음 골 경험치 +100%.",
    progress: "잔디석에서 귀환을 한 번 해 오게.",
    finish: "잘 다녀왔군. 자네는 이제 어엿한 잔디 귀환자일세.",
    reward: "업적 「잔디 귀환자」",
  },
};

export const QUEST_ORDER: readonly QuestId[] = ["q_rabbits", "q_leroy", "q_hearth"];

export const ACHIEVEMENTS: Readonly<Record<AchievementId, { name: string; text: string }>> = {
  recall: { name: "잔디 귀환자", text: "잔디석으로 귀환했다." },
  leroy: { name: "적어도 치킨은 있다", text: "리로이 잔킨스를 말렸다." },
  level2: { name: "새싹 잔디", text: "레벨 2에 도달했다." },
};

/** Xp needed to go from `level` to the next one: 1→2 100, 2→3 250, 3→4 400 ... */
export function xpToNext(level: number): number {
  return 100 + 150 * (Math.max(1, Math.floor(level)) - 1);
}

export function defaultProgress(): ForeverProgress {
  return { version: 1, level: 1, xp: 0, quests: {}, achievements: [] };
}

export function questProgress(progress: ForeverProgress, id: string): QuestProgress {
  return progress.quests[id] ?? { state: "none", count: 0 };
}

/** Adds xp, rolling over into as many levels as it pays for. `levelsGained` lists each new level reached. */
export function addXp(progress: ForeverProgress, amount: number): { progress: ForeverProgress; levelsGained: number[] } {
  let { level, xp } = progress;
  xp += Math.max(0, Math.floor(amount));
  const levelsGained: number[] = [];
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levelsGained.push(level);
  }
  return { progress: { ...progress, level, xp }, levelsGained };
}

/** none → active with a zero counter. Anything else is left alone. */
export function acceptQuest(progress: ForeverProgress, id: QuestId): ForeverProgress {
  if (questProgress(progress, id).state !== "none") return progress;
  return { ...progress, quests: { ...progress.quests, [id]: { state: "active", count: 0 } } };
}

/** Adds `amount` to an active quest's counter (capped at its goal). Quests that are not active do not move. */
export function advanceQuest(progress: ForeverProgress, id: QuestId, amount = 1): ForeverProgress {
  const current = questProgress(progress, id);
  if (current.state !== "active") return progress;
  const count = Math.min(QUESTS[id].goal, current.count + Math.max(0, Math.floor(amount)));
  if (count === current.count) return progress;
  return { ...progress, quests: { ...progress.quests, [id]: { state: "active", count } } };
}

export const questReady = (progress: ForeverProgress, id: QuestId) => {
  const current = questProgress(progress, id);
  return current.state === "active" && current.count >= QUESTS[id].goal;
};

/** active (goal met) → done, paying the xp and the achievement. Otherwise nothing changes. */
export function completeQuest(progress: ForeverProgress, id: QuestId): { progress: ForeverProgress; levelsGained: number[]; achievement: AchievementId | null } {
  if (!questReady(progress, id)) return { progress, levelsGained: [], achievement: null };
  const def = QUESTS[id];
  const done: ForeverProgress = { ...progress, quests: { ...progress.quests, [id]: { state: "done", count: def.goal } } };
  const paid = addXp(done, def.xp);
  const granted = def.achievement ? grantAchievement(paid.progress, def.achievement) : { progress: paid.progress, added: false };
  return { progress: granted.progress, levelsGained: paid.levelsGained, achievement: granted.added ? (def.achievement ?? null) : null };
}

export function grantAchievement(progress: ForeverProgress, id: AchievementId): { progress: ForeverProgress; added: boolean } {
  if (progress.achievements.includes(id)) return { progress, added: false };
  return { progress: { ...progress, achievements: [...progress.achievements, id] }, added: true };
}

/** Can this NPC's quest be offered right now (not started, prerequisite done)? */
export function questOffered(progress: ForeverProgress, id: QuestId): boolean {
  const def = QUESTS[id];
  if (questProgress(progress, id).state !== "none") return false;
  return !def.requires || questProgress(progress, def.requires).state === "done";
}

/** The mark above an NPC: `!` yellow, `?` grey (in progress), `?` yellow (ready to hand in). Turn-in beats progress beats offer. */
export type QuestMark = "available" | "progress" | "complete";

export function questMarkFor(progress: ForeverProgress, npc: string): QuestMark | null {
  let mark: QuestMark | null = null;
  for (const id of QUEST_ORDER) {
    const def = QUESTS[id];
    const state = questProgress(progress, id).state;
    if (state === "active" && def.turnIn === npc) {
      // talk quests are handed in by speaking to the NPC, so the mark is already yellow
      if (questReady(progress, id) || def.kind === "talk") return "complete";
      mark = "progress";
    } else if (state === "none" && def.giver === npc && questOffered(progress, id) && mark === null) mark = "available";
  }
  return mark;
}

// ---- storage ----

let memoryProgress: ForeverProgress | null = null;

const isInt = (value: unknown, min: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min;

/** Validates raw JSON text; anything wrong (bad JSON, wrong version, wrong shapes) gives a fresh start. */
export function parseProgress(raw: string | null): ForeverProgress {
  if (!raw) return defaultProgress();
  try {
    const data = JSON.parse(raw) as Partial<ForeverProgress> | null;
    if (!data || typeof data !== "object" || data.version !== 1) return defaultProgress();
    if (!isInt(data.level, 1) || !isInt(data.xp, 0)) return defaultProgress();
    const quests: Record<string, QuestProgress> = {};
    if (data.quests && typeof data.quests === "object") {
      for (const [id, value] of Object.entries(data.quests)) {
        if (!(id in QUESTS) || !value || typeof value !== "object") continue;
        const { state, count } = value as QuestProgress;
        if ((state === "none" || state === "active" || state === "done") && isInt(count, 0)) quests[id] = { state, count: Math.min(count, QUESTS[id as QuestId].goal) };
      }
    }
    const achievements = Array.isArray(data.achievements) ? [...new Set(data.achievements.filter((id): id is string => typeof id === "string" && id in ACHIEVEMENTS))] : [];
    return clampXp({ version: 1, level: data.level, xp: data.xp, quests, achievements, ...(data.letterRead === true ? { letterRead: true } : {}) });
  } catch {
    return defaultProgress();
  }
}

/** An xp value at or past the level's price is corrupt: settle the surplus into the following levels. */
function clampXp(progress: ForeverProgress): ForeverProgress {
  return progress.xp < xpToNext(progress.level) ? progress : addXp({ ...progress, xp: 0 }, progress.xp).progress;
}

export function loadProgress(): ForeverProgress {
  try {
    const raw = localStorage.getItem(FOREVER_PROGRESS_KEY);
    if (raw !== null) return (memoryProgress = parseProgress(raw));
  } catch {
    /* storage blocked: use what this session already holds */
  }
  return memoryProgress ?? defaultProgress();
}

export function saveProgress(progress: ForeverProgress): void {
  memoryProgress = progress;
  try {
    localStorage.setItem(FOREVER_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* storage blocked or full: the memory copy still serves this session */
  }
}

/** Tests only: forgets the in-memory copy. */
export function resetProgressMemory(): void {
  memoryProgress = null;
}
