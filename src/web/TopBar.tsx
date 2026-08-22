import { Trophy } from "lucide-react";
import { AnnouncementWidget } from "./AnnouncementModal";

export function TopBar({
  view,
  onViewChange,
  latestCount,
  onFeedOpen,
  onTrophyOpen,
}: {
  view: "division" | "evaluation";
  onViewChange: (view: "division" | "evaluation") => void;
  latestCount: number;
  onFeedOpen: () => void;
  onTrophyOpen: () => void;
}) {
  const isDivision = view === "division";
  return (
    <header className="topbar">
      <div className="topbar__brand-group">
        <a className="brand" href="#top">
          <span className="brand-wak">WAK</span>
          <span>JANDY</span>
          <strong>동아리 후보 대시보드</strong>
        </a>
        <AnnouncementWidget />
      </div>
      <nav className="main-nav" aria-label="메인 메뉴">
        <button
          className={isDivision ? "active" : ""}
          onClick={() => onViewChange("division")}
        >
          디비전 현황
        </button>
        <button
          className={!isDivision ? "active" : ""}
          onClick={() => onViewChange("evaluation")}
        >
          1:1 평가
        </button>
      </nav>
      <div className="topbar__actions">
        <button className="feed-toggle" onClick={onFeedOpen}>
          최신 소식 <em>{latestCount}</em>
        </button>
        <button
          className="trophy-toggle"
          type="button"
          onClick={onTrophyOpen}
          aria-label="업적 보기"
        >
          <Trophy aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
