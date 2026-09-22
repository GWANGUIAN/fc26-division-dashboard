import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
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
import "./cover-loop-lab.css";

type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(videoId: string): void;
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
    Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer;
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
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
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
    () => typeof document !== "undefined" && document.fullscreenElement !== null,
  );
  const supported = typeof document !== "undefined" && document.fullscreenEnabled;

  useEffect(() => {
    if (!supported) return;
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [supported]);

  const toggle = () => {
    if (!supported) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen().catch(() => undefined);
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
        const wave = Math.sin(currentTime * 4.1 + index * 0.83) + Math.sin(currentTime * 2.2 + index * 1.91) * 0.42;
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
export function CoverLoopStage({ track: initialTrack, index: initialIndex = 1 }: { track: CoverLoopTrack; index?: number }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneVideoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YouTubePlayer | undefined>(undefined);
  const [selectedTrackId, setSelectedTrackId] = useState(initialTrack.id);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const playlistRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const reducedMotion = useReducedMotion();
  const { isFullscreen, toggle: toggleFullscreen, supported: fullscreenSupported } = useFullscreen();
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");

  const activeIndex = Math.max(0, coverLoopTracks.findIndex((item) => item.id === selectedTrackId));
  const track = coverLoopTracks[activeIndex] ?? initialTrack;
  const index = coverLoopTracks.length ? activeIndex + 1 : initialIndex;

  // onStateChange is bound once inside the mount-only effect below, so it can only see fresh
  // repeatMode/activeIndex values through refs (same pattern MusicPlayer.tsx uses for trackIndex).
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      const youtubeWindow = window as YouTubeWindow;
      if (cancelled || !frameRef.current || !youtubeWindow.YT) return;
      playerRef.current = new youtubeWindow.YT.Player(frameRef.current, {
        videoId: initialTrack.media.videoId,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => {
            playerRef.current?.setVolume(volume);
            setDuration(playerRef.current?.getDuration() ?? 0);
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
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else if (mode === "all" && coverLoopTracks.length > 0) {
                const nextIndex = (activeIndexRef.current + 1) % coverLoopTracks.length;
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
    previousTrackIdRef.current = selectedTrackId;
    setCurrentTime(0);
    setDuration(0);
    playerRef.current?.loadVideoById(track.media.videoId);
  }, [selectedTrackId, track.media.videoId]);

  // 팝오버 바깥 클릭 또는 Escape로 닫는다.
  useEffect(() => {
    if (!playlistOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (playlistRef.current && !playlistRef.current.contains(event.target as Node)) setPlaylistOpen(false);
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
    if (isPlaying && !reducedMotion) void sceneVideo.play().catch(() => undefined);
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
    centerFlashTimerRef.current = window.setTimeout(() => setCenterFlash(null), 650);
    togglePlayback();
  };

  const selectTrack = (id: string) => {
    setSelectedTrackId(id);
    setPlaylistOpen(false);
  };

  // 곡이 하치 하나뿐이던 때만 비활성화했던 이전/다음 버튼 — 이제 2곡 이상이면 순환 이동한다.
  const canSkip = coverLoopTracks.length > 1;
  const goToPrevTrack = () => {
    if (!canSkip) return;
    const prevIndex = (activeIndex - 1 + coverLoopTracks.length) % coverLoopTracks.length;
    setSelectedTrackId(coverLoopTracks[prevIndex].id);
  };
  const goToNextTrack = () => {
    if (!canSkip) return;
    const nextIndex = (activeIndex + 1) % coverLoopTracks.length;
    setSelectedTrackId(coverLoopTracks[nextIndex].id);
  };

  // 꺼짐 → 전체 반복 → 한 곡 반복 → 꺼짐 순환.
  const cycleRepeatMode = () => {
    setRepeatMode((current) => (current === "off" ? "all" : current === "all" ? "one" : "off"));
  };
  const repeatLabel = repeatMode === "one" ? "한 곡 반복재생" : repeatMode === "all" ? "전체 반복재생" : "반복재생 꺼짐";

  const activeLyricIndex = track.lyrics.findIndex(
    (cue) => currentTime >= cue.startSeconds && currentTime < cue.endSeconds,
  );
  const activeLyric = activeLyricIndex >= 0 ? track.lyrics[activeLyricIndex] : undefined;
  const nextLyric = activeLyricIndex >= 0 ? track.lyrics[activeLyricIndex + 1] : undefined;
  const visibleVolume = muted ? 0 : volume;
  const showLoopVideo = !!track.loopVideo && !reducedMotion;
  const indexLabel = `${track.code} · ${String(index).padStart(2, "0")}`;

  return (
    <>
      <div className="cover-loop-lab__youtube-frame" ref={frameRef} aria-hidden="true" />
      <section className="cover-loop-lab__stage" aria-label={`${track.displayName} 커버 루프 영상`}>
        {/* 채움 배경: 같은 포스터를 cover + blur로 화면 끝까지 채워 세로로 긴 화면에서도 여백이 남지 않게 한다. */}
        <div className="cover-loop-lab__fill" aria-hidden="true" style={{ backgroundImage: `url(${track.poster})` }} />
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
            {centerFlash === "play" ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
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
                <div className="cover-loop-lab__playlist-popover" role="listbox" aria-label="재생목록">
                  {coverLoopTracks.map((item, itemIndex) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={item.id === selectedTrackId}
                      className={`cover-loop-lab__playlist-item${item.id === selectedTrackId ? " cover-loop-lab__playlist-item--active" : ""}`}
                      onClick={() => selectTrack(item.id)}
                    >
                      <span className="cover-loop-lab__playlist-item-index">{String(itemIndex + 1).padStart(2, "0")}</span>
                      <span className="cover-loop-lab__playlist-item-meta">
                        <strong>{item.title}</strong>
                        <small>
                          {item.artist} · {item.displayName}
                        </small>
                      </span>
                    </button>
                  ))}
                  <p className="cover-loop-lab__playlist-footer">추가 예정</p>
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
          {/* 원곡 제목/가수(위 NOW PLAYING)와 별개로, 이 커버를 부른 잔디동 선수 표기 영역. 선수
              이름 자체는 하단 플레이어 패널(cover-loop-lab__track-meta)에 표시한다. */}
          <div className="cover-loop-lab__performer">
            <span>COVER BY</span>
            <small>{indexLabel}</small>
          </div>
        </div>
        {/* 가사 + 플레이바를 한 덩어리로 화면 아래에 고정. 가사는 실제 컨트롤 행(볼륨~재생시간이
            있는 줄) 바로 위에 뜨고, 없을 때도 높이를 그대로 비워둬 그 줄이 위아래로 흔들리지
            않게 한다. */}
        <div className="cover-loop-lab__bottom">
          <section className="cover-loop-lab__player" aria-label="커버 음악 플레이어">
          <CoverLoopVisualizer isPlaying={isPlaying} currentTime={currentTime} volume={visibleVolume} reducedMotion={reducedMotion} />
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
            <button type="button" className="cover-loop-lab__skip" onClick={goToPrevTrack} disabled={!canSkip} aria-label="이전 곡">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cover-loop-lab__play"
              onClick={togglePlayback}
              disabled={!ready}
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
            <button type="button" className="cover-loop-lab__skip" onClick={goToNextTrack} disabled={!canSkip} aria-label="다음 곡">
              <ChevronRight aria-hidden="true" />
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
                {muted || visibleVolume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
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
              />
            </div>
            {/* 볼륨 버튼과 같은 줄에 표시. 가사가 없어도 폭을 그대로 차지해 시간/전체화면이
                옆으로 밀리지 않게 한다. */}
            <div className="cover-loop-lab__lyric" aria-live="polite">
              {activeLyric && (
                <p key={`cur-${activeLyricIndex}`} className="cover-loop-lab__lyric-line cover-loop-lab__lyric-line--current">
                  {activeLyric.text}
                </p>
              )}
              {/* 다음 가사를 한 줄쯤 잘리고 흐려진 채로 미리 보여주다가, 전환되면 이 줄이 위로
                  올라와 현재 가사 자리를 차지한다(key가 바뀌며 rise 애니메이션이 다시 재생됨). */}
              {activeLyric && nextLyric && (
                <p key={`next-${activeLyricIndex}`} className="cover-loop-lab__lyric-line cover-loop-lab__lyric-line--next" aria-hidden="true">
                  {nextLyric.text}
                </p>
              )}
            </div>
            <time>
              {formatTime(currentTime)} / {formatTime(duration)}
            </time>
            {fullscreenSupported && (
              <button
                type="button"
                className="cover-loop-lab__fullscreen"
                onClick={toggleFullscreen}
                aria-pressed={isFullscreen}
                aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
              >
                {isFullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
              </button>
            )}
          </div>
          <input
            className="cover-loop-lab__progress"
            type="range"
            min="0"
            max={Math.max(duration, 1)}
            step="0.1"
            value={Math.min(currentTime, Math.max(duration, 1))}
            onChange={(event) => {
              const seconds = Number(event.target.value);
              playerRef.current?.seekTo(seconds, true);
              setCurrentTime(seconds);
            }}
            disabled={!ready || duration === 0}
            aria-label="재생 위치"
            style={{ "--cover-loop-progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
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
