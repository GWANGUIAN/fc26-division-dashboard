import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Footprints, Gamepad2, Sparkles } from "lucide-react";
// Renders immediately on page load (unlike the lazy-loaded minigame modals), so its styles live in
// a stylesheet that ships with the main bundle — same reasoning as FortuneToggle's own css file.
import "./minigame-menu.css";
import { getCardMatchBackUrl } from "./cardMatchAssets.js";
import { getFortuneCardBackUrl } from "../fortune/fortuneCardAssets";
import { getPositionTestButtonIconUrl } from "../position-test/positionTestAssets";
import { hasOpenedFortune, markFortuneOpened } from "../storage";

export type MinigameId = "kickups" | "freekick" | "cardmatch" | "soccer-sum10" | "grass-merge" | "keeper-breakout" | "football-match3" | "football-rules-quiz";

function KeeperBreakoutMenuIcon() {
  const [available, setAvailable] = useState(true);
  return available ? <img src="/keeper-breakout-icon.webp" alt="" className="minigame-menu__icon" onError={() => setAvailable(false)} /> : <span className="minigame-menu__icon minigame-menu__icon--fallback" aria-hidden="true">🧤</span>;
}

function FootballRulesQuizMenuIcon() {
  const [available, setAvailable] = useState(true);
  return available ? <img src="/football-rules-quiz-icon.webp" alt="" className="minigame-menu__icon" onError={() => setAvailable(false)} /> : <BookOpenCheck className="minigame-menu__icon minigame-menu__icon--fallback" aria-hidden="true" />;
}

// Warming these up while the menu sits idle on the dashboard means the browser has already
// fetched and decoded them by the time a modal opens — measured ~50ms main-thread block
// otherwise happens right as the first game frame runs, because `new Audio(...).play()` forces
// that fetch/decode work synchronously into the same frame.
const WARMUP_URLS = Array.from(
  new Set([
    // kickups
    "/background-mini-game.mp3",
    "/sfxes/ball-bounce.mp3",
    "/sfxes/game-over.mp3",
    "/sfxes/doormomo.mp3",
    // freekick
    "/sfxes/goal.mp3",
    "/sfxes/background-freekick.mp3",
    // card match
    "/sfxes/card-match-flip.mp3",
    "/sfxes/card-match-success.mp3",
    "/sfxes/card-match-fail.mp3",
    "/sfxes/card-match-victory.mp3",
    // soccer sum10
    "/soccer-sum10-bgm.mp3",
    "/sfxes/soccer-sum10-start.mp3",
    "/sfxes/soccer-sum10-clear.mp3",
    "/sfxes/soccer-sum10-timeup.mp3",
    // grass merge
    "/grass-merge-bgm.mp3",
    "/sfxes/grass-merge-drop.mp3",
    "/sfxes/grass-merge-merge.mp3",
    // keeper breakout
    "/keeper-breakout-bgm.mp3",
    "/sfxes/keeper-breakout-paddle.mp3",
    "/sfxes/keeper-breakout-brick.mp3",
    "/football-match3-bgm.mp3",
    "/sfxes/football-match3-swap.mp3",
    "/sfxes/football-match3-match.mp3",
    // football rules quiz
    "/football-rules-quiz-bgm.mp3",
    "/sfxes/football-rules-quiz-open.mp3",
    "/sfxes/football-rules-quiz-select.mp3",
    "/sfxes/football-rules-quiz-correct.mp3",
    "/sfxes/football-rules-quiz-wrong.mp3",
    "/sfxes/football-rules-quiz-next.mp3",
    "/sfxes/football-rules-quiz-result.mp3",
    "/sfxes/football-rules-quiz-perfect.mp3",
  ]),
);

