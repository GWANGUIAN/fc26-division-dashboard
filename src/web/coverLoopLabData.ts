// 포스터/루프 영상은 파일명 규칙(<id>-cover-poster.*, <id>-cover-loop.mp4)만 지키면 이 글롭이
// 알아서 찾아준다 — 멤버가 늘어도 이 파일에 import 문을 추가할 필요가 없다. mp4는 ?url로
// 받아 20MB 파일 바이트가 JS 번들에 들어가지 않고 빌드타임 URL 문자열만 남게 한다.
const posterModules = import.meta.glob<string>("./assets/cover-loop/*-cover-poster.{webp,png}", {
  eager: true,
  import: "default",
});
const loopVideoModules = import.meta.glob<string>("./assets/cover-loop/*-cover-loop.mp4", {
  eager: true,
  import: "default",
  query: "?url",
});

function posterFor(id: string): string {
  const entry = Object.entries(posterModules).find(([path]) => path.includes(`/${id}-cover-poster.`));
  if (!entry) throw new Error(`Missing cover-loop poster asset for "${id}"`);
  return entry[1];
}

function loopVideoFor(id: string): string | undefined {
  return Object.entries(loopVideoModules).find(([path]) => path.includes(`/${id}-cover-loop.mp4`))?.[1];
}

export type LyricCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type CoverLoopMedia = {
  type: "youtube";
  videoId: string;
};

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
  { startSeconds: 54.82, endSeconds: 59.85, text: "揺れたマリーゴールドに似てる" },
  { startSeconds: 59.85, endSeconds: 64.33, text: "あれは空がまだ青い夏のこと" },
  { startSeconds: 64.33, endSeconds: 69.17, text: "懐かしいと笑えたあの日の恋" },
  { startSeconds: 69.17, endSeconds: 72.89, text: "「もう離れないで」と" },
  { startSeconds: 72.89, endSeconds: 77.95, text: "泣きそうな目で見つめる君を" },
  { startSeconds: 77.95, endSeconds: 82.51, text: "雲のような優しさでそっとぎゅっと" },
  { startSeconds: 82.51, endSeconds: 88.24, text: "抱きしめて 抱きしめて 離さない" },
  { startSeconds: 92.05, endSeconds: 95.41, text: "本当の気持ち全部" },
  { startSeconds: 95.41, endSeconds: 100.57, text: "吐き出せるほど強くはない" },
  { startSeconds: 100.57, endSeconds: 105.38, text: "でも不思議なくらいに" },
  { startSeconds: 105.38, endSeconds: 109.54, text: "絶望は見えない" },
  { startSeconds: 109.92, endSeconds: 114.45, text: "目の奥にずっと写るシルエット" },
  { startSeconds: 114.45, endSeconds: 117.83, text: "大好きさ" },
  { startSeconds: 117.86, endSeconds: 122.68, text: "柔らかな肌を寄せあい" },
  { startSeconds: 122.68, endSeconds: 127.74, text: "少し冷たい空気を2人" },
  { startSeconds: 127.74, endSeconds: 131.43, text: "かみしめて歩く今日という日に" },
  { startSeconds: 131.43, endSeconds: 137.07, text: "何と名前をつけようかなんて話して" },
  { startSeconds: 137.1, endSeconds: 141.9, text: "ああ アイラブユーの言葉じゃ" },
  { startSeconds: 141.9, endSeconds: 145.86, text: "足りないからとキスして" },
  { startSeconds: 145.86, endSeconds: 150.41, text: "雲がまだ2人の影を残すから" },
  { startSeconds: 150.41, endSeconds: 156.12, text: "いつまでも いつまでも このまま" },
  { startSeconds: 156.38, endSeconds: 161.71, text: "遥か遠い場所にいても" },
  { startSeconds: 161.71, endSeconds: 165.09, text: "繋がっていたいなあ" },
  { startSeconds: 165.09, endSeconds: 169.64, text: "2人の想いが" },
  { startSeconds: 169.64, endSeconds: 175.44, text: "同じでありますように" },
  { startSeconds: 188.02, endSeconds: 192.9, text: "麦わらの帽子の君が" },
  { startSeconds: 192.9, endSeconds: 197.91, text: "揺れたマリーゴールドに似てる" },
  { startSeconds: 197.91, endSeconds: 202.47, text: "あれは空がまだ青い夏のこと" },
  { startSeconds: 202.47, endSeconds: 207.32, text: "懐かしいと笑えたあの日の恋" },
  { startSeconds: 207.34, endSeconds: 211.01, text: "「もう離れないで」と" },
  { startSeconds: 211.01, endSeconds: 216.07, text: "泣きそうな目で見つめる君を" },
  { startSeconds: 216.07, endSeconds: 220.56, text: "雲のような優しさでそっとぎゅっと" },
  { startSeconds: 220.56, endSeconds: 225.41, text: "抱きしめて離さない" },
  { startSeconds: 225.42, endSeconds: 230.16, text: "ああ アイラブユーの言葉じゃ" },
  { startSeconds: 230.16, endSeconds: 234.14, text: "足りないからとキスして" },
  { startSeconds: 234.14, endSeconds: 238.72, text: "雲がまだ2人の影を残すから" },
  { startSeconds: 238.72, endSeconds: 245.0, text: "いつまでも いつまでも このまま" },
  { startSeconds: 247.21, endSeconds: 251.05, text: "離さない" },
  { startSeconds: 251.05, endSeconds: 258.22, text: "いつまでも いつまでも 離さない" },
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

