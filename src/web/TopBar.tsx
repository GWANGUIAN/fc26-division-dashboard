import { Trophy } from "lucide-react";
import { AnnouncementWidget } from "./AnnouncementModal";

export function TopBar({
  onTrophyOpen,
}: {
  onTrophyOpen: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar__brand-group">
        <a className="brand" href="#top">
          <span className="brand-wak">WAK</span>
          <span>JANDY</span>
          <strong>동아리 대시보드</strong>
        </a>
        <AnnouncementWidget />
      </div>
      <div className="topbar__actions">
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