export function MinigameMenu({
  onSelect,
  onOpenFortune,
  onOpenPositionTest,
}: {
  onSelect: (game: MinigameId) => void;
  onOpenFortune: () => void;
  onOpenPositionTest: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fortuneOpened, setFortuneOpened] = useState(() => hasOpenedFortune());
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const warmups = WARMUP_URLS.map((src) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      return audio;
    });
    return () => {
      warmups.forEach((audio) => {
        audio.src = "";
      });
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    addEventListener("mousedown", closeOnOutsideClick);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const fortuneBackUrl = getFortuneCardBackUrl();
  const positionIconUrl = getPositionTestButtonIconUrl();
  const extras: { key: string; label: string; icon: React.ReactNode; isNew?: boolean; onClick: () => void }[] = [
    {
      key: "fortune",
      label: "오늘의 운세 뽑기",
      icon: fortuneBackUrl ? <img src={fortuneBackUrl} alt="" className="minigame-menu__icon" /> : <Sparkles className="minigame-menu__icon minigame-menu__icon--fallback" aria-hidden="true" />,
      isNew: !fortuneOpened,
      onClick: () => {
        if (!fortuneOpened) {
          markFortuneOpened();
          setFortuneOpened(true);
        }
        onOpenFortune();
      },
    },
    {
      key: "position-test",
      label: "나의 축구 포지션은?",
      icon: positionIconUrl ? <img src={positionIconUrl} alt="" className="minigame-menu__icon" /> : <Footprints className="minigame-menu__icon minigame-menu__icon--fallback" aria-hidden="true" />,
      onClick: onOpenPositionTest,
    },
  ];
  const cardBackUrl = getCardMatchBackUrl();
  const games: { id: MinigameId; label: string; icon: React.ReactNode }[] = [
    { id: "kickups", label: "축구공 튀기기", icon: <img src="/soccer_ball.webp" alt="" className="minigame-menu__icon" /> },
    { id: "freekick", label: "3D 프리킥", icon: <img src="/goalpost.webp" alt="" className="minigame-menu__icon" /> },
    {
      id: "cardmatch",
      label: "카드 짝 맞추기",
      icon: cardBackUrl ? (
        <img src={cardBackUrl} alt="" className="minigame-menu__icon" />
      ) : (
        <span className="minigame-menu__icon minigame-menu__icon--fallback" aria-hidden="true">
          🃏
        </span>
      ),
    },
    {
      id: "soccer-sum10",
      label: "축구공 사과게임",
      icon: <img src="/soccer-sum10-icon.webp" alt="" className="minigame-menu__icon" />,
    },
    { id: "grass-merge", label: "잔디 머지", icon: <img src="/grass-merge-icon.webp" alt="" className="minigame-menu__icon" /> },
    { id: "keeper-breakout", label: "골키퍼 벽돌깨기", icon: <KeeperBreakoutMenuIcon /> },
    { id: "football-match3", label: "축구 매치3", icon: <img src="/football-match3-icon.webp" alt="" className="minigame-menu__icon" /> },
    { id: "football-rules-quiz", label: "축구 상식 퀴즈", icon: <FootballRulesQuizMenuIcon /> },
  ];

  return (
    <div className="minigame-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`minigame-menu__trigger ${open ? "minigame-menu__trigger--open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Gamepad2 className="minigame-menu__trigger-icon" aria-hidden="true" />
        <span className="minigame-menu__trigger-label">심심풀이</span>
        {!fortuneOpened && <span className="minigame-menu__new-dot" aria-hidden="true" />}
      </button>
      {open && (
        <ul className="minigame-menu__panel" role="menu" aria-label="심심풀이 목록">
          {extras.map((extra) => (
            <li key={extra.key} role="none">
              <button
                type="button"
                role="menuitem"
                className="minigame-menu__item"
                onClick={() => {
                  setOpen(false);
                  extra.onClick();
                }}
              >
                <span className="minigame-menu__icon-wrap">{extra.icon}</span>
                <span className="minigame-menu__item-label">{extra.label}</span>
                {extra.isNew && <span className="minigame-menu__new-badge">NEW</span>}
              </button>
            </li>
          ))}
          <li role="separator" className="minigame-menu__separator" />
          {games.map((game) => (
            <li key={game.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="minigame-menu__item"
                onClick={() => {
                  setOpen(false);
                  onSelect(game.id);
                }}
              >
                <span className="minigame-menu__icon-wrap">{game.icon}</span>
                <span className="minigame-menu__item-label">{game.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
