// The 잔디동 하치 트로피 룸 (interior:house-hachi97-trophy) podium: hachi97's top 5 SOOP 열혈팬, hand-entered
// from the channel's Topfan widget. `frame` is the painted frame's centre and radius in final room px
// (interiors are 640×384), measured against interiors/int-house-hachi97-trophy.webp. Name/badge are not
// shown in-world (photo only); kept here so it's clear whose photo each slot holds.

export interface TopFan {
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
  badge: string;
  /** Asset key under `topfans/`, a circle-cropped photo (falls back to a plain disc when missing). */
  photo: string;
  frame: { x: number; y: number; r: number };
}

export const HACHI_TROPHY_ROOM_SCENE = "interior:house-hachi97-trophy";

export const HACHI_TOP_FANS: readonly TopFan[] = [
  { rank: 1, name: "우리하치!", badge: "회장", photo: "topfans/hachi-trophy-1", frame: { x: 320, y: 88, r: 27 } },
  { rank: 2, name: "환승연애중", badge: "부회장", photo: "topfans/hachi-trophy-2", frame: { x: 215, y: 109, r: 27 } },
  { rank: 3, name: "류햇귀텐카이", badge: "3등", photo: "topfans/hachi-trophy-3", frame: { x: 428, y: 109, r: 27 } },
  { rank: 4, name: "양나리", badge: "4등", photo: "topfans/hachi-trophy-4", frame: { x: 530, y: 138, r: 28 } },
  { rank: 5, name: "_로코_", badge: "5등", photo: "topfans/hachi-trophy-5", frame: { x: 113, y: 138, r: 28 } },
];
