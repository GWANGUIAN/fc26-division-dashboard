export type GroupPhotoPropLayer = "behind" | "front";

/** 클릭했을 때의 소소한 반응 — 공(kick)은 별도로 GroupPhotoBall이 처리한다. */
export type GroupPhotoPropReaction = "wave" | "tip";

export type GroupPhotoPropSlot = {
  /** `src/web/assets/group-photo/props/<id>.webp` 파일명과 같다. */
  id: string;
  /** behind = 배경 위·뒷줄 캐릭터 아래, front = 앞줄 캐릭터 위. */
  layer: GroupPhotoPropLayer;
  /** Horizontal center position, as a percentage of the stage width (= vw, since the overlay is full-viewport). */
  left: number;
  /** 소품이 땅에 닿는 지점의 세로 위치 — 배경 상단 모서리에서 아래로 몇 vw인지. 캐릭터는 머리 쪽(top) 앵커지만 소품은 높이가 제각각이라 접지점 앵커가 튜닝하기 쉽다. */
  bottomVw: number;
  /** Prop width, in vw — pure-vw sizing like groupPhotoRoster.ts so it tracks the background at any zoom level. Height follows the image's own aspect ratio. */
  widthVw: number;
  reaction?: GroupPhotoPropReaction;
};

// 화면(GroupPhotoOverlay)과 저장 이미지(exportGroupPhotoImage.ts)가 모두
// 이 배열 하나만 읽는다 — 캐릭터 줄 위치처럼 CSS/캔버스에 값을 이중으로
// 두지 않는다. 이미지는 scripts/convert-group-photo-art.mjs가 투명 여백을
// 트림한 뒤 저장하므로 widthVw/bottomVw는 "보이는 픽셀" 기준이다.
// 좌표는 docs/group-photo-props.md의 "좌표계" 절차로 잡은 시작값이고, 합성
// 미리보기로 한 번 다듬었다 — 실제 화면에서 보고 더 조정해도 된다.
export const GROUP_PHOTO_PROPS: GroupPhotoPropSlot[] = [
  // 캐릭터 뒤 (원거리) — 좌우 빈 잔디를 채운다. 코너 플래그는 공 카트와
  // 겹치지 않게 감독 우왁굳 오른쪽에 둔다.
  { id: "goal", layer: "behind", left: 11, bottomVw: 42.5, widthVw: 20 },
  { id: "corner-flag", layer: "behind", left: 83.5, bottomVw: 41.5, widthVw: 4.45, reaction: "wave" },
  { id: "ball-cart", layer: "behind", left: 92.5, bottomVw: 44.5, widthVw: 13 },
  // 캐릭터 앞 (근거리)
  { id: "cones", layer: "front", left: 12, bottomVw: 49.5, widthVw: 11.5, reaction: "tip" },
  { id: "water-crate", layer: "front", left: 21.5, bottomVw: 48, widthVw: 8 },
  { id: "gear-bag", layer: "front", left: 84, bottomVw: 49, widthVw: 10 },
];

/** 클릭하면 골대로 날아가는 공 — 앞줄 가운데 두 캐릭터 발밑(축구 단체사진의 정석 구도). */
export const GROUP_PHOTO_BALL: GroupPhotoPropSlot = {
  id: "ball",
  layer: "front",
  left: 45.5,
  bottomVw: 49.4,
  widthVw: 3.6,
};

export const GROUP_PHOTO_GOAL_ID = "goal";

/** 공이 도착하는 골문 안쪽 — 공의 "중심"이 닿는 위치(가로 %, 배경 상단 기준 세로 vw). goal 소품의 위치를 바꾸면 같이 옮길 것. */
export const GROUP_PHOTO_GOAL_TARGET = { left: 11, centerVw: 38 };

/** 도착 시점 공 크기 배율(원근 축소) — group-photo.css의 gp-kick-y 마지막 scale과 같은 값. */
export const GROUP_PHOTO_BALL_END_SCALE = 0.62;

/** 공이 출발점에서 골문까지 이동하는 거리(vw). 공의 중심 = 접지점에서 지름의 절반만큼 위. */
export function getBallKickOffset(): { dxVw: number; dyVw: number } {
  const startCenterVw = GROUP_PHOTO_BALL.bottomVw - GROUP_PHOTO_BALL.widthVw / 2;
  return {
    dxVw: GROUP_PHOTO_GOAL_TARGET.left - GROUP_PHOTO_BALL.left,
    dyVw: GROUP_PHOTO_GOAL_TARGET.centerVw - startCenterVw,
  };
}

/**
 * 배경 상단 기준 vw → CSS top. group-photo.css의 캐릭터 줄과 같은 앵커
 * (`100% auto` 중앙 정렬된 배경의 상단 모서리 = 50vh - 28.125vw).
 */
export function propTopCss(vwFromBackgroundTop: number): string {
  return `calc(50vh - 28.125vw + ${vwFromBackgroundTop}vw)`;
}
