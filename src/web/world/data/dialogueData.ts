import type { CastId } from "../types";

// Every line the world says (docs/world/02 §2, §6–§9). Plain data with type-only imports; the rules that pick a
// line for the moment live in `state/npcDialogue.ts`. `{player}` becomes the chosen member's name.
//
// A line is a string (spoken by the NPC the entry belongs to) or `[text, mood]` for a portrait other than the
// neutral one. Lines from docs/world/02 (the reviewed drafts) are used as written. Entries marked "S4 신규" have no
// draft in 02 — the state fillers (`pre`, `home`, `accept`, …) and the original NPCs — and are listed in 02 §13 for
// the next review pass.

export type PortraitMood = "neutral" | "happy" | "surprised" | "worried";
export type Line = string | readonly [text: string, mood: PortraitMood];

/** A line with an explicit speaker (cuts that mix several people); `who: null` is narration. */
export interface CutLine {
  who: CastId | null;
  text: string;
  mood?: PortraitMood;
}

// ── prologue ─────────────────────────────────────────────────────────────────────────────────

/** The prologue cut before the first morning (02 §2). */
export const PROLOGUE_LINES: readonly string[] = [
  "{player}은(는) 오늘 잔디동에 입단했다.",
  "창밖의 잔디가 어쩐지 색이 바랜 듯 보인다.",
  "마을 한가운데 스타디움의 황금 잔디가 시들어 간다고 한다.",
  "일단 밖으로 나가 보자. 누군가 도움이 필요할지도 모른다.",
];

// ── missions ─────────────────────────────────────────────────────────────────────────────────

export interface MissionScript {
  /** The giver proposes the mission (the player then picks 받는다 / 나중에). Every mission but a tutorial talk has one. */
  offer?: readonly Line[];
  /** What the giver says right after the player accepts. S4 신규. */
  accept?: Line;
  /** The mission is running and the giver is asked again. */
  active?: readonly Line[];
  /** The goal is met and the player reports (the reward is paid when this ends). */
  complete: readonly Line[];
  /** Timed delivery: the giver offers the parcels again after a failed round, and answers when they are taken. S4 신규. */
  retryOffer?: Line;
  retry?: Line;
  /** A tutorial talk (no offer): the choices that follow the greeting. */
  topics?: readonly { label: string; lines: readonly Line[] }[];
}

