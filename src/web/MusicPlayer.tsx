import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Music4, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { musicPlaylist } from "./musicPlaylist";

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
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

let apiLoadPromise: Promise<void> | undefined;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiLoadPromise) {
    apiLoadPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiLoadPromise;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const trackIndexRef = useRef(trackIndex);
  trackIndexRef.current = trackIndex;

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !frameRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(frameRef.current, {
        videoId: musicPlaylist[0].videoId,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onStateChange: (event: { data: number }) => {
            const states = window.YT!.PlayerState;
            if (event.data === states.PLAYING) setIsPlaying(true);
            else if (event.data === states.PAUSED) setIsPlaying(false);
            else if (event.data === states.ENDED) {
              const nextIndex = (trackIndexRef.current + 1) % musicPlaylist.length;
              setTrackIndex(nextIndex);
              playerRef.current?.loadVideoById(musicPlaylist[nextIndex].videoId);
              playerRef.current?.playVideo();
            }
          },
        },
      });
    });
    return () => { cancelled = true; playerRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isExpanded) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setIsExpanded(false);
    };
    addEventListener("mousedown", closeOnOutsideClick);
    return () => removeEventListener("mousedown", closeOnOutsideClick);
  }, [isExpanded]);

  const playTrack = (index: number) => {
    setTrackIndex(index);
    playerRef.current?.loadVideoById(musicPlaylist[index].videoId);
    playerRef.current?.playVideo();
  };

  const togglePlayPause = () => {
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  };

  const changeVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value === 0 && !muted) { playerRef.current?.mute(); setMuted(true); }
    else if (value > 0 && muted) { playerRef.current?.unMute(); setMuted(false); }
  };

  const toggleMute = () => {
    if (muted) { playerRef.current?.unMute(); setMuted(false); }
    else { playerRef.current?.mute(); setMuted(true); }
  };

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    if (duration > 0) playerRef.current?.seekTo(duration * ratio, true);
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const ringCircumference = 2 * Math.PI * 22;
  const track = musicPlaylist[trackIndex];

  return <div className="music-player" ref={panelRef}>
    <section className={`music-player__panel ${isExpanded ? "music-player__panel--open" : "music-player__panel--collapsed"}`} role="region" aria-label="음악 플레이어" aria-hidden={!isExpanded}>
      <div className="music-player__header">
        <span>{track.title}</span>
        <button type="button" className="music-player__close" onClick={() => setIsExpanded(false)} aria-label="음악 플레이어 접기" tabIndex={isExpanded ? 0 : -1}><X aria-hidden="true" /></button>
      </div>
      <div className="music-player__video"><div ref={frameRef} /></div>
      <div className="music-player__controls">
        <button type="button" onClick={() => playTrack((trackIndex - 1 + musicPlaylist.length) % musicPlaylist.length)} aria-label="이전 곡" tabIndex={isExpanded ? 0 : -1}><ChevronLeft aria-hidden="true" /></button>
        <button type="button" onClick={togglePlayPause} aria-label={isPlaying ? "일시정지" : "재생"} tabIndex={isExpanded ? 0 : -1}>{isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
        <button type="button" onClick={() => playTrack((trackIndex + 1) % musicPlaylist.length)} aria-label="다음 곡" tabIndex={isExpanded ? 0 : -1}><ChevronRight aria-hidden="true" /></button>
        <span className="music-player__time">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <div className="music-player__progress" onClick={seek}><div className="music-player__progress-fill" style={{ width: `${progressRatio * 100}%` }} /></div>
      <div className="music-player__volume">
        <button type="button" onClick={toggleMute} aria-label={muted ? "음소거 해제" : "음소거"} tabIndex={isExpanded ? 0 : -1}>{muted || volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
        <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={changeVolume} aria-label="볼륨" tabIndex={isExpanded ? 0 : -1} style={{ "--volume-fill": `${muted ? 0 : volume}%` } as React.CSSProperties} />
      </div>
      <ul className="music-player__playlist">
        {musicPlaylist.map((item, index) => <li key={item.videoId}>
          <button type="button" className={index === trackIndex ? "active" : ""} onClick={() => playTrack(index)} tabIndex={isExpanded ? 0 : -1}>
            <strong>{item.title}</strong><small>{item.artist}</small>
          </button>
        </li>)}
      </ul>
    </section>
    <button type="button" className="music-player__toggle" onClick={() => setIsExpanded((current) => !current)} aria-label={isExpanded ? "음악 플레이어 접기" : "음악 플레이어 열기"} aria-expanded={isExpanded}>
      {isPlaying && <svg className="music-player__ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" />
        <circle cx="24" cy="24" r="22" style={{ strokeDasharray: ringCircumference, strokeDashoffset: ringCircumference * (1 - progressRatio) }} />
      </svg>}
      <Music4 />
    </button>
  </div>;
}
