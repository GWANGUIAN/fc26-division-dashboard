import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronFirst,
  ChevronLast,
  ListMusic,
  Maximize,
  Minimize,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RepeatOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { coverLoopTracks, type CoverLoopTrack } from "./coverLoopLabData";
import { CoverLoopLyricTimingTool } from "./CoverLoopLyricTimingTool";
import {
  loadCoverLoopLastPlayback,
  loadCoverLoopRepeatMode,
  loadCoverLoopVolume,
  saveCoverLoopLastPlayback,
  saveCoverLoopRepeatMode,
  saveCoverLoopVolume,
} from "./coverLoopLabStorage";
import "./cover-loop-lab.css";

type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
};

type YouTubeWindow = Window & {
  YT?: {
    Player: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => YouTubePlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
  };
  onYouTubeIframeAPIReady?: () => void;
};

let youtubeApiPromise: Promise<void> | undefined;

function loadYouTubeApi(): Promise<void> {
  const youtubeWindow = window as YouTubeWindow;
  if (youtubeWindow.YT?.Player) return Promise.resolve();
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previous = youtubeWindow.onYouTubeIframeAPIReady;
      youtubeWindow.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return youtubeApiPromise;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
}

// iOS Safari has no Fullscreen API for anything but a bare <video> element, so the button only
// renders where the browser actually supports it (document.fullscreenEnabled is false there).
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () =>
      typeof document !== "undefined" && document.fullscreenElement !== null,
  );
  const supported =
    typeof document !== "undefined" && document.fullscreenEnabled;

  useEffect(() => {
    if (!supported) return;
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [supported]);

  const toggle = () => {
    if (!supported) return;
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => undefined);
    else
      void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  return { isFullscreen, toggle, supported };
}

