import { useMemo } from "react";
import { GROUP_PHOTO_GOAL_TARGET, propTopCss } from "./groupPhotoProps";

const COLORS = ["#00e9ae", "#ffffff", "#ffd76a", "#ff9bec"];
const PARTICLE_COUNT = 40;

/** 시드 고정 의사난수 — 렌더 중 Math.random을 쓰지 않고, 같은 burst는 같은 모양이 되게 한다. */
function seededRandom(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * 골 순간 골문에서 터지는 색종이. 이미지 없이 CSS 파티클(group-photo.css의
 * gp-confetti)만 쓰고, 저장 이미지에는 포함하지 않는다. 부모가 약 2.8초 뒤
 * 언마운트한다. 위치는 골 목표점(groupPhotoProps.ts) 기준 vw.
 */
export function GroupPhotoConfetti({ burstId }: { burstId: number }) {
  const particles = useMemo(() => {
    const random = seededRandom(burstId);
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      color: COLORS[index % COLORS.length],
      cx: (random() - 0.35) * 30, // 오른쪽(화면 안쪽)으로 조금 더 퍼짐
      up: -(4 + random() * 9),
      fall: 3 + random() * 9,
      rot: (random() - 0.5) * 900,
      delay: random() * 0.18,
    }));
  }, [burstId]);

  return (
    <div
      className="group-photo-confetti"
      aria-hidden="true"
      style={{ left: `${GROUP_PHOTO_GOAL_TARGET.left}%`, top: propTopCss(GROUP_PHOTO_GOAL_TARGET.centerVw) }}
    >
      {particles.map((particle, index) => (
        <i
          key={index}
          style={
            {
              background: particle.color,
              "--cx": `${particle.cx}vw`,
              "--cy-up": `${particle.up}vw`,
              "--cy-fall": `${particle.fall}vw`,
              "--rot": `${particle.rot}deg`,
              animationDelay: `${particle.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
