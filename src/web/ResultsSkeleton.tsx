const SKELETON_DIVISIONS = [1, 2, 3, 4] as const;
const SKELETON_CARDS_PER_DIVISION = 3;
const SKELETON_TABLE_ROWS = 8;
const SKELETON_BOARD_CARDS = 12;

function StreamerCardSkeleton() {
  return (
    <div className="streamer-card streamer-card--skeleton" aria-hidden="true">
      <span className="streamer-card__avatar skeleton-circle skeleton-shimmer" />
      <span className="streamer-card__copy">
        <span className="skeleton-bar skeleton-bar--name skeleton-shimmer" />
        <span className="skeleton-bar skeleton-bar--record skeleton-shimmer" />
        <span className="skeleton-bar skeleton-bar--date skeleton-shimmer" />
      </span>
      <span className="skeleton-bar skeleton-bar--rank skeleton-shimmer" />
    </div>
  );
}

export function ListResultsSkeleton() {
  return (
    <section className="board board--skeleton" aria-label="목록 불러오는 중">
      {SKELETON_DIVISIONS.map((division) => (
        <section className="division division--skeleton" key={division}>
          <div className="division__label">
            <span className="skeleton-bar skeleton-bar--label skeleton-shimmer" />
            <strong className="skeleton-bar skeleton-bar--number skeleton-shimmer" />
          </div>
          <div className="division__players">
            {Array.from({ length: SKELETON_CARDS_PER_DIVISION }).map(
              (_, index) => (
                <StreamerCardSkeleton key={index} />
              ),
            )}
          </div>
        </section>
      ))}
    </section>
  );
}

export function TableResultsSkeleton() {
  return (
    <div className="streamer-table-wrap">
      <table
        className="streamer-table streamer-table--skeleton"
        aria-label="표 불러오는 중"
      >
        <thead>
          <tr>
            <th className="streamer-table__th streamer-table__th--rank">#</th>
            <th className="streamer-table__th">이름</th>
            <th className="streamer-table__th streamer-table__th--division">
              디비전
            </th>
            <th className="streamer-table__th streamer-table__th--record">
              전적
            </th>
            <th className="streamer-table__th streamer-table__th--games streamer-table__th--num">
              경기수
            </th>
            <th className="streamer-table__th streamer-table__th--winRate streamer-table__th--num">
              승률
            </th>
            <th className="streamer-table__th streamer-table__th--lastPromotion">
              최근 승급일
            </th>
          </tr>
        </thead>
        <tbody aria-hidden="true">
          {Array.from({ length: SKELETON_TABLE_ROWS }).map((_, index) => (
            <tr className="streamer-table__row" key={index}>
              <td className="streamer-table__rank">
                <span className="skeleton-bar skeleton-shimmer" />
              </td>
              <td className="streamer-table__identity">
                <span className="streamer-table__avatar skeleton-circle skeleton-shimmer" />
                <span className="skeleton-bar skeleton-bar--name skeleton-shimmer" />
              </td>
              <td>
                <span className="skeleton-bar skeleton-shimmer" />
              </td>
              <td>
                <span className="skeleton-bar skeleton-shimmer" />
              </td>
              <td className="streamer-table__num">
                <span className="skeleton-bar skeleton-bar--num skeleton-shimmer" />
              </td>
              <td className="streamer-table__num">
                <span className="skeleton-bar skeleton-bar--num skeleton-shimmer" />
              </td>
              <td className="streamer-table__date">
                <span className="skeleton-bar skeleton-shimmer" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardResultsSkeleton({ zoom }: { zoom: number }) {
  return (
    <div className="card-board-wrap">
      <section
        className={`card-board card-board--zoom-${zoom} card-board--skeleton`}
        aria-label="카드 불러오는 중"
      >
        {Array.from({ length: SKELETON_BOARD_CARDS }).map((_, index) => (
          <div
            className="fifa-card fifa-card--skeleton skeleton-shimmer"
            aria-hidden="true"
            key={index}
          />
        ))}
      </section>
    </div>
  );
}
