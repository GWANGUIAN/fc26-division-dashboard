/** Only keeps real post media, excluding avatars, emoji, editor UI, and thumbnails. */
export function filterArticleImages(images: Array<{ src?: string; className?: string; width?: number; height?: number; inPostBody?: boolean }>): string[] {
  return [...new Set(images
    .filter((image) =>
      Boolean(image.src) &&
      // Newer Café posts can omit the old `se-image-resource` class while
      // retaining the image inside the editor body.  Never accept arbitrary
      // iframe images: require either that class or a known post-body parent.
      (image.className?.split(/\s+/u).includes("se-image-resource") || image.inPostBody) &&
      // Naver can expose a valid editor image URL before its natural size has
      // loaded. Keep that unknown-size source; reject only images known to be
      // small editor decoration/emoji.
      (((image.width ?? 0) === 0 && (image.height ?? 0) === 0) ||
        ((image.width ?? 0) >= 160 && (image.height ?? 0) >= 160)) &&
      /(?:cafeptthumb-phinf|cafefiles)\.pstatic\.net/u.test(image.src ?? ""),
    )
    .map((image) => image.src!))];
}