export const MISSION_SCRIPTS: Readonly<Record<string, MissionScript>> = {
  "s-kid-hide": { offer: ["황금 축구공 아무 5개 찾기. 함께 해 볼까?"], accept: "기다리고 있을게.", active: ["마을 곳곳 · 도감에서 위치 확인"], complete: ["고마워! 황금 공 숨바꼭질, 멋지게 해냈구나."] },
  "s-arcade-rank": { offer: ["잔디 러시 1000m 달성. 함께 해 볼까?"], accept: "기다리고 있을게.", active: ["오락실 5번 기계 · 모든 기계의 최고 랭크는 도감에 누적"], complete: ["고마워! 오락실 랭크 도전, 멋지게 해냈구나."] },
  "m-91-cards": { offer: ["멤버 11명의 카드 공개. 함께 해 볼까?"], accept: "기다리고 있을게.", active: ["감독실 카드 수납장 · 도감에서 미공개 멤버 확인"], complete: ["고마워! 열한 명의 카드 도감, 멋지게 해냈구나."] },
  "s-rush-daily": { offer: ["일일 미션 3개 완료 후 스탬프 받기. 함께 해 볼까?"], accept: "기다리고 있을게.", active: ["광장 게시판 · KST 자정에 새 과제"], complete: ["고마워! 잔디 코치의 매일 훈련, 멋지게 해냈구나."] },
  "s-factory-garden": { offer: ["할아버지와 잔디 코치에게 정원 조언 듣기. 함께 해 볼까?"], accept: "기다리고 있을게.", active: ["공장 정원사 → 광장 할아버지 → 스타디움 옆 제초왕"], complete: ["고마워! 공장을 정원으로, 멋지게 해냈구나."] },
  // tutorial (02 §8)
  "m-00-hello": {
    complete: [
      "감독님이 클럽하우스에서 기다리신다. 북쪽 큰 건물이야. J를 눌러 미션 로그도 확인해 보렴.",
    ],
    topics: [
      {
        label: "마을 안내를 듣는다",
        lines: [
          "북쪽의 큰 건물이 클럽하우스, 광장 남쪽의 커다란 건물이 스타디움이란다.",
          "집마다 주인이 있으니 하나씩 찾아가 보렴. 문 앞에서 위로 걸으면 들어갈 수 있단다.",
        ],
      },
      { label: "괜찮아요", lines: ["그래, 천천히 둘러보렴."] },
    ],
  },
  "m-01-mycard": {
    offer: ["저기 카드 수납장에서 네 카드를 뒤집어 봐. 그게 입단 확인이다."],
    accept: "그래, 부탁한다. 수납장은 저 안쪽에 있어.",
    active: ["저기 카드 수납장에서 네 카드를 뒤집어 봐. 그게 입단 확인이다."],
    complete: [
      ["좋아. 그런데 큰일이 났다. 스타디움 잔디가 시들고 있어.", "worried"],
      "제초동이 뭔가 꾸미는 게 분명해. 멤버들이 각자 잔디 조각을 갖고 있으니, 도와주고 하나씩 받아 와 줘.",
    ],
  },
  "m-02-arcade": {
    offer: ["오락실 열었네. 기계 앞에서 E를 누르면 시작이야. 한 판만 해 봐, 공짜다."],
    accept: "그래그래, 한 판만! 클럽하우스 로비 안쪽 계단 아래야.",
    active: ["클럽하우스 로비 안쪽 계단 아래야. 기계 앞에서 E를 누르면 시작이야."],
    complete: [["잘하네! 앞으로 미션에서 점수 도전이 많을 거야. 연습은 여기서 마음껏!", "happy"]],
  },
  "m-89-director-report": {
    complete: ["모두 모였구나. 스타디움으로 가자. 결전이다, {player}."],
  },

  // members (02 §7)
  "m-doormomo-sum10": {
    offer: ["잔디 조각? 줄 수 있지. 대신 내 계산 속도를 따라와 봐. 합 10 게임에서 60점 이상, 어때?"],
    accept: "좋아. 오락실 1번 기계야. 큰 숫자부터 보지 마.",
    active: ["아직이야? 큰 숫자부터 보지 말고 작은 숫자 짝을 먼저 잡아 봐."],
    complete: [["…인정. 빠르네, {player}. 자, 잔디 조각이야. 나머지도 잘 부탁해.", "happy"]],
  },
  "m-sjh4018-kickups": {
    offer: ["수비는 발끝 감각이 생명이지. 공을 15번 안 떨어뜨리고 튀길 수 있어?"],
    accept: "좋아, 오락실 2번 기계야. 힘 빼고 리듬을 타.",
    active: ["떨어뜨려도 괜찮아. 다시 하면 되니까. 리듬을 타 봐."],
    complete: [["오, 진짜 해냈네! 든든한데? 조각은 네 거야.", "happy"]],
  },
  "m-kaksjak0730-freekick": {
    offer: ["밤하늘에 별이 있다면 잔디에는 프리킥이 있지. 별처럼 4골, 찍어 볼래?"],
    accept: "고마워. 오락실 3번 기계야. 별을 하나 정하고 차 봐.",
    active: ["벽 위로만 보지 말고 골대 구석에 별 하나를 정해 봐."],
    complete: [["…아름다웠어. 잔디도 기뻐하네. 이 조각, 소중히 써 줘.", "happy"]],
  },
  "m-janine95kim-cardmatch": {
    offer: ["집중력 시험이에요. 카드 짝 맞추기를 22턴 안에 끝내 보세요. 골키퍼처럼 위치를 기억하는 거예요."],
    accept: "부탁해요. 오락실 4번 기계예요. 침착하게요.",
    active: ["뒤집은 카드 위치를 머릿속에 격자로 그려 보세요."],
    complete: [["훌륭해요. 침착했어요. 서리처럼 단단한 조각, 드릴게요.", "happy"]],
  },
  "m-haepalin-lanterns": {
    offer: ["제 랜턴 친구들이 호수로 놀러 나가 버렸어요. 세 마리만 찾아 주실래요?"],
    accept: "고마워요. 호수 주변을 천천히 살펴봐 주세요.",
    active: ["반짝이는 곳을 잘 보세요. 물가, 다리 밑, 갈대 사이에 있어요."],
    complete: [["다들 돌아왔어요. 고마워요. 이 조각은 물결처럼 조용히 반짝일 거예요.", "happy"]],
  },
  "m-ju010228-kickgoals": {
    offer: ["골 감각이 살아야 봄이 오지! 훈련장에서 1분에 5골, 도전해 볼래?"],
    accept: "좋았어! 훈련장 공 앞에서 E야! 첫 킥부터 1분이 시작돼!",
    active: ["공 앞에서 E! 골대 정면으로 뻥! 자신 있게 차야 들어가!"],
    complete: [["와, 진짜 5골이야? 인정! 봄맞이 조각 받아!", "happy"]],
  },
  "m-lina0108-card-lowq": {
    offer: ["내 카드 있잖아, 조카 스케치북 버전! 그게 제일 귀엽거든. 한번 봐 줘. 봤으면 나한테 말해!"],
    accept: "고마워! 감독실 카드 수납장에서 봐 줘!",
    active: ["카드 수납장에서 내 카드를 열고, 테마를 '조카의 스케치북'으로 바꿔 보면 돼."],
    complete: [["봤지? 삐뚤빼뚤한데 귀엽지! 좋아, 조각 줄게.", "happy"]],
  },
  "m-hachi97-talkchain": {
    offer: ["요즘 마을에 '용볼'이 떨어졌다는 소문이 돌아. 진짜인지 셋한테 물어봐 줄래?"],
    accept: "크하하! 부탁한다! 나는 언덕에서 기다리고 있을게!",
    active: ["꼬마, 편의점 사장님, 잔디 할아버지 순서로 물어봐. 다들 뭔가 알고 있을 거야."],
    complete: [["역시 소문은 사실이었어! 이 정보값으로 조각 준다!", "happy"]],
  },
  "m-bboringirl-card-retro": {
    offer: ["내 카드 중에 90년대 도트 버전 있잖아. 이 월드랑 잘 어울리거든. 확인해 봐. 검사는 내가 해."],
    accept: "…그래. 감독실 카드 수납장이야.",
    active: ["감독실 카드 수납장에서 내 카드 열고 테마 바꿔. '90년대 고전 도트'."],
    complete: [["…역시 도트가 최고야. 잔디 조각, 가져가.", "happy"]],
  },
  "m-tleod1818-delivery": {
    offer: ["택배가 산더미예요! 세 곳만 90초 안에 배달해 주세요! 번개처럼요!"],
    accept: "부탁해요! 출발!",
    active: ["택배 주소는 상자에 써 있어요. 시간은 화면 위 타이머! 달려요, 달려!"],
    complete: [["완벽한 질주였어요! 수은력 200% 충전! 조각 받으세요!", "happy"]],
    retryOffer: "앗, 시간이 다 됐어요! 택배를 다시 받아 가실래요?",
    retry: "좋아요, 다시 달려요! 이번엔 더 빨리요!",
  },
  "m-tdnlamuron-conerun": {
    offer: ["돌격병은 멈추지 않는다. 콘 코스를 25초 안에 뚫어 봐. 콘 건드리면 감점이다."],
    accept: "좋아. 남서쪽 코스야. 시작 게이트를 지나면 시간이 간다.",
    active: ["직선으로 가지 말고 콘 사이를 매끄럽게 꺾어. 감속하면 진다."],
    complete: [["…쓸 만한데? 불꽃 같은 조각이다. 가져가.", "happy"]],
  },

  // side missions (02 §10) — S4 신규 wording
  "s-shop-milk": {
    offer: ["심부름 하나 부탁해도 될까? 이 잔디 우유를 광장의 할아버지께 전해 줘. 매일 드시거든."],
    accept: "고마워! 병 조심해서 가져가.",
    active: ["잔디 우유는 광장 분수 옆 할아버지께 전해 줘. 흔들지 말고!"],
    complete: [["잘 전했구나! 할아버지가 좋아하셨겠네. 다음에도 부탁할게.", "happy"]],
  },
  "s-elder-water": {
    offer: ["광장 잔디가 시들어서 마음이 아프구나. 물뿌리개로 시든 자리 다섯 곳에 물을 좀 주겠니?"],
    accept: "고맙구나. 시든 자리는 광장 곳곳에 있단다. 가까이 가서 E를 누르렴.",
    active: ["시든 잔디 자리가 광장 곳곳에 남아 있단다. 가까이 가서 E를 누르렴."],
    complete: [["허허, 광장이 한결 푸르러졌구나. 고맙다. 이 잔디는 이제 시들지 않을 게야.", "happy"]],
  },
};

