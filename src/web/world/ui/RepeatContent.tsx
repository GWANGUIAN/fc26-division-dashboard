import { useEffect, useState } from "react";
import { GOLDEN_BALLS } from "../data/goldenBalls";
import { heldGoldenBalls, spentGoldenBalls } from "../state/finaleBalls";
import { BADGES, MINIGAME_INFO } from "../data/missionDefs";
import { PLAYABLE_CAST } from "../data/worldCast";
import { DAILY_TASKS, kstDate, refreshDaily } from "../state/daily";
import { arcadeRank, bestKey } from "../state/ranks";
import type { MinigameRoundResult, WorldSave } from "../types";
import { RepeatPanel } from "./RepeatPanel";

export function DailyBoard({ save, onClaim, onClose }: { save: WorldSave; onClaim: (date: string) => void; onClose: () => void }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const daily = refreshDaily(save, now).daily;
  const ready = daily.date === kstDate(now) && daily.picks.every(id => daily.done.includes(id));
  const claimed = daily.stamps.includes(daily.date);
  return <RepeatPanel title="광장 일일 게시판" onClose={onClose}>
    <p>{daily.date} · KST 자정 갱신 · 세 과제를 마치면 하루 한 번 스탬프</p>
    {!save.flags["ending-seen"] && <p>엔딩 후 잔디 코치의 일일 훈련이 열립니다.</p>}
    <ul className="world-repeat-grid">{daily.picks.map(id => <li key={id}>{daily.done.includes(id) ? "완료 · " : "진행 · "}{DAILY_TASKS.find(t => t.id === id)?.label}</li>)}</ul>
    <button disabled={!save.flags["ending-seen"] || !ready || claimed} onClick={() => onClaim(daily.date)}>{claimed ? "오늘 수령 완료" : "스탬프 받기"}</button>
    <p role="status">누적 {daily.stamps.length}일 · 7 / 14 / 30일 뱃지 보상</p>
    <div className="world-repeat-stamps" aria-label="30일 스탬프 카드">{Array.from({ length: 30 }, (_, i) => <span key={i}>{i < daily.stamps.length ? "●" : i + 1}</span>)}</div>
  </RepeatPanel>;
}

export function CollectionBook({ save, hiddenUnlocked, onClose }: { save: WorldSave; hiddenUnlocked: boolean; onClose: () => void }) {
  return <RepeatPanel title="잔디동 도감 · 기록과 칭호" onClose={onClose}>
    <h3>오락실 최고 기록 · 랭크 도전</h3>
    <ul className="world-repeat-grid">{(Object.keys(MINIGAME_INFO) as MinigameRoundResult["game"][]).map(game => <li key={game}>{MINIGAME_INFO[game].name}<br />{save.bests[bestKey(game)] ?? "—"}{MINIGAME_INFO[game].unit} · {arcadeRank(game, save.bests[bestKey(game)])}</li>)}</ul>
    <h3>황금 축구공 보유 {heldGoldenBalls(save)}개 · 발견 {GOLDEN_BALLS.filter(b => save.collected.includes(b.id)).length}/20</h3>
    <ul className="world-repeat-grid">{GOLDEN_BALLS.map(b => { const spent = spentGoldenBalls(save.missions).includes(b.id); const found = save.collected.includes(b.id); return <li key={b.id} className={spent ? "is-spent" : found ? "is-earned" : "is-locked"}>{spent ? "사용" : found ? "획득" : "미발견"}<br />{b.hint}{b.ending ? " · 엔딩 후" : ""}</li>; })}</ul>
    <h3>카드 도감 {PLAYABLE_CAST.filter(c => save.flags[`card:${c.id}`]).length}/11</h3>
    <p>감독실의 월드 카드 팝업에서 공개하면 기록됩니다. 11명을 공개한 뒤 우왁굳에게 보고하세요.</p>
    <p>{hiddenUnlocked ? "우왁굳 히든 카드가 해금됐어요! 카드 팝업에서 우왁굳을 선택하세요." : "기존 카드 공개 수집으로 우왁굳 히든 카드가 해금됩니다. 월드 미션은 월드 안에서 공개한 카드만 판정합니다."}</p>
    <ul className="world-repeat-grid">{PLAYABLE_CAST.map(c => <li key={c.id} className={save.flags[`card:${c.id}`] ? "is-earned" : "is-locked"}>{c.displayName} · {save.flags[`card:${c.id}`] ? "공개" : "미공개"}</li>)}</ul>
    <h3>뱃지</h3><ul className="world-repeat-grid">{Object.values(BADGES).map(b => <li key={b.id} className={save.flags[`badge:${b.id}`] ? "is-earned" : "is-locked"}>{b.label} · {save.flags[`badge:${b.id}`] ? "획득" : "미획득"}</li>)}</ul>
    <h3>획득한 게임 칭호</h3><p>{Object.keys(save.flags).filter(id => id.startsWith("title:")).map(id => { const [, game, rank] = id.split(":"); return `${MINIGAME_INFO[game as MinigameRoundResult["game"]]?.name ?? game} · ${rank}`; }).join(" / ") || "오락실에서 한 판 도전하세요."}</p>
  </RepeatPanel>;
}
