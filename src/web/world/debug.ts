// `?worldDebug` (docs/world/08 §0 #4): the site owner checks the deployed game through this overlay
// instead of automated browser tests — collision boxes, coordinates, camera, scale and FPS.

export function isWorldDebug(search: string = typeof location === "undefined" ? "" : location.search): boolean {
  return new URLSearchParams(search).has("worldDebug");
}
