/** Only keeps real post media, excluding avatars, emoji, editor UI, and thumbnails. */
export function filterArticleImages(images: Array<{ src?: string; className?: string; width?: number; height?: number }>): string[] {
  return [...new Set(images
    .filter((image) =>
      Boolean(image.src) &&
      image.className?.split(/\s+/u).includes("se-image-resource") &&
      (image.width ?? 0) >= 160 &&
      (image.height ?? 0) >= 160 &&
      /cafeptthumb-phinf\.pstatic\.net/u.test(image.src ?? ""),
    )
    .map((image) => image.src!))];
}
