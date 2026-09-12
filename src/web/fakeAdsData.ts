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
    image: "/fake-ads/ad-pandabi.webp",
    href: "https://vod.sooplive.com/player/206780319?change_second=28",
    label: "샤브샤브 판다비",
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
    label: "해피해피해파린🪼",
  },
];
