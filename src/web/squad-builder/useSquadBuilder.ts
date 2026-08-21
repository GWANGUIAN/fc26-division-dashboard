import { useEffect, useReducer } from "react";
import type { SquadPlayer } from "./customPlayerTypes.js";
import { squadBuilderReducer } from "./squadBuilderReducer.js";
import { loadSquadBuilderState, saveSquadBuilderState } from "./storage.js";

export function useSquadBuilder(players: SquadPlayer[]) {
  const [state, dispatch] = useReducer(
    squadBuilderReducer,
    undefined,
    loadSquadBuilderState,
  );

  useEffect(() => {
    saveSquadBuilderState(state);
  }, [state]);

  useEffect(() => {
    dispatch({
      type: "RECONCILE_ROSTER",
      liveStreamerIds: players.map((player) => player.id),
      frontStreamerIds: players
        .filter((player) => player.isCustomPlayer)
        .map((player) => player.id),
    });
  }, [players]);

  const activeSquad =
    state.squads.find((squad) => squad.id === state.activeSquadId) ??
    state.squads[0];

  return { state, dispatch, activeSquad };
}
