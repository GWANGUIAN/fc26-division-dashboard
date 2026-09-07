import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { FancyTier } from "./cardVisuals";
import "swiper/css";

export type CelebrationSlide = { key: string; message: string; fancyTier?: FancyTier };

const CONFETTI = ["🎉", "🎊", "✨", "⭐", "🎊", "✨"];
// Extra pieces/sparks shown only for the 2차 (final) celebration — keeps the
// everyday 1차 banner at its original level of flair and reserves the fuller
// effect for when there's an actual 2차 합격자 to celebrate.
const CONFETTI_ROUND2_EXTRA = ["🥇", "🌟", "🎉", "✨"];
const FANCY_ROW_SPARK_SLOTS = [1, 2, 3, 4] as const;

export function FavoriteCelebrationRow({
  message,
  fancyTier = "none",
  size = "default",
}: {
  message: string;
  fancyTier?: FancyTier;
  size?: "default" | "large";
}) {
  const fancy = fancyTier === "full";
  return (
    <span
      className={`favorite-celebration__row ${size === "large" ? "favorite-celebration__row--xl" : ""} ${fancy ? "favorite-celebration__row--fancy" : ""}`}
    >
      <span className="favorite-celebration__icon favorite-celebration__icon--left" aria-hidden="true">
        {fancy ? "👑" : "🎉"}
      </span>
      <strong className="favorite-celebration__message">
        {message}
        {fancy && (
          <span className="favorite-celebration__fancy-sparks" aria-hidden="true">
            {FANCY_ROW_SPARK_SLOTS.map((slot) => (
              <i key={slot} className={`favorite-celebration__fancy-spark favorite-celebration__fancy-spark--${slot}`}>
                ✦
              </i>
            ))}
          </span>
        )}
      </strong>
      <span className="favorite-celebration__icon favorite-celebration__icon--right" aria-hidden="true">
        {fancy ? "👑" : "🏆"}
      </span>
    </span>
  );
}

export function FavoriteCelebration({
  slides,
  round = 1,
}: {
  slides: CelebrationSlide[];
  round?: 1 | 2;
}) {
  if (slides.length === 0) return null;
  const label = slides.map((slide) => slide.message).join(" · ");
  const isRound2 = round === 2;
  const confetti = isRound2 ? [...CONFETTI, ...CONFETTI_ROUND2_EXTRA] : CONFETTI;
  return (
    <aside
      className={`favorite-celebration ${isRound2 ? "favorite-celebration--round2" : ""}`}
      role="note"
      aria-label={label}
    >
      <span className="favorite-celebration__shine" aria-hidden="true" />
      <span className="favorite-celebration__confetti" aria-hidden="true">
        {confetti.map((emoji, index) => (
          <span
            key={index}
            className={`favorite-celebration__confetti-piece favorite-celebration__confetti-piece--${index + 1}`}
          >
            {emoji}
          </span>
        ))}
      </span>
      <span
        className="favorite-celebration__spark favorite-celebration__spark--left"
        aria-hidden="true"
      >
        ✦
      </span>
      {isRound2 && (
        <>
          <span
            className="favorite-celebration__spark favorite-celebration__spark--top"
            aria-hidden="true"
          >
            ✦
          </span>
          <span
            className="favorite-celebration__spark favorite-celebration__spark--bottom"
            aria-hidden="true"
          >
            ✦
          </span>
        </>
      )}
      <div className="favorite-celebration__viewport">
        {slides.length > 1 ? (
          <Swiper
            className="favorite-celebration__swiper"
            modules={[Autoplay]}
            direction="vertical"
            loop
            allowTouchMove={false}
            speed={600}
            autoplay={{ delay: 3400, disableOnInteraction: false }}
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.key}>
                <FavoriteCelebrationRow message={slide.message} fancyTier={slide.fancyTier} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <FavoriteCelebrationRow message={slides[0].message} fancyTier={slides[0].fancyTier} />
        )}
      </div>
      <span
        className="favorite-celebration__spark favorite-celebration__spark--right"
        aria-hidden="true"
      >
        ✦
      </span>
    </aside>
  );
}
