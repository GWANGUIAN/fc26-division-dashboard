import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import "./fortune-bonus-announce.css";

const VISIBLE_MS = 4800;
const EXIT_MS = 350;

/** Fired once by useFortuneBonusUnlock's onUnlock callback when the viewer
 * has revealed all 11 tarot cards — same "bigger, longer-lived, more
 * animated than the plain toast" treatment as
 * toty-card/WoowakgoodBonusAnnounce.tsx, own copy since the message here is
 * longer (wraps to 2 lines) rather than a single short line. */
export function FortuneBonusAnnounce({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setExiting(true), VISIBLE_MS);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [exiting, onDone]);

  return (
    <div
      className={`fortune-bonus-announce${exiting ? " fortune-bonus-announce--exiting" : ""}`}
      role="status"
    >
      <Sparkles aria-hidden="true" />
      <span>
        타로 카드를 전부 뽑으셨어요! 숨겨진 카드가 공개되었습니다.
        <br />
        다음 운세 뽑기부터 숨겨진 카드도 함께 만나볼 수 있어요.
      </span>
    </div>
  );
}
