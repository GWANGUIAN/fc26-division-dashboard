import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export const DEFAULT_CELEBRATION_MESSAGE = "축 왁굳형&핫짱 즐겨찾기 목록 입성";

export type CelebrationSlide = { key: string; message: string };

function FavoriteCelebrationRow({ message }: { message: string }) {
  return (
    <span className="favorite-celebration__row">
      <span className="favorite-celebration__icon" aria-hidden="true">
        🎉
      </span>
      <strong>{message}</strong>
      <span className="favorite-celebration__icon" aria-hidden="true">
        🎺
      </span>
    </span>
  );
}

export function FavoriteCelebration({ slides }: { slides: CelebrationSlide[] }) {
  const label = slides.map((slide) => slide.message).join(" · ");
  return (
    <aside className="favorite-celebration" role="note" aria-label={label}>
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
          <FavoriteCelebrationRow
            message={slides[0]?.message ?? DEFAULT_CELEBRATION_MESSAGE}
          />
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
