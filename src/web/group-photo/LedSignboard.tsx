import "./led-signboard.css";

// 실제 도트매트릭스 전광판처럼 보이게 하는 컴포넌트 — AI 생성 이미지 없이
// Galmuri11 픽셀 폰트 + CSS 도트 그리드 오버레이 + 발광 text-shadow만으로
// 구현 (led-signboard.css 참고). scroll 모드는 헤더 티커(오른쪽에서 왼쪽으로
// 무한 스크롤), static 모드는 단체샷 오버레이 안의 고정 문구에 쓰인다.
type LedSignboardProps =
  | { mode: "scroll"; names: string[]; cheerText: string }
  | { mode: "static"; text: string; fancy?: boolean };

export function LedSignboard(props: LedSignboardProps) {
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

  const { names, cheerText } = props;
  if (names.length === 0) return null;
  const text = [...names, cheerText].join("   ·   ");
  return (
    <div className="led-signboard led-signboard--scroll">
      <span className="led-signboard__dots" aria-hidden="true" />
      <div className="led-signboard__track">
        <span className="led-signboard__copy">{text}</span>
        <span className="led-signboard__copy" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
}
