import type { ReactNode } from "react";
import { CirclePile, Shield, Trophy } from "lucide-react";
import geminiLogo from "./assets/gemini-logo.svg";

export type Announcement = {
  id: string;
  date: string;
  body: ReactNode;
  note?: string;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-08-squad-builder",
    date: "2026.08.21",
    body: (
      <>
        <strong>나만의 스쿼드 빌더</strong> 기능이 추가되었습니다. 디비전 목록
        오른쪽의 <br />
        <br />
        <span className="announcement-squad-builder-btn">
          <CirclePile aria-hidden="true" />
          <span>나만의 스쿼드 빌더</span>
        </span>{" "}
        버튼을 누르면 스쿼드를 추가하고 원하는 포메이션에 선수들을 자유롭게
        배치해볼 수 있습니다. <strong>커스텀 선수</strong>도 추가/삭제
        가능합니다.
      </>
    ),
  },
  {
    id: "2026-08-gemini-review",
    date: "2026.08.20",
    body: (
      <>
        <span className="announcement-icon-badge announcement-icon-badge--gemini">
          <img src={geminiLogo} alt="" />
        </span>{" "}
        <strong>Gemini 한줄평</strong> 기능이 추가되었습니다. 왁물원에 승격 보고
        게시글이 올라오고 전체 전적 분석이 성공하면, 스트리머 상세 정보에서 AI가
        남긴 짧은 한줄평을 확인할 수 있습니다.
      </>
    ),
    note: "조건이 아직 충족되지 않았거나 분석 전/분석 중이면 이전 평가가 대신 표시됩니다.",
  },
  {
    id: "2026-08-ai-record-extraction",
    date: "2026.08.19",
    body: (
      <>
        <strong>AI</strong>가 승격 보고 게시물의 이미지를 분석해서{" "}
        <strong>전체 전적을 추출</strong>하는 기능을 구현했습니다.
        <br />
        스트리머분들께서는 전체 전적이 포함된 게임 화면을 캡쳐해서 첨부하기를
        부탁드립니다.
      </>
    ),
    note: "자동 추출되지 않는 데이터는 별도 수동 업데이트됩니다.",
  },
  {
    id: "2026-08-card-view",
    date: "2026.08.19",
    body: (
      <>
        <strong>카드 뷰</strong>가 추가되었습니다.{" "}
        <span className="announcement-card-view-btn">
          <Shield aria-hidden="true" />
          <span>카드뷰로 보기</span>
        </span>{" "}
        버튼을 클릭하면 카드 뷰로 전환할 수 있고,
        <br />
        디비전순 / 승률순으로 정렬할 수 있습니다.
      </>
    ),
  },
  {
    id: "2026-08-trophy",
    date: "2026.08.18",
    body: (
      <>
        <strong>업적</strong> 기능이 추가되었습니다. 상단바 오른쪽{" "}
        <span className="announcement-icon-badge announcement-icon-badge--trophy">
          <Trophy aria-hidden="true" />
        </span>{" "}
        버튼을 누르면 각 카테고리별 업적을 확인할 수 있습니다.
      </>
    ),
  },
];

export const ANNOUNCEMENTS_SORTED = [...ANNOUNCEMENTS].sort((a, b) =>
  b.date.localeCompare(a.date),
);
