import { useState, type ReactNode } from "react";
import { SILENT_AUDIO, type WorldAudioLike } from "../audio/worldAudio";
import { GOLDEN_BALLS } from "../data/goldenBalls";
import { BADGES, MINIGAME_INFO, type MinigameGame } from "../data/missionDefs";
import { PLAYABLE_CAST, getCast } from "../data/worldCast";
import { heldGoldenBalls, spentGoldenBalls } from "../state/finaleBalls";
import { RANKS, arcadeRank, bestKey, rankGoal, rankTier } from "../state/ranks";
import type { WorldSave } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { BadgeIcon } from "./BadgeIcon";
import { gameIconKeys } from "./missionIcons";
import { firstAsset, panelArt } from "./panelArt";
import { DOWN_CODES, LEFT_CODES, RIGHT_CODES, UP_CODES, useWorldKeys } from "./useWorldKeys";
import "./board-codex.css";

type Tab = "records" | "balls" | "cards" | "badges";
const TABS: { id: Tab; label: string }[] = [
  { id: "records", label: "기록" },
  { id: "balls", label: "황금 공" },
  { id: "cards", label: "카드" },
  { id: "badges", label: "뱃지" },
];
/** Slots per row, so ↑↓ jump a row. The record list is a single column. */
const COLUMNS: Record<Tab, number> = { records: 1, balls: 10, cards: 6, badges: 8 };
const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };

const HIDDEN_CARD = "woowakgood";

interface CollectionBookProps {
  save: WorldSave;
  /** The dashboard's hidden 우왁굳 card has been unlocked. */
  hiddenUnlocked: boolean;
  /** Optional so a render test needs no sound. */
  audio?: WorldAudioLike;
  /** The tab that shows first (the records). */
  initialTab?: Tab;
  onClose: () => void;
}

/** What a rank asks for, in the game's own unit ("300m 이상", "24턴 이하"). */
function rankGoalText(game: MinigameGame, tier: number): string {
  if (tier === 0) return "처음";
  if (tier === 1) return "한 판 플레이";
  const goal = rankGoal(game, tier);
  if (goal === null) return "";
  const { unit } = MINIGAME_INFO[game];
  return `${goal}${unit} ${game === "cardmatch" ? "이하" : "이상"}`;
}

/**
 * The collection book (docs/world/17), drawn like the mission log on a parchment notebook: four tabs — the arcade
 * records and rank ladders, the twenty golden balls, the eleven member cards (plus the hidden one) and the badges.
 * ←→↑↓ move over the slots, Q/E (or Tab, 1–4) switch the tab, and the detail of the highlighted slot shows below or
 * to the right. Esc (handled by the overlay) or a click outside closes.
 */
