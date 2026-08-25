import { useEffect, useRef, useState } from "react";

const SLIDE_FALLBACK_MS = 500;
const SHUTTER_FALLBACK_MS = 500;

const SFX_URLS = [
  "/sfxes/light-on.mp3",
  "/sfxes/light-off.mp3",
  "/sfxes/turn-on.mp3",
  "/sfxes/scream.mp3",
  "/sfxes/shine.mp3",
];

const CHAT_MESSAGES: { nickname: string; text: string }[] = [
  { nickname: "유샥크", text: "아이로 진짜 왜케 잘생겼냐 미쳤다💛💚" },
  { nickname: "독고혜지", text: "아이로 최고야 너무 멋있어💚💛" },
  { nickname: "땃쥐", text: "아이로형, 너무 멋있어요." },
  { nickname: "사라정", text: "아이로 오빠, so handsome💛" },
  { nickname: "유키라", text: "아이로 없인 못 살아ㅠㅠ💚💛" },
  { nickname: "제갈금자", text: "선우야, 너가 너무 자랑스러워" },
  { nickname: "하로하", text: "아이로 사랑해 진짜 최고야💛" },
  { nickname: "플러그대장", text: "오늘도 아이로 보러 출근합니다💛💚" },
  { nickname: "유샥크", text: "라이트 온 미쳤다 진짜ㅠㅠ💚" },
  { nickname: "독고혜지", text: "심쿵사 할 듯💚💛" },
  { nickname: "유키라", text: "아이로 진짜 사랑해💛💚" },
  { nickname: "땃쥐", text: "아이로형 오늘도 짱이에요💛" },
  { nickname: "사라정", text: "아이로 오빠 완전 legend야" },
  { nickname: "제갈금자", text: "선우야 오늘 진짜 빛났어💛" },
  { nickname: "하로하", text: "아이로 보고있으면 힐링된다💚" },
  { nickname: "찐플러그", text: "심장 나갈 것 같아 아이로야💛💚💛" },
  { nickname: "만년플러그", text: "이 무대 평생 갈 것 같아💚💛" },
  { nickname: "플러그1호", text: "아이로 너무 빛나💛💚💛" },
];

const CHAT_COLORS = [
  "#ffd93d",
  "#6bff8f",
  "#7ecbff",
  "#ff8fd6",
  "#ffa552",
  "#a78bff",
  "#5ce1e6",
  "#ff6b6b",
];

function colorForNickname(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CHAT_COLORS[hash % CHAT_COLORS.length];
}

const CHAT_BADGES = [
  "/icons/flug-1.webp",
  "/icons/flug-2.webp",
  "/icons/flug-3.webp",
  "/icons/flug-4.webp",
  "/icons/flug-5.webp",
  "/icons/flug-6.webp",
];

function badgeForNickname(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 17 + name.charCodeAt(i)) >>> 0;
  }
  return CHAT_BADGES[hash % CHAT_BADGES.length];
}

