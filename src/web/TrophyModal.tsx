import { useEffect, useRef, type ReactNode } from "react";
import { Info, Trophy } from "lucide-react";
import { formatCafePostDate } from "../shared/dates.js";
import { DIVISION_ONE_EMOJI, type TrophyAwards } from "../shared/trophy.js";
import { HallOfFameSectionBackdrop } from "./hall-of-fame/HallOfFameSectionBackdrop.js";
import { HallOfFameWinnerGrid, type HallOfFameWinner } from "./hall-of-fame/HallOfFameWinnerGrid.js";
import "./hall-of-fame/hall-of-fame-card.css";
import { formatTimelineDate } from "./formatters";
import { Modal, useEscape } from "./Modal";
import { stopSfx } from "./sfxAudio.js";

// Plays once, softly, the instant the gallery opens — see
// TotyCardPopup.tsx's playPopupOpenSfx for the same one-off-Audio-instance
// convention. A missing file just 404s silently, same as everywhere else.
const OPEN_SFX_URL = "/sfxes/hall-of-fame-open.mp3";
function playOpenSfx(volume: number): HTMLAudioElement {
  const audio = new Audio(OPEN_SFX_URL);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

function TrophyHelp({ children }: { children: ReactNode }) {
  return (
    <span className="trophy-help">
      <button type="button" aria-label="계산 기준 보기">
        <Info aria-hidden="true" />
      </button>
      <span role="tooltip">{children}</span>
    </span>
  );
}

export function TrophyModal({
  awards,
  excludedNames = [],
  sfxEnabled,
  sfxVolume,
  onClose,
}: {
  awards: TrophyAwards;
  excludedNames?: string[];
  sfxEnabled: boolean;
  sfxVolume: number;
  onClose: () => void;
}) {
  const handleClose = () => {
    stopSfx();
    onClose();
  };
  useEscape(handleClose);

  // Tracks the one-off open chime so it can be cut short if the modal
  // closes while it's still playing — same pattern as TotyCardPopup.tsx.
  const openSfxRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    if (sfxEnabled) openSfxRef.current.push(playOpenSfx(sfxVolume / 100));
    return () => {
      for (const audio of openSfxRef.current) audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once on mount, not on every sfx setting change
  }, []);

  const divisionOneWinners: HallOfFameWinner[] = awards.divisionOne.map((award) => ({
    streamer: award.streamer,
    tier: award.rank,
    medal: DIVISION_ONE_EMOJI[award.rank],
    statLines: [
      { label: "달성", value: formatCafePostDate(award.reachedAt) },
      { label: "현재", value: `${award.streamer.currentDivision}부`, emphasis: true },
    ],
  }));

  const mostMatchesWinners: HallOfFameWinner[] = awards.mostMatches.map((award) => ({
    streamer: award.streamer,
    statLines: [
      { label: "총 경기", value: `${award.totalGames}경기`, emphasis: true },
      {
        label: "전적",
        value: `${award.streamer.record?.wins}승 ${award.streamer.record?.draws}무 ${award.streamer.record?.losses}패`,
      },
    ],
  }));

  const bestWinRateWinners: HallOfFameWinner[] = awards.bestWinRate.map((award) => ({
    streamer: award.streamer,
    statLines: [
      { label: "승률", value: `${award.winRate.toFixed(1)}%`, emphasis: true },
      {
        label: "전적",
        value: `${award.streamer.record?.wins}승 ${award.streamer.record?.draws}무 ${award.streamer.record?.losses}패`,
      },
    ],
  }));

  const dailyPromotionWinners: HallOfFameWinner[] = awards.dailyPromotion.map((award) => ({
    streamer: award.streamer,
    statLines: [
      { label: formatTimelineDate(award.dateKey), value: `${award.startDivision}부 → ${award.endDivision}부` },
      { label: "상승", value: `▲${award.steps}`, emphasis: true },
    ],
  }));

  const selfPromotionWinners: HallOfFameWinner[] = awards.selfPromotion.map((award) => ({
    streamer: award.streamer,
    statLines: [
      { label: "게시글", value: `${award.totalCount}개`, emphasis: true },
      { label: "스코프·11대11", value: `${award.scopeCount}·${award.elevenVsElevenCount}` },
    ],
  }));

  const hardWorkerWinners: HallOfFameWinner[] = awards.hardWorker.map((award) => ({
    streamer: award.streamer,
    statLines: [],
    // Not derived from any stat — a fixed flavor line for this fixed pick,
    // same spirit as trophy.ts's own hardcoded HARD_WORKER_ID.
    quote: "이게 천타버스야~",
  }));

  return (
    <Modal
      onClose={handleClose}
      label="업적"
      wide
      header={
        <div>
          <p className="eyebrow">HALL OF FAME</p>
          <h2 className="trophy-modal__title">
            <Trophy aria-hidden="true" /> 업적
          </h2>
          <p className="trophy-modal__intro">이제야 이쪽을 봐주는구나</p>
          {excludedNames.length > 0 && (
            <p className="trophy-modal__note">
              * {excludedNames.map((name) => name + "님").join(", ")}은
              제외됩니다.
            </p>
          )}
        </div>
      }
    >
      <div className="trophy-awards">
        <section className="trophy-award trophy-award--summit">
          <HallOfFameSectionBackdrop categoryKey="division-one" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🏆
            </span>
            <div>
              <h3>
                1부 리그 달성{" "}
                <TrophyHelp>
                  가장 먼저 1부 리그를 달성한 상위 스트리머 3명을 표시합니다.
                  1부 리거 달성 게시글이 게시된 순서를 기준으로 하며, 이후
                  디비전이 바뀌어도 최초 달성 기록은 유지됩니다.
                </TrophyHelp>
              </h3>
              <p>가장 먼저 1부 리그를 달성한 스트리머들</p>
            </div>
          </div>
          {divisionOneWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="division-one"
              winners={divisionOneWinners}
              sectionIndex={0}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">
              아직 1부 리그를 달성한 스트리머가 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--matches">
          <HallOfFameSectionBackdrop categoryKey="most-matches" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              ⚔️
            </span>
            <div>
              <h3>
                최다 경기 출전{" "}
                <TrophyHelp>
                  커리어 전적(승+무+패)을 합산해 가장 많은 경기를 치른
                  스트리머를 표시합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 많은 경기를 치른 스트리머</p>
            </div>
          </div>
          {mostMatchesWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="most-matches"
              winners={mostMatchesWinners}
              sectionIndex={1}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--winrate">
          <HallOfFameSectionBackdrop categoryKey="best-win-rate" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              👑
            </span>
            <div>
              <h3>
                최고 승률{" "}
                <TrophyHelp>
                  커리어 전적(승+무+패)이 1경기 이상인 스트리머 중 승률이 가장
                  높은 스트리머를 표시합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 높은 승률을 기록한 스트리머</p>
            </div>
          </div>
          {bestWinRateWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="best-win-rate"
              winners={bestWinRateWinners}
              sectionIndex={2}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--growth">
          <HallOfFameSectionBackdrop categoryKey="daily-promotion" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🚀
            </span>
            <div>
              <h3>
                하루 급성장{" "}
                <TrophyHelp>
                  전체 수집 기간에서 한국 시간 하루 동안 첫 승격글의 직전
                  부수부터 마지막 승격글까지 계산합니다. 중간 승격글이 없어도
                  최종 부수까지 반영하며, 한 건만 있어도 1단계로 계산합니다.
                </TrophyHelp>
              </h3>
              <p>하루에 가장 많이 올라간 역대 기록</p>
            </div>
          </div>
          {dailyPromotionWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="daily-promotion"
              winners={dailyPromotionWinners}
              sectionIndex={3}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">
              아직 기록된 승격 업적이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--promotion">
          <HallOfFameSectionBackdrop categoryKey="self-promotion" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              📣
            </span>
            <div>
              <h3>
                자기 PR 왕{" "}
                <TrophyHelp>
                  잔디동 스코프의 ‘내가 직접 홍보’ 글과 11대11 플레이 영상
                  게시글 수를 합산합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 활발하게 자신을 알린 주인공</p>
            </div>
          </div>
          {selfPromotionWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="self-promotion"
              winners={selfPromotionWinners}
              sectionIndex={4}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 자기 PR 게시글이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--hard-worker">
          <HallOfFameSectionBackdrop categoryKey="hard-worker" />
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🔥
            </span>
            <div>
              <h3>노력왕</h3>
              <p>제작자 선정 진짜 열심히 노력한 스트리머</p>
            </div>
          </div>
          {hardWorkerWinners.length ? (
            <HallOfFameWinnerGrid
              categoryKey="hard-worker"
              winners={hardWorkerWinners}
              sectionIndex={5}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
            />
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 노력왕이 없습니다.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
