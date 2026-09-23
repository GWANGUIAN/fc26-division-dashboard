import { WOOWAKGOOD_BONUS_STREAMER } from "./toty-card/woowakgoodBonusCard.js";
import type { CoverLoopMedia } from "./coverLoopMedia";

// 포스터/루프 영상은 파일명 규칙(<id>-cover-poster.*, <id>-cover-loop.mp4)만 지키면 이 글롭이
// 알아서 찾아준다 — 멤버가 늘어도 이 파일에 import 문을 추가할 필요가 없다. mp4는 ?url로
// 받아 20MB 파일 바이트가 JS 번들에 들어가지 않고 빌드타임 URL 문자열만 남게 한다.
const posterModules = import.meta.glob<string>(
  "./assets/cover-loop/*-cover-poster.{webp,png}",
  {
    eager: true,
    import: "default",
  },
);
const loopVideoModules = import.meta.glob<string>(
  "./assets/cover-loop/*-cover-loop.mp4",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

function posterFor(id: string): string {
  const entry = Object.entries(posterModules).find(([path]) =>
    path.includes(`/${id}-cover-poster.`),
  );
  if (!entry) throw new Error(`Missing cover-loop poster asset for "${id}"`);
  return entry[1];
}

function loopVideoFor(id: string): string | undefined {
  return Object.entries(loopVideoModules).find(([path]) =>
    path.includes(`/${id}-cover-loop.mp4`),
  )?.[1];
}

export type LyricCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type { CoverLoopMedia } from "./coverLoopMedia";

export type CoverLoopTrack = {
  id: string;
  /** Short English label for the "HACHI · 01" style index badge — id itself may be a soopId handle. */
  code: string;
  displayName: string;
  position: string;
  title: string;
  artist: string;
  media: CoverLoopMedia;
  poster: string;
  loopVideo?: string;
  objectPosition: string;
  /** Where the confirmed lyric text should start once it's added — see `lyrics` below. */
  lyricStartSeconds: number;
  lyrics: readonly LyricCue[];
};

// 사용자가 직접 제공한 LRC 가사(2026-09-22 대화, 더 짧게 나뉜 버전)를 그대로 쓰되, 원래 첫
// 가사가 21.00초에 시작하던 것을 lyricStartSeconds(6)에 맞춰 전체를 -15.00초만큼 당겼다.
// 각 Cue의 endSeconds는 다음 Cue의 시작(또는 LRC 원문의 빈 줄 = 간주곡 구간)까지다.
const hachiLyricsRaw: readonly LyricCue[] = [
  { startSeconds: 6.0, endSeconds: 9.76, text: "風の強さがちょっと" },
  { startSeconds: 9.76, endSeconds: 14.86, text: "心を揺さぶりすぎて" },
  { startSeconds: 14.86, endSeconds: 19.39, text: "真面目に見つめた" },
  { startSeconds: 19.39, endSeconds: 23.66, text: "君が恋しい" },
  { startSeconds: 24.14, endSeconds: 27.87, text: "でんぐり返しの日々" },
  { startSeconds: 27.87, endSeconds: 32.99, text: "可哀想なふりをして" },
  { startSeconds: 32.99, endSeconds: 37.48, text: "だらけてみたけど" },
  { startSeconds: 37.48, endSeconds: 41.74, text: "希望の光は" },
  { startSeconds: 42.08, endSeconds: 46.25, text: "目の前でずっと輝いている" },
  { startSeconds: 46.25, endSeconds: 49.6, text: "幸せだ" },
  { startSeconds: 49.93, endSeconds: 54.82, text: "麦わらの帽子の君が" },
  {
    startSeconds: 54.82,
    endSeconds: 59.85,
    text: "揺れたマリーゴールドに似てる",
  },
  {
    startSeconds: 59.85,
    endSeconds: 64.33,
    text: "あれは空がまだ青い夏のこと",
  },
  {
    startSeconds: 64.33,
    endSeconds: 69.17,
    text: "懐かしいと笑えたあの日の恋",
  },
  { startSeconds: 69.17, endSeconds: 72.89, text: "「もう離れないで」と" },
  {
    startSeconds: 72.89,
    endSeconds: 77.95,
    text: "泣きそうな目で見つめる君を",
  },
  {
    startSeconds: 77.95,
    endSeconds: 82.51,
    text: "雲のような優しさでそっとぎゅっと",
  },
  {
    startSeconds: 82.51,
    endSeconds: 88.24,
    text: "抱きしめて 抱きしめて 離さない",
  },
  { startSeconds: 92.05, endSeconds: 95.41, text: "本当の気持ち全部" },
  { startSeconds: 95.41, endSeconds: 100.57, text: "吐き出せるほど強くはない" },
  { startSeconds: 100.57, endSeconds: 105.38, text: "でも不思議なくらいに" },
  { startSeconds: 105.38, endSeconds: 109.54, text: "絶望は見えない" },
  {
    startSeconds: 109.92,
    endSeconds: 114.45,
    text: "目の奥にずっと写るシルエット",
  },
  { startSeconds: 114.45, endSeconds: 117.83, text: "大好きさ" },
  { startSeconds: 117.86, endSeconds: 122.68, text: "柔らかな肌を寄せあい" },
  { startSeconds: 122.68, endSeconds: 127.74, text: "少し冷たい空気を2人" },
  {
    startSeconds: 127.74,
    endSeconds: 131.43,
    text: "かみしめて歩く今日という日に",
  },
  {
    startSeconds: 131.43,
    endSeconds: 137.07,
    text: "何と名前をつけようかなんて話して",
  },
  {
    startSeconds: 137.1,
    endSeconds: 141.9,
    text: "ああ アイラブユーの言葉じゃ",
  },
  { startSeconds: 141.9, endSeconds: 145.86, text: "足りないからとキスして" },
  {
    startSeconds: 145.86,
    endSeconds: 150.41,
    text: "雲がまだ2人の影を残すから",
  },
  {
    startSeconds: 150.41,
    endSeconds: 156.12,
    text: "いつまでも いつまでも このまま",
  },
  { startSeconds: 156.38, endSeconds: 161.71, text: "遥か遠い場所にいても" },
  { startSeconds: 161.71, endSeconds: 165.09, text: "繋がっていたいなあ" },
  { startSeconds: 165.09, endSeconds: 169.64, text: "2人の想いが" },
  { startSeconds: 169.64, endSeconds: 175.44, text: "同じでありますように" },
  { startSeconds: 188.02, endSeconds: 192.9, text: "麦わらの帽子の君が" },
  {
    startSeconds: 192.9,
    endSeconds: 197.91,
    text: "揺れたマリーゴールドに似てる",
  },
  {
    startSeconds: 197.91,
    endSeconds: 202.47,
    text: "あれは空がまだ青い夏のこと",
  },
  {
    startSeconds: 202.47,
    endSeconds: 207.32,
    text: "懐かしいと笑えたあの日の恋",
  },
  { startSeconds: 207.34, endSeconds: 211.01, text: "「もう離れないで」と" },
  {
    startSeconds: 211.01,
    endSeconds: 216.07,
    text: "泣きそうな目で見つめる君を",
  },
  {
    startSeconds: 216.07,
    endSeconds: 220.56,
    text: "雲のような優しさでそっとぎゅっと",
  },
  { startSeconds: 220.56, endSeconds: 225.41, text: "抱きしめて離さない" },
  {
    startSeconds: 225.42,
    endSeconds: 230.16,
    text: "ああ アイラブユーの言葉じゃ",
  },
  { startSeconds: 230.16, endSeconds: 234.14, text: "足りないからとキスして" },
  {
    startSeconds: 234.14,
    endSeconds: 238.72,
    text: "雲がまだ2人の影を残すから",
  },
  {
    startSeconds: 238.72,
    endSeconds: 245.0,
    text: "いつまでも いつまでも このまま",
  },
  { startSeconds: 247.21, endSeconds: 251.05, text: "離さない" },
  {
    startSeconds: 251.05,
    endSeconds: 258.22,
    text: "いつまでも いつまでも 離さない",
  },
];

// 실제 재생에서는 가사가 너무 빨리 바뀌는 느낌이라, 0.3초 늦춰서 노래를 따라가게 한다.
const HACHI_LYRIC_DELAY_SECONDS = 0.5;
const hachiLyrics: readonly LyricCue[] = hachiLyricsRaw.map((cue) => ({
  ...cue,
  startSeconds: cue.startSeconds + HACHI_LYRIC_DELAY_SECONDS,
  endSeconds: cue.endSeconds + HACHI_LYRIC_DELAY_SECONDS,
}));

export const hachiCoverLoopTrack: CoverLoopTrack = {
  id: "hachi",
  code: "HACHI",
  displayName: "하치_HACHI",
  position: "ST",
  title: "마리골드",
  artist: "아이묭",
  media: { type: "youtube", videoId: "JZTxKMRYC_Y" },
  poster: posterFor("hachi"),
  loopVideo: loopVideoFor("hachi"),
  objectPosition: "center",
  lyricStartSeconds: 6 + HACHI_LYRIC_DELAY_SECONDS,
  lyrics: hachiLyrics,
};

// 해파린 커버는 SOOP 클립으로만 제공된다. 재생·볼륨 등은 SOOP iframe 내부 컨트롤에 맡기고,
// 배경 루프 MP4는 재생 상태와 무관하게(SOOP는 재생 상태를 알 수 없으므로) 항상 돌아간다
// (CoverLoopStage의 showLoopVideo/scene video 참고).
export const haepalinCoverLoopTrack: CoverLoopTrack = {
  id: "haepalin",
  code: "HAEPALIN",
  displayName: "해파린",
  position: "CB",
  title: "너의 색으로 물들어",
  artist: "GUMI",
  media: {
    type: "soop-clip",
    titleNo: 145540969,
    clipTitle: "ଳ୍ଠ [MMD] 너의 색으로 물들어 (Cover by 해파린)",
  },
  poster: posterFor("haepalin"),
  loopVideo: loopVideoFor("haepalin"),
  objectPosition: "center",
  lyricStartSeconds: 0,
  lyrics: [],
};

// 아래 세 트랙도 해파린과 동일하게 SOOP 클립 전용 — 재생·볼륨 등은 SOOP iframe 내부 컨트롤에
// 맡기고, 배경 루프 MP4만 항상 재생한다.
export const jumengiCoverLoopTrack: CoverLoopTrack = {
  id: "ju010228",
  code: "JYUMENGE",
  displayName: "쥬멩이",
  position: "ST",
  title: "기다린 만큼, 더",
  artist: "카더가든",
  media: {
    type: "soop-clip",
    titleNo: 206994189,
    clipTitle: "쥬멩이 - 기다린 만큼, 더",
  },
  poster: posterFor("ju010228"),
  loopVideo: loopVideoFor("ju010228"),
  objectPosition: "center",
  lyricStartSeconds: 0,
  lyrics: [],
};

export const dashibaCoverLoopTrack: CoverLoopTrack = {
  id: "tdnlamuron",
  code: "DASHIBA",
  displayName: "다시바",
  position: "WF",
  title: "책방오빠 문학소녀",
  artist: "비비",
  media: {
    type: "soop-clip",
    titleNo: 199339643,
    clipTitle: "레전드 시바님 노래",
  },
  poster: posterFor("tdnlamuron"),
  loopVideo: loopVideoFor("tdnlamuron"),
  objectPosition: "center",
  lyricStartSeconds: 0,
  lyrics: [],
};

export const pingguCoverLoopTrack: CoverLoopTrack = {
  id: "sjh4018",
  code: "PINGGU",
  displayName: "핑구",
  position: "CB",
  title: "Say Something",
  artist: "A Great Big World",
  media: {
    type: "soop-clip",
    titleNo: 207852887,
    clipTitle: "핑구 - say something",
  },
  poster: posterFor("sjh4018"),
  loopVideo: loopVideoFor("sjh4018"),
  objectPosition: "center",
  lyricStartSeconds: 0,
  lyrics: [],
};

// 개발 전용 가사 타이밍 도구(CoverLoopLyricTimingTool)로 직접 찍어 확정한 구간(2026-09-22).
// 실제 재생 시각을 그대로 탭한 값이라 별도 오프셋 없이 그대로 쓴다.
const janineLyrics: readonly LyricCue[] = [
  { startSeconds: 0.48, endSeconds: 4.09, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 4.09, endSeconds: 7.33, text: "나를 바라봐줘, 좀 더!" },
  {
    startSeconds: 7.33,
    endSeconds: 16.51,
    text: '보답으로는 "사랑을 가득 담은 입맞춤으로"',
  },
  {
    startSeconds: 16.51,
    endSeconds: 21.54,
    text: "꿈이 아니야, 모두가 보고 있어",
  },
  {
    startSeconds: 21.54,
    endSeconds: 27.12,
    text: "하트를 만들어 사랑을 보내주세요",
  },
  {
    startSeconds: 27.12,
    endSeconds: 32.52,
    text: "할 수 있는 건 뭐든지 다 할게요",
  },
  {
    startSeconds: 32.52,
    endSeconds: 37.93,
    text: "멈추지 않을거야, 최선을 다 할거니까",
  },
  {
    startSeconds: 37.93,
    endSeconds: 40.62,
    text: "어쩌다가 보게 된 비난의 댓글",
  },
  {
    startSeconds: 40.62,
    endSeconds: 43.32,
    text: "웃기지마! 제대로 알지도 못하면서",
  },
  {
    startSeconds: 43.32,
    endSeconds: 48.36,
    text: "그래도 괜찮아, 무대 위에 서면 모두가 있어",
  },
  { startSeconds: 48.36, endSeconds: 49.62, text: '"갑니다!"' },
  { startSeconds: 49.62, endSeconds: 52.14, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 52.14, endSeconds: 54.84, text: "나를 바라봐줘, 좀 더!" },
  {
    startSeconds: 54.84,
    endSeconds: 60.24,
    text: '보답으로는 "사랑을 가득 담은 입맞춤으로"',
  },
  { startSeconds: 60.24, endSeconds: 62.94, text: "사로잡아 볼게, 좀 더!" },
  { startSeconds: 62.94, endSeconds: 65.82, text: "꿈을 보여줄게, 좀 더!" },
  {
    startSeconds: 65.82,
    endSeconds: 72.3,
    text: "마음껏 즐겨줘, 사랑을 가득담은 스페셜 나이트",
  },
  { startSeconds: 72.3, endSeconds: 85.26, text: "팬썹해줄거야!" },
  {
    startSeconds: 85.26,
    endSeconds: 89.76,
    text: "편지도 많이 적어서 보내주세요",
  },
  {
    startSeconds: 89.76,
    endSeconds: 95.34,
    text: "소중히 읽어보고 보물로 간직할게요",
  },
  {
    startSeconds: 95.34,
    endSeconds: 100.74,
    text: "스캔들은, 제게는 이르지만",
  },
  {
    startSeconds: 100.74,
    endSeconds: 106.14,
    text: "배신하지 않아요 미리 선언해둘게요",
  },
  {
    startSeconds: 106.14,
    endSeconds: 108.84,
    text: "질투와 괴롭힘에는 절대 지지 않아",
  },
  {
    startSeconds: 108.84,
    endSeconds: 111.72,
    text: "웃기지마! 실력으로 이겨줄거야",
  },
  {
    startSeconds: 111.72,
    endSeconds: 116.76,
    text: "그러니 절대로 그만두지 않아 지기 싫으니까",
  },
  { startSeconds: 116.76, endSeconds: 117.84, text: '"갑니다!"' },
  { startSeconds: 117.84, endSeconds: 120.18, text: "손을 높이 들고, 좀 더!" },
  { startSeconds: 120.18, endSeconds: 123.06, text: "땀을 흘려가며, 좀 더!" },
  {
    startSeconds: 123.06,
    endSeconds: 128.46,
    text: '보답으로는 "사랑을 가득담은 재닌빔으로"',
  },
  { startSeconds: 128.46, endSeconds: 131.16, text: "크게 외쳐줄래, 좀 더!" },
  { startSeconds: 131.16, endSeconds: 133.86, text: "아직 부족한걸, 좀 더!" },
  {
    startSeconds: 133.86,
    endSeconds: 140.52,
    text: '기쁘게 받아줘 "사랑을 가득담은 당신을 위한 노래"',
  },
  // 다음 줄이 143.39초에 시작해서, 겹치지 않도록 이 줄의 끝을 148.52 → 143.39로 당겼다
  // (시작 시각 140.52는 그대로).
  { startSeconds: 140.52, endSeconds: 143.39, text: "팬썹해줄거야!" },
  // 여기부터 끝까지는 사용자가 직접 탭해 확정한 타임라인(2026-09-22, 가사 한 곳 수정 포함).
  {
    startSeconds: 143.39,
    endSeconds: 152.75,
    text: "아아, 이제 점점 끝이 보여 아쉬워지네",
  },
  {
    startSeconds: 152.75,
    endSeconds: 157.79,
    text: "즐거우면서도, 눈물이 나는걸",
  },
  {
    startSeconds: 157.79,
    endSeconds: 163.19,
    text: "다음에, 또다시... 만날 수 있는거지?",
  },
  { startSeconds: 163.19, endSeconds: 174.16, text: '"약속이야!"' },
  {
    startSeconds: 174.16,
    endSeconds: 177.04,
    text: "상냥함이 가득 넘쳐흐르는 칭찬들도",
  },
  {
    startSeconds: 177.04,
    endSeconds: 179.74,
    text: "마음이 담기지 않은 누군가의 빈말도",
  },
  { startSeconds: 179.74, endSeconds: 182.63, text: "전부 필요해 필요하다구" },
  { startSeconds: 182.63, endSeconds: 185.68, text: "더 강해질 거야" },
  { startSeconds: 185.68, endSeconds: 188.56, text: "마음껏 소리쳐! 좀 더!" },
  { startSeconds: 188.56, endSeconds: 191.26, text: "즐겨 보는 거야! 좀 더!" },
  {
    startSeconds: 191.26,
    endSeconds: 196.66,
    text: "절대 잊지 못할 아주 특별한 날이 될 수 있도록",
  },
  { startSeconds: 196.66, endSeconds: 199.18, text: "함께 노래해줘 계속!" },
  { startSeconds: 199.18, endSeconds: 202.24, text: "같이 걸어가줘 계속!" },
  {
    startSeconds: 202.24,
    endSeconds: 207.64,
    text: "우리의 암호는 아주 특별한 L.O.V.E",
  },
  { startSeconds: 207.64, endSeconds: 210.34, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 210.34, endSeconds: 213.22, text: "나를 바라봐줘, 좀 더!" },
  {
    startSeconds: 213.22,
    endSeconds: 218.62,
    text: '보답으로는 "사랑을 가득 담은 입맞춤으로"',
  },
  { startSeconds: 218.62, endSeconds: 221.14, text: "사로잡아 볼게, 좀 더!" },
  { startSeconds: 221.14, endSeconds: 224.02, text: "꿈을 보여줄게, 좀 더!" },
  {
    startSeconds: 224.02,
    endSeconds: 230.68,
    text: "마음껏 즐겨줘, 사랑을 가득담은 스페셜 나이트",
  },
  { startSeconds: 230.68, endSeconds: 238.68, text: "팬썹해줄거야!" },
];

export const janineCoverLoopTrack: CoverLoopTrack = {
  id: "janine95kim",
  code: "JANINE",
  displayName: "재닌",
  position: "GK",
  title: "팬서비스(ファンサ)",
  artist: "허니웍스 (Honey Works)",
  media: { type: "youtube", videoId: "pRz3SKnBF1Y" },
  poster: posterFor("janine95kim"),
  loopVideo: loopVideoFor("janine95kim"),
  objectPosition: "center",
  lyricStartSeconds: 0.48,
  lyrics: janineLyrics,
};

// 사용자가 직접 탭해 확정한 타임라인(2026-09-22). 실제 재생 시각을 그대로 쓴다.
const hangyeolLyrics: readonly LyricCue[] = [
  {
    startSeconds: 9.57,
    endSeconds: 17.67,
    text: "아마도 우리는 모두 역할이 있을지 몰라",
  },
  {
    startSeconds: 17.67,
    endSeconds: 25.23,
    text: "무대 위의 발을 맞출 때면 한 장을 또 넘겨가고,",
  },
  {
    startSeconds: 25.23,
    endSeconds: 33.32,
    text: "커튼콜은 내려왔어 화톳불에 둘러 앉고",
  },
  {
    startSeconds: 33.32,
    endSeconds: 41.6,
    text: "먼지쌓인 옛날 추억들이 갑자기 찾아오는걸",
  },
  { startSeconds: 41.6, endSeconds: 45.92, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 45.92, endSeconds: 49.71, text: "기다렸고 기다렸지" },
  { startSeconds: 49.71, endSeconds: 53.67, text: "막이 내리면 그리울까?" },
  { startSeconds: 53.67, endSeconds: 57.44, text: "후련했고 섭섭했지" },
  {
    startSeconds: 57.44,
    endSeconds: 65.37,
    text: "끝났다는 것은 다시 시작된다는 것을",
  },
  {
    startSeconds: 65.37,
    endSeconds: 72.56,
    text: "잊는다는 것도 역시 비워둔다는 것을",
  },
  {
    startSeconds: 72.56,
    endSeconds: 80.3,
    text: "아마도 그 이야기를 이어가고 싶었나봐",
  },
  {
    startSeconds: 80.3,
    endSeconds: 88.22,
    text: "아직도 파란 불빛 앞에서 그 때의 흔적을 찾고,",
  },
  {
    startSeconds: 88.22,
    endSeconds: 96.14,
    text: "다시 돌릴 수도 없는 태엽은 푹 잠들었어",
  },
  {
    startSeconds: 96.14,
    endSeconds: 104.6,
    text: "희미해진 빛도, 노랫말도, 다시금 찾아오겠지",
  },
  { startSeconds: 104.6, endSeconds: 108.56, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 108.56, endSeconds: 112.52, text: "기다렸고 기다렸지" },
  { startSeconds: 112.52, endSeconds: 116.48, text: "막이 내리면 그리울까?" },
  { startSeconds: 116.48, endSeconds: 120.44, text: "후련했고 섭섭했지" },
  {
    startSeconds: 120.44,
    endSeconds: 128.18,
    text: "끝났다는 것은 다시 시작된다는 것을",
  },
  {
    startSeconds: 128.18,
    endSeconds: 152.3,
    text: "잊는다는 것도 역시 비워둔다는 것을",
  },
  {
    startSeconds: 152.3,
    endSeconds: 159.86,
    text: "다음 열차는 오고있고 방명록은 열어뒀어",
  },
  {
    startSeconds: 159.86,
    endSeconds: 171.92,
    text: "잠궈놓았던 세상 속을 다시 어지럽힐거야",
  },
  { startSeconds: 171.92, endSeconds: 175.52, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 175.52, endSeconds: 179.48, text: "기다렸고 기다렸지" },
  { startSeconds: 179.48, endSeconds: 183.72, text: "막이 내리면 그리울까?" },
  { startSeconds: 183.72, endSeconds: 187.32, text: "후련했고 섭섭했지" },
  { startSeconds: 187.32, endSeconds: 191.46, text: "물어본다면 답은 올까?" },
  { startSeconds: 191.46, endSeconds: 195.42, text: "불러봤고 또 불러봤지" },
  {
    startSeconds: 195.42,
    endSeconds: 203.34,
    text: "길은 언제나 나로부터 찾을 수 밖에 없는걸",
  },
  {
    startSeconds: 203.34,
    endSeconds: 210.9,
    text: "끝났다는 것은 다시 시작된다는 것을",
  },
  {
    startSeconds: 210.9,
    endSeconds: 219.0,
    text: "잊는다는 것도 역시 비워둔다는 것을",
  },
  {
    startSeconds: 219.0,
    endSeconds: 226.92,
    text: "끝났다는 것은 다시 시작된다는 것을",
  },
  {
    startSeconds: 226.92,
    endSeconds: 234.92,
    text: "잊는다는 것도 역시 비워둔다는 것을",
  },
];

export const hangyeolCoverLoopTrack: CoverLoopTrack = {
  id: "kaksjak0730",
  code: "HANGYEOL",
  displayName: "한결",
  position: "CM·CDM",
  title: "끝났다는 것은 다시 시작된다는 것을",
  artist: "강아윤",
  media: { type: "youtube", videoId: "x_swRYU23zQ" },
  poster: posterFor("kaksjak0730"),
  loopVideo: loopVideoFor("kaksjak0730"),
  objectPosition: "center",
  lyricStartSeconds: 9.57,
  lyrics: hangyeolLyrics,
};

// 개발 전용 가사 타이밍 도구(CoverLoopLyricTimingTool)로 직접 찍어 확정한 구간(2026-09-22).
// 실제 재생 시각을 그대로 탭한 값이라 별도 오프셋 없이 그대로 쓴다. 1:17.63~1:46.07,
// 2:40.79~3:16.43 구간은 간주곡이라 가사 Cue가 없다.
const linyaLyrics: readonly LyricCue[] = [
  { startSeconds: 10.14, endSeconds: 12.84, text: "아련히 피워낸 열" },
  { startSeconds: 12.84, endSeconds: 15.9, text: "눈부신 다짐도" },
  { startSeconds: 15.9, endSeconds: 20.76, text: "꽃이 지듯 시들어가겠지" },
  { startSeconds: 20.76, endSeconds: 22.92, text: "아름답단 말처럼" },
  { startSeconds: 22.92, endSeconds: 25.98, text: "내 모습 이대로" },
  { startSeconds: 25.98, endSeconds: 28.14, text: "심어둔 우리를" },
  { startSeconds: 28.14, endSeconds: 31.2, text: "기억하겠다 해줘" },
  {
    startSeconds: 31.2,
    endSeconds: 39.47,
    text: "난 새하얀 눈이 돼 어딘가로 흩어질 거야",
  },
  { startSeconds: 39.47, endSeconds: 44.7, text: "그 장면 안에도" },
  { startSeconds: 44.7, endSeconds: 50.45, text: "네가 미소 짓기를" },
  {
    startSeconds: 50.45,
    endSeconds: 55.49,
    text: "바람아 네가 보여준 이 세상은",
  },
  {
    startSeconds: 55.49,
    endSeconds: 60.72,
    text: "꽃잎들이 모여 세상을 밝히더라",
  },
  {
    startSeconds: 60.72,
    endSeconds: 65.94,
    text: "시간 따라 다다른 이 순간은",
  },
  {
    startSeconds: 65.94,
    endSeconds: 73.31,
    text: "작은 티끌 하나 하나라도 없었다면",
  },
  { startSeconds: 73.31, endSeconds: 77.63, text: "보지 못했을 이야기" },
  {
    startSeconds: 106.07,
    endSeconds: 111.47,
    text: "'피다'의 반대말은 '지다'가 아냐",
  },
  { startSeconds: 111.47, endSeconds: 113.63, text: "너를 봐봐" },
  { startSeconds: 113.63, endSeconds: 116.87, text: "얼마나 예쁜지" },
  { startSeconds: 116.87, endSeconds: 119.75, text: "난 아지랑이 속에" },
  {
    startSeconds: 119.75,
    endSeconds: 125.33,
    text: "뛰놀던 우리를 본 것만 같아",
  },
  { startSeconds: 125.33, endSeconds: 130.01, text: "선잠의 꿈이라도" },
  { startSeconds: 130.01, endSeconds: 134.51, text: "이유가 되니까" },
  { startSeconds: 134.51, endSeconds: 136.67, text: "네가" },
  {
    startSeconds: 136.67,
    endSeconds: 141.35,
    text: "바람아 네가 보여준 이 세상은",
  },
  {
    startSeconds: 141.35,
    endSeconds: 146.21,
    text: "꽃잎들이 모여 세상을 밝히더라",
  },
  {
    startSeconds: 146.21,
    endSeconds: 151.61,
    text: "시간 따라 다다른 이 순간을",
  },
  { startSeconds: 151.61, endSeconds: 160.79, text: "기억해 낼 거야 분명" },
  { startSeconds: 196.43, endSeconds: 200.75, text: "난 나는 게 아닌" },
  {
    startSeconds: 200.75,
    endSeconds: 206.33,
    text: "그저 떨어지던 걸지도 몰라",
  },
  { startSeconds: 206.33, endSeconds: 211.19, text: "언젠가 너 앞에" },
  { startSeconds: 211.19, endSeconds: 216.77, text: "또 다시 피울게" },
  {
    startSeconds: 216.77,
    endSeconds: 222.35,
    text: "바람이 내게 보여준 이 세상은",
  },
  {
    startSeconds: 222.35,
    endSeconds: 227.21,
    text: "반딧불이 모여 꽃잎이 돼 주더라",
  },
  {
    startSeconds: 227.21,
    endSeconds: 232.43,
    text: "시간 따라 다다른 이 따스함은",
  },
  {
    startSeconds: 232.43,
    endSeconds: 240.35,
    text: "놓지 않을 기억, 그날에 너와 나",
  },
  { startSeconds: 240.35, endSeconds: 242.33, text: "시작의 해로" },
  { startSeconds: 242.33, endSeconds: 245.03, text: "다시 돌아간대도" },
  {
    startSeconds: 245.03,
    endSeconds: 250.07,
    text: "몇천 번이라도 같은 길을 걸어가리",
  },
  {
    startSeconds: 250.07,
    endSeconds: 255.29,
    text: "우릴 함께 날아오르게 해줬던",
  },
  { startSeconds: 255.29, endSeconds: 259.61, text: "나의 봄바람아" },
  { startSeconds: 259.61, endSeconds: 262.85, text: "다시 만나게 되면" },
  { startSeconds: 262.85, endSeconds: 267.0, text: "또 어디론가 데려가 줘" },
];

export const linyaCoverLoopTrack: CoverLoopTrack = {
  id: "lina0108",
  code: "LINYA",
  displayName: "리냐_LINYA",
  position: "FB",
  title: "낙화",
  artist: "LUCY",
  media: { type: "youtube", videoId: "9WVURtxNSTE" },
  poster: posterFor("lina0108"),
  loopVideo: loopVideoFor("lina0108"),
  objectPosition: "center",
  lyricStartSeconds: 10.14,
  lyrics: linyaLyrics,
};

// 개발 전용 가사 타이밍 도구(CoverLoopLyricTimingTool)로 직접 찍어 확정한 구간(2026-09-22).
// 실제 재생 시각을 그대로 탭한 값이라 별도 오프셋 없이 그대로 쓴다. 1:24.33~1:26.13,
// 2:35.24~2:46.58 구간은 간주곡이라 가사 Cue가 없다.
const bboringirlLyrics: readonly LyricCue[] = [
  {
    startSeconds: 15.21,
    endSeconds: 24.93,
    text: "Everyday Everytime 손끝에 번진 네 미소",
  },
  {
    startSeconds: 24.93,
    endSeconds: 35.19,
    text: "Everyday Everynight 또 꿈을 꾸듯 다가와",
  },
  { startSeconds: 35.19, endSeconds: 39.33, text: "스뚜루루 떨리는 두 눈" },
  { startSeconds: 39.33, endSeconds: 45.45, text: "수줍은 미소가 너무 좋아" },
  {
    startSeconds: 45.45,
    endSeconds: 54.63,
    text: "달콤해 너의 향기까지 날 설레게 해",
  },
  {
    startSeconds: 54.63,
    endSeconds: 60.39,
    text: "난 이대로 Falling 우린 Falling",
  },
  {
    startSeconds: 60.39,
    endSeconds: 64.91,
    text: "눈부시게 빛나는 Little star",
  },
  {
    startSeconds: 64.91,
    endSeconds: 69.93,
    text: "난 너 없인 Lonely 슬픈 Lonely",
  },
  {
    startSeconds: 69.93,
    endSeconds: 75.51,
    text: "사랑스런 나만의 Little star",
  },
  { startSeconds: 75.51, endSeconds: 84.33, text: "내게로 와 오오" },
  {
    startSeconds: 86.13,
    endSeconds: 95.49,
    text: "Everyday Everytime 살며시 내린 비처럼",
  },
  {
    startSeconds: 95.49,
    endSeconds: 105.93,
    text: "Everyday Everynight 늘 속삭이듯 다가와",
  },
  { startSeconds: 105.93, endSeconds: 110.07, text: "스뚜루루 귓가를 맴돈" },
  { startSeconds: 110.07, endSeconds: 115.65, text: "낮은 목소리가 나는 좋아" },
  {
    startSeconds: 115.65,
    endSeconds: 124.83,
    text: "온종일 I'm falling in love 너를 사랑해",
  },
  {
    startSeconds: 124.83,
    endSeconds: 130.95,
    text: "난 이대로 Falling 우린 Falling",
  },
  {
    startSeconds: 130.95,
    endSeconds: 135.63,
    text: "눈부시게 빛나는 Little star",
  },
  {
    startSeconds: 135.63,
    endSeconds: 140.66,
    text: "난 너 없인 Lonely 슬픈 Lonely",
  },
  {
    startSeconds: 140.66,
    endSeconds: 146.06,
    text: "사랑스런 나만의 Little star",
  },
  { startSeconds: 146.06, endSeconds: 155.24, text: "내게로 와 오오" },
  { startSeconds: 166.58, endSeconds: 170.72, text: "스뚜루루 귓가를 맴돈" },
  { startSeconds: 170.72, endSeconds: 176.12, text: "낮은 목소리가 나는 좋아" },
  {
    startSeconds: 176.12,
    endSeconds: 185.66,
    text: "온종일 I'm falling in love 너를 사랑해",
  },
  {
    startSeconds: 185.66,
    endSeconds: 191.6,
    text: "난 이대로 Falling 우린 Falling",
  },
  {
    startSeconds: 191.6,
    endSeconds: 196.1,
    text: "눈부시게 빛나는 Little star",
  },
  {
    startSeconds: 196.1,
    endSeconds: 201.5,
    text: "난 너 없인 Lonely 슬픈 Lonely",
  },
  {
    startSeconds: 201.5,
    endSeconds: 206.72,
    text: "사랑스런 나만의 Little star",
  },
  { startSeconds: 206.72, endSeconds: 211.94, text: "내게로 와 내게로 와" },
  {
    startSeconds: 211.94,
    endSeconds: 216.98,
    text: "내 맘 다 가져간 넌 Little star",
  },
  {
    startSeconds: 216.98,
    endSeconds: 221.66,
    text: "난 너 없인 Lonely 슬픈 Lonely",
  },
  {
    startSeconds: 221.66,
    endSeconds: 227.06,
    text: "사랑스런 나만의 Little star",
  },
  { startSeconds: 227.06, endSeconds: 236.06, text: "널 기다려 Oh yeah" },
  { startSeconds: 236.06, endSeconds: 242.36, text: "널 사랑해" },
];

export const bboringirlCoverLoopTrack: CoverLoopTrack = {
  id: "bboringirl",
  code: "BBORING",
  displayName: "뽀린걸",
  position: "CM",
  title: "Everyday",
  artist: "박은우",
  media: { type: "youtube", videoId: "4FtYneG447I", startSeconds: 13 },
  poster: posterFor("bboringirl"),
  loopVideo: loopVideoFor("bboringirl"),
  objectPosition: "center",
  lyricStartSeconds: 15.21,
  lyrics: bboringirlLyrics,
};

// 사용자가 직접 탭해 확정한 타임라인(2026-09-22)이지만, 저작권 때문에 원문 가사는 이 코드
// 저장소에 넣지 않는다 — 텍스트는 자리표시자이며, 실제 가사는 사용자가 직접 채워 넣어야 한다.
const bingmingLyrics: readonly LyricCue[] = [
  {
    startSeconds: 9.2,
    endSeconds: 13.88,
    text: "君を泣かすから だから一緒には居れないな",
  },
  {
    startSeconds: 13.88,
    endSeconds: 18.38,
    text: "君を泣かすから 早く忘れて欲しいんだ",
  },
  {
    startSeconds: 18.38,
    endSeconds: 23.24,
    text: "人間だからね たまには違うものも食べたいね",
  },
  {
    startSeconds: 23.24,
    endSeconds: 27.38,
    text: "君を泣かすから そう君を泣かすから",
  },
  { startSeconds: 27.38, endSeconds: 29.9, text: "でも味気ないんだよね" },
  {
    startSeconds: 29.9,
    endSeconds: 32.42,
    text: "会いたくなんだよね",
  },
  {
    startSeconds: 32.42,
    endSeconds: 34.58,
    text: "君以外会いたくないんだよね",
  },
  {
    startSeconds: 34.58,
    endSeconds: 37.1,
    text: "なんて勝手だね",
  },
  {
    startSeconds: 37.1,
    endSeconds: 39.26,
    text: "大体曖昧なんだよね",
  },
  {
    startSeconds: 39.26,
    endSeconds: 41.78,
    text: "愛の存在証明なんて",
  },
  {
    startSeconds: 41.78,
    endSeconds: 45.91,
    text: "君が教えてくれないか",
  },
  {
    startSeconds: 45.91,
    endSeconds: 51.5,
    text: "何十回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 51.5,
    endSeconds: 55.27,
    text: "愛してるを並べてみて",
  },
  {
    startSeconds: 55.27,
    endSeconds: 60.31,
    text: "何十回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 60.31,
    endSeconds: 65.17,
    text: "最高のフルコースを頂戴",
  },
  {
    startSeconds: 74.35,
    endSeconds: 79.03,
    text: "君を泣かすから きっと一生は無理だよね",
  },
  {
    startSeconds: 79.03,
    endSeconds: 83.47,
    text: "君を泣かすから 胸がとても痛くなんだ",
  },
  {
    startSeconds: 83.47,
    endSeconds: 88.33,
    text: "人間だからね たまには分かり合えなくなって",
  },
  {
    startSeconds: 88.33,
    endSeconds: 92.65,
    text: "君を泣かすから また君を泣かすから",
  },
  {
    startSeconds: 92.65,
    endSeconds: 95.17,
    text: "でも自信がないんだよね",
  },
  {
    startSeconds: 95.17,
    endSeconds: 97.69,
    text: "変わりたくないんだよね",
  },
  {
    startSeconds: 97.69,
    endSeconds: 100.03,
    text: "君以外会いたくないんだよね",
  },
  {
    startSeconds: 100.03,
    endSeconds: 102.55,
    text: "なんて勝手だね",
  },
  {
    startSeconds: 102.55,
    endSeconds: 104.53,
    text: "大体曖昧だったよね",
  },
  {
    startSeconds: 104.53,
    endSeconds: 107.23,
    text: "愛の存在証明なんて",
  },
  {
    startSeconds: 107.23,
    endSeconds: 111.01,
    text: "君がそこに居るのにね",
  },
  {
    startSeconds: 111.01,
    endSeconds: 116.59,
    text: "何百回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 116.59,
    endSeconds: 120.55,
    text: "愛してるを並べてみて",
  },
  {
    startSeconds: 120.55,
    endSeconds: 125.41,
    text: "何百回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 125.41,
    endSeconds: 130.09,
    text: "最高のフルコースを頂戴",
  },
  {
    startSeconds: 130.09,
    endSeconds: 134.59,
    text: "離れないで傍に居てくれたのは",
  },
  {
    startSeconds: 134.59,
    endSeconds: 139.27,
    text: "結局君一人だったよね",
  },
  {
    startSeconds: 139.27,
    endSeconds: 143.95,
    text: "涙のスパイスは君の胸に",
  },
  {
    startSeconds: 143.95,
    endSeconds: 148.45,
    text: "残ってしまうだろうけど",
  },
  {
    startSeconds: 148.45,
    endSeconds: 153.67,
    text: "何千回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 153.67,
    endSeconds: 157.81,
    text: "愛してるを並べるから",
  },
  {
    startSeconds: 157.81,
    endSeconds: 162.85,
    text: "何千回の夜を過ごしたって得られぬような",
  },
  {
    startSeconds: 162.85,
    endSeconds: 167.17,
    text: "最高のフルコースを",
  },
  {
    startSeconds: 167.17,
    endSeconds: 172.21,
    text: "何万回の夜を過ごしたって忘れぬような",
  },
  {
    startSeconds: 172.21,
    endSeconds: 176.53,
    text: "愛してるを並べるから",
  },
  {
    startSeconds: 176.53,
    endSeconds: 181.38,
    text: "何万回の夜を過ごしたって忘れぬような",
  },
  {
    startSeconds: 181.38,
    endSeconds: 186.97,
    text: "最高のフルコースを頂戴",
  },
];

export const bingmingCoverLoopTrack: CoverLoopTrack = {
  id: "tleod1818",
  code: "BINGMING",
  displayName: "빙밍_",
  position: "FB",
  title: "만찬가(晩餐歌)",
  artist: "tuki",
  media: { type: "youtube", videoId: "Nt0G0XtPpBQ" },
  poster: posterFor("tleod1818"),
  loopVideo: loopVideoFor("tleod1818"),
  objectPosition: "center",
  lyricStartSeconds: 9.2,
  lyrics: bingmingLyrics,
};

// 사용자가 직접 제공한 LRC 가사와 타임코드(2026-09-22)를 사용한다. 빈 LRC 행은 Cue로
// 만들지 않아 해당 구간에는 가사가 표시되지 않는다.
const doormomoLyricTiming: readonly LyricCue[] = [
  { startSeconds: 9.27, endSeconds: 11.51, text: "" },
  { startSeconds: 11.51, endSeconds: 12.73, text: "" },
  { startSeconds: 12.73, endSeconds: 13.88, text: "" },
  { startSeconds: 13.88, endSeconds: 15.78, text: "" },
  { startSeconds: 15.78, endSeconds: 18.41, text: "" },
  { startSeconds: 18.41, endSeconds: 21.26, text: "" },
  { startSeconds: 21.26, endSeconds: 22.46, text: "" },
  { startSeconds: 22.46, endSeconds: 23.59, text: "" },
  { startSeconds: 23.59, endSeconds: 25, text: "" },
  { startSeconds: 27.53, endSeconds: 29.87, text: "" },
  { startSeconds: 29.87, endSeconds: 32.1, text: "" },
  { startSeconds: 32.1, endSeconds: 34.39, text: "" },
  { startSeconds: 34.39, endSeconds: 36.68, text: "" },
  { startSeconds: 36.68, endSeconds: 38.99, text: "" },
  { startSeconds: 38.99, endSeconds: 41.26, text: "" },
  { startSeconds: 41.26, endSeconds: 43.52, text: "" },
  { startSeconds: 43.52, endSeconds: 45.65, text: "" },
  { startSeconds: 45.85, endSeconds: 48.12, text: "" },
  { startSeconds: 48.12, endSeconds: 50.4, text: "" },
  { startSeconds: 50.4, endSeconds: 52.68, text: "" },
  { startSeconds: 52.68, endSeconds: 54.97, text: "" },
  { startSeconds: 54.97, endSeconds: 57.27, text: "" },
  { startSeconds: 57.27, endSeconds: 59.55, text: "" },
  { startSeconds: 59.55, endSeconds: 62.47, text: "" },
  { startSeconds: 62.47, endSeconds: 64.12, text: "" },
  { startSeconds: 64.12, endSeconds: 67.04, text: "" },
  { startSeconds: 67.04, endSeconds: 69.3, text: "" },
  { startSeconds: 69.3, endSeconds: 74.1, text: "" },
  { startSeconds: 74.1, endSeconds: 75.82, text: "" },
  { startSeconds: 75.82, endSeconds: 78.4, text: "" },
  { startSeconds: 78.4, endSeconds: 79.56, text: "" },
  { startSeconds: 79.56, endSeconds: 80.69, text: "" },
  { startSeconds: 80.69, endSeconds: 82.44, text: "" },
  { startSeconds: 82.44, endSeconds: 84.69, text: "" },
  { startSeconds: 84.69, endSeconds: 86.97, text: "" },
  { startSeconds: 86.97, endSeconds: 89.23, text: "" },
  { startSeconds: 89.23, endSeconds: 91.58, text: "" },
  { startSeconds: 91.58, endSeconds: 93.83, text: "" },
  { startSeconds: 93.83, endSeconds: 96.12, text: "" },
  { startSeconds: 96.12, endSeconds: 98.39, text: "" },
  { startSeconds: 98.39, endSeconds: 100.5, text: "" },
  { startSeconds: 100.7, endSeconds: 102.98, text: "" },
  { startSeconds: 102.98, endSeconds: 105.27, text: "" },
  { startSeconds: 105.27, endSeconds: 107.54, text: "" },
  { startSeconds: 107.54, endSeconds: 109.82, text: "" },
  { startSeconds: 109.82, endSeconds: 112.12, text: "" },
  { startSeconds: 112.12, endSeconds: 114.4, text: "" },
  { startSeconds: 114.4, endSeconds: 117.28, text: "" },
  { startSeconds: 117.28, endSeconds: 119.05, text: "" },
  { startSeconds: 121.23, endSeconds: 123.54, text: "" },
  { startSeconds: 123.54, endSeconds: 124.73, text: "" },
  { startSeconds: 124.73, endSeconds: 125.86, text: "" },
  { startSeconds: 125.86, endSeconds: 127.84, text: "" },
  { startSeconds: 127.84, endSeconds: 130.44, text: "" },
  { startSeconds: 130.44, endSeconds: 133.24, text: "" },
  { startSeconds: 133.24, endSeconds: 134.42, text: "" },
  { startSeconds: 134.42, endSeconds: 135.59, text: "" },
  { startSeconds: 135.59, endSeconds: 139.58, text: "" },
  { startSeconds: 139.58, endSeconds: 141.83, text: "" },
  { startSeconds: 141.83, endSeconds: 144.08, text: "" },
  { startSeconds: 144.08, endSeconds: 146.39, text: "" },
  { startSeconds: 146.39, endSeconds: 148.67, text: "" },
  { startSeconds: 148.67, endSeconds: 150.98, text: "" },
  { startSeconds: 150.98, endSeconds: 153.24, text: "" },
  { startSeconds: 153.24, endSeconds: 155.74, text: "" },
  { startSeconds: 155.74, endSeconds: 157.81, text: "" },
  { startSeconds: 157.81, endSeconds: 160.12, text: "" },
  { startSeconds: 160.12, endSeconds: 162.42, text: "" },
  { startSeconds: 162.42, endSeconds: 164.71, text: "" },
  { startSeconds: 164.71, endSeconds: 166.97, text: "" },
  { startSeconds: 166.97, endSeconds: 169.26, text: "" },
  { startSeconds: 169.26, endSeconds: 171.56, text: "" },
  { startSeconds: 171.56, endSeconds: 174.42, text: "" },
  { startSeconds: 174.42, endSeconds: 176.12, text: "" },
];

const doormomoLyricTextByStart: Readonly<Record<number, string>> = {
  9.27: "Baila para mí",
  11.51: "Baila para mí",
  12.73: "You got me, papi",
  13.88: "Baila para mí",
  15.78: "저기 불어오는 바닷바람이",
  18.41: "파도를 만들어 춤추게 하듯",
  21.26: "You got me dancing",
  22.46: "Baila para mí",
  23.59: "Give it to me, papi",
  27.53: "춤을 춰 춤을 춰",
  29.87: "Dancing like no mañana",
  32.1: "Summer time, summer time",
  34.39: "기집애들 이뻐",
  36.68: "Pop the bottle up, face down",
  38.99: "너와 난 조금 바뻐",
  41.26: "Keep the base up, face down",
  43.52: "부딪혀 나의 Bumpa",
  45.85: "부딪혀 나의 Bumpa",
  48.12: "부딪혀 나의 Bumpa",
  50.4: "부딪혀 나의 Bumpa",
  52.68: "부딪혀 나의 Bumpa",
  54.97: "부딪혀 나의 Bumpa",
  57.27: "부딪혀 나의 Bumpa",
  59.55: "부딪혀 나의 Bumpa, paw, paw, paw",
  62.47: "Paw, paw, paw, paw, paw, paw",
  64.12: "Yeah, yuh, BIBI in hurry",
  67.04: "오늘이 끝인 듯하지",
  69.3: "사랑을 나누지 달리 뜨거운 날 할게 없지",
  74.1: "So we dancing like uah",
  75.82: "음악은 점점 가네 둔탁",
  78.4: "So you got the move",
  79.56: "Baby, I got one too",
  80.69: "나를 위해 움직여 One",
  82.44: "춤을 춰 춤을 춰",
  84.69: "Dancing like no mañana",
  86.97: "Summer time, summer time",
  89.23: "기집애들 이뻐",
  91.58: "Pop the bottle up, face down",
  93.83: "너와 난 조금 바뻐",
  96.12: "Keep the base up, face down",
  98.39: "부딪혀 나의 Bumpa",
  100.7: "부딪혀 나의 Bumpa",
  102.98: "부딪혀 나의 Bumpa",
  105.27: "부딪혀 나의 Bumpa",
  107.54: "부딪혀 나의 Bumpa",
  109.82: "부딪혀 나의 Bumpa",
  112.12: "부딪혀 나의 Bumpa",
  114.4: "부딪혀 나의 Bumpa, paw, paw, paw",
  117.28: "Paw, paw, paw, paw, paw, paw",
  121.23: "Baila para mí",
  123.54: "Baila para mí",
  124.73: "You got me, papi",
  125.86: "Baila para mí",
  127.84: "저기 불어오는 바닷바람이",
  130.44: "파도를 만들어 춤추게 하듯",
  133.24: "You got me dancing",
  134.42: "Baila para mí",
  135.59: "Give it to me, papi",
  139.58: "부딪혀 나의 Bumpa",
  141.83: "부딪혀 나의 Bumpa",
  144.08: "부딪혀 나의 Bumpa",
  146.39: "부딪혀 나의 Bumpa",
  148.67: "부딪혀 나의 Bumpa",
  150.98: "부딪혀 나의 Bumpa",
  153.24: "부딪혀 나의 Bumpa",
  155.74: "한번 더 아니 두번 더",
  157.81: "부딪혀 나의 Bumpa",
  160.12: "부딪혀 나의 Bumpa",
  162.42: "부딪혀 나의 Bumpa",
  164.71: "부딪혀 나의 Bumpa",
  166.97: "부딪혀 나의 Bumpa",
  169.26: "부딪혀 나의 Bumpa",
  171.56: "부딪혀 나의 Bumpa, paw, paw, paw",
  174.42: "Paw, paw, paw, paw, paw, paw",
};

const doormomoLyrics: readonly LyricCue[] = doormomoLyricTiming.map((cue) => {
  const text = doormomoLyricTextByStart[cue.startSeconds];
  if (text === undefined) {
    throw new Error(`Missing doormomo lyric text at ${cue.startSeconds}s`);
  }
  return { ...cue, text };
});

export const doormomoCoverLoopTrack: CoverLoopTrack = {
  id: "doormomo",
  code: "DOORMOMO",
  displayName: "문모모",
  position: "CDM",
  title: "BUMPA",
  artist: "비비",
  media: { type: "youtube", videoId: "ngmd5ANbRmY" },
  poster: posterFor("doormomo"),
  loopVideo: loopVideoFor("doormomo"),
  objectPosition: "center",
  lyricStartSeconds: 9.27,
  lyrics: doormomoLyrics,
};

// 개발 전용 가사 타이밍 도구(CoverLoopLyricTimingTool)로 직접 찍어 확정한 구간(2026-09-22).
// 실제 재생 시각을 그대로 탭한 값이라 별도 오프셋 없이 그대로 쓴다.
const woowakgoodLyrics: readonly LyricCue[] = [
  { startSeconds: 7.46, endSeconds: 14.44, text: "왜 너에겐 그렇게 어려운지" },
  {
    startSeconds: 14.44,
    endSeconds: 21.47,
    text: "애를 쓰는 나를 제대로 봐주는 게",
  },
  {
    startSeconds: 21.47,
    endSeconds: 32.08,
    text: "너 하나에 이토록 아플 수 있음에 놀라곤 해",
  },
  {
    startSeconds: 32.08,
    endSeconds: 41.08,
    text: "고단했던 하루, 나는 꿈을 꿔도 아파",
  },
  { startSeconds: 41.08, endSeconds: 49.36, text: "너였다면 어떨 것 같아?" },
  {
    startSeconds: 49.36,
    endSeconds: 55.12,
    text: "이런 미친 날들이 네 하루가 되면 말야",
  },
  {
    startSeconds: 55.12,
    endSeconds: 69.17,
    text: "너도 나만큼 혼자 부서져 본다면 알게 될까?",
  },
  {
    startSeconds: 69.17,
    endSeconds: 76.18,
    text: "가슴이 터질 듯 날 가득 채운 통증과",
  },
  { startSeconds: 76.18, endSeconds: 85, text: "얼마나 너를 원하고 있는지" },
  {
    startSeconds: 85,
    endSeconds: 89.5,
    text: "내가 너라면 그냥 날 사랑할 텐데",
  },
];

// 로스터(roster.yaml)에 없는 감독 우왁굳 — 하드코딩 게스트 컨벤션은
// src/web/toty-card/woowakgoodBonusCard.ts 참고, group-photo/groupPhotoRoster.ts와 같은 방식으로
// WOOWAKGOOD_BONUS_STREAMER를 재사용한다.
export const woowakgoodCoverLoopTrack: CoverLoopTrack = {
  id: WOOWAKGOOD_BONUS_STREAMER.id,
  code: "WOOWAKGOOD",
  displayName: WOOWAKGOOD_BONUS_STREAMER.displayName,
  position: WOOWAKGOOD_BONUS_STREAMER.hopedPosition1 ?? "ALL",
  title: "너였다면",
  artist: "정승환",
  media: { type: "youtube", videoId: "4jcWUW8_Fys" },
  poster: posterFor(WOOWAKGOOD_BONUS_STREAMER.id),
  loopVideo: loopVideoFor(WOOWAKGOOD_BONUS_STREAMER.id),
  objectPosition: "center",
  lyricStartSeconds: 7.46,
  lyrics: woowakgoodLyrics,
};

// 나머지 3명은 이번 세션에서 구현하지 않는다 — 에셋/가사가 준비되면 이 배열에 추가한다.
// 우왁굳(감독, 로스터 밖 게스트)은 선수단이 아니므로 항상 배열 맨 끝에 둔다 — 새 선수를
// 추가할 땐 이 트랙 "앞"에 끼워 넣을 것.
export const coverLoopTracks: readonly CoverLoopTrack[] = [
  hachiCoverLoopTrack,
  janineCoverLoopTrack,
  hangyeolCoverLoopTrack,
  linyaCoverLoopTrack,
  bboringirlCoverLoopTrack,
  bingmingCoverLoopTrack,
  doormomoCoverLoopTrack,
  haepalinCoverLoopTrack,
  jumengiCoverLoopTrack,
  dashibaCoverLoopTrack,
  pingguCoverLoopTrack,
  woowakgoodCoverLoopTrack,
];
