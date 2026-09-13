// Tracks which streamers' 3D cards the viewer has actually clicked "카드
// 공개" on, persisted in localStorage — purely a client-side collection
// hook ("아직 안 열어본 카드가 있다") so TotyCardButton can show a small
// badge on any streamer whose card hasn't been revealed yet. Backed by a
// tiny observable store (rather than reading localStorage directly) so
// every "3D 카드 보기" button across the app re-renders the instant any one
// popup's card gets revealed, without a page reload.

const STORAGE_KEY = "toty-card-revealed-ids";

function loadRevealedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

let revealedIds = loadRevealedIds();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...revealedIds]));
  } catch {
    // ignore storage quota/availability failures (private browsing, etc.)
  }
}

export function isTotyCardRevealed(streamerId: string): boolean {
  return revealedIds.has(streamerId);
}

export function markTotyCardRevealed(streamerId: string): void {
  if (revealedIds.has(streamerId)) return;
  revealedIds = new Set(revealedIds).add(streamerId);
  persist();
  for (const listener of listeners) listener();
}

export function subscribeTotyCardRevealed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
