import type { PromotionPost } from "../shared/model.js";
import { formatCafePostDate } from "../shared/dates.js";

export function LatestFeedDrawer({
  open,
  onClose,
  posts,
}: {
  open: boolean;
  onClose: () => void;
  posts: PromotionPost[];
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="feed"
        role="dialog"
        aria-modal="true"
        aria-label="최신 소식"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <p className="eyebrow">LAST 24 HOURS</p>
        <h2>최신 소식</h2>
        {posts.length ? (
          posts.slice(0, 25).map((post) => (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              key={post.articleId}
            >
              <span>{post.category}</span>
              <strong>{post.title}</strong>
              <small>
                {post.cafeAuthor} · {formatCafePostDate(post.publishedAt)}
              </small>
            </a>
          ))
        ) : (
          <p className="empty-list">
            최근 24시간 내 등록된 디비전 보고가 없습니다.
          </p>
        )}
      </aside>
    </div>
  );
}
