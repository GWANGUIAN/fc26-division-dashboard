export type FootballRulesQuizQuestion = {
  id: string;
  question: string;
  options: readonly string[];
  answerIndex: number;
  explanation: string;
  illustration: string;
  mainCharacter: string;
};

export const FOOTBALL_RULES_QUIZ_QUESTIONS: readonly FootballRulesQuizQuestion[] = [
  {
    id: "corner-own-goal",
    question: "선수가 코너킥을 차다 강한 바람이나 실수로 인해 아무도 맞지 않고 곧바로 자기 팀 골대 안으로 들어갔습니다. IFAB 규정상 어떻게 처리될까요?",
    options: ["상대 팀의 자책골로 득점 처리된다.", "코너킥을 다시 찬다.", "상대 팀의 코너킥이 선언된다.", "상대 팀의 간접 프리킥이 선언된다."],
    answerIndex: 2,
    explanation: "코너킥, 프리킥, 스로인은 타인의 터치 없이 자기 팀 골대로 직접 들어갈 경우 자책골이 되지 않고 상대 팀의 코너킥으로 재개됩니다.",
    illustration: "/football-rules-quiz-q01.webp",
    mainCharacter: "문모모",
  },
  {
    id: "trick-backpass",
    question: "수비수가 발로 굴러오는 공을 스스로 공중에 띄운 뒤 헤더로 자신의 골키퍼에게 전달했습니다. 골키퍼가 이를 손이 아닌 발로 처리했을 때 심판의 올바른 판정은 무엇일까요?",
    options: ["경기 정지 없이 정상 플레이로 진행한다.", "비신사적 행위로 수비수에게 경고를 주고 간접 프리킥을 선언한다.", "골키퍼에게 경고를 주고 직접 프리킥을 선언한다.", "핸드볼 반칙으로 수비수에게 퇴장을 명한다."],
    answerIndex: 1,
    explanation: "백패스 제한 규정을 꼼수로 회피하는 행위(스스로 띄워 머리로 패스)는 비신사적 행위에 해당하며, 골키퍼의 터치 방식 및 여부와 상관없이 수비수가 경고를 받습니다.",
    illustration: "/football-rules-quiz-q02.webp",
    mainCharacter: "핑구",
  },
  {
    id: "seven-players",
    question: "정식 축구 경기 중 한 팀에서 퇴장 선수가 속출했습니다. 경기 중단을 피하고 경기를 계속 진행하려면 한 팀에 최소 몇 명의 선수가 남아 있어야 할까요?",
    options: ["5명", "6명", "7명", "8명"],
    answerIndex: 2,
    explanation: "한 팀의 선수 수가 7명 미만(6명 이하)이 되면 경기를 더 이상 진행할 수 없으며 몰수패 처리됩니다.",
    illustration: "/football-rules-quiz-q03.webp",
    mainCharacter: "한결___",
  },
  {
    id: "referee-deflection",
    question: "공격수가 찬 강력한 슈팅이 주심의 몸에 맞고 굴절되어 그대로 상대 팀 골대 안으로 들어갔습니다. 최신 IFAB 규정에 따른 심판의 판정은 무엇일까요?",
    options: ["주심은 장애물로 간주하므로 그대로 득점으로 인정한다.", "골을 취소하고 드롭볼로 경기를 재개한다.", "골을 취소하고 골킥으로 경기를 재개한다.", "핸드볼 반칙을 선언하고 공격수에게 경고를 준다."],
    answerIndex: 1,
    explanation: "개정된 규정에 따라 주심에 맞고 골이 되거나, 소유권이 바뀌거나, 결정적인 공격이 시작되면 경기를 중단하고 드롭볼로 재개합니다.",
    illustration: "/football-rules-quiz-q04.webp",
    mainCharacter: "쥬멩이",
  },
  {
    id: "throw-own-goal",
    question: "수비수가 자기 진영에서 스로인을 던졌는데, 아무도 터치하지 않고 그대로 자기 팀 골대 안으로 들어갔습니다. 이 상황의 판정은 어떻게 될까요?",
    options: ["상대 팀의 자책골로 득점 처리된다.", "스로인을 다시 던진다.", "상대 팀의 코너킥이 선언된다.", "상대 팀의 패널티킥이 선언된다."],
    answerIndex: 2,
    explanation: "스로인으로 직접 골을 넣을 수 없는 것과 마찬가지로, 아무도 맞지 않고 자기 팀 골대로 들어가도 자책골로 인정되지 않고 상대 팀 코너킥이 선언됩니다.",
    illustration: "/football-rules-quiz-q05.webp",
    mainCharacter: "빙밍_",
  },
  {
    id: "traffic-light-cards",
    question: "1970년 멕시코 월드컵에서 처음 도입된 옐로카드와 레드카드. 이 아이디어를 낸 영국의 켄 아스턴 심판은 무엇을 보고 카드 제도를 착안했을까요?",
    options: ["신호등의 색상 변화", "경마장에서 사용하는 경고 깃발", "우체국의 우표와 봉투 색상", "지하철 티켓의 등급별 색상"],
    answerIndex: 0,
    explanation: "언어가 다른 선수들과 관중에게 경고와 퇴장 의사를 명확히 전달하기 위해 신호등의 노란불(주의)과 빨간불(정지)에서 착안했습니다.",
    illustration: "/football-rules-quiz-q06.webp",
    mainCharacter: "뽀린걸",
  },
  {
    id: "tap-penalty",
    question: "페널티킥 상황에서 키커가 직접 슈팅을 하지 않고 옆(앞쪽 방향)으로 슬쩍 패스를 건넸고, 뒤에서 달려오던 동료가 슈팅하여 골을 넣었습니다. 이 골은 인정될까요?",
    options: ["페널티킥은 무조건 직접 슈팅해야 하므로 무효 처리된다.", "공을 앞쪽으로 차서 이동시켰다면 정상 득점으로 인정된다.", "키커에게 경고를 주고 상대 팀의 프리킥이 선언된다.", "키커만 득점할 수 있으므로 노골 선언 후 페널티킥을 다시 찬다."],
    answerIndex: 1,
    explanation: "페널티킥 시 공이 '앞으로' 움직여야 한다는 규칙만 지키면 동료에게 패스하는 플레이(탭 페널티킥)는 규정상 합법입니다.",
    illustration: "/football-rules-quiz-q07.webp",
    mainCharacter: "하치",
  },
  {
    id: "throw-in-offside",
    question: "공격수가 상대 팀 최후방 수비수보다 훨씬 뒤쪽에 있는 명백한 오프사이드 위치에 서있을 때, 동료가 던진 '스로인'을 직접 받았습니다. 판정은 어떻게 될까요?",
    options: ["오프사이드 반칙이 적용되지 않으므로 그대로 진행된다.", "명백한 오프사이드이므로 상대 팀의 간접 프리킥이 선언된다.", "스로인 반칙(파울 스로)으로 간주해 스로인 소유권이 넘어간다.", "오프사이드 위치에서의 수신은 경고 대상이다."],
    answerIndex: 0,
    explanation: "축구 규정상 스로인, 코너킥, 골킥을 직접 받는 상황에서는 오프사이드 반칙이 적용되지 않습니다.",
    illustration: "/football-rules-quiz-q08.webp",
    mainCharacter: "리냐",
  },
  {
    id: "pickles-trophy",
    question: "1966년 잉글랜드 월드컵을 앞두고 전시 중이던 우승 트로피 '줄리메 컵'이 도난당했습니다. 이 트로피를 런던 주택가 풀숲에서 찾아낸 의외의 주인공은 누구일까요?",
    options: ["훈련 중이던 경찰 탐지견", "산책을 하던 '피클스'라는 이름의 개", "길을 지나가던 어린 어린이", "청소 작업을 하던 환경미화원"],
    answerIndex: 1,
    explanation: "주인과 산책하던 개 '피클스(Pickles)'가 신문지에 싸여 담벼락 밑 풀숲에 파묻혀 있던 줄리메 컵을 냄새로 찾아냈습니다.",
    illustration: "/football-rules-quiz-q09.webp",
    mainCharacter: "해파린",
  },
  {
    id: "square-goalpost",
    question: "1987년 FIFA가 안전 및 공의 불규칙 바운드 문제로 규정을 변경하기 전까지, 축구장 골대의 기둥(골포스트) 모양으로 흔하게 사용되던 형태는 무엇일까요?",
    options: ["각형(사각 기둥) 모양", "삼각 기둥 모양", "타원형 모양", "오각형 모양"],
    answerIndex: 0,
    explanation: "과거에는 사각형 골포스트가 흔했지만, 공이 맞고 튕겨 나오는 방향 예측이 어렵고 선수 부상 위험이 높아 둥근 원형 기둥으로 변경되었습니다.",
    illustration: "/football-rules-quiz-q10.webp",
    mainCharacter: "다시바",
  },
  {
    id: "penalty-double-touch",
    question: "페널티킥 상황에서 키커가 찬 공이 골키퍼에게 맞지 않고 '골대(골포스트)'에만 맞고 튕겨 나왔습니다. 이 공을 키커가 아무도 터치하지 않은 상태에서 그대로 다시 차 골을 넣었다면 심판의 올바른 판정은 무엇일까요?",
    options: ["정상 득점으로 인정된다.", "키커의 이중 터치 반칙으로 득점이 취소되고 상대 팀의 간접 프리킥이 선언된다.", "페널티킥을 다시 차도록 명령한다.", "상대 팀의 골킥이 선언된다."],
    answerIndex: 1,
    explanation: "페널티킥 시 키커는 다른 선수가 공을 터치하기 전까지 연속으로 공을 터치할 수 없습니다(이중 터치 규정). 골대는 선수가 아니므로, 골대만 맞고 나온 공을 키커가 직접 리바운드해 차 넣는 것은 반칙입니다. 단, 골키퍼 손이나 몸에 맞고 나온 공은 키커가 다시 차서 넣어도 정상 득점입니다.",
    illustration: "/football-rules-quiz-q11.webp",
    mainCharacter: "재닌",
  },
];

export const FOOTBALL_RULES_QUIZ_ANSWER_LABELS = ["01", "02", "03", "04"] as const;
