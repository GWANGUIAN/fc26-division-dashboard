/**
 * 잔디동 월페이퍼 매니페스트 — docs/wallpaper-prompts.md의 제목/참여 인물을 그대로 옮긴 것.
 * 이미지가 public/wallpapers/ 안에 있어서(src/web/assets/ 아래가 아님) import.meta.glob로
 * 자동 스캔할 수 없으므로, group-photo/toty-card처럼 코드로 직접 나열하는 대신
 * 여기에 한 번에 정리해서 관리한다(파일이 추가/삭제되면 이 배열도 같이 고쳐야 함).
 *
 * `members`는 roster.yaml의 slug(우왁굳만 예외로 "woowakgood",
 * src/web/toty-card/woowakgoodBonusCard.ts의 WOOWAKGOOD_ID와 동일) — 멤버 필터에 쓰인다.
 */
export type WallpaperCategory = "group" | "extra" | "solo";

export interface WallpaperEntry {
  /** 고유 키. 파일명과 동일해서 그대로 재사용. */
  id: string;
  /** public/wallpapers/ 안의 확장자 없는 파일명. */
  file: string;
  title: string;
  members: string[];
  category: WallpaperCategory;
}

export const WALLPAPERS: WallpaperEntry[] = [
  // --- 소그룹 (19장) ---
  { id: "wallpaper-group-01", file: "wallpaper-group-01", title: "최후의 수비라인", category: "group", members: ["janine95kim", "sjh4018", "haepalin"] },
  { id: "wallpaper-group-02", file: "wallpaper-group-02", title: "사이드라인 드리블 듀오", category: "group", members: ["hachi97", "tdnlamuron"] },
  { id: "wallpaper-group-03", file: "wallpaper-group-03", title: "패스 훈련 콤비", category: "group", members: ["kaksjak0730", "bboringirl"] },
  { id: "wallpaper-group-04", file: "wallpaper-group-04", title: "오버래핑 런", category: "group", members: ["tleod1818", "lina0108"] },
  { id: "wallpaper-group-05", file: "wallpaper-group-05", title: "천타버스 치킨집 회식", category: "group", members: ["doormomo", "tleod1818"] },
  { id: "wallpaper-group-06", file: "wallpaper-group-06", title: "전술 보드 앞에서", category: "group", members: ["woowakgood", "hachi97", "kaksjak0730"] },
  { id: "wallpaper-group-07", file: "wallpaper-group-07", title: "락커룸 파이팅 구호", category: "group", members: ["bboringirl", "ju010228", "tdnlamuron", "lina0108"] },
  { id: "wallpaper-group-08", file: "wallpaper-group-08", title: "원정 버스 안 쪽잠", category: "group", members: ["janine95kim", "sjh4018", "haepalin", "doormomo"] },
  { id: "wallpaper-group-09", file: "wallpaper-group-09", title: "결승골 다이빙 세레머니", category: "group", members: ["hachi97", "ju010228", "tdnlamuron", "kaksjak0730", "bboringirl"] },
  { id: "wallpaper-group-10", file: "wallpaper-group-10", title: "감독의 특별 골키퍼 클리닉", category: "group", members: ["woowakgood", "janine95kim"] },
  { id: "wallpaper-group-11", file: "wallpaper-group-11", title: "편의점 야식 파티", category: "group", members: ["tleod1818", "lina0108", "haepalin"] },
  { id: "wallpaper-group-12", file: "wallpaper-group-12", title: "노래방 뒷풀이", category: "group", members: ["ju010228", "tdnlamuron", "bboringirl"] },
  { id: "wallpaper-group-13", file: "wallpaper-group-13", title: "벤치 작전 브리핑", category: "group", members: ["woowakgood", "doormomo", "sjh4018", "kaksjak0730"] },
  { id: "wallpaper-group-14", file: "wallpaper-group-14", title: "빗속의 운동장", category: "group", members: ["hachi97", "lina0108"] },
  { id: "wallpaper-group-15", file: "wallpaper-group-15", title: "시상식 셀카", category: "group", members: ["janine95kim", "bboringirl", "ju010228", "woowakgood"] },
  { id: "wallpaper-group-16", file: "wallpaper-group-16", title: "보드게임 카페 대결", category: "group", members: ["sjh4018", "haepalin", "doormomo"] },
  { id: "wallpaper-group-17", file: "wallpaper-group-17", title: "헬스장 웨이트 트레이닝", category: "group", members: ["tleod1818", "sjh4018", "woowakgood"] },
  { id: "wallpaper-group-18", file: "wallpaper-group-18", title: "영화관 팝콘 데이트", category: "group", members: ["doormomo", "tleod1818", "haepalin"] },
  { id: "wallpaper-group-19", file: "wallpaper-group-19", title: "놀이공원 롤러코스터", category: "group", members: ["sjh4018", "tdnlamuron", "lina0108"] },

  // --- 추가 이미지: 화풍 다양화 (10장) ---
  { id: "wallpaper-extra-01", file: "wallpaper-extra-01", title: "리프팅 챌린지", category: "extra", members: ["ju010228", "tdnlamuron"] },
  { id: "wallpaper-extra-02", file: "wallpaper-extra-02", title: "벚꽃 아래 피크닉", category: "extra", members: ["kaksjak0730", "lina0108"] },
  { id: "wallpaper-extra-03", file: "wallpaper-extra-03", title: "진흙탕 볼 장난", category: "extra", members: ["tleod1818", "sjh4018", "haepalin"] },
  { id: "wallpaper-extra-04", file: "wallpaper-extra-04", title: "시상대 위에서", category: "extra", members: ["janine95kim", "ju010228"] },
  { id: "wallpaper-extra-05", file: "wallpaper-extra-05", title: "설날 세배", category: "extra", members: ["bboringirl", "doormomo", "woowakgood"] },
  { id: "wallpaper-extra-06", file: "wallpaper-extra-06", title: "스테인드글라스 골든부트", category: "extra", members: ["hachi97", "tdnlamuron"] },
  { id: "wallpaper-extra-07", file: "wallpaper-extra-07", title: "페이퍼크래프트 락커룸", category: "extra", members: ["kaksjak0730", "bboringirl", "ju010228"] },
  { id: "wallpaper-extra-08", file: "wallpaper-extra-08", title: "리소그래프 응원 포스터", category: "extra", members: ["lina0108", "tdnlamuron"] },
  { id: "wallpaper-extra-09", file: "wallpaper-extra-09", title: "칠판 낙서 전술 브리핑", category: "extra", members: ["woowakgood", "sjh4018", "haepalin"] },
  { id: "wallpaper-extra-10", file: "wallpaper-extra-10", title: "캠프파이어 앞에서", category: "extra", members: ["janine95kim", "tleod1818"] },

  // --- 개인 솔로 (12명 × 2장 = 24장) ---
  { id: "wallpaper-solo-janine95kim-1", file: "wallpaper-solo-janine95kim-1", title: "결정적인 다이빙 세이브", category: "solo", members: ["janine95kim"] },
  { id: "wallpaper-solo-janine95kim-2", file: "wallpaper-solo-janine95kim-2", title: "회식 자리 건배", category: "solo", members: ["janine95kim"] },
  { id: "wallpaper-solo-bboringirl-1", file: "wallpaper-solo-bboringirl-1", title: "락커룸, 신발끈을 묶으며", category: "solo", members: ["bboringirl"] },
  { id: "wallpaper-solo-bboringirl-2", file: "wallpaper-solo-bboringirl-2", title: "치비 프로필", category: "solo", members: ["bboringirl"] },
  { id: "wallpaper-solo-sjh4018-1", file: "wallpaper-solo-sjh4018-1", title: "헤더 경합", category: "solo", members: ["sjh4018"] },
  { id: "wallpaper-solo-sjh4018-2", file: "wallpaper-solo-sjh4018-2", title: "겨울 패딩 입고 원정길", category: "solo", members: ["sjh4018"] },
  { id: "wallpaper-solo-doormomo-1", file: "wallpaper-solo-doormomo-1", title: "캡틴의 전술 노트", category: "solo", members: ["doormomo"] },
  { id: "wallpaper-solo-doormomo-2", file: "wallpaper-solo-doormomo-2", title: "시상식 정장", category: "solo", members: ["doormomo"] },
  { id: "wallpaper-solo-hachi97-1", file: "wallpaper-solo-hachi97-1", title: "필살 슈팅", category: "solo", members: ["hachi97"] },
  { id: "wallpaper-solo-hachi97-2", file: "wallpaper-solo-hachi97-2", title: "편의점 야식 컵라면", category: "solo", members: ["hachi97"] },
  { id: "wallpaper-solo-kaksjak0730-1", file: "wallpaper-solo-kaksjak0730-1", title: "프리킥 앞에서", category: "solo", members: ["kaksjak0730"] },
  { id: "wallpaper-solo-kaksjak0730-2", file: "wallpaper-solo-kaksjak0730-2", title: "카페에서의 오후", category: "solo", members: ["kaksjak0730"] },
  { id: "wallpaper-solo-ju010228-1", file: "wallpaper-solo-ju010228-1", title: "결승골의 순간", category: "solo", members: ["ju010228"] },
  { id: "wallpaper-solo-ju010228-2", file: "wallpaper-solo-ju010228-2", title: "원정 숙소, 잠옷 차림", category: "solo", members: ["ju010228"] },
  { id: "wallpaper-solo-tleod1818-1", file: "wallpaper-solo-tleod1818-1", title: "오버래핑 크로스", category: "solo", members: ["tleod1818"] },
  { id: "wallpaper-solo-tleod1818-2", file: "wallpaper-solo-tleod1818-2", title: "노래방 마이크", category: "solo", members: ["tleod1818"] },
  { id: "wallpaper-solo-lina0108-1", file: "wallpaper-solo-lina0108-1", title: "사이드라인 드리블 돌파", category: "solo", members: ["lina0108"] },
  { id: "wallpaper-solo-lina0108-2", file: "wallpaper-solo-lina0108-2", title: "장난스러운 셀카", category: "solo", members: ["lina0108"] },
  { id: "wallpaper-solo-haepalin-1", file: "wallpaper-solo-haepalin-1", title: "완벽한 태클", category: "solo", members: ["haepalin"] },
  { id: "wallpaper-solo-haepalin-2", file: "wallpaper-solo-haepalin-2", title: "여름 바닷가 나들이", category: "solo", members: ["haepalin"] },
  { id: "wallpaper-solo-tdnlamuron-1", file: "wallpaper-solo-tdnlamuron-1", title: "스피드 돌파", category: "solo", members: ["tdnlamuron"] },
  { id: "wallpaper-solo-tdnlamuron-2", file: "wallpaper-solo-tdnlamuron-2", title: "공원 산책", category: "solo", members: ["tdnlamuron"] },
  { id: "wallpaper-solo-woowakgood-1", file: "wallpaper-solo-woowakgood-1", title: "사이드라인의 지휘", category: "solo", members: ["woowakgood"] },
  { id: "wallpaper-solo-woowakgood-2", file: "wallpaper-solo-woowakgood-2", title: "회식 자리 건배사", category: "solo", members: ["woowakgood"] },

  // --- 하치_HACHI 추가 솔로 (4장) ---
  { id: "wallpaper-hachi-01", file: "wallpaper-hachi-01", title: "노을 아래 마지막 슈팅", category: "solo", members: ["hachi97"] },
  { id: "wallpaper-hachi-02", file: "wallpaper-hachi-02", title: "훈련 후 인터뷰", category: "solo", members: ["hachi97"] },
  { id: "wallpaper-hachi-03", file: "wallpaper-hachi-03", title: "경기장 앞 동상", category: "solo", members: ["hachi97"] },
  { id: "wallpaper-hachi-04", file: "wallpaper-hachi-04", title: "골목 벽화 속 하치", category: "solo", members: ["hachi97"] },
];

export function wallpaperFullUrl(file: string): string {
  return `/wallpapers/${file}.webp`;
}

export function wallpaperThumbUrl(file: string): string {
  return `/wallpapers/thumbs/${file}.webp`;
}
