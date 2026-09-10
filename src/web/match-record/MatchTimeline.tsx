import type { MatchGame, MatchGoalEvent } from "./types";

function TimelineEntry({ event }: { event: MatchGoalEvent }) {
  return (
    <>
      <span className="match-timeline__scorer">
        {event.scorerName}
        {event.isPenalty && <span className="match-timeline__tag match-timeline__tag--pk">PK</span>}
        {event.isOwnGoal && <span className="match-timeline__tag match-timeline__tag--og">자책골</span>}
      </span>
      {event.assistName && (
        <span className="match-timeline__assist">
          <span aria-hidden="true">🅰️</span>
          {event.assistName}
        </span>
      )}
    </>
  );
}

/**
 * Vertical goal timeline for one match — jandy events on the left, opponent
 * events on the right, each with a ball marker in the middle. When the event
 * carries a `seconds` timestamp and the game has a videoUrl, the whole row
 * opens that moment in a new tab via `?change_second=`, the same deep-link
 * convention JandyVideoSection's chapter cards use.
 */
export function MatchTimeline({ game }: { game: MatchGame }) {
  if (game.timeline.length === 0) return null;
  return (
    <ol className="match-timeline">
      {game.timeline.map((event) => {
        const href =
          event.seconds != null && game.videoUrl
            ? `${game.videoUrl}?change_second=${event.seconds}`
            : undefined;
        const rowClass = `match-timeline__row match-timeline__row--${event.team}`;
        const rowContent = (
          <>
            <span className="match-timeline__side match-timeline__side--jandy">
              {event.team === "jandy" && <TimelineEntry event={event} />}
            </span>
            <span className="match-timeline__marker">
              <img src="/soccer_ball.webp" alt="" aria-hidden="true" />
              {event.minuteLabel && (
                <span className="match-timeline__time">{event.minuteLabel}′</span>
              )}
            </span>
            <span className="match-timeline__side match-timeline__side--opponent">
              {event.team === "opponent" && <TimelineEntry event={event} />}
            </span>
          </>
        );
        return (
          <li className={rowClass} key={event.id}>
            {href ? (
              <a
                className="match-timeline__link"
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${event.scorerName} 골 장면 새 탭에서 보기`}
              >
                {rowContent}
              </a>
            ) : (
              <div className="match-timeline__link match-timeline__link--static">{rowContent}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