// Not real audio analysis — a stand-in shape driven by playback time and volume, angular white
// bars, frozen under prefers-reduced-motion (docs/cover-loop-lab-next-implementation.md "UI 명세").
function CoverLoopVisualizer({
  isPlaying,
  currentTime,
  volume,
  reducedMotion,
}: {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  reducedMotion: boolean;
}) {
  const bars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        if (reducedMotion || !isPlaying || volume === 0) return 16;
        const wave =
          Math.sin(currentTime * 4.1 + index * 0.83) +
          Math.sin(currentTime * 2.2 + index * 1.91) * 0.42;
        return Math.round(12 + ((wave + 1.42) / 2.84) * (76 * (volume / 100)));
      }),
    [currentTime, isPlaying, volume, reducedMotion],
  );

  return (
    <div className="cover-loop-lab__visualizer" aria-hidden="true">
      {bars.map((height, index) => (
        <span key={index} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

/**
 * The player body used by the full-screen playlist popup (CoverLoopPlaylistOverlay.tsx).
 * `track`/`index` are only the initial selection — the NOW PLAYING playlist popover switches
 * between all of `coverLoopTracks` from here on, independent of what the caller originally passed in.
 */
export function CoverLoopStage({
  track: initialTrack,
  index: initialIndex = 1,
}: {
  track: CoverLoopTrack;
  index?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneVideoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YouTubePlayer | undefined>(undefined);
  // 재생목록을 닫았다가 다시 열었을 때 마지막으로 듣던 곡으로 복귀하기 위한 초기값. 저장된
  // 곡이 이제는 목록에 없으면(가사/에셋을 뺐거나 한 경우) 원래 initialTrack으로 되돌아간다.
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    const saved = loadCoverLoopLastPlayback();
    if (saved && coverLoopTracks.some((item) => item.id === saved.trackId))
      return saved.trackId;
    return initialTrack.id;
  });
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const playlistRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => loadCoverLoopVolume());
  const [muted, setMuted] = useState(false);
  const reducedMotion = useReducedMotion();
  const {
    isFullscreen,
    toggle: toggleFullscreen,
    supported: fullscreenSupported,
  } = useFullscreen();

  // AI 생성 영상 안내 태그 — CoverLoopPlaylistOverlay.tsx의 닫기 버튼과 같은 방식: 기본은
  // 숨겨져 있다가 마우스가 움직이면 잠깐 보였다 다시 사라진다(reduced-motion에서는 계속 표시).
  const [aiNoticeVisible, setAiNoticeVisible] = useState(() => reducedMotion);
  const aiNoticeVisibleRef = useRef(aiNoticeVisible);
  aiNoticeVisibleRef.current = aiNoticeVisible;
  const aiNoticeHideTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) setAiNoticeVisible(true);
  }, [reducedMotion]);

  useEffect(() => () => window.clearTimeout(aiNoticeHideTimerRef.current), []);

  function revealAiNotice() {
    if (reducedMotion) return;
    if (!aiNoticeVisibleRef.current) setAiNoticeVisible(true);
    window.clearTimeout(aiNoticeHideTimerRef.current);
    aiNoticeHideTimerRef.current = window.setTimeout(() => setAiNoticeVisible(false), 2500);
  }
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">(() =>
    loadCoverLoopRepeatMode(),
  );

  useEffect(() => {
    saveCoverLoopRepeatMode(repeatMode);
  }, [repeatMode]);

  const activeIndex = Math.max(
    0,
    coverLoopTracks.findIndex((item) => item.id === selectedTrackId),
  );
  const track = coverLoopTracks[activeIndex] ?? initialTrack;
  const index = coverLoopTracks.length ? activeIndex + 1 : initialIndex;

  // onStateChange is bound once inside the mount-only effect below, so it can only see fresh
  // repeatMode/activeIndex values through refs (same pattern MusicPlayer.tsx uses for trackIndex).
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  // 마지막 재생 위치 저장용 — 인터벌/언마운트 콜백에서 최신 값을 읽기 위해 매 렌더마다 갱신한다
  // (playerRef는 언마운트 시점에 이미 destroy돼 있을 수 있어 getCurrentTime()을 못 믿는다).
  const latestCurrentTimeRef = useRef(currentTime);
  latestCurrentTimeRef.current = currentTime;

  // 재생 중엔 3초마다, 일시정지로 전환되는 순간엔 즉시, 컴포넌트가 사라질 때(팝업을 닫을 때)도
  // 한 번 더 저장해 "마지막으로 재생한 곡 + 위치"가 항상 최신으로 남게 한다.
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      saveCoverLoopLastPlayback(track.id, latestCurrentTimeRef.current);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [isPlaying, track.id]);

  useEffect(() => {
    if (!ready || isPlaying) return;
    saveCoverLoopLastPlayback(track.id, latestCurrentTimeRef.current);
  }, [isPlaying, ready, track.id]);

  const latestTrackIdRef = useRef(track.id);
  latestTrackIdRef.current = track.id;
  useEffect(() => {
    return () => {
      saveCoverLoopLastPlayback(
        latestTrackIdRef.current,
        latestCurrentTimeRef.current,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      const youtubeWindow = window as YouTubeWindow;
      if (cancelled || !frameRef.current || !youtubeWindow.YT) return;
      playerRef.current = new youtubeWindow.YT.Player(frameRef.current, {
        videoId: track.media.videoId,
        playerVars: {
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          ...(track.media.startSeconds
            ? { start: track.media.startSeconds }
            : {}),
        },
        events: {
          onReady: () => {
            playerRef.current?.setVolume(volume);
            setDuration(playerRef.current?.getDuration() ?? 0);
            // 재생목록에 다시 들어왔을 때 마지막으로 듣던 위치로 되돌리되, 일시정지 상태를
            // 유지한다(자동재생하지 않음) — 저장된 곡이 지금 로드된 곡과 다르면 무시한다.
            const saved = loadCoverLoopLastPlayback();
            const restoreSeconds =
              saved && saved.trackId === track.id
                ? saved.seconds
                : (track.media.startSeconds ?? 0);
            if (restoreSeconds > 0)
              playerRef.current?.seekTo(restoreSeconds, true);
            setCurrentTime(restoreSeconds);
            setReady(true);
          },
          onStateChange: (event: { data: number }) => {
            const states = youtubeWindow.YT!.PlayerState;
            if (event.data === states.PLAYING) setIsPlaying(true);
            if (event.data === states.PAUSED) setIsPlaying(false);
            if (event.data === states.ENDED) {
              setIsPlaying(false);
              const mode = repeatModeRef.current;
              if (mode === "one") {
                const repeatingTrack = coverLoopTracks[activeIndexRef.current];
                playerRef.current?.seekTo(
                  repeatingTrack?.media.startSeconds ?? 0,
                  true,
                );
                playerRef.current?.playVideo();
              } else if (mode === "all" && coverLoopTracks.length > 0) {
                const nextIndex =
                  (activeIndexRef.current + 1) % coverLoopTracks.length;
                setSelectedTrackId(coverLoopTracks[nextIndex].id);
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the iframe player is created once per mount; later track switches reuse it via loadVideoById below
  }, []);

  // 재생목록 팝오버에서 다른 곡을 고르면, iframe을 다시 만들지 않고 같은 플레이어에 새 영상만
  // 불러온다(MusicPlayer.tsx의 playTrack과 같은 방식).
  const previousTrackIdRef = useRef(selectedTrackId);
  useEffect(() => {
    if (previousTrackIdRef.current === selectedTrackId) return;
    saveCoverLoopLastPlayback(
      previousTrackIdRef.current,
      latestCurrentTimeRef.current,
    );
    previousTrackIdRef.current = selectedTrackId;
    setCurrentTime(0);
    setDuration(0);
    playerRef.current?.loadVideoById(
      track.media.videoId,
      track.media.startSeconds ?? 0,
    );
  }, [selectedTrackId, track.media.videoId, track.media.startSeconds]);

  // 팝오버 바깥 클릭 또는 Escape로 닫는다.
  useEffect(() => {
    if (!playlistOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        playlistRef.current &&
        !playlistRef.current.contains(event.target as Node)
      )
        setPlaylistOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlaylistOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [playlistOpen]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
      setDuration(playerRef.current?.getDuration() ?? 0);
    }, 180);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  // Background loop video stays muted/loop/playsInline always; it only plays while the external
  // YouTube audio is actually playing, so the scene doesn't move against silence. track.loopVideo
  // is in the deps so switching tracks (which remounts <video> via key={track.id} below) re-plays
  // the fresh element — a <source> src swap alone doesn't make the browser reload the video.
  useEffect(() => {
    const sceneVideo = sceneVideoRef.current;
    if (!sceneVideo) return;
    if (isPlaying && !reducedMotion)
      void sceneVideo.play().catch(() => undefined);
    else sceneVideo.pause();
  }, [isPlaying, reducedMotion, track.loopVideo]);

  const togglePlayback = () => {
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  };

  const seekToStart = () => {
    playerRef.current?.seekTo(0, true);
    setCurrentTime(0);
  };

  const updateVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    saveCoverLoopVolume(nextVolume);
    playerRef.current?.setVolume(nextVolume);
    if (nextVolume === 0) {
      playerRef.current?.mute();
      setMuted(true);
    } else if (muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  };

  const toggleMuted = () => {
    if (muted) {
      playerRef.current?.unMute();
      setMuted(false);
    } else {
      playerRef.current?.mute();
      setMuted(true);
    }
  };

  // 일반 동영상 플레이어처럼 화면(버튼 제외)을 클릭하면 재생/일시정지 토글 + 가운데에 아이콘이
  // 잠깐 떴다 사라진다. isPlaying은 토글 직후 비동기로 바뀌므로, 클릭 시점의 현재 상태를 기준으로
  // "이제 어떤 동작이 일어날지"를 보여준다(재생 중이었다면 일시정지 아이콘, 아니었다면 재생 아이콘).
  const centerFlashTimerRef = useRef<number | undefined>(undefined);
  const [centerFlash, setCenterFlash] = useState<"play" | "pause" | null>(null);

  useEffect(() => () => window.clearTimeout(centerFlashTimerRef.current), []);

  const handleStageClick = () => {
    if (!ready) return;
    setCenterFlash(isPlaying ? "pause" : "play");
    window.clearTimeout(centerFlashTimerRef.current);
    centerFlashTimerRef.current = window.setTimeout(
      () => setCenterFlash(null),
      650,
    );
    togglePlayback();
  };

  const selectTrack = (id: string) => {
    setSelectedTrackId(id);
    setPlaylistOpen(false);
  };

  // 곡이 하치 하나뿐이던 때만 비활성화했던 이전/다음 버튼 — 이제 2곡 이상이면 순환 이동한다.
  const canSkip = coverLoopTracks.length > 1;
  // 일반적인 뮤직 플레이어처럼: 어느 정도 재생이 진행된 뒤(3초 초과) "이전" 버튼을 누르면
  // 이전 곡으로 넘어가지 않고 지금 곡을 처음부터 다시 재생한다. 곡 시작 부근에서 누르면
  // 그제서야 실제로 이전 곡으로 이동한다.
  const PREV_RESTART_THRESHOLD_SECONDS = 3;
  const goToPrevTrack = () => {
    if (!canSkip) return;
    const trackStart = track.media.startSeconds ?? 0;
    if (ready && currentTime - trackStart > PREV_RESTART_THRESHOLD_SECONDS) {
      playerRef.current?.seekTo(trackStart, true);
      setCurrentTime(trackStart);
      return;
    }
    const prevIndex =
      (activeIndex - 1 + coverLoopTracks.length) % coverLoopTracks.length;
    setSelectedTrackId(coverLoopTracks[prevIndex].id);
  };
  const goToNextTrack = () => {
    if (!canSkip) return;
    const nextIndex = (activeIndex + 1) % coverLoopTracks.length;
    setSelectedTrackId(coverLoopTracks[nextIndex].id);
  };

  // 꺼짐 → 전체 반복 → 한 곡 반복 → 꺼짐 순환.
  const cycleRepeatMode = () => {
    setRepeatMode((current) =>
      current === "off" ? "all" : current === "all" ? "one" : "off",
    );
  };
  const repeatLabel =
    repeatMode === "one"
      ? "한 곡 반복재생"
      : repeatMode === "all"
        ? "전체 반복재생"
        : "반복재생 꺼짐";

  const activeLyricIndex = track.lyrics.findIndex(
    (cue) => currentTime >= cue.startSeconds && currentTime < cue.endSeconds,
  );
  const activeLyric =
    activeLyricIndex >= 0 ? track.lyrics[activeLyricIndex] : undefined;
  // 가사 타이밍은 유튜브 원본 재생 시각(currentTime) 그대로 매칭하되, 화면에 보이는 재생
  // 시간·전체 길이·플레이바는 media.startSeconds만큼 당겨서 "0초부터 재생된" 것처럼 보여준다.
  const trackStartOffset = track.media.startSeconds ?? 0;
  const displayCurrentTime = Math.max(0, currentTime - trackStartOffset);
  const displayDuration = Math.max(0, duration - trackStartOffset);
  const nextLyric =
    activeLyricIndex >= 0 ? track.lyrics[activeLyricIndex + 1] : undefined;
  const visibleVolume = muted ? 0 : volume;
  const showLoopVideo = !!track.loopVideo && !reducedMotion;
  const indexLabel = `${track.code} · ${String(index).padStart(2, "0")}`;

  return (
    <>
      <div
        className="cover-loop-lab__youtube-frame"
        ref={frameRef}
        aria-hidden="true"
      />
      <section
        className="cover-loop-lab__stage"
        aria-label={`${track.displayName} 커버 루프 영상`}
        onPointerMove={revealAiNotice}
        onPointerEnter={revealAiNotice}
      >
        {/* 채움 배경: 같은 포스터를 cover + blur로 화면 끝까지 채워 세로로 긴 화면에서도 여백이 남지 않게 한다. */}
        <div
          className="cover-loop-lab__fill"
          aria-hidden="true"
          style={{ backgroundImage: `url(${track.poster})` }}
        />
        <div className="cover-loop-lab__fill-shade" aria-hidden="true" />
        {/* 주 장면: contain으로 16:9 원본 프레임을 그대로 보존해 좌우를 자르지 않는다. */}
        {showLoopVideo ? (
          <video
            key={track.id}
            ref={sceneVideoRef}
            className="cover-loop-lab__scene"
            poster={track.poster}
            muted
            loop
            playsInline
            preload="metadata"
            style={{ objectPosition: track.objectPosition }}
          >
            <source src={track.loopVideo} type="video/mp4" />
          </video>
        ) : (
          <img
            className="cover-loop-lab__scene"
            src={track.poster}
            alt={`${track.displayName} 커버 루프 장면`}
            style={{ objectPosition: track.objectPosition }}
          />
        )}
        <div className="cover-loop-lab__vignette" aria-hidden="true" />

        {/* 장면 클릭 = 재생/일시정지 토글(다른 버튼들 위가 아닌 빈 화면 영역만 반응). */}
        <button
          type="button"
          className="cover-loop-lab__click-catcher"
          onClick={handleStageClick}
          disabled={!ready}
          aria-label={isPlaying ? "일시정지" : "재생"}
        />
        {centerFlash && (
          <div className="cover-loop-lab__center-flash" aria-hidden="true">
            {centerFlash === "play" ? (
              <Play aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
          </div>
        )}

        <div className="cover-loop-lab__top">
          <div className="cover-loop-lab__now-playing">
            <div className="cover-loop-lab__playlist-anchor" ref={playlistRef}>
              <button
                type="button"
                className="cover-loop-lab__playlist-toggle"
                onClick={() => setPlaylistOpen((current) => !current)}
                aria-haspopup="listbox"
                aria-expanded={playlistOpen}
                aria-label={playlistOpen ? "재생목록 닫기" : "재생목록 열기"}
              >
                <ListMusic aria-hidden="true" />
              </button>
              {playlistOpen && (
                <div
                  className="cover-loop-lab__playlist-popover"
                  role="listbox"
                  aria-label="재생목록"
                >
                  {coverLoopTracks.map((item, itemIndex) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={item.id === selectedTrackId}
                      className={`cover-loop-lab__playlist-item${item.id === selectedTrackId ? " cover-loop-lab__playlist-item--active" : ""}`}
                      onClick={() => selectTrack(item.id)}
                    >
                      <span className="cover-loop-lab__playlist-item-index">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="cover-loop-lab__playlist-item-meta">
                        <strong>{item.title}</strong>
                        <small>
                          {item.artist} · {item.displayName}
                        </small>
                      </span>
                    </button>
                  ))}
                  {/* <p className="cover-loop-lab__playlist-footer">추가 예정</p> */}
                </div>
              )}
            </div>
            <div className="cover-loop-lab__now-playing-text">
              <span>NOW PLAYING</span>
              <span className="cover-loop-lab__title-row">
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
              </span>
            </div>
          </div>
          <div className="cover-loop-lab__performer-group">
            {/* 원곡 제목/가수(위 NOW PLAYING)와 별개로, 이 커버를 부른 잔디동 선수 표기 영역.
                선수 이름 자체는 하단 플레이어 패널(cover-loop-lab__track-meta)에 표시한다. */}
            <div className="cover-loop-lab__performer">
              <span>COVER BY</span>
              <small>{indexLabel}</small>
            </div>
            {/* AI로 생성한 루프 영상이라 어색할 수 있다는 안내 — 평소엔 숨겨져 있다가 마우스가
                움직이면 잠깐 나타난다(닫기 버튼과 같은 hover-reveal 패턴). */}
            <div
              className={`cover-loop-lab__ai-notice${aiNoticeVisible ? " cover-loop-lab__ai-notice--visible" : ""}`}
            >
              <Bot aria-hidden="true" />
              <span>AI로 생성한 영상으로 어색할 수 있어요</span>
            </div>
          </div>
        </div>
        {/* 가사 + 플레이바를 한 덩어리로 화면 아래에 고정. 가사는 실제 컨트롤 행(볼륨~재생시간이
            있는 줄) 바로 위에 뜨고, 없을 때도 높이를 그대로 비워둬 그 줄이 위아래로 흔들리지
            않게 한다. */}
        <div className="cover-loop-lab__bottom">
          <section
            className="cover-loop-lab__player"
            aria-label="커버 음악 플레이어"
          >
            <CoverLoopVisualizer
              isPlaying={isPlaying}
              currentTime={currentTime}
              volume={visibleVolume}
              reducedMotion={reducedMotion}
            />
            <div className="cover-loop-lab__track-meta">
              <div className="cover-loop-lab__track-meta-row">
                <strong>{track.title}</strong>
                <button
                  type="button"
                  className="cover-loop-lab__repeat"
                  onClick={cycleRepeatMode}
                  aria-pressed={repeatMode !== "off"}
                  aria-label={repeatLabel}
                  title={repeatLabel}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 aria-hidden="true" />
                  ) : repeatMode === "all" ? (
                    <Repeat aria-hidden="true" />
                  ) : (
                    <RepeatOff aria-hidden="true" />
                  )}
                </button>
              </div>
              <small>{track.displayName}</small>
            </div>
            <div className="cover-loop-lab__controls">
              <button
                type="button"
                className="cover-loop-lab__skip"
                onClick={goToPrevTrack}
                disabled={!canSkip}
                aria-label="이전 곡"
              >
                <ChevronFirst aria-hidden="true" />
              </button>
              <button
                type="button"
                className="cover-loop-lab__play"
                onClick={togglePlayback}
                disabled={!ready}
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="cover-loop-lab__skip"
                onClick={goToNextTrack}
                disabled={!canSkip}
                aria-label="다음 곡"
              >
                <ChevronLast aria-hidden="true" />
              </button>
              <div className="cover-loop-lab__volume-group">
                <button
                  type="button"
                  className="cover-loop-lab__mute"
                  onClick={toggleMuted}
                  disabled={!ready}
                  aria-pressed={muted}
                  aria-label={muted ? "음소거 해제" : "음소거"}
                >
                  {muted || visibleVolume === 0 ? (
                    <VolumeX aria-hidden="true" />
                  ) : (
                    <Volume2 aria-hidden="true" />
                  )}
                </button>
                <input
                  className="cover-loop-lab__volume-range"
                  type="range"
                  min="0"
                  max="100"
                  value={visibleVolume}
                  onChange={(event) => updateVolume(Number(event.target.value))}
                  disabled={!ready}
                  aria-label="볼륨"
                  style={
                    {
                      "--cover-loop-volume": `${visibleVolume}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
              {/* 볼륨 버튼과 같은 줄에 표시. 가사가 없어도 폭을 그대로 차지해 시간/전체화면이
                옆으로 밀리지 않게 한다. */}
              <div className="cover-loop-lab__lyric" aria-live="polite">
                {activeLyric && (
                  <p
                    key={`cur-${activeLyricIndex}`}
                    className="cover-loop-lab__lyric-line cover-loop-lab__lyric-line--current"
                  >
                    {activeLyric.text}
                  </p>
                )}
                {/* 다음 가사를 한 줄쯤 잘리고 흐려진 채로 미리 보여주다가, 전환되면 이 줄이 위로
                  올라와 현재 가사 자리를 차지한다(key가 바뀌며 rise 애니메이션이 다시 재생됨). */}
                {activeLyric && nextLyric && (
                  <p
                    key={`next-${activeLyricIndex}`}
                    className="cover-loop-lab__lyric-line cover-loop-lab__lyric-line--next"
                    aria-hidden="true"
                  >
                    {nextLyric.text}
                  </p>
                )}
              </div>
              <time>
                {formatTime(displayCurrentTime)} / {formatTime(displayDuration)}
              </time>
              {fullscreenSupported && (
                <button
                  type="button"
                  className="cover-loop-lab__fullscreen"
                  onClick={toggleFullscreen}
                  aria-pressed={isFullscreen}
                  aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
                >
                  {isFullscreen ? (
                    <Minimize aria-hidden="true" />
                  ) : (
                    <Maximize aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            <input
              className="cover-loop-lab__progress"
              type="range"
              min="0"
              max={Math.max(displayDuration, 1)}
              step="0.1"
              value={Math.min(displayCurrentTime, Math.max(displayDuration, 1))}
              onChange={(event) => {
                const displaySeconds = Number(event.target.value);
                const seconds = displaySeconds + trackStartOffset;
                playerRef.current?.seekTo(seconds, true);
                setCurrentTime(seconds);
              }}
              disabled={!ready || duration === 0}
              aria-label="재생 위치"
              style={
                {
                  "--cover-loop-progress": `${displayDuration ? (displayCurrentTime / displayDuration) * 100 : 0}%`,
                } as React.CSSProperties
              }
            />
          </section>
        </div>
      </section>
      {/* 재닌 곡처럼 가사 타이밍이 중간부터 어긋날 때 수동으로 다시 찍기 위한 개발 전용 도구.
          프로덕션 빌드에서는 절대 렌더되지 않는다. */}
      {import.meta.env.DEV && (
        <CoverLoopLyricTimingTool
          track={track}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onSeekToStart={seekToStart}
        />
      )}
    </>
  );
}
