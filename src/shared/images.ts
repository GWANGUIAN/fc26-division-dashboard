/** Only keeps real post media, excluding avatars, emoji, editor UI, and thumbnails. */
export function filterArticleImages(images: Array<{ src?: string; className?: string; width?: number; height?: number }>): string[] {
  return [...new Set(images
    .filter((image) =>
      Boolean(image.src) &&
      image.className?.split(/\s+/u).includes("se-image-resource") &&
      // Naver can expose a valid editor image URL before its natural size has
      // loaded. Keep that unknown-size source; reject only images known to be
      // small editor decoration/emoji.
      (((image.width ?? 0) === 0 && (image.height ?? 0) === 0) ||
        ((image.width ?? 0) >= 160 && (image.height ?? 0) >= 160)) &&
      /cafeptthumb-phinf\.pstatic\.net/u.test(image.src ?? ""),
    )
    .map((image) => image.src!))];
}
