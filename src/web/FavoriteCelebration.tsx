import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { FancyTier } from "./cardVisuals";
import "swiper/css";

export type CelebrationSlide = { key: string; message: string; fancyTier?: FancyTier };

const CONFETTI = ["🎉", "🎊", "✨", "⭐", "🎊", "✨"];
const FANCY_ROW_SPARK_SLOTS = [1, 2, 3, 4] as const;
const FANCY_ROW_LITE_SPARK_SLOTS = [1, 2] as const;

function FavoriteCelebrationRow({
  message,
  fancyTier = "none",
}: {
  message: string;
  fancyTier?: FancyTier;
}) {
  const lite = fancyTier === "lite";
  const fancy = fancyTier !== "none";
  return (
    <span
      className={`favorite-celebration__row ${fancy ? `favorite-celebration__row--fancy${lite ? " favorite-celebration__row--fancy-lite" : ""}` : ""}`}
    >
      <span className="favorite-celebration__icon favorite-celebration__icon--left" aria-hidden="true">
        {fancy ? "👑" : "🎉"}
      </span>
      <strong className="favorite-celebration__message">
        {message}
        {fancy && (
          <span
            className={`favorite-celebration__fancy-sparks ${lite ? "favorite-celebration__fancy-sparks--lite" : ""}`}
            aria-hidden="true"
          >
            {(lite ? FANCY_ROW_LITE_SPARK_SLOTS : FANCY_ROW_SPARK_SLOTS).map((slot) => (
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

export function FavoriteCelebration({ slides }: { slides: CelebrationSlide[] }) {
  if (slides.length === 0) return null;
  const label = slides.map((slide) => slide.message).join(" · ");
  return (
    <aside className="favorite-celebration" role="note" aria-label={label}>
      <span className="favorite-celebration__shine" aria-hidden="true" />
      <span className="favorite-celebration__confetti" aria-hidden="true">
        {CONFETTI.map((emoji, index) => (
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
