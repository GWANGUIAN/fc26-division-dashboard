// Static copy for the "오늘의 운세" tarot draw — one tarot card per roster
// player (same ids as the TOTY 3D card feature's main roster, see
// docs/toty-card-prompts.md), plus three players (재닌, 하치, 다시바) who
// each also have a second bonus card (see janine95kim2/hachi972/
// tdnlamuron2 below).
// displayName/position are NOT duplicated here; FortunePopup looks those up
// live from the streamers list by id instead (same reasoning as
// totyCardTheme.ts staying id-keyed while TotyCardPopup reads the name from
// StreamerRecord), so a roster.yaml name change doesn't require touching
// this file. Card names/fortune text are all soccer-flavored per the
// feature's concept — see docs/fortune-prompts.md for the matching
// image-generation prompts.
//
// glowColor/glowColorSoft drive the pulsing rim glow on the revealed card
// (see FortuneDraw.tsx) — deliberately its OWN independent palette per
// player, not a reuse of totyCardTheme.ts's TOTY 3D-card colors: this tarot
// deck has its own visual identity, separate from the 3D card feature (see
// docs/fortune-prompts.md's design-direction notes on this).

export interface FortuneCardEntry {
  id: string;
  cardName: string;
  fortuneText: string;
  glowColor: string;
  glowColorSoft: string;
  /** Set only when `id` does NOT match a roster.yaml id directly — e.g. a
   * player's second/alternate card (see janine95kim2, hachi972, tdnlamuron2),
   * which needs its own `id` for a distinct image asset
   * (`<id>-fortune-card.webp`) and its own reveal-history entry, but should
   * still show that player's real displayName when revealed.
   * FortuneDraw.tsx/FortuneHistoryModal.tsx look up the streamer by
   * `streamerId ?? id`. */
  streamerId?: string;
  /** Explicit sfx URL to play instead of that streamer's own
   * StreamerRecord.sfx — used by janine95kim2/hachi972 so a player's second
   * card has its own distinct sound rather than replaying their regular
   * card's sfx. Not every second card needs this — tdnlamuron2 deliberately
   * leaves it unset to reuse 다시바's own sfx (see below). */
  sfxOverride?: string;
}

