import hachiThumb from "./assets/vrchat/hachi97.webp";
import janineThumb from "./assets/vrchat/janine95kim.webp";
// import haepalinThumb from "./assets/vrchat/haepalin.webp";
// import bingmingThumb from "./assets/vrchat/tleod1818.webp";
import jumengiThumb from "./assets/vrchat/ju010228.webp";
import vrchatLogo from "./assets/vrchat/vrchat-logo.webp";

type VrchatAvatar = { name: string; url: string; thumbnail: string };

// Keyed by streamer id (= soopId). Only streamers who have approved
// their fan-character avatar being linked are enabled; the rest are
// implemented but commented out until permission is granted.
const VRCHAT_AVATARS: Record<string, VrchatAvatar> = {
  hachi97: {
    name: "용볼이",
    url: "https://vrchat.com/home/avatar/avtr_e4fdbc47-9fcb-4944-b39f-c9759c0792c9",
    thumbnail: hachiThumb,
  },
  janine95kim: {
    name: "구르미",
    url: "https://vrchat.com/home/avatar/avtr_02d97d10-23f8-48bb-b880-d6b1556ffe41",
    thumbnail: janineThumb,
  },
  // haepalin: {
  //   name: "해피",
  //   url: "https://vrchat.com/home/avatar/avtr_bc8ba5b6-93e0-477d-a2fc-6669374b169a",
  //   thumbnail: haepalinThumb,
  // },
  // tleod1818: {
  //   name: "봉밥이",
  //   url: "https://vrchat.com/home/avatar/avtr_f88a7660-9641-49ec-b14e-8a2387eba491",
  //   thumbnail: bingmingThumb,
  // },
  ju010228: {
    name: "돌멩이",
    url: "https://vrchat.com/home/avatar/avtr_cad67ddf-dcc8-4090-b1cd-6bac61c81bfb",
    thumbnail: jumengiThumb,
  },
};

export function VrchatAvatarLink({ streamerId }: { streamerId: string }) {
  const avatar = VRCHAT_AVATARS[streamerId];
  if (!avatar) return null;
  return (
    <a
      className="vrchat-avatar-link"
      href={avatar.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${avatar.name} VRChat 아바타 다운로드 (새 창)`}
    >
      <img
        className="vrchat-avatar-link__thumb"
        src={avatar.thumbnail}
        alt=""
        loading="lazy"
      />
      <span className="vrchat-avatar-link__text">
        <span className="vrchat-avatar-link__name">
          {avatar.name} VRChat 아바타
        </span>
        <span className="vrchat-avatar-link__cta">다운로드 ↗</span>
      </span>
      <img
        className="vrchat-avatar-link__logo"
        src={vrchatLogo}
        alt="VRChat"
        loading="lazy"
      />
    </a>
  );
}
