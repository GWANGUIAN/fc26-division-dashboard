import { useEffect, useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";
// Renders immediately on page load (unlike the lazy-loaded minigame modals), so its styles live in
// a stylesheet that ships with the main bundle — same reasoning as FortuneToggle's own css file.
import "./minigame-menu.css";
import { getCardMatchBackUrl } from "./cardMatchAssets.js";

export type MinigameId = "kickups" | "freekick" | "cardmatch" | "soccer-sum10";

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
  ]),
);

export function MinigameMenu({ onSelect }: { onSelect: (game: MinigameId) => void }) {
  const [open, setOpen] = useState(false);
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

  const cardBackUrl = getCardMatchBackUrl();
  const games: { id: MinigameId; label: string; icon: React.ReactNode }[] = [
    { id: "kickups", label: "키업스", icon: <img src="/soccer_ball.webp" alt="" className="minigame-menu__icon" /> },
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
        <span className="minigame-menu__trigger-label">미니게임</span>
      </button>
      {open && (
        <ul className="minigame-menu__panel" role="menu" aria-label="미니게임 목록">
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
