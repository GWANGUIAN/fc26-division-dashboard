// Static copy for the "오늘의 운세" tarot draw — 11 roster players, one tarot
// card each (same 11 ids as the TOTY 3D card feature's main roster, see
// docs/toty-card-prompts.md). displayName/position are NOT duplicated here;
// FortunePopup looks those up live from the streamers list by id instead
// (same reasoning as totyCardTheme.ts staying id-keyed while TotyCardPopup
// reads the name from StreamerRecord), so a roster.yaml name change doesn't
// require touching this file. Card names/fortune text are all
// soccer-flavored per the feature's concept — see docs/fortune-prompts.md
// for the matching image-generation prompts.
//
// glowColor/glowColorSoft drive the pulsing rim glow on the revealed card
// (see FortuneDraw.tsx) — deliberately its OWN independent palette per
// player, not a reuse of totyCardTheme.ts's TOTY 3D-card colors: this tarot
// deck has its own visual identity, separate from the 3D card feature (see
// docs/fortune-prompts.md's design-direction notes on this).

export interface FortuneCardEntry {
  id: string;
  cardName: string;
  /** Contains literal "\n" at the natural sentence/clause break — rendered
   * with `white-space: pre-line` in fortune-draw.css so the description
   * always wraps at that point instead of wherever the browser happens to
   * break the line. */
  fortuneText: string;
  glowColor: string;
  glowColorSoft: string;
}

export const FORTUNE_CARDS: FortuneCardEntry[] = [
  {
    id: "tdnlamuron",
    cardName: "타오르는 돌격병",
    fortuneText: "그라운드에 불이 붙는다🔥\n오늘의 질주는 브레이크가 없다 — 수비 세 명쯤은 스쳐 지나가는 바람일 뿐.",
    glowColor: "#ff5c5c",
    glowColorSoft: "#ffe0e0",
  },
  {
    id: "ju010228",
    cardName: "봄의 골잡이",
    fortuneText: "떠오르는 태양처럼 거침없이 솟아오르는 기세.\n오늘 날리는 슈팅은 전부 골문 안으로 빨려 들어간다.",
    glowColor: "#ffcf4d",
    glowColorSoft: "#fff3d0",
  },
  {
    id: "doormomo",
    cardName: "천리안의 지휘관",
    fortuneText: "필드 전체가 손바닥 위에 놓인 듯 훤히 보이는 날.\n다만 큰 그림에 몰두하다 눈앞의 쉬운 기회를 놓치기 쉬우니, 가끔은 단순하게 갈 것.",
    glowColor: "#8fb4ff",
    glowColorSoft: "#eaf2ff",
  },
  {
    id: "bboringirl",
    cardName: "강철 심장 미드필더",
    fortuneText: "초반엔 다리가 유난히 무겁게 느껴진다.\n하지만 그 엔진은 끝까지 멈추지 않고, 후반 추가시간에 진짜 실력이 드러난다.",
    glowColor: "#c9536b",
    glowColorSoft: "#ffd9b3",
  },
  {
    id: "kaksjak0730",
    cardName: "밤하늘의 프리키커",
    fortuneText: "밤하늘의 별처럼 흔들림 없는 눈.\n오늘의 프리킥 한 방이 상대 골키퍼의 두 발을 얼려버린다.",
    glowColor: "#c9a6ff",
    glowColorSoft: "#f0e6ff",
  },
  {
    id: "sjh4018",
    cardName: "공중 요새의 수문장",
    fortuneText: "하늘 위에서 내려다보는 단단한 방패.\n오늘의 수비 라인은 무엇도 뚫을 수 없는 요새가 된다.",
    glowColor: "#8fd0ff",
    glowColorSoft: "#f2fbff",
  },
  {
    id: "haepalin",
    cardName: "고요한 물결의 파수꾼",
    fortuneText: "서두르면 오히려 놓친다.\n물처럼 차분히 기다리면, 상대가 먼저 제풀에 지쳐 무너진다.",
    glowColor: "#9fd8b0",
    glowColorSoft: "#eafff2",
  },
  {
    id: "lina0108",
    cardName: "엇갈린 시선의 갈림길 요정",
    fortuneText: "리냐의 시선이 어디를 향하는지는 아무도 모른다.\n하지만 그 알 수 없는 방향 끝에, 아무도 예상 못한 찬스가 기다리고 있다.",
    glowColor: "#b98aff",
    glowColorSoft: "#8be8d8",
  },
  {
    id: "tleod1818",
    cardName: "번개의 질주자",
    fortuneText: "번개처럼 빠르지만, 너무 서두르면 발이 꼬인다.\n속도를 늦추고 타이밍을 노리면, 완벽한 크로스가 어시스트로 이어진다.",
    glowColor: "#4dd9e0",
    glowColorSoft: "#e0fbff",
  },
  {
    id: "janine95kim",
    cardName: "서리의 골키퍼",
    fortuneText: "손끝에서 서리가 피어나는 순간, 골문은 완전히 얼어붙는다.\n오늘 그 어떤 슈팅도 재닌의 손끝을 피해가지 못한다.",
    glowColor: "#a6dcff",
    glowColorSoft: "#f0faff",
  },
  {
    id: "hachi97",
    cardName: "황금 드래곤의 강림",
    fortuneText: "황금빛 기운이 온몸을 감싸는 날.\n무엇을 하든 다 이루어진다 — 드리블로 세 명을 제치는 상상마저 현실이 된다.",
    glowColor: "#ffe29e",
    glowColorSoft: "#d9b3ff",
  },
];

export function getFortuneCard(id: string): FortuneCardEntry | undefined {
  return FORTUNE_CARDS.find((card) => card.id === id);
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

/** Picks `count` distinct random entries from the full 11-card deck.
 * `extraCards` is folded into the pool alongside the base 11 — used to mix
 * in the hidden 우왁굳 card (see fortuneWoowakgoodCard.ts) once
 * useFortuneBonusUnlock.ts says it's been unlocked, without this module
 * needing to import that standalone card itself. */
export function drawRandomFortuneCards(count: number, extraCards: FortuneCardEntry[] = []): FortuneCardEntry[] {
  return drawRandomFromPool([...FORTUNE_CARDS, ...extraCards], count);
}
