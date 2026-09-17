let activeSfxAudio: HTMLAudioElement | undefined;

/** `onCreate`, if given, runs synchronously right after the Audio element is
 * constructed but before it starts playing — lets a caller wire it into its
 * own Web Audio graph (e.g. toty-card/totyCardRetroSfx.ts's
 * applyRetroSfxFilter for the "90년대 고전 도트" easter egg's click sfx)
 * without this module needing to know anything about that. */
export function playSfx(url: string, volume = 1, onCreate?: (audio: HTMLAudioElement) => void) {
  stopSfx();
  const audio = new Audio(url);
  audio.volume = volume;
  onCreate?.(audio);
  activeSfxAudio = audio;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures
  });
}

export function stopSfx() {
  activeSfxAudio?.pause();
  activeSfxAudio = undefined;
}
