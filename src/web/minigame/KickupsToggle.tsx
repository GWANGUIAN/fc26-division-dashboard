export function KickupsToggle({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="kickups-toggle" onClick={onClick} aria-label="키업스 미니게임 열기">
      <img src="/soccer_ball.webp" alt="" className="kickups-toggle__icon" />
    </button>
  );
}
