import { useState, type KeyboardEvent } from "react";
import { allSceneIds } from "../data/maps";
import type { DebugPick, WorldEngine } from "../engine/world";
import type { SceneId } from "../types";

interface DebugPanelProps {
  engine: WorldEngine | null;
  /** Scene the player is in right now. */
  scene: SceneId;
  /** Last canvas click, in world pixels/tiles. */
  pick: DebugPick | null;
}

/** Typing in the tile boxes owns the keyboard (the world ignores WASD in fields); Enter hands it back. */
const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") event.currentTarget.blur();
};

/**
 * `?worldDebug` control panel (real, unscaled DOM next to the stage): jump between the overworld and the
 * 19 interiors, place the player on a tile, preview the colour restoration, walk through walls, and read
 * the coordinates of a canvas click so map JSON can be corrected by hand (docs/world/08 §0 #4).
 */
export function DebugPanel({ engine, scene, pick }: DebugPanelProps) {
  const [target, setTarget] = useState<SceneId>("overworld");
  const [tx, setTx] = useState("");
  const [ty, setTy] = useState("");
  const [restoreOn, setRestoreOn] = useState(false);
  const [restore, setRestore] = useState(0);
  const [noclip, setNoclip] = useState(false);
  const [copied, setCopied] = useState(false);

  const scenes = allSceneIds();
  const tile = tx.trim() !== "" && ty.trim() !== "" && Number.isFinite(Number(tx)) && Number.isFinite(Number(ty)) ? ([Math.floor(Number(tx)), Math.floor(Number(ty))] as [number, number]) : undefined;

  function copyPick() {
    if (!pick) return;
    void navigator.clipboard?.writeText(`[${pick.tx}, ${pick.ty}]`).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }, () => {});
  }

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