// ── the showdown (02 §9) ─────────────────────────────────────────────────────────────────────

export interface FinaleScript {
  /** Cut 1: the challenge, before the player accepts. */
  intro: readonly CutLine[];
  /** Per round: the Weeder King's taunt at its start and his reaction once it is cleared (spoken at the next round's start). */
  rounds: readonly { taunt: string; cleared: string }[];
  /** Reported after the third round: the whistle and the core stopping (the reward is paid when this ends). */
  victory: readonly CutLine[];
  /** Cuts 2 and 3, after the golden grass has bloomed: the King's change of heart and the call for the group photo. */
  ending: readonly CutLine[];
  /** The credits card, one line at a time. */
  credits: readonly string[];
}

export const FINALE_SCRIPT: FinaleScript = {
  intro: [
    { who: "weedking", text: "잔디는 깎여야 아름답다! 내 제초 코어가 이 마을을 깔끔하게 밀어 줄 거야!" },
    { who: "referee", text: "규칙은 간단해. 3라운드 연속으로 이겨." },
  ],
  rounds: [
    { taunt: "깎기 전에 숫자부터 세 보시지!", cleared: "…제법이군. 하지만 다음은 다르다!" },
    { taunt: "내 제초기보다 빨리 튀길 수 있나?", cleared: "이럴 수가! 하지만 마지막 라운드가 남았다!" },
    { taunt: "마지막이다! 이 골대는 내 것이야!", cleared: "" },
  ],
  victory: [
    { who: "referee", text: "삐이익—! 3라운드 모두 승리! 결전 종료!", mood: "happy" },
    { who: "weedking", text: "말도 안 돼… 내 제초 코어가!", mood: "surprised" },
    { who: null, text: "제초 코어가 삐-익 하는 소리와 함께 멈췄다." },
  ],
  ending: [
    { who: "weedking", text: "…어? 잔디가 이렇게 예뻤나. 미안하다. 나는 사실 잔디가 부러웠을지도 몰라.", mood: "worried" },
    { who: null, text: "관중석의 멤버들이 우르르 내려왔다." },
    { who: "woowakgood", text: "자, 다 같이 사진 한 장 찍자!", mood: "happy" },
  ],
  credits: [
    "황금 잔디가 다시 피어났습니다.",
    "제초동 구역의 문도 열렸어요.",
    "잔디동 Let's Go!!",
  ],
};

