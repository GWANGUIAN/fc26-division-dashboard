import { Music4, Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../../Modal.js";
import { SoundControl } from "../SoundControl.js";
import { MinigameStage } from "../ranking/MinigameStage.js";
import { RankingPanel } from "../ranking/RankingPanel.js";
import { useRanking } from "../ranking/useRanking.js";
import { loadGrassMergeHighScore } from "../../storage.js";
import { GrassMergeCanvas } from "./GrassMergeCanvas.js";
import { grassMergeAssetUrls } from "./grassMergeAssets.js";
import { TIERS } from "./grassMergeEngine.js";
import { useGrassMergeGame, type GrassMergeRoundResult } from "./useGrassMergeGame.js";
import { useGrassMergeMusic } from "./useGrassMergeMusic.js";
import { useGrassMergeSfx } from "./useGrassMergeSfx.js";
import "./grass-merge.css";

export function GrassMergeModal({ onClose, onRoundEnd }: { onClose: () => void; onRoundEnd?: (result: GrassMergeRoundResult) => void }) {
  useEscape(onClose);
  const { sfxOn, sfxVolume, toggleSfx, changeSfxVolume } = useGrassMergeSfx();
  const { musicOn, musicVolume, toggleMusic, changeMusicVolume, startMusic, stopMusic } = useGrassMergeMusic();
  const ranking = useRanking("grass-merge", () => loadGrassMergeHighScore() || null);
  const { state, startGame, aim, release, advance } = useGrassMergeGame({ sfxOn, sfxVolume, onRoundEnd: (result) => { stopMusic(); onRoundEnd?.(result); ranking.report(result.score); } });
  const startRound = () => { startGame(); startMusic(); };
  const next = TIERS[state.engine.nextTier - 1];
  return (
    <Modal wide onClose={onClose} label="잔디 머지" header={<div><p className="eyebrow">MINIGAME</p><h2 className="grass-merge__title"><span className="grass-merge__title-icon"><img src={grassMergeAssetUrls.icon} alt="" /></span> 잔디 머지</h2><p className="grass-merge__intro">같은 잔디 아이템을 합쳐 황금 왕관 잔디구까지 진화시키세요.</p></div>}>
      <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
      <div className="grass-merge-meta">
        <div className="grass-merge-hud"><span className="grass-merge-badge">점수 {state.engine.score}</span><span className="grass-merge-badge">최고 {state.highScore}</span><span className="grass-merge-next">다음 <i style={{ backgroundColor: next.color }}>{state.engine.nextTier}</i></span></div>
        <SoundControl enabled={musicOn} volume={musicVolume} onToggle={toggleMusic} onVolumeChange={changeMusicVolume} icon={<Music4 aria-hidden="true" />} label="배경음악" wrapperClassName={`grass-merge-icon-toggle ${musicOn ? "" : "grass-merge-icon-toggle--muted"}`} />
        <SoundControl enabled={sfxOn} volume={sfxVolume} onToggle={toggleSfx} onVolumeChange={changeSfxVolume} icon={sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} label="효과음" wrapperClassName={`grass-merge-icon-toggle ${sfxOn ? "" : "grass-merge-icon-toggle--muted"}`} />
      </div>
      <div className="grass-merge-play-area">
        <div className="grass-merge-board-wrap">{state.phase !== "ready" && <GrassMergeCanvas key={state.roundId} engine={state.engine} phase={state.phase} onAim={aim} onDrop={release} onAdvance={advance} />}
          {state.phase === "ready" && <div className="grass-merge-start-panel"><span className="grass-merge-start-panel__orb">1</span><strong>씨앗부터 키워 보세요!</strong><span>클릭 또는 Space로 떨어뜨리고, 같은 단계끼리 합치세요.</span><button type="button" className="grass-merge-start" onClick={startRound}>게임 시작</button></div>}
          {state.phase === "over" && <div className="grass-merge-result" role="status"><strong>경기 종료!</strong><span>{state.engine.score}점 획득 {state.engine.score === state.highScore && state.engine.score > 0 ? "· 최고 기록!" : ""}</span><button type="button" className="grass-merge-start" onClick={startRound}>다시 시작</button></div>}
        </div>
        <aside className="grass-merge-evolution" aria-label="진화 순서표"><strong>진화 순서</strong><ol>{TIERS.map((tier) => <li key={tier.tier}><span style={{ backgroundColor: tier.color }}>{tier.tier}</span><small>{tier.name}</small></li>)}</ol></aside>
      </div>
      </MinigameStage>
    </Modal>
  );
}

export default GrassMergeModal;
