import { useEffect, useReducer } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import { squadBuilderReducer } from "./squadBuilderReducer.js";
import { loadSquadBuilderState, saveSquadBuilderState } from "./storage.js";

export function useSquadBuilder(streamers: StreamerRecord[]) {
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
      liveStreamerIds: streamers.map((streamer) => streamer.id),
    });
  }, [streamers]);

  const activeSquad =
    state.squads.find((squad) => squad.id === state.activeSquadId) ??
    state.squads[0];

  return { state, dispatch, activeSquad };
}
