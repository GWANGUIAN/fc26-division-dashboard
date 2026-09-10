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
    label: "패러디 광고 - 왁굿",
  },
  {
    id: "bingming",
    image: "/fake-ads/ad-bingming.webp",
    href: "https://www.sooplive.com/station/tleod1818",
    label: "패러디 광고 - 빙밍",
  },
  {
    id: "chunyang",
    image: "/fake-ads/ad-chunyang.webp",
    href: "https://www.sooplive.com/station/243000/post/205727363",
    label: "패러디 광고 - 춘향",
  },
  {
    id: "five-girl",
    image: "/fake-ads/ad-five-girl.webp",
    href: "https://www.sooplive.com/station/kaksjak0730/post/205548269",
    label: "패러디 광고 - 다섯 소녀",
  },
  {
    id: "jaenin",
    image: "/fake-ads/ad-jaenin.webp",
    href: "https://www.sooplive.com/station/janine95kim",
    label: "패러디 광고 - 재닌",
  },
  {
    id: "linya",
    image: "/fake-ads/ad-linya.webp",
    href: "https://vod.sooplive.com/player/206348423?change_second=16553",
    label: "패러디 광고 - 리냐",
  },
  {
    id: "pandadin",
    image: "/fake-ads/ad-pandadin.webp",
    href: "https://vod.sooplive.com/player/205341287/catch?szSearchTnoList=205341287",
    label: "패러디 광고 - 판다딘",
  },
  {
    id: "hachi",
    image: "/fake-ads/ad-hachi.webp",
    href: "https://www.sooplive.com/station/hachi97",
    label: "패러디 광고 - 하치",
  },
  {
    id: "yukira",
    image: "/fake-ads/ad-yukira.webp",
    href: "https://vod.sooplive.com/player/206434535/catch",
    label: "패러디 광고 - 유키라",
  },
  {
    id: "bboringirl",
    image: "/fake-ads/ad-bboringirl.webp",
    href: "https://vod.sooplive.com/player/205333447/catch?szSearchTnoList=205333447",
    label: "패러디 광고 - 뽀린걸",
  },
  {
    id: "roentgenium",
    image: "/fake-ads/ad-roentgenium.webp",
    href: "https://vod.sooplive.com/player/206526289?change_second=1185",
    label: "패러디 광고 - 뢴트게늄",
  },
];
