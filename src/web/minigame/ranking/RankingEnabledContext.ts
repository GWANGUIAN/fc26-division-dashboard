import { createContext } from "react";

/**
 * Whether the minigame modals below show the online ranking. It is on
 * everywhere by default; the world overlay switches it off, so the modals
 * inside 잔디동 월드 have no ranking panel, load nothing and submit nothing.
 */
export const RankingEnabledContext = createContext(true);