// ── the director's story talks (02 §8) ────────────────────────────────────────────────────────

export const STORY_SCRIPT = {
  /** After 3 / 6 / 9 shards: what the director says the next time he is spoken to. */
  beats: {
    3: ["벌써 세 개? 스타디움 잔디 끝이 조금 초록으로 돌아왔어. 이 페이스로 가자."],
    6: ["절반이 넘었다. 제초동 쪽에서 이상한 소리가 나. 서둘러야겠어."],
    9: ["하나만 더. 제초왕이 곧 나타날 거야. 마음의 준비를 해 둬."],
  } as Readonly<Record<number, readonly Line[]>>,
};

// ── people ───────────────────────────────────────────────────────────────────────────────────

export interface CastScript {
  /** The first conversation, before any mission talk. */
  first?: readonly Line[];
  /** Members before the main missions open (the player has not seen the director yet). S4 신규. */
  pre?: readonly Line[];
  /** One line per conversation, rotating; used when there is nothing else to talk about. */
  idle: readonly Line[];
  /** After the ending. */
  post?: readonly Line[];
  /** In their own house once their mission is done (docs/world/02 §6 `home[]`). S4 신규. */
  home?: readonly Line[];
  /** Asked about the dragon-ball rumor by 하치's talk chain. */
  rumor?: Line;
  /** Shouted from the stands during the showdown. S4 신규. */
  cheer?: Line;
  /** Animals: lines are narration, not speech. */
  narrate?: boolean;
  /** A parcel handed to this person (the milk for the elder). */
  receive?: Line;
}

