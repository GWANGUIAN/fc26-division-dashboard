import { useLayoutEffect, useRef, useState } from "react";
import "./led-signboard.css";

// 실제 도트매트릭스 전광판처럼 보이게 하는 컴포넌트 — AI 생성 이미지 없이
// Galmuri11 픽셀 폰트 + CSS 도트 그리드 오버레이 + 발광 text-shadow만으로
// 구현 (led-signboard.css 참고). scroll 모드는 헤더 티커(오른쪽에서 왼쪽으로
// 무한 스크롤), static 모드는 단체샷 오버레이 안의 고정 문구에 쓰인다.
type LedSignboardProps =
  | { mode: "scroll"; names: string[]; cheerText: string }
  | { mode: "static"; text: string; fancy?: boolean };

// 고정된 animation-duration을 쓰면 텍스트 길이에 따라 체감 속도(px/s)가
// 달라진다 — 새로고침 직후 snapshot이 아직 안 불러와져서 이름 목록이
// 비어있을 때(또는 "잔디동 화이팅!!"만 있을 때)는 같은 시간에 훨씬 짧은
// 거리만 움직여서 "느려진 것처럼" 보였다. 그래서 시간을 고정하는 대신 속도
// (초당 px)를 고정하고, 실제 트랙 폭에 맞춰 duration을 매번 계산한다.
const SCROLL_PIXELS_PER_SECOND = 70;

export function LedSignboard(props: LedSignboardProps) {
  // 훅은 항상 같은 순서로 호출돼야 하므로, mode/names 분기로 인한 조기
  // return보다 먼저 최상단에서 무조건 호출한다 (names.length가 0 → N으로
  // 바뀌는 것 — 새로고침 직후 snapshot 로딩 중 흔한 케이스 — 때문에 훅
  // 개수가 렌더마다 달라지면 React가 크래시함).
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number>();
  const text = props.mode === "scroll" ? [...props.names, props.cheerText].join("   ·   ") : "";

  useLayoutEffect(() => {
    if (props.mode !== "scroll") return;
    const track = trackRef.current;
    if (!track) return;
    // scrollWidth spans both copies laid side by side; one copy (the
    // distance the -50% keyframe actually travels) is half of that.
    const oneCopyWidth = track.scrollWidth / 2;
    setDuration(oneCopyWidth / SCROLL_PIXELS_PER_SECOND);
  }, [props.mode, text]);

  if (props.mode === "static") {
    const fancy = props.fancy ?? false;
    return (
      <div className={`led-signboard led-signboard--static${fancy ? " led-signboard--fancy" : ""}`}>
        <span className="led-signboard__dots" aria-hidden="true" />
        <span className="led-signboard__static">{props.text}</span>
        {fancy && (
          <span className="led-signboard__fancy-sparks" aria-hidden="true">
            <i className="led-signboard__fancy-spark led-signboard__fancy-spark--1">✦</i>
            <i className="led-signboard__fancy-spark led-signboard__fancy-spark--2">✦</i>
            <i className="led-signboard__fancy-spark led-signboard__fancy-spark--3">✦</i>
            <i className="led-signboard__fancy-spark led-signboard__fancy-spark--4">✦</i>
          </span>
        )}
      </div>
    );
  }

  if (props.names.length === 0) return null;

  return (
    <div className="led-signboard led-signboard--scroll">
      <span className="led-signboard__dots" aria-hidden="true" />
      <div
        ref={trackRef}
        className="led-signboard__track"
        style={duration ? { animationDuration: `${duration}s` } : undefined}
      >
        <span className="led-signboard__copy">{text}</span>
        <span className="led-signboard__copy" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
}
