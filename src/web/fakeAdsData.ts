export interface FakeAd {
  /** Unique key, also used as the React list key. */
  id: string;
  /** Path under /public (e.g. "/fake-ads/my-ad.png"). Recommended 160x600 or 300x600. */
  image: string;
  /** Where the tab opens on click. */
  href: string;
  /** Accessible label only (alt text / title) — not rendered as visible text. */
  label: string;
}

// Temporary placeholder list — swap `image`/`href` with real creatives.
// Drop image files into public/fake-ads/ and reference them as "/fake-ads/<file>".
// Add or remove entries freely; the rail cycles through whatever is in this array.
export const fakeAds: FakeAd[] = [
  {
    id: "wakgood",
    image: "/fake-ads/ad-wakgood.webp",
    href: "https://www.sooplive.com/station/ecvhao",
    label: "왁초리",
  },
  {
    id: "bingming",
    image: "/fake-ads/ad-bingming.webp",
    href: "https://vod.sooplive.com/player/206243369?change_second=33",
    label: "초보.빙밍",
  },
  {
    id: "jaenin",
    image: "/fake-ads/ad-jaenin.webp",
    href: "https://www.sooplive.com/station/janine95kim",
    label: "재--신",
  },
  {
    id: "linya",
    image: "/fake-ads/ad-linya.webp",
    href: "https://vod.sooplive.com/player/206348423?change_second=16553",
    label: "풀백 1황 사시노 리냐",
  },
  {
    id: "pandadin",
    image: "/fake-ads/ad-pandadin.webp",
    href: "https://vod.sooplive.com/player/205341287/catch?szSearchTnoList=205341287",
    label: "풀독오른 판다딘",
  },
  {
    id: "hachi",
    image: "/fake-ads/ad-hachi.webp",
    href: "https://www.sooplive.com/station/hachi97",
    label: "멘헤라 하치쿤",
  },
  {
    id: "yukira",
    image: "/fake-ads/ad-yukira.webp",
    href: "https://vod.sooplive.com/player/206434535/catch",
    label: "소시오패스 유키라",
  },
  {
    id: "bboringirl",
    image: "/fake-ads/ad-bboringirl.webp",
    href: "https://vod.sooplive.com/player/205333447/catch?szSearchTnoList=205333447",
    label: "치즈 중독자 뽀린걸",
  },
  {
    id: "roentgenium",
    image: "/fake-ads/ad-roentgenium.webp",
    href: "https://vod.sooplive.com/player/206526289?change_second=1185",
    label: "여없노밥",
  },
  {
    id: "panzee",
    image: "/fake-ads/ad-panzee.webp",
    href: "https://vod.sooplive.com/player/206149139/catch",
    label: "야추털",
  },
  {
    id: "jumengee",
    image: "/fake-ads/ad-jumengee.webp",
    href: "https://vod.sooplive.com/player/206796559/catch",
    label: "쥬ㅡㅡ멘",
  },
  {
    id: "haeparin",
    image: "/fake-ads/ad-haeparin.webp",
    href: "https://vod.sooplive.com/player/206811383/catch?szSearchTnoList=206811383-206811153",
    label: "해피해피해파린🪼 내가 열수 있다는 말이 안된다 말다고 기탕세해드리는 거 아닐까 이게 제작자군 해달라는 것도 아닌 것 같은데 광고 몇 개만 있는지 한번 볼 수 있나요? 이성이 잡혀야 하지 않을까 싶더니 근데 그 되게 좋았던 것 같아요. 갑자기 바로 기초 좀 꾸려주셔가지고 같이 경기를 쓸 수 있어서 계속 좋았더니 광고 없는 것 같은데 난 광고한 모할 수 있어 이거 헤피살 이런가 이거해드렸으니까 제작하는 대각자님을 부르기 위한 그 비밀의 그 모습이었다. 제작사님을 통화하기 위한 서핑세리가 아닌 아니긴 한데 아니었어 아니요. 이 사이트를 틀어서 카드 오십시오 아니야 방송화가 여러분 내일 와요. 맞아 맞아 그 감기 모일 경기학도면서 어떻게 좀 더 이십일가가 이것저것 하다 보니까 시장이 빨리 가더라고요. 원래는 혼자서 강동하고 막 혼자 있지 모니터링하거든요. 더나서 오늘은 여덟시에 커피 스트라이터 온라인 생각해요. 하나하나 대박이도손하고 다시 최근 하셨죠. 삼성 일선에 제가 쓰고 답에서 감사합니다. 옆팔이 이렇게 언젠가 만명을 모아가지고 남을 수 있는 게 맞아 계속 오르잖아요. 대부분 다 그 올라가신 분들 보면은 다음 다 일만에 쓰시면 넘어갔어요. 아마도 그런 거 보니까 지금 이제 두개가 됐으니까 몇년 있어야 될지 어떻게 해서 그런 일은 일어나지 않아요. 그러자 되는데 어떻게 해야 되냐면 내년 색요돼서 막 일만 하더라도 계속인지 많았어요.",
  },
];