export const CAST_SCRIPTS: Readonly<Partial<Record<CastId, CastScript>>> = {
  doormomo: {
    first: ["어서 와. 나는 문모모. 이 마을 전술은 내 머릿속에 다 있지."],
    pre: ["감독님 인사부터 받고 와. 전술 얘기는 그다음이야."],
    idle: ["조각은 이미 건넸잖아. 이제 전술 얘기나 하자.", "오늘 라인 간격 봤어? 완벽했지."],
    post: ["결전 때 지휘는 내가 맡았지. 다음엔 네가 해 볼래?"],
    home: ["집까지 왔네. 전술 보드는 함부로 건드리지 마. 지워지면 처음부터야.", "사실 저 수정구는 그냥 장식이야. …아마도."],
    cheer: "라인 간격 좋아! 침착하게 계산해!",
  },
  sjh4018: {
    first: ["어, 왔네? 구름 위는 바람이 세니까 발 조심해."],
    pre: ["감독님한테는 인사드렸어? 요새 얘기는 그다음에 해도 늦지 않아."],
    idle: ["요새는 내가 지킨다. 걱정 말고 다녀와.", "구름이 오늘따라 낮네. 좋은 징조야."],
    post: ["잔디가 살아나니까 요새도 든든해졌어. 고맙다."],
    home: ["우리 집 소파는 앉으면 못 일어나. 경고했다?", "요새 안에서는 내가 지켜 줄게. 편히 쉬어."],
    cheer: "든든하게 뒤에서 지켜볼게! 힘내!",
  },
  kaksjak0730: {
    first: ["쉿, 잔디 소리 좀 들어 봐. …아, 손님이구나. 나는 한결이야."],
    pre: ["감독님이 기다리셔. 잔디 소리는 나중에도 들을 수 있어."],
    idle: ["오늘 밤엔 잔디 냄새가 더 진하다.", "별이 잔디 위로 떨어지는 날이 와. 언젠가."],
    post: ["잔디가 되살아난 밤은 처음이야. 오래 남을 거야."],
    home: ["여기서 보면 별이 제일 잘 보여. 잔디 위의 별까지.", "저 화분은 요즘 부쩍 컸어. 물 주는 시간에는 조용히 해 줘."],
    cheer: "잔디 위에 별을 띄워 줘!",
  },
  janine95kim: {
    first: ["어서 와요. 여기는 조금 춥죠? 골키퍼는 차분해야 해서 집도 이래요."],
    pre: ["먼저 감독님께 인사드리고 오세요. 서두르지 않아도 돼요."],
    idle: ["글러브를 낀 손끝이 시린 날씨네요.", "안경이 자꾸 김 서려서… 후후."],
    post: ["잔디가 돌아오니 링크 옆에도 새싹이 나왔어요."],
    home: ["차 한잔할래요? 김이 서려도 이 안은 따뜻해요.", "골키퍼는 말이 없어도 마음은 늘 골문 앞에 있어요."],
    cheer: "침착하게, 끝까지 집중해요!",
  },
  haepalin: {
    first: ["…앗, 안녕하세요. 물결 소리에 묻혀서 못 들었어요."],
    pre: ["…감독님이 부르신대요. 다녀오세요. 호수는 도망가지 않아요."],
    idle: ["호수는 오늘도 잔잔해요.", "해파리는 뼈가 없어도 잘 살아요. 몽글몽글."],
    post: ["잔디가 살아나니 호수 위에도 초록 빛이 번져요."],
    home: ["어항의 친구들이 인사하고 싶대요. 몽글몽글.", "물결 소리를 들으면 마음이 차분해져요."],
    cheer: "물결처럼 차분하게… 응원해요!",
  },
  ju010228: {
    first: ["오! 신입이다! 나 쥬멩이야, 우리 팀 골잡이!"],
    pre: ["감독님한테 먼저 가 봐! 인사하고 오면 재밌는 일이 생길걸!"],
    idle: ["봄바람이 불면 발끝이 근질근질해!", "골 넣고 나면 세리머니가 제일 재밌지!"],
    post: ["잔디가 새로 자란 곳에서 뛰면 발이 가벼워!"],
    home: ["우리 집 온실 봤어? 봄이 사시사철 살아!", "골 기록판은 올해 안에 벽 하나를 꽉 채울 거야!"],
    cheer: "골 넣어라! 봄이 온다!",
  },
  lina0108: {
    first: ["어, 신입? 나 리냐야. 벚꽃 밟지 마! 아니, 밟아도 되는데 예쁘게 밟아."],
    pre: ["감독님 만났어? 안 만났으면 얼른 가 봐! 벚꽃은 기다려 줄게."],
    idle: ["오버래핑은 벚꽃잎처럼 가볍게!", "사시노 리냐는 오늘도 옆줄 지배 중."],
    post: ["잔디 되살아나니까 벚꽃도 두 배로 폈다니까?"],
    home: ["스케치북은 조카 거니까 낙서하면 안 돼! …한 장쯤은 괜찮으려나?", "저 벚꽃 꽃병은 내가 직접 꽂았어. 옆줄 지배자는 감각도 있거든."],
    cheer: "옆줄은 내가 지킨다! 힘내!",
  },
  hachi97: {
    first: ["크하하! 왔구나! 나는 핫짱, 황금 드래곤의 화신이지!"],
    pre: ["크하하! 우선 감독님께 인사부터! 그게 신입의 예의다!"],
    idle: ["용은 잔디 위에서 제일 강하지.", "용볼 팬클럽 회원 모집 중이야."],
    post: ["잔디가 살아났으니 용도 마음 놓고 날겠어!"],
    home: ["크하하! 내 황금 용 알을 보러 왔구나! 만져 보면 따뜻할걸?", "용볼 팬이 보낸 액자 봤지? 제일 아끼는 거야."],
    cheer: "크하하! 황금 드래곤이 함께한다!",
  },
  bboringirl: {
    first: ["…왔어? 만지지 마. 아니, 그건 만져도 돼."],
    pre: ["…감독님부터 만나고 와. 그다음에 얘기하자."],
    idle: ["납땜 냄새 좋지 않아? 나만 그런가.", "회로는 거짓말을 안 해."],
    post: ["잔디가 살아나니 작업실 화분도 살았어. 고마워."],
    home: ["…신기해? 저 모니터, 도트 게임 켜져 있는 거.", "작업대는 만지지 마. 아니, 구경은 해도 돼."],
    cheer: "…해내. 믿어.",
  },
  tleod1818: {
    first: ["왔어요? 저 빙밍이에요! 오늘도 달리는 중이에요!"],
    pre: ["감독님 만났어요? 인사부터 하고 오세요! 저는 달리는 중이에요!"],
    idle: ["수은력은 나눠 줄수록 늘어나요!", "풀백은 달리다가 달리다가 또 달려요."],
    post: ["잔디가 되살아나니 배달 길도 푹신해요!"],
    home: ["여기가 배달소 창구예요! 택배가 늘 산더미죠!", "쉬는 시간에도 몸이 근질근질해요. 수은력은 마르지 않아요!"],
    cheer: "번개처럼 달려요! 파이팅!",
  },
  tdnlamuron: {
    first: ["왔냐. 나는 다시바. 뜨겁게 가자."],
    pre: ["감독님한테 먼저 가라. 나중에 뜨겁게 붙자."],
    idle: ["용암이 식기 전에 다음 훈련이다.", "돌직구가 편하지. 돌아가는 건 못 참아."],
    post: ["잔디가 살아나니 용암 옆에서도 풀 냄새가 나네."],
    home: ["훈련 노트 봤냐? 별거 없다. 더 빨리, 그게 전부야.", "콘 더미에서 하나 가져가고 싶냐? …농담이다."],
    cheer: "멈추지 마라! 불꽃처럼!",
  },

  woowakgood: {
    first: ["왔구나, {player}. 잔디동에 온 걸 환영한다. 우선 네 카드부터 확인해 봐."],
    idle: ["카드 수납장은 언제든 써도 돼. 다 비슷하게 생겼지만 사연이 다 달라.", "제초동이 잔디를 왜 싫어하는지… 나도 아직 모르겠다."],
    post: ["마을이 예전보다 더 푸르네. 이게 다 너희 덕분이다.", "일일 미션 게시판은 광장에 있다. 심심하면 들러 봐."],
  },

  elder: {
    first: [
      ["허허, 새 얼굴이구나. 잔디동은 처음인가? 방향키로 걷고, 누군가에게 다가가서 E를 누르면 말을 걸 수 있단다.", "happy"],
      "머리 위에 파란 물음표가 뜨면 도와줄 일이 있다는 뜻이고, 금색 느낌표가 뜨면 일을 마쳤으니 보고하라는 뜻이지.",
    ],
    idle: [
      "오늘도 잔디가 조금 힘이 없어 보이는구나.",
      "궁금한 게 있으면 언제든 물어보렴.",
      "잔디는 밟혀도 다시 일어난단다. 사람도 그렇지.",
    ],
    post: ["광장 잔디가 이렇게 푸른 건 오랜만이구나.", "허허, 젊은이들 덕분에 살았구나. 고맙다."],
    rumor: "옛날부터 언덕엔 용이 산다는 전설이 있지.",
    receive: ["오, 잔디 우유구나! 매일 챙겨 주니 고맙다고 전해 주렴.", "happy"],
  },
  shopkeeper: {
    first: ["어서 오세요, 잔디 편의점이에요! 클럽하우스 오락실도 제가 관리하고 있죠."],
    idle: ["게임 잘하는 손님이 늘었어요. 오락실이 시끌시끌하죠.", "출출하면 도시락도 있어요. 오늘의 메뉴는 비밀!"],
    post: ["잔디가 살아나니 손님이 부쩍 늘었어요!", "오락실에서 연습하고 가세요. 여전히 공짜예요."],
    rumor: "어제 용 비늘 모양 과자가 다 팔렸어.",
  },
  kid: {
    first: ["안녕하세요! 저는 잔디동 최고 팬이에요! 선수분들을 다 알아요!"],
    idle: ["잔디가 다시 살아나면 같이 공차기해요!", "선수분들이 지나갈 때마다 심장이 두근거려요!", "제 꿈은 스타디움에서 응원하는 거예요!"],
    post: ["잔디가 살아났어요! 이제 진짜 공차기할 수 있어요!", "스타디움 응원석에서 다 봤어요! 다들 멋졌어요!"],
    rumor: "언덕 위에서 황금빛 공이 굴러가는 걸 봤어요!",
  },
  referee: {
    first: ["삐— 아, 손님이군. 나는 심판이야. 이곳의 규칙은 내 휘슬이 정하지."],
    idle: ["휘슬은 언제나 준비돼 있다.", "공정한 경기는 공정한 눈에서 시작되지."],
    post: ["결전은 끝났지만 휘슬은 아직 손에 쥐고 있지. 언제든 경기는 열려.", "잔디가 이렇게 푸르니 휘슬 소리도 상쾌하군."],
  },
  weedking: {
    first: ["…누구냐. 여기는 제초동 본부다."],
    idle: ["잔디는 깎여야 아름답다. …그렇게 믿어 왔지."],
    post: [
      "잔디 코치라고 불러라. …아직은 낯간지럽군.",
      "잔디는 밟혀야 산다는 걸 이제야 알았다.",
      "제초기는 이제 잔디를 딱 알맞게 다듬는 데만 쓴다.",
    ],
  },
  "weeder-grunt": {
    first: ["…멈춰라. 여기서부터는 제초동 구역이다."],
    idle: ["잔디 반입 금지다. 돌아가라.", "지금은 통행할 수 없다."],
    post: ["이제부터는 잔디를 가꾸는 일을 한다. 나쁘지 않군.", "제초동 구역이 초록빛이 되니 마음이 이상하다."],
  },
  "cat-jandi": {
    narrate: true,
    idle: ["잔디냥이 야옹— 하고 짧게 울었다.", "잔디냥이 발치에 몸을 비볐다.", "잔디냥이 하품을 하고 다시 웅크렸다."],
  },
  "dog-ball": {
    narrate: true,
    idle: ["공돌이가 꼬리를 흔들며 발치를 맴돈다.", "공돌이가 공을 물고 신나게 뛰어다닌다.", "공돌이가 멍! 하고 짖었다."],
  },
};

/** The line the stands shout for one member (docs/world/03 §9, examine action `cheer:<cast>`). */
export function cheerLine(cast: CastId): Line | undefined {
  return CAST_SCRIPTS[cast]?.cheer;
}