export const FORTUNE_CARDS: FortuneCardEntry[] = [
  {
    id: "tdnlamuron",
    cardName: "타오르는 돌격병",
    fortuneText: "그라운드에 불이 붙는다🔥 오늘의 질주는 브레이크가 없다 — 수비 세 명쯤은 스쳐 지나가는 바람일 뿐.",
    glowColor: "#ff5c5c",
    glowColorSoft: "#ffe0e0",
  },
  {
    // 다시바의 두 번째(보너스) 카드 — 별명 "수은추"(리그 오브 레전드의 모든
    // 디버프를 제거하는 아이템 "수은 장식띠"에서 따온 "수은"=분위기를
    // 환기시키고 곁에 있으면 힐링되는 사람 + "추"="남자" 놀림조 접미사, 실제
    // 여자인데 장난삼아 붙은 별명)를 패러디한 개그 카드. janine95kim2/hachi972와
    // 같은 패턴: 정체성은 다시바 그대로, id만 달라서 전용 이미지
    // (tdnlamuron2-fortune-card.webp)와 별도의 "뽑았던 카드" 기록을 가짐 —
    // streamerId로 실제 표시 이름(다시바)은 그대로 가져옴. sfxOverride 없이
    // 원래 카드와 같은 효과음(dashiba.mp3)을 그대로 씀(사용자 요청). 자세한
    // 내용은 docs/fortune-prompts.md 참고.
    id: "tdnlamuron2",
    streamerId: "tdnlamuron",
    cardName: "수은추의 정화",
    fortuneText: "다시바가 스쳐 지나가기만 해도 안 좋은 기운은 전부 씻겨 내려간다. 팀은 오늘도 장난삼아 그녀를 '수은추'라 부르지만, 그 정화 능력만큼은 의심할 여지가 없다.",
    glowColor: "#b8c9dc",
    glowColorSoft: "#f2f6fb",
  },
  {
    id: "ju010228",
    cardName: "봄의 골잡이",
    fortuneText: "떠오르는 태양처럼 거침없이 솟아오르는 기세. 오늘 날리는 슈팅은 전부 골문 안으로 빨려 들어간다.",
    glowColor: "#ffcf4d",
    glowColorSoft: "#fff3d0",
  },
  {
    id: "doormomo",
    cardName: "천리안의 지휘관",
    fortuneText: "필드 전체가 손바닥 위에 놓인 듯 훤히 보이는 날. 다만 큰 그림에 몰두하다 눈앞의 쉬운 기회를 놓치기 쉬우니, 가끔은 단순하게 갈 것.",
    glowColor: "#8fb4ff",
    glowColorSoft: "#eaf2ff",
  },
  {
    id: "bboringirl",
    cardName: "강철 심장 미드필더",
    fortuneText: "초반엔 다리가 유난히 무겁게 느껴진다. 하지만 그 엔진은 끝까지 멈추지 않고, 후반 추가시간에 진짜 실력이 드러난다.",
    glowColor: "#c9536b",
    glowColorSoft: "#ffd9b3",
  },
  {
    id: "kaksjak0730",
    cardName: "밤하늘의 프리키커",
    fortuneText: "밤하늘의 별처럼 흔들림 없는 눈. 오늘의 프리킥 한 방이 상대 골키퍼의 두 발을 얼려버린다.",
    glowColor: "#c9a6ff",
    glowColorSoft: "#f0e6ff",
  },
  {
    id: "sjh4018",
    cardName: "공중 요새의 수문장",
    fortuneText: "하늘 위에서 내려다보는 단단한 방패. 오늘의 수비 라인은 무엇도 뚫을 수 없는 요새가 된다.",
    glowColor: "#8fd0ff",
    glowColorSoft: "#f2fbff",
  },
  {
    id: "haepalin",
    cardName: "고요한 물결의 파수꾼",
    fortuneText: "서두르면 오히려 놓친다. 물처럼 차분히 기다리면, 상대가 먼저 제풀에 지쳐 무너진다.",
    glowColor: "#9fd8b0",
    glowColorSoft: "#eafff2",
  },
  {
    id: "lina0108",
    cardName: "엇갈린 시선의 갈림길 요정",
    fortuneText: "리냐의 시선이 어디를 향하는지는 아무도 모른다. 하지만 그 알 수 없는 방향 끝에, 아무도 예상 못한 찬스가 기다리고 있다.",
    glowColor: "#b98aff",
    glowColorSoft: "#8be8d8",
  },
  {
    id: "tleod1818",
    cardName: "번개의 질주자",
    fortuneText: "번개처럼 빠르지만, 너무 서두르면 발이 꼬인다. 속도를 늦추고 타이밍을 노리면, 완벽한 크로스가 어시스트로 이어진다.",
    glowColor: "#4dd9e0",
    glowColorSoft: "#e0fbff",
  },
  {
    id: "janine95kim",
    cardName: "서리의 골키퍼",
    fortuneText: "손끝에서 서리가 피어나는 순간, 골문은 완전히 얼어붙는다. 오늘 그 어떤 슈팅도 재닌의 손끝을 피해가지 못한다.",
    glowColor: "#a6dcff",
    glowColorSoft: "#f0faff",
  },
  {
    // 재닌의 두 번째(보너스) 카드 — 평소 목소리가 걸걸하고 노래를 못해서 붙은
    // 별명 "퉁퉁이"(도라에몽)를 패러디한 개그 카드. 얼굴은 재닌 본인이고
    // 의상/포즈만 퉁퉁이 스타일인 합성 캐릭터라 위 janine95kim 카드와는 완전히
    // 별개의 항목으로 둠 — id를 다르게 줘서 전용 이미지
    // (janine95kim2-fortune-card.webp)와 별도의 "뽑았던 카드" 기록을 갖게
    // 하되, streamerId로 실제 표시 이름(재닌)은 그대로 가져옴. 자세한 내용은
    // docs/fortune-prompts.md 참고.
    id: "janine95kim2",
    streamerId: "janine95kim",
    cardName: "울부짖는 수문장",
    fortuneText: "재닌이 목청을 가다듬는 순간, 상대 공격수의 다리가 얼어붙는다. 오늘 그 어떤 슈팅도 그 우렁찬 포효를 뚫지 못한다.",
    glowColor: "#e8bf4e",
    glowColorSoft: "#fff3d6",
    // 본인 카드(jaenin.mp3)와 겹치지 않도록 예전에 쓰이던 재닌 효과음(git
    // 히스토리상 jaenin.mp3의 바로 이전 버전)을 별도 파일로 복원해서 사용.
    sfxOverride: "/sfxes/jaenin-tongtongi.mp3",
  },
  {
    id: "hachi97",
    cardName: "황금 드래곤의 강림",
    fortuneText: "황금빛 기운이 온몸을 감싸는 날. 무엇을 하든 다 이루어진다 — 드리블로 세 명을 제치는 상상마저 현실이 된다.",
    glowColor: "#ffe29e",
    glowColorSoft: "#d9b3ff",
  },
  {
    // 하치의 두 번째(보너스) 카드 — "두고하치"(하치가 우왁굳에게 강력 추천한
    // 게임이 실제로 플레이됐는데 그 게임을 싫어하던 일부 팬들이 "두고보자"+
    // "하치"를 합쳐 채팅으로 벼르면서 굳어진 밈) 패러디. janine95kim2와 같은
    // 패턴: 얼굴/정체성은 하치 그대로, id만 달라서 전용 이미지
    // (hachi972-fortune-card.webp)와 별도의 "뽑았던 카드" 기록을 가짐 —
    // streamerId로 실제 표시 이름(하치)은 그대로 가져옴. 자세한 내용은
    // docs/fortune-prompts.md 참고.
    id: "hachi972",
    streamerId: "hachi97",
    cardName: "두고하치의 심판",
    fortuneText: "하치가 오늘도 자신만만하게 다음 수를 추천한다. 어디선가 '두고하치...'라는 채팅이 스쳐 지나가지만, 정작 본인은 신경도 안 쓰고 이미 다음 골 세리머니를 준비하는 중.",
    glowColor: "#ff8a4d",
    glowColorSoft: "#ffe3c2",
    // 본인 카드(hachi.mp3)와 겹치지 않는 전용 효과음.
    sfxOverride: "/sfxes/hachi-dugohachi.mp3",
  },
];

