import { describe, expect, it } from "vitest";
import { filterArticleImages } from "./images.js";

const articleImage = "https://cafeptthumb-phinf.pstatic.net/MjAx/test.jpg?type=w1600";

describe("article image filtering", () => {
  it("keeps legacy SmartEditor images", () => {
    expect(filterArticleImages([{ src: articleImage, className: "se-image-resource", width: 800, height: 600 }])).toEqual([articleImage]);
  });

  it("keeps current editor-body images even without the legacy class", () => {
    expect(filterArticleImages([{ src: articleImage, className: "", inPostBody: true, width: 800, height: 600 }])).toEqual([articleImage]);
  });

  it("rejects sidebar images, emoji-sized media, and non-Café hosts", () => {
    expect(filterArticleImages([
      { src: articleImage, className: "", inPostBody: false, width: 800, height: 600 },
      { src: articleImage, className: "se-image-resource", width: 80, height: 80 },
      { src: "https://example.test/image.jpg", className: "se-image-resource", width: 800, height: 600 },
    ])).toEqual([]);
  });
});
