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
    id: "charlie",
    image: "/fake-ads/ad-charlie.webp",
    href: "https://vod.sooplive.com/player/207247339",
    label: "찰신",
  },
  {
    id: "wowhachi",
    image: "/fake-ads/ad-wowhachi.webp",
    href: "https://vod.sooplive.com/player/207158227",
    label: "두고하치...",
  },
  {
    id: "bmw",
    image: "/fake-ads/ad-bmw.webp",
    href: "https://www.sooplive.com/station/ecvhao/post/207633197",
    label: "차가리",
  },
  {
    id: "haeparin",
    image: "/fake-ads/ad-haeparin.webp",
    href: "https://vod.sooplive.com/player/206811383/catch?szSearchTnoList=206811383-206811153",
    label: "해피해피해파린🪼",
  },
  {
    id: "hiki",
    image: "/fake-ads/ad-hiki.webp",
    href: "https://vod.sooplive.com/player/207949483",
    label: "차가리",
  },
];
