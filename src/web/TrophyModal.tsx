import type { ReactNode } from "react";
import { Info, Trophy } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { formatCafePostDate } from "../shared/dates.js";
import { DIVISION_ONE_EMOJI, type TrophyAwards } from "../shared/trophy.js";
import { Avatar } from "./cardVisuals";
import { formatTimelineDate } from "./formatters";
import { Modal, useEscape } from "./Modal";

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

function TrophyWinner({
  streamer,
  medal,
}: {
  streamer: StreamerRecord;
  medal?: string;
}) {
  return (
    <div className="trophy-winner">
      {medal && (
        <span className="trophy-winner__medal" aria-hidden="true">
          {medal}
        </span>
      )}
      <Avatar {...streamer} />
      <div>
        <strong>{streamer.displayName}</strong>
      </div>
    </div>
  );
}

export function TrophyModal({
  awards,
  onClose,
}: {
  awards: TrophyAwards;
  onClose: () => void;
}) {
  useEscape(onClose);
  return (
    <Modal
      onClose={onClose}
      label="업적"
      header={
        <div>
          <p className="eyebrow">HALL OF FAME</p>
          <h2 className="trophy-modal__title">
            <Trophy aria-hidden="true" /> 업적
          </h2>
          <p className="trophy-modal__intro">이제야 이쪽을 봐주는구나</p>
        </div>
      }
    >
      <div className="trophy-awards">
        <section className="trophy-award trophy-award--summit">
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
          {awards.divisionOne.length ? (
            <div className="trophy-award__winners">
              {awards.divisionOne.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner
                    streamer={award.streamer}
                    medal={DIVISION_ONE_EMOJI[award.rank]}
                  />
                  <div className="trophy-record__metric">
                    <span>{formatCafePostDate(award.reachedAt)} 달성</span>
                    <strong>현재 {award.streamer.currentDivision}부</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 1부 리그를 달성한 스트리머가 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--matches">
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
          {awards.mostMatches.length ? (
            <div className="trophy-award__winners">
              {awards.mostMatches.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>총 {award.totalGames}경기</strong>
                    <span>
                      {award.streamer.record?.wins}승{" "}
                      {award.streamer.record?.draws}무{" "}
                      {award.streamer.record?.losses}패
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--winrate">
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
          {awards.bestWinRate.length ? (
            <div className="trophy-award__winners">
              {awards.bestWinRate.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>승률 {award.winRate.toFixed(1)}%</strong>
                    <span>
                      {award.streamer.record?.wins}승{" "}
                      {award.streamer.record?.draws}무{" "}
                      {award.streamer.record?.losses}패
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--growth">
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
          {awards.dailyPromotion.length ? (
            <div className="trophy-award__winners">
              {awards.dailyPromotion.map((award) => (
                <article
                  className="trophy-record"
                  key={`${award.streamer.id}-${award.dateKey}`}
                >
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <span>{formatTimelineDate(award.dateKey)}</span>
                    <strong>
                      {award.startDivision}부 → {award.endDivision}부
                    </strong>
                    <b>▲ {award.steps}</b>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 기록된 승격 업적이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--promotion">
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
          {awards.selfPromotion.length ? (
            <div className="trophy-award__winners">
              {awards.selfPromotion.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>총 {award.totalCount}개 게시글</strong>
                    <span>
                      스코프 {award.scopeCount} · 11대11{" "}
                      {award.elevenVsElevenCount}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 자기 PR 게시글이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--retention">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🛏️
            </span>
            <div>
              <h3>
                잔류왕{" "}
                <TrophyHelp>
                  9부 이상으로 승격한 적이 있는 스트리머 중, 현재 디비전에 가장
                  오랫동안 머무른 스트리머를 표시합니다. 1부 리그는 제외되며,
                  마지막으로 디비전이 바뀐 시점부터 오늘까지 지난 일수를
                  기준으로 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>현재 디비전에 가장 오래 머문 스트리머</p>
            </div>
          </div>
          {awards.retention.length ? (
            <div className="trophy-award__winners">
              {awards.retention.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>{award.days}일째 잔류 중</strong>
                    <span>
                      현재 {award.currentDivision}부 ·{" "}
                      {formatCafePostDate(award.since)}부터
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 잔류 기록이 없습니다.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