// 개발 전용 가사 타이밍 도구(CoverLoopLyricTimingTool)로 직접 찍어 확정한 구간(2026-09-22).
// 실제 재생 시각을 그대로 탭한 값이라 별도 오프셋 없이 그대로 쓴다.
const janineLyrics: readonly LyricCue[] = [
  { startSeconds: 0.48, endSeconds: 4.09, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 4.09, endSeconds: 7.33, text: "나를 바라봐줘, 좀 더!" },
  { startSeconds: 7.33, endSeconds: 16.51, text: '보답으로는 "사랑을 가득 담은 입맞춤으로"' },
  { startSeconds: 16.51, endSeconds: 21.54, text: "꿈이 아니야, 모두가 보고 있어" },
  { startSeconds: 21.54, endSeconds: 27.12, text: "하트를 만들어 사랑을 보내주세요" },
  { startSeconds: 27.12, endSeconds: 32.52, text: "할 수 있는 건 뭐든지 다 할게요" },
  { startSeconds: 32.52, endSeconds: 37.93, text: "멈추지 않을거야, 최선을 다 할거니까" },
  { startSeconds: 37.93, endSeconds: 40.62, text: "어쩌다가 보게 된 비난의 댓글" },
  { startSeconds: 40.62, endSeconds: 43.32, text: "웃기지마! 제대로 알지도 못하면서" },
  { startSeconds: 43.32, endSeconds: 48.36, text: "그래도 괜찮아, 무대 위에 서면 모두가 있어" },
  { startSeconds: 48.36, endSeconds: 49.62, text: '"갑니다!"' },
  { startSeconds: 49.62, endSeconds: 52.14, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 52.14, endSeconds: 54.84, text: "나를 바라봐줘, 좀 더!" },
  { startSeconds: 54.84, endSeconds: 60.24, text: '보답으로는 "사랑을 가득 담은 입맞춤으로"' },
  { startSeconds: 60.24, endSeconds: 62.94, text: "사로잡아 볼게, 좀 더!" },
  { startSeconds: 62.94, endSeconds: 65.82, text: "꿈을 보여줄게, 좀 더!" },
  { startSeconds: 65.82, endSeconds: 72.3, text: "마음껏 즐겨줘, 사랑을 가득담은 스페셜 나이트" },
  { startSeconds: 72.3, endSeconds: 85.26, text: "팬썹해줄거야!" },
  { startSeconds: 85.26, endSeconds: 89.76, text: "편지도 많이 적어서 보내주세요" },
  { startSeconds: 89.76, endSeconds: 95.34, text: "소중히 읽어보고 보물로 간직할게요" },
  { startSeconds: 95.34, endSeconds: 100.74, text: "스캔들은, 제게는 이르지만" },
  { startSeconds: 100.74, endSeconds: 106.14, text: "배신하지 않아요 미리 선언해둘게요" },
  { startSeconds: 106.14, endSeconds: 108.84, text: "질투와 괴롭힘에는 절대 지지 않아" },
  { startSeconds: 108.84, endSeconds: 111.72, text: "웃기지마! 실력으로 이겨줄거야" },
  { startSeconds: 111.72, endSeconds: 116.76, text: "그러니 절대로 그만두지 않아 지기 싫으니까" },
  { startSeconds: 116.76, endSeconds: 117.84, text: '"갑니다!"' },
  { startSeconds: 117.84, endSeconds: 120.18, text: "손을 높이 들고, 좀 더!" },
  { startSeconds: 120.18, endSeconds: 123.06, text: "땀을 흘려가며, 좀 더!" },
  { startSeconds: 123.06, endSeconds: 128.46, text: '보답으로는 "사랑을 가득담은 재닌빔으로"' },
  { startSeconds: 128.46, endSeconds: 131.16, text: "크게 외쳐줄래, 좀 더!" },
  { startSeconds: 131.16, endSeconds: 133.86, text: "아직 부족한걸, 좀 더!" },
  { startSeconds: 133.86, endSeconds: 140.52, text: '기쁘게 받아줘 "사랑을 가득담은 당신을 위한 노래"' },
  // 다음 줄이 143.39초에 시작해서, 겹치지 않도록 이 줄의 끝을 148.52 → 143.39로 당겼다
  // (시작 시각 140.52는 그대로).
  { startSeconds: 140.52, endSeconds: 143.39, text: "팬썹해줄거야!" },
  // 여기부터 끝까지는 사용자가 직접 탭해 확정한 타임라인(2026-09-22, 가사 한 곳 수정 포함).
  { startSeconds: 143.39, endSeconds: 152.75, text: "아아, 이제 점점 끝이 보여 아쉬워지네" },
  { startSeconds: 152.75, endSeconds: 157.79, text: "즐거우면서도, 눈물이 나는걸" },
  { startSeconds: 157.79, endSeconds: 163.19, text: "다음에, 또다시... 만날 수 있는거지?" },
  { startSeconds: 163.19, endSeconds: 174.16, text: '"약속이야!"' },
  { startSeconds: 174.16, endSeconds: 177.04, text: "상냥함이 가득 넘쳐흐르는 칭찬들도" },
  { startSeconds: 177.04, endSeconds: 179.74, text: "마음이 담기지 않은 누군가의 빈말도" },
  { startSeconds: 179.74, endSeconds: 182.63, text: "전부 필요해 필요하다구" },
  { startSeconds: 182.63, endSeconds: 185.68, text: "더 강해질 거야" },
  { startSeconds: 185.68, endSeconds: 188.56, text: "마음껏 소리쳐! 좀 더!" },
  { startSeconds: 188.56, endSeconds: 191.26, text: "즐겨 보는 거야! 좀 더!" },
  { startSeconds: 191.26, endSeconds: 196.66, text: "절대 잊지 못할 아주 특별한 날이 될 수 있도록" },
  { startSeconds: 196.66, endSeconds: 199.18, text: "함께 노래해줘 계속!" },
  { startSeconds: 199.18, endSeconds: 202.24, text: "같이 걸어가줘 계속!" },
  { startSeconds: 202.24, endSeconds: 207.64, text: "우리의 암호는 아주 특별한 L.O.V.E" },
  { startSeconds: 207.64, endSeconds: 210.34, text: "좋아하게 돼서, 좀 더!" },
  { startSeconds: 210.34, endSeconds: 213.22, text: "나를 바라봐줘, 좀 더!" },
  { startSeconds: 213.22, endSeconds: 218.62, text: '보답으로는 "사랑을 가득 담은 입맞춤으로"' },
  { startSeconds: 218.62, endSeconds: 221.14, text: "사로잡아 볼게, 좀 더!" },
  { startSeconds: 221.14, endSeconds: 224.02, text: "꿈을 보여줄게, 좀 더!" },
  { startSeconds: 224.02, endSeconds: 230.68, text: "마음껏 즐겨줘, 사랑을 가득담은 스페셜 나이트" },
  { startSeconds: 230.68, endSeconds: 238.68, text: "팬썹해줄거야!" },
];

