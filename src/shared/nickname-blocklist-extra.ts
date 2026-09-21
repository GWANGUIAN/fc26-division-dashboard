// Hand-maintained additions on top of the LDNOOBW lists. Add a word here when
// someone slips a bad nickname through; nothing else needs to change.
//
// Matching rules (see nickname-filter.ts): Korean entries are compared after
// the name and the entry are both broken into jamo, with spaces, digits and
// punctuation removed, so "씨1발", "ㅅㅣㅂㅏㄹ" and "시이이발" all hit "시발".
// Korean entries match anywhere inside a name (strict on purpose).

/** Korean profanity, insults, sexual and hateful words, including common spelling variants. */
export const EXTRA_KO: readonly string[] = [
  // 욕설 변형
  "시발", "시팔", "시빨", "씨빨", "씨바", "씨부랄", "시부랄", "씌발", "쒸발", "씨이발",
  "병신", "븅신", "빙신", "병쉰", "벼엉신", "등신", "머저리",
  "개새", "개색", "개쉑", "개세끼", "개새키", "개새기", "개객끼", "개년", "씹새", "십새", "십쉐",
  "쌔끼", "쉐끼", "섀끼", "새꺄", "색히", "쉑히",
  "지랄", "엿먹", "조까", "좆까", "좃까", "존나", "좆나", "조낸", "좃", "좆",
  "미친놈", "미친년", "미친새", "또라이", "돌아이", "찐따",
  "니미", "니애미", "니엄마", "느금마", "느금", "앰창", "엠창", "애미뒤", "애비뒤", "뒤져", "뒈져", "죽어라",
  // 선정적 표현
  "섹스", "섹파", "섹드립", "야동", "야설", "야사", "딸치", "딸딸이", "자위", "오나홀", "몸캠", "노콘",
  "젖꼭지", "젖탱이", "빨통", "음란", "음탕", "음순", "음경", "정액", "질싸", "질내사정", "오르가즘",
  "성관계", "성매매", "조건만남", "원나잇", "강간", "윤간", "몰카", "불법촬영", "변태",
  // 혐오 표현
  "맘충", "틀딱", "한남충", "김치녀", "된장녀", "전라디언", "홍어",
];

/**
 * Consonant-only abbreviations. They are matched only against jamo that were
 * typed on their own, never against jamo taken out of ordinary syllables,
 * so a name like "옷발" (ㅅ+ㅂ across two syllables) is not caught.
 */
export const TYPED_JAMO_ABBREVIATIONS: readonly string[] = [
  "ㅅㅂ", "ㅆㅂ", "ㅂㅅ", "ㅄ", "ㅈㄹ", "ㅈㄴ", "ㅁㅊ", "ㅅㅂㄹㅁ", "ㅆㅂㄹㅁ", "ㄲㅈ", "ㄷㅊ", "ㅅㄲ", "ㅆㄲ", "ㅁㅊㄴ",
];

/** English additions: misspellings, insults and slurs the LDNOOBW list lacks. */
export const EXTRA_EN: readonly string[] = [
  "fuk", "fck", "fcuk", "phuck", "shyt", "bytch", "biatch", "bitch", "bastard", "asshole",
  "retard", "faggot", "kys", "hitler", "nazi", "nigger", "nigga", "cunts", "cunty",
  // Korean typed with the keyboard still on English: 시발, 병신, 지랄, 존나, 미친, 섹스, 개새끼.
  "tlqkf", "qudtls", "wlfkf", "whssk", "alcls", "tprtm", "rotorl",
];

/**
 * Innocent phrases that contain a blocked word. They are cut out of a name
 * before it is checked, so "시바견" passes while "시바견씨발" is still caught
 * (the rest is checked as usual). Matching is exact and case-insensitive.
 * Real roster names that trip the lists belong here too: a test checks that
 * every streamer name in roster.yaml passes.
 */
export const ALLOWED_PHRASES: readonly string[] = [
  "시바견", "시바이누", "졸라맨", "자지러", "다시바", "느그자", "단지이럴수가", "세기",
  "essex", "sussex", "middlesex", "sextant", "sextet", "therapist",
  "advertisement", "basement", "endorsement", "casement", "abasement", "specialist",
];

/**
 * Latin words of four letters or fewer are normally matched only as a whole
 * word ("ass" must not block "Assassin", "anal" must not block "Analyst").
 * Words listed here have no innocent word containing them, so they are
 * matched anywhere inside a name.
 */
export const SUBSTRING_SHORT_LATIN: readonly string[] = ["fuck", "fck", "shit", "porn", "slut", "jizz", "sex", "nigg"];
