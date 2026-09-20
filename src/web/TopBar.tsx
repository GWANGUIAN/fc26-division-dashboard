import { Castle, Shirt, Trophy } from "lucide-react";
import { AnnouncementWidget } from "./AnnouncementModal";

export function TopBar({
  onUniformOpen,
  onTrophyOpen,
  onStadiumOpen,
}: {
  onUniformOpen: () => void;
  onTrophyOpen: () => void;
  onStadiumOpen: () => void;
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
          className="stadium-toggle"
          type="button"
          onClick={onStadiumOpen}
          aria-label="3D 경기장 구경"
        >
          <Castle aria-hidden="true" />
        </button>
        <button
          className="uniform-toggle"
          type="button"
          onClick={onUniformOpen}
          aria-label="응원 유니폼 만들기"
        >
          <Shirt aria-hidden="true" />
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
