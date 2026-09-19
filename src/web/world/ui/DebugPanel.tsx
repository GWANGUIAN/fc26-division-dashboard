import { useState, type KeyboardEvent } from "react";
import { allSceneIds } from "../data/maps";
import { MISSION_DEFS, missionDefsFor } from "../data/missionDefs";
import type { DebugPick, WorldEngine } from "../engine/world";
import { debugCompleteAll, debugResetProgress, debugSetFlag, debugSetMission, debugSetShards, debugSkipTutorial } from "../state/debugTools";
import { missionStatusById } from "../state/missions";
import type { MissionStatus, SceneId, WorldSave } from "../types";

interface DebugPanelProps {
  engine: WorldEngine | null;
  /** Scene the player is in right now. */
  scene: SceneId;
  /** Last canvas click, in world pixels/tiles. */
  pick: DebugPick | null;
  /** The save being played (null before the world starts). */
  save: WorldSave | null;
  /** Replaces the save through the overlay (it persists and refreshes HUD/markers). */
  onSave: (update: (save: WorldSave) => WorldSave) => void;
}

/** Typing in the tile boxes owns the keyboard (the world ignores WASD in fields); Enter hands it back. */
const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") event.currentTarget.blur();
};

const STATUS_CHOICES: { value: MissionStatus; label: string }[] = [
  { value: "available", label: "초기화(받기 전)" },
  { value: "active", label: "진행 중" },
  { value: "ready", label: "보고 가능(!)" },
  { value: "completed", label: "완료(보상 지급)" },
];

/**
 * `?worldDebug` control panel (real, unscaled DOM next to the stage): jump between the overworld and the
 * 19 interiors, place the player on a tile, preview the colour restoration, walk through walls, read the
 * coordinates of a canvas click so map JSON can be corrected by hand (docs/world/08 §0 #4) — and, from S3,
 * set shards, flags and mission states to check every mission without playing through the story.
 */
