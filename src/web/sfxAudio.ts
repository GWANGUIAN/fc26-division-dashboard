let activeSfxAudio: HTMLAudioElement | undefined;

export function playSfx(url: string, volume = 1) {
  stopSfx();
  const audio = new Audio(url);
  audio.volume = volume;
  activeSfxAudio = audio;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures
  });
}

export function stopSfx() {
  activeSfxAudio?.pause();
  activeSfxAudio = undefined;
}
