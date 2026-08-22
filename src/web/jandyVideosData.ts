export type JandyVideo = { title: string; videoUrl: string; thumbnailUrl: string };

export const jandyVideos: readonly JandyVideo[] = [
  {
    title: "FC 수비 강의.",
    videoUrl: "https://vod.sooplive.com/player/204537485",
    thumbnailUrl: "/thumbnails/thumnail_defense.webp",
  },
  {
    title: "잔디동 1:1 교육 영상 찍기.",
    videoUrl: "https://vod.sooplive.com/player/204439557",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260816_0FF1613F_296390051_1_r&column=2&t=1786866474",
  },
  {
    title: "잔디동 평가기준 교본 : 볼키핑.",
    videoUrl: "https://vod.sooplive.com/player/204350261",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260814_8CA6E131_296355533_3_r&column=2&t=1786799539",
  },
  {
    title: "후열 잔디 분석 (잔디동용)",
    videoUrl: "https://vod.sooplive.com/player/204162403",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260812_527B7F61_296306761_3_r&column=2&t=1786641746",
  },
  {
    title: "5동아리 잔디 동아리 공개",
    videoUrl: "https://vod.sooplive.com/player/204070471",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260811_27F806A7_296281607_1_r&column=2&t=1786569806",
  },
];

export type JandyChapter = { title: string; seconds: number };

export type JandyChapterVideo = {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  chapters: readonly JandyChapter[];
};

export const jandyChapterVideos: readonly JandyChapterVideo[] = [
  {
    title: "버튜버 쥰내 패기",
    videoUrl: "https://vod.sooplive.com/player/204887231",
    thumbnailUrl: "/thumbnails/thumbnail_hit.webp",
    chapters: [
      { title: "양지랖편", seconds: 23529 },
      { title: "공격 강의", seconds: 26074 },
      { title: "오슈이편", seconds: 29976 },
      { title: "빙밍편", seconds: 30924 },
    ],
  },
  {
    title: "FC 26 포지션별 교본 영상",
    videoUrl: "https://vod.sooplive.com/player/204798839",
    thumbnailUrl: "/thumbnails/thumbnail_soccer_book.webp",
    chapters: [
      { title: "도입", seconds: 29468 },
      { title: "센터백 교본", seconds: 29981 },
      { title: "풀백 교본", seconds: 30815 },
      { title: "수비 미드필더 교본 - 1", seconds: 31731 },
      { title: "수비 미드필더 교본 - 2", seconds: 36609 },
      { title: "중앙 미드필더 교본", seconds: 32674 },
      { title: "윙 포워드 교본", seconds: 33645 },
      { title: "스트라이커 교본 - 1", seconds: 34686 },
      { title: "스트라이커 교본 - 2", seconds: 35625 },
    ],
  },
];