export function DebugPanel({ engine, scene, pick, save, onSave }: DebugPanelProps) {
  const [target, setTarget] = useState<SceneId>("overworld");
  const [tx, setTx] = useState("");
  const [ty, setTy] = useState("");
  const [restoreOn, setRestoreOn] = useState(false);
  const [restore, setRestore] = useState(0);
  const [noclip, setNoclip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flagName, setFlagName] = useState("");
  const [missionId, setMissionId] = useState<string>(MISSION_DEFS[0].id);
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("active");

  const scenes = allSceneIds();
  const tile = tx.trim() !== "" && ty.trim() !== "" && Number.isFinite(Number(tx)) && Number.isFinite(Number(ty)) ? ([Math.floor(Number(tx)), Math.floor(Number(ty))] as [number, number]) : undefined;

  function copyPick() {
    if (!pick) return;
    void navigator.clipboard?.writeText(`[${pick.tx}, ${pick.ty}]`).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }, () => {});
  }

  const enabled = save ? missionDefsFor(save.player) : [];
  const flags = save ? Object.keys(save.flags).filter((key) => key !== "prologue-done") : [];

  return (
    <aside className="world-debug" aria-label="월드 디버그">
      <strong className="world-debug__title">worldDebug</strong>
      <div className="world-debug__row">현재 씬 <code>{scene}</code></div>

      <label className="world-debug__row">
        씬
        <select
          value={target}
          onChange={(event) => {
            setTarget(event.target.value as SceneId);
            event.target.blur();
          }}
        >
          {scenes.map((id) => (
            <option key={id} value={id}>{id === "overworld" ? "overworld (오버월드)" : id.replace("interior:", "실내 · ")}</option>
          ))}
        </select>
      </label>
      <div className="world-debug__row">
        타일
        <input inputMode="numeric" placeholder="x" value={tx} onChange={(event) => setTx(event.target.value)} onKeyDown={blurOnEnter} />
        <input inputMode="numeric" placeholder="y" value={ty} onChange={(event) => setTy(event.target.value)} onKeyDown={blurOnEnter} />
      </div>
      <button type="button" onClick={() => engine?.teleport(target, tile)}>이동 (타일 비우면 기본 위치)</button>

      <label className="world-debug__row">
        <input type="checkbox" checked={restoreOn} onChange={(event) => {
          setRestoreOn(event.target.checked);
          engine?.setRestoreOverride(event.target.checked ? restore / 100 : null);
          event.target.blur();
        }} />
        색 복원 미리보기 {restoreOn ? `${restore}%` : "(저장값)"}
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={restore}
        disabled={!restoreOn}
        onChange={(event) => {
          const value = Number(event.target.value);
          setRestore(value);
          engine?.setRestoreOverride(value / 100);
        }}
        onPointerUp={(event) => event.currentTarget.blur()}
      />

      <label className="world-debug__row">
        <input type="checkbox" checked={noclip} onChange={(event) => {
          setNoclip(event.target.checked);
          engine?.setNoclip(event.target.checked);
          event.target.blur();
        }} />
        벽 통과 (noclip)
      </label>

      {save && (
        <section className="world-debug__section" aria-label="미션·진행 도구">
          <strong>미션·진행</strong>
          <div className="world-debug__row">
            잔디 조각
            <button type="button" onClick={() => onSave((s) => debugSetShards(s, s.shards - 1))}>−</button>
            <code>{save.shards}/10</code>
            <button type="button" onClick={() => onSave((s) => debugSetShards(s, s.shards + 1))}>＋</button>
          </div>
          <div className="world-debug__row">
            <button type="button" onClick={() => onSave(debugSkipTutorial)}>튜토리얼 건너뛰기</button>
            <button type="button" onClick={() => onSave(debugCompleteAll)}>메인 전부 완료</button>
          </div>
          <div className="world-debug__row">
            <button
              type="button"
              onClick={() => {
                engine?.cancelRuns();
                onSave(debugResetProgress);
              }}
            >
              진행 초기화
            </button>
            <button type="button" onClick={() => engine?.cancelRuns()}>타이머 취소</button>
            <button type="button" onClick={() => engine?.resetBall()}>공 리셋</button>
          </div>

          <label className="world-debug__row">
            미션
            <select value={missionId} onChange={(event) => { setMissionId(event.target.value); event.target.blur(); }}>
              {MISSION_DEFS.map((def) => (
                <option key={def.id} value={def.id}>{def.id}{def.giver === save.player ? " (본인 · 제외)" : ""}</option>
              ))}
            </select>
          </label>
          <div className="world-debug__row">
            <select value={missionStatus} onChange={(event) => { setMissionStatus(event.target.value as MissionStatus); event.target.blur(); }}>
              {STATUS_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => onSave((s) => debugSetMission(s, missionId, missionStatus))}>적용</button>
          </div>

          <div className="world-debug__row">
            플래그
            <input placeholder="main-open" value={flagName} onChange={(event) => setFlagName(event.target.value)} onKeyDown={blurOnEnter} />
          </div>
          <div className="world-debug__row">
            <button type="button" onClick={() => onSave((s) => debugSetFlag(s, flagName, true))}>설정</button>
            <button type="button" onClick={() => onSave((s) => debugSetFlag(s, flagName, false))}>해제</button>
          </div>
          <div className="world-debug__note">플래그: {flags.length > 0 ? flags.join(", ") : "없음"}</div>
          <div className="world-debug__note">수집: {save.collected.length > 0 ? save.collected.join(", ") : "없음"}</div>

          <ul className="world-debug__missions">
            {enabled.map((def) => {
              const status = missionStatusById(save, def.id);
              return (
                <li key={def.id} className={`is-${status}`}>
                  <span>{def.id}</span>
                  <em>{status}</em>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="world-debug__pick">
        {pick ? (
          <>
            <div>클릭: <code>{pick.scene}</code></div>
            <div>px <code>{pick.x}, {pick.y}</code></div>
            <div>tile <code>[{pick.tx}, {pick.ty}]</code></div>
            <button type="button" onClick={copyPick}>{copied ? "복사됨" : "타일 좌표 복사"}</button>
          </>
        ) : (
          <div>화면을 클릭하면 좌표가 나와요.</div>
        )}
      </div>
    </aside>
  );
}