export function getFortuneCard(id: string): FortuneCardEntry | undefined {
  return FORTUNE_CARDS.find((card) => card.id === id);
}

function effectiveStreamerId(entry: Pick<FortuneCardEntry, "id" | "streamerId">): string {
  return entry.streamerId ?? entry.id;
}

/** 1-based position of `entry` among the FORTUNE_CARDS entries that share
 * its streamer (via `streamerId ?? id`), in array order — always 1 for a
 * single-card player, 1/2/... for a multi-card player's cards (e.g.
 * janine95kim → 1, janine95kim2 → 2). A card that isn't in FORTUNE_CARDS at
 * all (the hidden 우왁굳 card lives outside it, see
 * fortuneWoowakgoodCard.ts) reports 1. */
export function getFortuneCardOrdinal(entry: Pick<FortuneCardEntry, "id" | "streamerId">): number {
  const sid = effectiveStreamerId(entry);
  let ordinal = 0;
  for (const candidate of FORTUNE_CARDS) {
    if (effectiveStreamerId(candidate) === sid) {
      ordinal++;
      if (candidate.id === entry.id) return ordinal;
    }
  }
  return 1;
}

/** How many FORTUNE_CARDS entries share `entry`'s streamer — 1 for every
 * player with a single card, 2+ for janine95kim/hachi97/tdnlamuron (each of
 * which also has a second bonus card). */
export function getFortuneCardCountForStreamer(entry: Pick<FortuneCardEntry, "id" | "streamerId">): number {
  const sid = effectiveStreamerId(entry);
  const count = FORTUNE_CARDS.filter((candidate) => effectiveStreamerId(candidate) === sid).length;
  return count || 1;
}

const ORDINAL_WORDS = ["첫번째", "두번째", "세번째", "네번째", "다섯번째"];

function ordinalWord(n: number): string {
  return ORDINAL_WORDS[n - 1] ?? `${n}번째`;
}

/** "~의 카드" eyebrow text shown above a revealed card — FortuneDraw.tsx's
 * reveal panel and FortuneHistoryModal.tsx's detail panel both use this, so
 * a multi-card streamer (재닌/하치/다시바) reads "~의 첫번째 카드"/"~의
 * 두번째 카드" in both places instead of an ambiguous "~의 카드" that
 * doesn't say which of their cards this is. Falls back to "오늘의 카드"
 * when `displayName` couldn't be resolved. */
export function formatFortuneCardEyebrow(
  displayName: string | undefined,
  entry: FortuneCardEntry,
): string {
  if (!displayName) return "오늘의 카드";
  if (getFortuneCardCountForStreamer(entry) <= 1) return `${displayName}의 카드`;
  return `${displayName}의 ${ordinalWord(getFortuneCardOrdinal(entry))} 카드`;
}

/** "이름" / "이름(1)" / "이름(2)" label used in the "뽑았던 카드" history
 * list (FortuneHistoryModal.tsx) — only a multi-card streamer gets the
 * "(n)" suffix, so single-card players' entries look exactly as before.
 * Falls back to the card's own name when `displayName` couldn't be
 * resolved (same fallback the list already had). */
export function formatFortuneCardListLabel(
  displayName: string | undefined,
  entry: FortuneCardEntry,
): string {
  const name = displayName ?? entry.cardName;
  if (!displayName || getFortuneCardCountForStreamer(entry) <= 1) return name;
  return `${name}(${getFortuneCardOrdinal(entry)})`;
}

/** Picks `count` distinct random entries from an arbitrary `pool`
 * (Fisher–Yates partial shuffle) — the primitive both
 * drawRandomFortuneCards below and FortuneDraw.tsx's own "새로운 카드만
 * 뽑기" filtering build on. */
export function drawRandomFromPool(pool: FortuneCardEntry[], count: number): FortuneCardEntry[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/** Picks `count` distinct random entries from the full FORTUNE_CARDS deck.
 * `extraCards` is folded into the pool alongside it — used to mix in the
 * hidden 우왁굳 card (see fortuneWoowakgoodCard.ts) once
 * useFortuneBonusUnlock.ts says it's been unlocked, without this module
 * needing to import that standalone card itself. */
export function drawRandomFortuneCards(count: number, extraCards: FortuneCardEntry[] = []): FortuneCardEntry[] {
  return drawRandomFromPool([...FORTUNE_CARDS, ...extraCards], count);
}
