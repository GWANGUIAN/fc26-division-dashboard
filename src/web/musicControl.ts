// Lets the 잔디동 월드 overlay silence the site-wide YouTube MusicPlayer while it is open and give it
// back afterwards (docs/world/08 §5 #1). MusicPlayer registers a handler; the world only resumes
// music it paused itself, so a track the visitor had already paused stays paused.

export interface MusicHandler {
  isPlaying(): boolean;
  pause(): void;
  play(): void;
}

let handler: MusicHandler | null = null;
let pausedByWorld = false;

/** Called by MusicPlayer on mount; returns the unregister function for its cleanup. */
export function registerMusicHandler(next: MusicHandler): () => void {
  handler = next;
  return () => {
    if (handler === next) {
      handler = null;
      pausedByWorld = false;
    }
  };
}

/** Pauses the global music if it is currently playing. Safe to call when no player is mounted. */
export function suspendGlobalMusic() {
  if (!handler || pausedByWorld || !handler.isPlaying()) return;
  handler.pause();
  pausedByWorld = true;
}

/** Resumes the global music only if `suspendGlobalMusic` was what stopped it. */
export function resumeGlobalMusic() {
  if (!handler || !pausedByWorld) return;
  pausedByWorld = false;
  handler.play();
}
