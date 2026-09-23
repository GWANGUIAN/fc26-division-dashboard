// The 14 personality-test results — one per (position, style) combination.
// See docs/position-test-prompts.md section 6 for the confirmed mapping
// table and the matching AI art prompts. ST/CDM/GK have only one 2차 합격
// roster member each, so both of that position's themes use the same
// memberId (two different illustrations of the same person); the other
// four positions have two members each, one per theme.
//
// Deliberately NOT reusing any motif/wording from the "오늘의 운세" tarot
// deck (fortuneCardData.ts / docs/fortune-prompts.md) for the same member —
// see the plan's mapping-table note for the full list of excluded words.

import type { PositionCode, PositionTestStyle } from "./positionTestData";

export interface PositionTestResultEntry {
  position: PositionCode;
  style: PositionTestStyle;
  memberId: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

export const POSITION_LABELS: Record<PositionCode, string> = {
  ST: "스트라이커",
  WF: "윙포워드",
  CM: "미드필더",
  CDM: "수비형 미드필더",
  CB: "센터백",
  FB: "풀백",
  GK: "골키퍼",
};

export const POSITION_TEST_RESULTS: readonly PositionTestResultEntry[] = [
  {
    position: "ST",
    style: "A",
    memberId: "ju010228",
    title: "주인공병 슛팅 중독자",
    subtitle: "기회만 보이면 일단 쏘고 보는 원샷 원킬 스트라이커",
    accentColor: "#ff7a4d",
  },
  {
    position: "ST",
    style: "B",
    memberId: "ju010228",
    title: "줏어먹기 연금술사",
    subtitle: "삽질은 없다, 골 앞에서만 나타나 득점만 챙기는 해결사",
    accentColor: "#ff7a4d",
  },
  {
    position: "CDM",
    style: "A",
    memberId: "doormomo",
    title: "메모장 가득 채우는 전술 덕후",
    subtitle: "상대 분석부터 동선까지 혼자 다 적어오는 두뇌파",
    accentColor: "#8a5cff",
  },
  {
    position: "CDM",
    style: "B",
    memberId: "doormomo",
    title: "은근 승부욕 폭발하는 안정감 요원",
    subtitle: "태연한 척하지만 지면 그날 하루 종일 복기함",
    accentColor: "#8a5cff",
  },
  {
    position: "GK",
    style: "A",
    memberId: "janine95kim",
    title: "실점 제로 집착 완벽주의자",
    subtitle: "골문 앞은 내 구역, 실점은 자존심 문제",
    accentColor: "#ffd44f",
  },
  {
    position: "GK",
    style: "B",
    memberId: "janine95kim",
    title: "선방하고 혼자 신난 리액션 부자",
    subtitle: "막아놓고 제일 신나서 소리 지르는 흥부자",
    accentColor: "#ffd44f",
  },
  {
    position: "CM",
    style: "A",
    memberId: "bboringirl",
    title: "티 안 나게 다 하는 그림자 일꾼",
    subtitle: "공격도 수비도 안 보이는 곳에서 다 커버하는 숨은 주역",
    accentColor: "#4a90ff",
  },
  {
    position: "CM",
    style: "B",
    memberId: "kaksjak0730",
    title: "패스 각도만 파는 각도기 장인",
    subtitle: "상대 뚫는 패스 한 방을 위해 계산만 하는 타입",
    accentColor: "#4a90ff",
  },
  {
    position: "CB",
    style: "A",
    memberId: "sjh4018",
    title: "헤더면 헤더, 몸이면 몸 다 던지는 맷집 수비수",
    subtitle: "일단 부딪히고 보는 몸빵 하나는 진심",
    accentColor: "#6b83a3",
  },
  {
    position: "CB",
    style: "B",
    memberId: "haepalin",
    title: "그림자처럼 따라붙는 찰거머리 수비수",
    subtitle: "소리 없이 하루 종일 붙어서 상대를 지치게 만듦",
    accentColor: "#6b83a3",
  },
  {
    position: "FB",
    style: "A",
    memberId: "tleod1818",
    title: "체력 방전 모르는 무한 배터리",
    subtitle: "오버래핑 200번도 거뜬한 사이드 괴물",
    accentColor: "#2ed9a8",
  },
  {
    position: "FB",
    style: "B",
    memberId: "lina0108",
    title: "타이밍 하나로 승부 보는 감각파 크로스러",
    subtitle: "계산보다 감으로 정확하게 꽂는 타입",
    accentColor: "#2ed9a8",
  },
  {
    position: "WF",
    style: "A",
    memberId: "tdnlamuron",
    title: "생각보다 발이 먼저 나가는 스피드광",
    subtitle: "상대 수비 보기도 전에 이미 제쳐버림",
    accentColor: "#c6e64a",
  },
  {
    position: "WF",
    style: "B",
    memberId: "hachi97",
    title: "혼자 신난 프리스타일 드리블러",
    subtitle: "계획 없이 몸이 먼저 움직이는 즉흥 예능인",
    accentColor: "#c6e64a",
  },
];

export function getPositionTestResult(position: PositionCode, style: PositionTestStyle): PositionTestResultEntry {
  const found = POSITION_TEST_RESULTS.find((entry) => entry.position === position && entry.style === style);
  // Every (position, style) pair is covered by the table above, so this is
  // unreachable in practice — the fallback just keeps the return type
  // non-optional without an assertion.
  return found ?? POSITION_TEST_RESULTS[0];
}