export function BrightnessGag() {
  useEffect(() => {
    const warmups = SFX_URLS.map((src) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      return audio;
    });
    return () => {
      warmups.forEach((audio) => {
        audio.src = "";
      });
    };
  }, []);

  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introPhase, setIntroPhase] = useState<"slide" | "shutter">("slide");
  const [slideDurationMs, setSlideDurationMs] = useState(SLIDE_FALLBACK_MS);
  const [shutterDurationMs, setShutterDurationMs] = useState(SHUTTER_FALLBACK_MS);
  const [chatFeed, setChatFeed] = useState<
    { id: number; nickname: string; text: string }[]
  >([]);
  const chatIndexRef = useRef(0);
  const label = active ? "라이트 오프" : "라이트 온";
  const chatVisible = introPlaying || active;

  useEffect(() => {
    if (!chatVisible) {
      chatIndexRef.current = 0;
      setChatFeed([]);
      return;
    }
    const appendMessage = () => {
      const next = CHAT_MESSAGES[chatIndexRef.current % CHAT_MESSAGES.length];
      chatIndexRef.current += 1;
      setChatFeed((current) => {
        const withNew = [...current, { id: Date.now() + Math.random(), ...next }];
        return withNew.length > 6 ? withNew.slice(withNew.length - 6) : withNew;
      });
    };
    appendMessage();
    const interval = setInterval(appendMessage, 900);
    return () => clearInterval(interval);
  }, [chatVisible]);

  function playTurnOnSound(withScream: boolean) {
    const turnOnAudio = new Audio("/sfxes/turn-on.mp3");
    if (withScream) {
      turnOnAudio.addEventListener("ended", () => {
        new Audio("/sfxes/scream.mp3").play().catch(() => {});
      });
    }
    turnOnAudio.play().catch(() => {});
  }

  function turnOn() {
    setPlaying(true);
    setIntroPhase("slide");
    setIntroPlaying(true);
    const shine = new Audio("/sfxes/shine.mp3");
    const beginSlide = () => {
      const duration = shine.duration;
      setSlideDurationMs(
        Number.isFinite(duration) && duration > 0
          ? duration * 1000
          : SLIDE_FALLBACK_MS,
      );
      shine.play().catch(() => {});
    };
    shine.addEventListener("loadedmetadata", beginSlide, { once: true });
    shine.addEventListener("error", beginSlide, { once: true });
  }

  function handleSlideEnd() {
    setIntroPhase("shutter");
    const audio = new Audio("/sfxes/light-on.mp3");
    const start = () => {
      const duration = audio.duration;
      setShutterDurationMs(
        Number.isFinite(duration) && duration > 0
          ? duration * 1000
          : SHUTTER_FALLBACK_MS,
      );
      audio.play().catch(finish);
    };
    const finish = () => {
      setPlaying(false);
      setIntroPlaying(false);
      playTurnOnSound(true);
      setActive(true);
    };
    audio.addEventListener("loadedmetadata", start, { once: true });
    audio.addEventListener("error", start, { once: true });
    audio.addEventListener("ended", finish);
  }

  function turnOff() {
    setPlaying(true);
    const audio = new Audio("/sfxes/light-off.mp3");
    const finish = () => {
      setPlaying(false);
      playTurnOnSound(false);
      setActive(false);
    };
    audio.addEventListener("ended", finish);
    audio.play().catch(finish);
  }

  function handleClick() {
    if (playing || introPlaying) return;
    if (active) turnOff();
    else turnOn();
  }

  return (
    <>
      <button
        type="button"
        className={`brightness-gag-toggle${active ? " brightness-gag-toggle--active" : ""}${!active && playing ? " brightness-gag-toggle--hidden" : ""}`}
        onClick={handleClick}
        disabled={playing || introPlaying}
        aria-pressed={active}
        aria-label="밝기 10 (경기장 화이트아웃 패러디)"
        title="밝기 10"
      >
        <span className="brightness-gag-toggle__circle">
          <img
            src="/profiles/iro.webp"
            alt=""
            aria-hidden="true"
            className="brightness-gag-toggle__photo"
          />
        </span>
        <svg
          className="brightness-gag-toggle__label"
          viewBox="0 0 128 50"
          aria-hidden="true"
        >
          <path id="brightness-gag-arc" d="M 14,15 A 64,64 0 0 0 114,15" fill="none" />
          <text>
            <textPath href="#brightness-gag-arc" startOffset="50%" textAnchor="middle">
              {label}
            </textPath>
          </text>
        </svg>
      </button>
      {introPlaying && (
        <div
          className="brightness-gag-intro"
          aria-hidden="true"
          style={
            {
              "--slide-duration": `${slideDurationMs}ms`,
              "--shutter-duration": `${shutterDurationMs}ms`,
            } as React.CSSProperties
          }
        >
          <img
            src="/profiles/iro.webp"
            alt=""
            className="brightness-gag-intro__image"
            onAnimationEnd={handleSlideEnd}
          />
          {introPhase === "shutter" && (
            <>
              <div className="brightness-gag-intro__shutter brightness-gag-intro__shutter--top" />
              <div className="brightness-gag-intro__shutter brightness-gag-intro__shutter--bottom" />
            </>
          )}
        </div>
      )}
      {active && <div className="brightness-gag-overlay" aria-hidden="true" />}
      {chatVisible && (
        <div className="brightness-gag-chat" aria-hidden="true">
          {chatFeed.map((message) => (
            <div className="brightness-gag-chat__line" key={message.id}>
              <img
                src={badgeForNickname(message.nickname)}
                alt=""
                className="brightness-gag-chat__badge"
              />
              <span
                className="brightness-gag-chat__nick"
                style={{ color: colorForNickname(message.nickname) }}
              >
                {message.nickname}
              </span>
              <span className="brightness-gag-chat__text">{message.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
