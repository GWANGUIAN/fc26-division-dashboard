import { Music4, Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../../Modal.js";
import { SoundControl } from "../SoundControl.js";
import { MinigameStage } from "../ranking/MinigameStage.js";
import { RankingPanel } from "../ranking/RankingPanel.js";
import { useRanking } from "../ranking/useRanking.js";
import { loadFootballMatch3HighScore } from "../../storage.js";
import { FootballMatch3Canvas } from "./FootballMatch3Canvas.js";
import { useFootballMatch3Game, type FootballMatch3RoundResult } from "./useFootballMatch3Game.js";
import { useFootballMatch3Music } from "./useFootballMatch3Music.js";
import { useFootballMatch3Sfx } from "./useFootballMatch3Sfx.js";
import "./football-match3.css";

export default function FootballMatch3Modal({ onClose, onRoundEnd }: { onClose: () => void; onRoundEnd?: (result: FootballMatch3RoundResult) => void }) {
  useEscape(onClose);
  const sfx = useFootballMatch3Sfx();
  const music = useFootballMatch3Music();
  const ranking = useRanking("football-match3", () => loadFootballMatch3HighScore() || null);
  const game = useFootballMatch3Game({ sfxOn: sfx.sfxOn, sfxVolume: sfx.sfxVolume, onRoundEnd: (result) => { music.stopMusic(); onRoundEnd?.(result); ranking.report(result.score); } });
  const start = () => { game.startRound(); music.startMusic(); };
  const stars = game.state.engine.score >= 5000 ? 3 : game.state.engine.score >= 3000 ? 2 : game.state.engine.score >= 1500 ? 1 : 0;
  return <Modal onClose={onClose} label="축구 매치3" wide header={<div><p className="eyebrow">MINIGAME</p><h2 className="football-match3__title"><span aria-hidden="true">⚽</span> 축구 매치3</h2><p className="football-match3__intro">인접한 축구 용품을 바꿔 3개 이상 연결하세요. 30턴 안에 연쇄를 이어 가세요.</p></div>}>
    <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
      <div className="football-match3-meta"><div className="football-match3-hud"><span className="football-match3-badge">남은 턴 {game.state.engine.movesLeft}</span><span className="football-match3-badge football-match3-badge--score">점수 {game.state.engine.score}</span><span className="football-match3-badge">최고 {game.state.highScore}</span>{game.state.steps.length >= 2 && <span className="football-match3-badge football-match3-badge--chain">연쇄 ×{game.state.steps.length}</span>}</div><SoundControl enabled={music.musicOn} volume={music.musicVolume} onToggle={music.toggleMusic} onVolumeChange={music.changeMusicVolume} icon={<Music4 aria-hidden="true" />} label="배경음악" wrapperClassName="football-match3-icon-toggle"/><SoundControl enabled={sfx.sfxOn} volume={sfx.sfxVolume} onToggle={sfx.toggleSfx} onVolumeChange={sfx.changeSfxVolume} icon={sfx.sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} label="효과음" wrapperClassName="football-match3-icon-toggle"/></div>
      <div className="football-match3-play-area">
        {game.state.phase !== "ready" && <FootballMatch3Canvas key={game.state.roundId} engine={game.state.engine} animationBoard={game.state.animationBoard} steps={game.state.steps} invalidSwap={game.state.invalidSwap} disabled={game.state.animating || game.state.phase !== "playing"} onTryMove={game.tryMove} onClearStep={game.playClearStep} onAnimationEnd={game.finishAnimation}/>} 
        {game.state.phase === "ready" && <div className="football-match3-start-panel"><strong>킥오프!</strong><span>타일을 클릭해 이웃과 교환하거나, 방향키와 Space로 조작하세요.</span><button type="button" className="football-match3-start" onClick={start}>게임 시작</button></div>}
        {game.state.phase === "over" && <div className="football-match3-result" role="status"><strong>경기 종료!</strong><span className="football-match3-stars" aria-label={`별 ${stars}개`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span><span>{game.state.engine.score}점 획득 {game.state.engine.score === game.state.highScore && game.state.engine.score > 0 ? "· 최고 기록!" : ""}</span><button type="button" className="football-match3-start" onClick={start}>다시 시작</button></div>}
      </div>
    </MinigameStage>
  </Modal>;
}
