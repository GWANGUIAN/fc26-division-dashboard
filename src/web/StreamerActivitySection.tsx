import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PromotionPost, StreamerActivityPost } from "../shared/model.js";
import { formatCafePostDate } from "../shared/dates.js";
import {
  buildPromotionTimeline,
  summarizePromotionTimeline,
} from "../shared/promotion-timeline.js";
import { formatDuration, formatTimelineDate, formatTimelineTime } from "./formatters";

export function StreamerActivitySection({
  title,
  posts,
}: {
  title: string;
  posts?: StreamerActivityPost[];
}) {
  return (
    <section className="streamer-activity">
      <div className="streamer-activity__heading">
        <span>{title}</span>
        <b>{posts?.length ?? 0}</b>
      </div>
      {posts?.length ? (
        <div className="streamer-activity__posts">
          {posts.map((post) => (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              key={`${post.board}:${post.articleId}`}
            >
              <strong>{post.title}</strong>
              <time>{formatCafePostDate(post.publishedAt)}</time>
            </a>
          ))}
        </div>
      ) : (
        <p>등록된 게시글 없음</p>
      )}
    </section>
  );
}

export function PromotionTimeline({ posts }: { posts: PromotionPost[] }) {
  const events = buildPromotionTimeline(posts);
  const summary = summarizePromotionTimeline(events);
  if (!summary) return null;
  const groups = events.reduce<{ dateKey: string; events: typeof events }[]>(
    (items, event) => {
      const group = items.at(-1);
      if (group?.dateKey === event.dateKey) group.events.push(event);
      else items.push({ dateKey: event.dateKey, events: [event] });
      return items;
    },
    [],
  );
  let index = 0;
  return (
    <section
      className="promotion-timeline"
      aria-labelledby="promotion-timeline-title"
    >
      <div className="promotion-timeline__heading">
        <div>
          <p className="eyebrow">PROMOTION JOURNEY</p>
          <h3 id="promotion-timeline-title">승급 여정</h3>
        </div>
      </div>
      <div className="promotion-timeline__stats" aria-label="승급 여정 요약">
        <span>
          <b>{summary.promotionCount}</b>회 실제 승급
        </span>
        {events.length > 1 ? (
          <span>
            <b>
              {summary.exactDurationMs !== undefined
                ? formatDuration(summary.exactDurationMs)
                : `${summary.calendarDays}일`}
            </b>{" "}
            {summary.exactDurationMs !== undefined ? "소요" : "확인된 기간"}
          </span>
        ) : (
          <span>첫 승급 보고</span>
        )}
      </div>
      <div className="promotion-timeline__track">
        <div className="promotion-timeline__rail">
          {groups.map((group) => (
            <div className="promotion-timeline__day" key={group.dateKey}>
              <p>{formatTimelineDate(group.dateKey)}</p>
              <div className="promotion-timeline__events">
                {group.events.map((event, eventIndex) => {
                  const previous = group.events[eventIndex - 1];
                  const interval =
                    previous?.precision === "time" && event.precision === "time"
                      ? Date.parse(event.post.publishedAt) -
                        Date.parse(previous.post.publishedAt)
                      : undefined;
                  const delay = index++ * 85;
                  return (
                    <div
                      className="promotion-timeline__event"
                      key={event.post.articleId}
                    >
                      {interval !== undefined && interval >= 0 && (
                        <span className="promotion-timeline__interval">
                          {formatDuration(interval)} 후
                        </span>
                      )}
                      <a
                        className="promotion-timeline__node"
                        href={event.post.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ animationDelay: `${delay}ms` }}
                        aria-label={`${event.post.division}부 승격 게시글 보기`}
                      >
                        <b>D{event.post.division}</b>
                        <span
                          className={`promotion-timeline__time ${event.precision === "time" ? "" : "promotion-timeline__time--placeholder"}`}
                          aria-hidden={event.precision !== "time"}
                        >
                          {event.precision === "time"
                            ? formatTimelineTime(event.post.publishedAt)
                            : "00:00"}
                        </span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="promotion-timeline__notice">
        일부 과거 게시글은 카페 제공 정보상 날짜만 표시됩니다.
      </p>
    </section>
  );
}

export function PreviousPromotionSection({ posts }: { posts?: PromotionPost[] }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!posts?.length) return null;
  return (
    <section className="streamer-activity promotion-history">
      <button
        className="streamer-activity__heading promotion-history__toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>이전 승격 게시글</span>
        <span className="promotion-history__meta">
          <b>{posts.length}</b>
          <span className="promotion-history__icon" aria-hidden="true">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </span>
        </span>
      </button>
      {isOpen && (
        <div className="streamer-activity__posts">
          {posts.map((post) => (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              key={post.articleId}
            >
              <span className="promotion-history__category">
                {post.category}
              </span>
              <strong>{post.title}</strong>
              <time>{formatCafePostDate(post.publishedAt)}</time>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