export const janineCoverLoopTrack: CoverLoopTrack = {
  id: "janine95kim",
  code: "JANINE",
  displayName: "재닌",
  position: "GK",
  title: "팬서비스",
  artist: "허니웍스",
  media: { type: "youtube", videoId: "pRz3SKnBF1Y" },
  poster: posterFor("janine95kim"),
  loopVideo: loopVideoFor("janine95kim"),
  objectPosition: "center",
  lyricStartSeconds: 0.48,
  lyrics: janineLyrics,
};

// 사용자가 직접 탭해 확정한 타임라인(2026-09-22). 실제 재생 시각을 그대로 쓴다.
const hangyeolLyrics: readonly LyricCue[] = [
  { startSeconds: 9.57, endSeconds: 17.67, text: "아마도 우리는 모두 역할이 있을지 몰라" },
  { startSeconds: 17.67, endSeconds: 25.23, text: "무대 위의 발을 맞출 때면 한 장을 또 넘겨가고," },
  { startSeconds: 25.23, endSeconds: 33.32, text: "커튼콜은 내려왔어 화톳불에 둘러 앉고" },
  { startSeconds: 33.32, endSeconds: 41.6, text: "먼지쌓인 옛날 추억들이 갑자기 찾아오는걸" },
  { startSeconds: 41.6, endSeconds: 45.92, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 45.92, endSeconds: 49.71, text: "기다렸고 기다렸지" },
  { startSeconds: 49.71, endSeconds: 53.67, text: "막이 내리면 그리울까?" },
  { startSeconds: 53.67, endSeconds: 57.44, text: "후련했고 섭섭했지" },
  { startSeconds: 57.44, endSeconds: 65.37, text: "끝났다는 것은 다시 시작된다는 것을" },
  { startSeconds: 65.37, endSeconds: 72.56, text: "잊는다는 것도 역시 비워둔다는 것을" },
  { startSeconds: 72.56, endSeconds: 80.3, text: "아마도 그 이야기를 이어가고 싶었나봐" },
  { startSeconds: 80.3, endSeconds: 88.22, text: "아직도 파란 불빛 앞에서 그 때의 흔적을 찾고," },
  { startSeconds: 88.22, endSeconds: 96.14, text: "다시 돌릴 수도 없는 태엽은 푹 잠들었어" },
  { startSeconds: 96.14, endSeconds: 104.6, text: "희미해진 빛도, 노랫말도, 다시금 찾아오겠지" },
  { startSeconds: 104.6, endSeconds: 108.56, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 108.56, endSeconds: 112.52, text: "기다렸고 기다렸지" },
  { startSeconds: 112.52, endSeconds: 116.48, text: "막이 내리면 그리울까?" },
  { startSeconds: 116.48, endSeconds: 120.44, text: "후련했고 섭섭했지" },
  { startSeconds: 120.44, endSeconds: 128.18, text: "끝났다는 것은 다시 시작된다는 것을" },
  { startSeconds: 128.18, endSeconds: 152.3, text: "잊는다는 것도 역시 비워둔다는 것을" },
  { startSeconds: 152.3, endSeconds: 159.86, text: "다음 열차는 오고있고 방명록은 열어뒀어" },
  { startSeconds: 159.86, endSeconds: 171.92, text: "잠궈놓았던 세상 속을 다시 어지럽힐거야" },
  { startSeconds: 171.92, endSeconds: 175.52, text: "다음 작품에 봄은 올까?" },
  { startSeconds: 175.52, endSeconds: 179.48, text: "기다렸고 기다렸지" },
  { startSeconds: 179.48, endSeconds: 183.72, text: "막이 내리면 그리울까?" },
  { startSeconds: 183.72, endSeconds: 187.32, text: "후련했고 섭섭했지" },
  { startSeconds: 187.32, endSeconds: 191.46, text: "물어본다면 답은 올까?" },
  { startSeconds: 191.46, endSeconds: 195.42, text: "불러봤고 또 불러봤지" },
  { startSeconds: 195.42, endSeconds: 203.34, text: "길은 언제나 나로부터 찾을 수 밖에 없는걸" },
  { startSeconds: 203.34, endSeconds: 210.9, text: "끝났다는 것은 다시 시작된다는 것을" },
  { startSeconds: 210.9, endSeconds: 219.0, text: "잊는다는 것도 역시 비워둔다는 것을" },
  { startSeconds: 219.0, endSeconds: 226.92, text: "끝났다는 것은 다시 시작된다는 것을" },
  { startSeconds: 226.92, endSeconds: 234.92, text: "잊는다는 것도 역시 비워둔다는 것을" },
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

// 나머지 8명은 이번 세션에서 구현하지 않는다 — 에셋/가사가 준비되면 이 배열에 추가한다.
export const coverLoopTracks: readonly CoverLoopTrack[] = [
  hachiCoverLoopTrack,
  janineCoverLoopTrack,
  hangyeolCoverLoopTrack,
];
