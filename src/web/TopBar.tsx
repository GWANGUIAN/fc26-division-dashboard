import { Castle, Goal, Shirt, Trophy } from "lucide-react";
import { AnnouncementWidget } from "./AnnouncementModal";
import "./pitch-return.css";

export function TopBar({
  onUniformOpen,
  onTrophyOpen,
  onStadiumOpen,
  onGoPitch,
}: {
  onUniformOpen: () => void;
  onTrophyOpen: () => void;
  onStadiumOpen: () => void;
  /** Present only when the dashboard was entered through the pitch gate (Root); shows the way back. */
  onGoPitch?: () => void;
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
        {onGoPitch && (
          <button className="pitch-return" type="button" onClick={onGoPitch} aria-label="피치로 돌아가기">
            <Goal aria-hidden="true" />
            <span className="pitch-return__label">피치로 돌아가기</span>
          </button>
        )}
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
