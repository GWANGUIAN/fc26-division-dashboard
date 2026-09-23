// Question data for "나의 축구 포지션은?" — a tally-based personality quiz,
// not a graded one (see docs/position-test-prompts.md for the matching
// image-generation prompts and the full position/theme mapping table).
//
// Each option carries a `position` tag (which of the 7 positions it votes
// for) and a `style` tag ("A" | "B", balanced 2-and-2 per question) that
// later decides which of that position's two themes wins — see
// positionTestEngine.ts's computePositionTestResult. The 9 questions x 4
// options = 36 option slots distribute the 7 positions as evenly as
// possible (ST appears 6 times, the other 6 positions appear 5 times each)
// and never repeat a position within the same question.

export type PositionCode = "ST" | "WF" | "CM" | "CDM" | "CB" | "FB" | "GK";
export type PositionTestStyle = "A" | "B";

export interface PositionTestOption {
  text: string;
  position: PositionCode;
  style: PositionTestStyle;
}

export interface PositionTestQuestion {
  id: string;
  question: string;
  illustration: string;
  options: readonly PositionTestOption[];
}

export const POSITION_TEST_QUESTIONS: readonly PositionTestQuestion[] = [
  {
    id: "defense-gap",
    question: "동네 조기축구 경기, 상대 수비 라인이 무너지는 찰나! 이 순간 당신의 본능은?",
    illustration: "/position-test-q01.webp",
    options: [
      { text: "일단 문전으로 침투해서 슈팅 각도부터 잡는다", position: "ST", style: "A" },
      { text: "측면에서 스피드로 그대로 뚫는다", position: "WF", style: "A" },
      { text: "패스 루트부터 계산해서 동료에게 찔러준다", position: "CDM", style: "B" },
      { text: "오버래핑 타이밍 잡으려고 뒷공간부터 살핀다", position: "FB", style: "B" },
    ],
  },
  {
    id: "team-chat",
    question: "팀 단톡방에 '내일 경기 몇 명 옴?' 메시지가 올라왔다. 당신의 반응은?",
    illustration: "/position-test-q02.webp",
    options: [
      { text: "포지션이랑 전술까지 미리 정리해서 답장한다", position: "CM", style: "A" },
      { text: "일단 '저요'만 찍고 조용히 대기한다", position: "CB", style: "A" },
      { text: "'제가 골키퍼 볼게요' 하고 바로 선점한다", position: "GK", style: "B" },
      { text: "'저 오늘 몇 골 넣을지 기대하세요' 하고 드립친다", position: "ST", style: "B" },
    ],
  },
  {
    id: "counter-attack",
    question: "동료가 실수로 공을 빼앗겨서 역습 위기! 당신이 가장 먼저 하는 행동은?",
    illustration: "/position-test-q03.webp",
    options: [
      { text: "전속력으로 따라붙어서 커버한다", position: "WF", style: "A" },
      { text: "라인을 좁히라고 소리치며 진형부터 정리한다", position: "CDM", style: "A" },
      { text: "측면 공간부터 틀어막으러 전력 질주한다", position: "FB", style: "B" },
      { text: "패스 길목을 먼저 예측해서 끊으러 간다", position: "CM", style: "B" },
    ],
  },
  {
    id: "final-minute",
    question: "경기 종료 직전, 우리 팀이 한 골 차로 지고 있다. 당신의 머릿속은?",
    illustration: "/position-test-q04.webp",
    options: [
      { text: "일단 우리 골문부터 지키자는 생각뿐이다", position: "CB", style: "A" },
      { text: "코너킥 하나까지 다 막아낼 각오로 자세를 잡는다", position: "GK", style: "A" },
      { text: "마지막 한 방 넣을 각을 이미 계산 중이다", position: "ST", style: "B" },
      { text: "측면 크로스 한 번 더 올릴 체력이 남았는지 확인한다", position: "WF", style: "B" },
    ],
  },
  {
    id: "warm-up",
    question: "경기 전 몸풀기 시간, 당신은 보통 뭘 하고 있나요?",
    illustration: "/position-test-q05.webp",
    options: [
      { text: "동료들 컨디션 체크하면서 오늘 전술을 다시 설명한다", position: "CDM", style: "A" },
      { text: "사이드라인 왕복 달리기로 다리부터 푼다", position: "FB", style: "A" },
      { text: "패스 감각 익히려고 짧은 패스를 주고받는다", position: "CM", style: "B" },
      { text: "헤더 연습하면서 몸싸움 각오를 다진다", position: "CB", style: "B" },
    ],
  },
  {
    id: "highlight-clip",
    question: "동네 축구 유튜브 하이라이트에 내가 나온다면, 어떤 장면이길 바라나요?",
    illustration: "/position-test-q06.webp",
    options: [
      { text: "손끝으로 걷어낸 극적인 선방 장면", position: "GK", style: "A" },
      { text: "혼자 다 해결한 결승골 세리머니", position: "ST", style: "A" },
      { text: "수비 두세 명 제치는 드리블 하이라이트", position: "WF", style: "B" },
      { text: "경기 전체를 조율한 인터뷰 코멘트", position: "CDM", style: "B" },
    ],
  },
  {
    id: "rival-ace",
    question: "상대 팀 에이스가 오늘따라 유독 무섭다. 당신의 대응 전략은?",
    illustration: "/position-test-q07.webp",
    options: [
      { text: "측면부터 틀어막아서 못 들어오게 한다", position: "FB", style: "A" },
      { text: "중원에서부터 공을 안 주려고 압박한다", position: "CM", style: "A" },
      { text: "몸으로 부딪혀서 기 싸움부터 이긴다", position: "CB", style: "B" },
      { text: "슈팅 각도를 최대한 좁혀서 심리전을 건다", position: "GK", style: "B" },
    ],
  },
  {
    id: "after-party",
    question: "경기 후 회식 자리, 오늘 경기 얘기가 나오면 당신은?",
    illustration: "/position-test-q08.webp",
    options: [
      { text: "내가 넣은 골 얘기부터 신나서 꺼낸다", position: "ST", style: "A" },
      { text: "내가 제친 장면 다시 보여달라고 조른다", position: "WF", style: "A" },
      { text: "오늘 전술이 왜 통했는지 분석한다", position: "CDM", style: "B" },
      { text: "오늘 뛴 거리부터 자랑한다", position: "FB", style: "B" },
    ],
  },
  {
    id: "new-teammate",
    question: "새로운 팀원이 들어왔다. 당신이 가장 먼저 챙기는 건?",
    illustration: "/position-test-q09.webp",
    options: [
      { text: "포지션이랑 동선부터 친절하게 설명해준다", position: "CM", style: "A" },
      { text: "일단 옆에서 든든하게 자리를 잡아준다", position: "CB", style: "A" },
      { text: "'급하면 나 대신 골키퍼 해도 돼' 하고 웃는다", position: "GK", style: "B" },
      { text: "'오늘 골 맛 한번 보여줄게' 하고 텐션을 올린다", position: "ST", style: "B" },
    ],
  },
];
