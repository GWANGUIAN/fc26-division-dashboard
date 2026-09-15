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
    id: "bingming",
    image: "/fake-ads/ad-bingming.webp",
    href: "https://vod.sooplive.com/player/206243369?change_second=33",
    label: "초보.빙밍",
  },
  {
    id: "hachi",
    image: "/fake-ads/ad-hachi.webp",
    href: "https://vod.sooplive.com/player/207076087",
    label: "우왁굳의 은밀한 과외",
  },
  {
    id: "bboringirl",
    image: "/fake-ads/ad-bboringirl.webp",
    href: "https://vod.sooplive.com/player/205333447/catch?szSearchTnoList=205333447",
    label: "치즈 중독자 뽀린걸",
  },
  {
    id: "wowhachi",
    image: "/fake-ads/ad-wowhachi.webp",
    href: "https://vod.sooplive.com/player/207158227",
    label: "두고하치...",
  },
  {
    id: "panzee",
    image: "/fake-ads/ad-panzee.webp",
    href: "https://vod.sooplive.com/player/206149139/catch",
    label: "야추털",
  },
  {
    id: "haeparin",
    image: "/fake-ads/ad-haeparin.webp",
    href: "https://vod.sooplive.com/player/206811383/catch?szSearchTnoList=206811383-206811153",
    label: "해피해피해파린🪼",
  },
];
