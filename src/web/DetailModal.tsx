import { useState } from "react";
import { Volume2 } from "lucide-react";
import type { PromotionPost, StreamerRecord } from "../shared/model.js";
import { soopChannelUrl } from "../shared/model.js";
import { normalizeCafeAlias } from "../shared/promotion.js";
import { formatCafePostDate } from "../shared/dates.js";
import { divisionColor } from "../shared/division-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
import {
  AchievementBadges,
  fancyTierOf,
  FancyAvatar,
  FancyName,
  mixHex,
  RecordBadge,
} from "./cardVisuals";
import { GeminiReviewSection } from "./GeminiReviewSection";
import { CafeLink, FancyBurst, Modal, SoopLink, useEscape } from "./Modal";
import { playSfx } from "./sfxAudio";
import {
  PreviousPromotionSection,
  PromotionTimeline,
  StreamerActivitySection,
} from "./StreamerActivitySection";

export function DetailModal({
  streamer,
  awards,
  isLive,
  onClose,
  onOpenTrophy,
  latestPosts = [],
  sfxVolume,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  isLive?: boolean;
  onClose: () => void;
  onOpenTrophy?: () => void;
  latestPosts?: PromotionPost[];
  sfxVolume: number;
}) {
  // Combine promotionHistory with latestPosts to ensure we have all posts
  const historyPostIds = new Set(
    (streamer.promotionHistory ?? []).map((p) => p.articleId),
  );
  const normalizedAliases = new Set(
    streamer.cafeAliases.map(normalizeCafeAlias),
  );
  const allPosts = [
    ...(streamer.promotionHistory ?? []),
    ...latestPosts.filter(
      (p) =>
        normalizedAliases.has(normalizeCafeAlias(p.cafeAuthor)) &&
        !historyPostIds.has(p.articleId),
    ),
  ];
  // Find current division post from allPosts
  const currentPost = allPosts.find(
    (p) => p.division === streamer.currentDivision,
  );
  // An operator override is pinning the division (roster.yaml override.policy !== "auto") and no collected
  // post actually reports that division yet — every known post is for a different (often stale) division.
  const manualOverrideNotice =
    !currentPost &&
    streamer.overridePolicy !== "auto" &&
    streamer.overrideDivision === streamer.currentDivision;
  const post =
    currentPost ??
    (manualOverrideNotice
      ? undefined
      : allPosts.length
        ? allPosts[allPosts.length - 1]
        : undefined);
  const promotionHistory = allPosts;
  const channel = soopChannelUrl(streamer.soopId);
  const [expandedImage, setExpandedImage] = useState<string>();
  useEscape(() => (expandedImage ? setExpandedImage(undefined) : onClose()));
  const fancyTier = fancyTierOf(streamer);
  const fancyLite = fancyTier === "lite";
  const fancyModalColor = fancyLite
    ? mixHex("#00e9ae", "white", 0.65)
    : "#00e9ae";
  return (
    <Modal
      onClose={onClose}
      label="디비전 상세"
      decoration={
        fancyTier !== "none" ? <FancyBurst tier={fancyTier} /> : undefined
      }
      fancyBorderColor={fancyTier !== "none" ? fancyModalColor : undefined}
      fancyLite={fancyLite}
      header={
        <div className="modal__identity">
          <span className="modal__avatar-wrap">
            <FancyAvatar streamer={streamer} />
            {isLive && (
              <span
                className="live-ring"
                role="img"
                aria-label={`${streamer.displayName} 방송중`}
                title="현재 방송중"
              />
            )}
          </span>
          <div>
            <span className="eyebrow">CURRENT DIVISION</span>
            <h2>
              <FancyName streamer={streamer}>{streamer.displayName}</FancyName>{" "}
              <b
                style={
                  {
                    "--division-color": divisionColor(streamer.currentDivision),
                  } as React.CSSProperties
                }
              >
                {streamer.currentDivision}부
              </b>{" "}
              <AchievementBadges
                streamer={streamer}
                awards={awards}
                onClick={onOpenTrophy}
              />
            </h2>
            <span className="modal__record-row">
              <RecordBadge streamer={streamer} className="record-badge--lg" />
              {streamer.sfx && (
                <button
                  type="button"
                  className="modal__sfx-play"
                  onClick={() => playSfx(streamer.sfx!, sfxVolume / 100)}
                  aria-label={`${streamer.displayName} 효과음 재생`}
                >
                  <Volume2 aria-hidden="true" />
                </button>
              )}
            </span>
            {!streamer.isMapped && <p>카페 작성자 · SOOP 정보 미연결</p>}
          </div>
        </div>
      }
    >
      <GeminiReviewSection review={streamer.latestReview} hasPost={!!post} />
      {post ? (
        <>
          <div className="report">
            <span>{post.category}</span>
            <h3>{post.title}</h3>
            <time>{formatCafePostDate(post.publishedAt)}</time>
          </div>
          {post.imageUrls.length > 0 && (
            <div className="gallery">
              {post.imageUrls.map((url, index) => (
                <button
                  className="gallery__image"
                  type="button"
                  onClick={() => setExpandedImage(url)}
                  aria-label={`${streamer.displayName} 게시글 이미지 확대`}
                  key={url}
                >
                  <img
                    src={url}
                    alt={`${streamer.displayName} 게시글 이미지`}
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
          <PromotionTimeline posts={promotionHistory} />
        </>
      ) : manualOverrideNotice ? (
        <p className="empty-detail">
          카페에 {streamer.currentDivision}부 승격 게시글이 아직 올라오지 않아
          운영자가 수동으로 업데이트한 디비전입니다.
        </p>
      ) : (
        <p className="empty-detail">
          아직 확인된 디비전 보고 게시글이 없습니다.
        </p>
      )}
      <PreviousPromotionSection posts={streamer.previousPromotionPosts} />
      <StreamerActivitySection
        title="잔디동 스코프 [내가 직접 홍보]"
        posts={streamer.scopePosts}
      />
      <StreamerActivitySection
        title="11대 11 플레이 영상"
        posts={streamer.elevenVsElevenPosts}
      />
      <div className="actions">
        {post && <CafeLink href={post.articleUrl} />}
        {channel && <SoopLink href={channel}>SOOP 방송국 ↗</SoopLink>}
      </div>
      {expandedImage && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="게시글 이미지 확대"
          onMouseDown={() => setExpandedImage(undefined)}
        >
          <button
            className="close"
            type="button"
            onClick={() => setExpandedImage(undefined)}
            aria-label="확대 이미지 닫기"
          >
            ×
          </button>
          <img
            src={expandedImage}
            alt={`${streamer.displayName} 게시글 이미지 확대`}
            referrerPolicy="no-referrer"
            onMouseDown={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </Modal>
  );
}
