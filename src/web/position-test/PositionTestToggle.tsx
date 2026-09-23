import { Footprints } from "lucide-react";
// Renders immediately on page load (unlike PositionTestPopup), so its
// styles need to be in a stylesheet loaded with the main bundle — same
// reasoning as FortuneToggle's own split css file.
import "./position-test-toggle.css";
import { getPositionTestButtonIconUrl } from "./positionTestAssets";

export function PositionTestToggle({ onClick }: { onClick: () => void }) {
  const iconUrl = getPositionTestButtonIconUrl();

  return (
    <button type="button" className="position-test-toggle" onClick={onClick} aria-label="나의 축구 포지션은? 성향 테스트 열기">
      {iconUrl ? (
        <img src={iconUrl} alt="" className="position-test-toggle__icon" />
      ) : (
        <Footprints aria-hidden="true" className="position-test-toggle__icon position-test-toggle__icon--fallback" />
      )}
      <span className="position-test-toggle__label">나의 축구 포지션은?</span>
    </button>
  );
}
