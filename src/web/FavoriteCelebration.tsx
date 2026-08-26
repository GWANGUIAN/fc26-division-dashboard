import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export type CelebrationSlide = { key: string; message: string };

const CONFETTI = ["🎉", "🎊", "✨", "⭐", "🎊", "✨"];

function FavoriteCelebrationRow({ message }: { message: string }) {
  return (
    <span className="favorite-celebration__row">
      <span className="favorite-celebration__icon favorite-celebration__icon--left" aria-hidden="true">
        🎉
      </span>
      <strong className="favorite-celebration__message">{message}</strong>
      <span className="favorite-celebration__icon favorite-celebration__icon--right" aria-hidden="true">
        🏆
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
                <FavoriteCelebrationRow message={slide.message} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <FavoriteCelebrationRow message={slides[0].message} />
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
