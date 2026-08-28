import { useState } from "react";

export type View = "division" | "evaluation";

function readViewFromLocation(): View {
  return new URLSearchParams(window.location.search).get("view") === "evaluation"
    ? "evaluation"
    : "division";
}

/** Backs the division/evaluation tab with a `?view=` query param so it survives a refresh. */
export function useView() {
  const [view, setViewState] = useState<View>(() => readViewFromLocation());

  function setView(next: View) {
    setViewState(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "division") params.delete("view");
    else params.set("view", next);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }

  return { view, setView };
}
