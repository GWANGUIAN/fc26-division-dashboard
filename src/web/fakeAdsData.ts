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
    id: "bmw",
    image: "/fake-ads/ad-bmw.webp",
    href: "https://www.sooplive.com/station/ecvhao/post/207633197",
    label: "차가리",
  },
  {
    id: "hiki",
    image: "/fake-ads/ad-hiki.webp",
    href: "https://vod.sooplive.com/player/207949483",
    label: "이게 어려워?",
  },
  {
    id: "dashiba",
    image: "/fake-ads/ad-dashiba.webp",
    href: "https://vod.sooplive.com/player/207820227?change_second=51",
    label: "어깨 누르기",
  },
  {
    id: "wow",
    image: "/fake-ads/ad-wow.webp",
    href: "https://www.sooplive.com/station/ecvhao/post/208244861",
    label: "와우...",
  },
  {
    id: "first",
    image: "/fake-ads/ad-first.webp",
    href: "https://vod.sooplive.com/player/208382975?change_second=2359",
    label: "잔디동 첫모임",
  },
];