export function CollectionBook({ save, hiddenUnlocked, audio = SILENT_AUDIO, initialTab = "records", onClose }: CollectionBookProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [index, setIndex] = useState(0);

  const games = Object.keys(MINIGAME_INFO) as MinigameGame[];
  const spent = new Set(spentGoldenBalls(save.missions));
  const balls = GOLDEN_BALLS.map((ball, position) => ({
    ball,
    no: position + 1,
    state: spent.has(ball.id) ? ("spent" as const) : save.collected.includes(ball.id) ? ("found" as const) : ("unknown" as const),
  }));
  const foundBalls = balls.filter((entry) => entry.state !== "unknown").length;
  const cards = [
    ...PLAYABLE_CAST.map((cast) => ({ id: cast.id, name: cast.displayName, revealed: Boolean(save.flags[`card:${cast.id}`]), hidden: false })),
    { id: HIDDEN_CARD, name: getCast(HIDDEN_CARD).displayName, revealed: hiddenUnlocked, hidden: true },
  ];
  const revealedMembers = cards.filter((card) => !card.hidden && card.revealed).length;
  const badges = Object.values(BADGES).map((badge) => ({ badge, earned: Boolean(save.flags[`badge:${badge.id}`]) }));
  const earnedBadges = badges.filter((entry) => entry.earned).length;
  const titleCount = Object.keys(save.flags).filter((id) => id.startsWith("title:")).length;

  const count = { records: games.length, balls: balls.length, cards: cards.length, badges: badges.length }[tab];
  const at = Math.min(index, count - 1);

  const select = (position: number) => {
    if (position === at) return;
    audio.playSfx("ui-move");
    setIndex(position);
  };
  const switchTab = (next: Tab) => {
    if (next === tab) return;
    audio.playSfx("ui-move");
    setTab(next);
    setIndex(0);
  };
  const cycleTab = (step: number) => switchTab(TABS[(TABS.findIndex((entry) => entry.id === tab) + step + TABS.length) % TABS.length].id);
  const move = (dx: number, dy: number) => {
    const columns = COLUMNS[tab];
    if (columns === 1) return select((at + dy + count) % count);
    const next = at + dx + dy * columns;
    if (next < 0 || next >= count || (dx !== 0 && Math.floor(next / columns) !== Math.floor(at / columns))) return;
    select(next);
  };

  useWorldKeys((code, event) => {
    if (code === "KeyQ" || code === "PageUp") cycleTab(-1);
    else if (code === "KeyE" || code === "PageDown") cycleTab(1);
    else if (code === "Tab") cycleTab(event.shiftKey ? -1 : 1);
    else if (code in DIGITS) switchTab(TABS[DIGITS[code]].id);
    else if (UP_CODES.has(code)) move(0, -1);
    else if (DOWN_CODES.has(code)) move(0, 1);
    else if (LEFT_CODES.has(code)) move(-1, 0);
    else if (RIGHT_CODES.has(code)) move(1, 0);
    else return false;
    return true;
  });

  const { style, has } = panelArt({
    "frame-log": "ui/panel-parchment",
    "frame-tab-on": "ui/tab-active",
    "frame-tab": "ui/tab-normal",
    "frame-card": "ui/card-normal",
    "frame-card-on": "ui/card-selected",
    "frame-card-dim": "ui/card-dim",
    // The codex kit (docs/world/17): optional, each group is used only when all of it exists.
    "frame-card-secret": "ui/codex-card-secret",
    "ball-found": "ui/codex-ball-found",
    "ball-spent": "ui/codex-ball-spent",
    "ball-unknown": "ui/codex-ball-unknown",
    "badge-earned": "ui/codex-badge-earned",
    "badge-locked": "ui/codex-badge-locked",
    "gem-on": "ui/codex-gem-on",
    "gem-off": "ui/codex-gem-off",
  });
  const ballArt = has["ball-found"] && has["ball-spent"] && has["ball-unknown"];
  const badgeArt = has["badge-earned"] && has["badge-locked"];
  const gemArt = has["gem-on"] && has["gem-off"];
  const ballSprite = getWorldAssetUrl("props/goldball-1");
  const check = getWorldAssetUrl("ui/check-badge");
  const lock = getWorldAssetUrl("ui/mi-locked");
  const close = getWorldAssetUrl("ui/mn-close");

  const slotProps = (position: number) => ({
    role: "option" as const,
    "aria-selected": position === at,
    onMouseEnter: () => select(position),
    onClick: () => select(position),
  });

  let summary: string;
  let body: ReactNode;
  if (tab === "records") {
    summary = `오락실 최고 기록과 랭크 · 칭호 ${titleCount}개 획득`;
    const game = games[at];
    const best = save.bests[bestKey(game)];
    const tier = rankTier(game, best);
    const { name, unit } = MINIGAME_INFO[game];
    body = (
      <div className="world-codex__split">
        <ul className="world-codex__list" role="listbox" aria-label="오락실 기록">
          {games.map((entry, position) => {
            const score = save.bests[bestKey(entry)];
            const entryTier = rankTier(entry, score);
            const icon = firstAsset(...gameIconKeys(entry));
            return (
              <li key={entry} {...slotProps(position)} className={`world-codex__game${position === at ? " is-on" : ""}${score === undefined ? " is-none" : ""}`}>
                {icon ? <img src={icon} alt="" draggable={false} /> : <span className="world-codex__icon-fallback" aria-hidden="true" />}
                <span className="world-codex__game-text">
                  <strong>{MINIGAME_INFO[entry].name}</strong>
                  <small>{score === undefined ? "아직 기록 없음" : `${score}${MINIGAME_INFO[entry].unit}`}</small>
                </span>
                <span className={`world-codex__rank tier-${Math.min(entryTier, 7)}`}>{arcadeRank(entry, score)}</span>
              </li>
            );
          })}
        </ul>
        <div className="world-codex__detail" aria-live="polite">
          <h3>{name}</h3>
          <p className="world-codex__best">
            최고 기록 <b>{best === undefined ? "—" : `${best}${unit}`}</b>
          </p>
          <ol className={`world-codex__ladder${gemArt ? " is-art" : ""}`} aria-label="랭크 사다리">
            {RANKS.map((rank, rankTierIndex) => (
              <li key={rank} className={`${rankTierIndex <= tier ? "is-reached" : ""}${rankTierIndex === tier ? " is-now" : ""}`}>
                <i aria-hidden="true" />
                <span>{rank}</span>
                <small>{rankTierIndex === tier ? "현재" : rankGoalText(game, rankTierIndex)}</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  } else if (tab === "balls") {
    summary = `황금 축구공 보유 ${heldGoldenBalls(save)}개 · 발견 ${foundBalls}/${balls.length}`;
    const current = balls[at];
    const stateLabel = { spent: "사용", found: "획득", unknown: "미발견" }[current.state];
    body = (
      <>
        <ul className={`world-codex__balls${ballArt ? " is-art" : ""}`} role="listbox" aria-label="황금 축구공">
          {balls.map((entry, position) => (
            <li key={entry.ball.id} {...slotProps(position)} className={`world-codex__ball is-${entry.state}${position === at ? " is-on" : ""}${entry.ball.ending ? " is-ending" : ""}`}>
              {ballSprite ? <img src={ballSprite} alt="" draggable={false} /> : <span className="world-codex__ball-fallback" aria-hidden="true" />}
              <em>{entry.no}</em>
              {entry.state === "spent" && (check ? <img className="world-codex__ball-mark" src={check} alt="" draggable={false} /> : <b className="world-codex__ball-mark">✓</b>)}
              {entry.state === "unknown" && <b className="world-codex__ball-mark">?</b>}
            </li>
          ))}
        </ul>
        <div className="world-codex__strip" aria-live="polite">
          <span className={`world-codex__state is-${current.state}`}>{stateLabel}</span>
          <div>
            <h3>
              {current.no}번 · {current.ball.hint}
            </h3>
            <p>{current.ball.ending ? "엔딩 후에 나타나는 황금 축구공이에요." : "마을 곳곳에 숨어 있는 황금 축구공이에요."}</p>
          </div>
        </div>
        <p className="world-codex__legend">
          <span className="is-found">획득</span>
          <span className="is-spent">사용함</span>
          <span className="is-unknown">미발견</span>
          <span className="is-ending">엔딩 후</span>
        </p>
      </>
    );
  } else if (tab === "cards") {
    summary = `카드 도감 ${revealedMembers}/${PLAYABLE_CAST.length} 공개 · 모두 공개한 뒤 우왁굳에게 보고하세요`;
    const current = cards[at];
    const status = current.hidden ? (current.revealed ? "해금" : "잠김") : current.revealed ? "공개" : "미공개";
    const note = current.hidden
      ? current.revealed
        ? "우왁굳 히든 카드가 해금됐어요! 카드 팝업에서 우왁굳을 선택하세요."
        : "기존 카드 공개 수집으로 우왁굳 히든 카드가 해금돼요. 월드 미션은 월드 안에서 공개한 카드만 판정해요."
      : current.revealed
        ? "월드에서 공개한 카드예요."
        : "감독실의 월드 카드 팝업에서 공개하면 기록돼요.";
    body = (
      <>
        <ul className="world-codex__cards" role="listbox" aria-label="카드 도감">
          {cards.map((card, position) => {
            const portrait = getWorldAssetUrl(`portraits/${card.id}-neutral`);
            return (
              <li
                key={card.id}
                {...slotProps(position)}
                className={`world-codex__card${card.revealed ? " is-revealed" : " is-locked"}${card.hidden ? " is-secret" : ""}${position === at ? " is-on" : ""}${has["frame-card"] ? " world-codex__card--art" : ""}`}
              >
                {portrait ? <img src={portrait} alt="" draggable={false} /> : <span className="world-codex__portrait-fallback" aria-hidden="true" />}
                <strong>{card.hidden && !card.revealed ? "???" : card.name}</strong>
              </li>
            );
          })}
        </ul>
        <div className="world-codex__strip" aria-live="polite">
          <span className={`world-codex__state is-${current.revealed ? "found" : "unknown"}`}>{status}</span>
          <div>
            <h3>{current.hidden && !current.revealed ? "숨겨진 카드" : current.name}</h3>
            <p>{note}</p>
          </div>
        </div>
      </>
    );
  } else {
    summary = `뱃지 ${earnedBadges}/${badges.length} 획득`;
    const current = badges[at];
    body = (
      <>
        <ul className={`world-codex__badges${badgeArt ? " is-art" : ""}`} role="listbox" aria-label="뱃지">
          {badges.map((entry, position) => (
            <li key={entry.badge.id} {...slotProps(position)} className={`world-codex__badge${entry.earned ? " is-earned" : " is-locked"}${position === at ? " is-on" : ""}`}>
              <BadgeIcon badge={entry.badge} earned={entry.earned} />
              {!entry.earned && lock && <img className="world-codex__lock" src={lock} alt="" draggable={false} />}
            </li>
          ))}
        </ul>
        <div className="world-codex__strip" aria-live="polite">
          <span className={`world-codex__state is-${current.earned ? "found" : "unknown"}`}>{current.earned ? "획득" : "미획득"}</span>
          <div>
            <h3>{current.badge.label}</h3>
            <p>{current.badge.hint}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="world-veil" onClick={onClose}>
      <section className={`world-codex${has["frame-log"] ? " world-codex--art" : ""}`} style={style} role="dialog" aria-label="잔디동 도감" onClick={(event) => event.stopPropagation()}>
        <header className="world-codex__head">
          <h2>잔디동 도감</h2>
          <div className="world-codex__tabs" role="tablist">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                className={`world-codex__tab${tab === entry.id ? " is-on" : ""}${has["frame-tab-on"] && has["frame-tab"] ? " world-codex__tab--art" : ""}`}
                onClick={() => switchTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button type="button" className="world-codex__close" onClick={onClose} aria-label="닫기">
            {close ? <img src={close} alt="" draggable={false} /> : "×"}
          </button>
        </header>
        <p className="world-codex__summary">{summary}</p>
        <div className={`world-codex__body is-${tab}`}>{body}</div>
        <footer className="world-codex__foot">방향키 선택 · Q/E 탭 · Esc 닫기</footer>
      </section>
    </div>
  );
}
