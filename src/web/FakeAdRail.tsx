import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, Info, MoreVertical } from "lucide-react";
import { fakeAds, type FakeAd } from "./fakeAdsData";

const ROTATE_INTERVAL_MS = 8000;
const FADE_MS = 350;

const AD_WIDTH = 160;
const GAP_FROM_CONTENT = 24;
// On wide screens the rail hugs the viewport edge at this offset. As the window
// narrows and <main> gets within GAP_FROM_CONTENT + AD_WIDTH of that edge position,
// the rail slides inward to keep tracking main's edge instead — then hides once
// even that would push it closer to the viewport edge than this same margin.
const EDGE_OFFSET = 16;
const MIN_VIEWPORT_MARGIN = EDGE_OFFSET;

// Measures the actual rendered <main> box so the rail sits just outside it —
// a fixed calc() guess drifts out of sync whenever main's own width formula changes.
function useRailOffsets() {
  const [offsets, setOffsets] = useState<{ left: number; right: number } | null>(null);

  useLayoutEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const update = () => {
      const rect = mainEl.getBoundingClientRect();
      const contentHugLeft = rect.left - GAP_FROM_CONTENT - AD_WIDTH;
      const contentHugRight = window.innerWidth - rect.right - GAP_FROM_CONTENT - AD_WIDTH;
      const left = Math.min(EDGE_OFFSET, contentHugLeft);
      const right = Math.min(EDGE_OFFSET, contentHugRight);
      if (left < MIN_VIEWPORT_MARGIN || right < MIN_VIEWPORT_MARGIN) {
        setOffsets(null);
        return;
      }
      setOffsets({ left, right });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return offsets;
}

// Fetches every ad image up front so a rotation never swaps to an unloaded
// <img src>, which otherwise briefly renders blank and pops in — the "blink".
function usePreloadAdImages() {
  useEffect(() => {
    fakeAds.forEach((ad) => {
      const img = new Image();
      img.src = ad.image;
    });
  }, []);
}

function useAdRotation(startIndex: number, phaseOffsetMs: number) {
  const [index, setIndex] = useState(startIndex);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (fakeAds.length < 2) return;
    let interval: number | undefined;
    let fadeTimeout: number | undefined;

    const phaseTimeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisible(false);
        fadeTimeout = window.setTimeout(() => {
          setIndex((current) => (current + 1) % fakeAds.length);
          setVisible(true);
        }, FADE_MS);
      }, ROTATE_INTERVAL_MS);
    }, phaseOffsetMs);

    return () => {
      window.clearTimeout(phaseTimeout);
      if (interval) window.clearInterval(interval);
      if (fadeTimeout) window.clearTimeout(fadeTimeout);
    };
  }, []);

  return { ad: fakeAds[index % fakeAds.length], visible };
}

// Mirrors the real Google AdSense "AdChoices" menu flow — mock-only, nothing is
// actually blocked or persisted, it's just local UI state for the parody.
type PanelState = "closed" | "menu" | "reasons" | "why" | "done";

function AdUnit({ ad, visible }: { ad: FakeAd; visible: boolean }) {
  const [panel, setPanel] = useState<PanelState>("closed");
  const [infoHover, setInfoHover] = useState(false);

  useEffect(() => {
    setPanel("closed");
    setInfoHover(false);
  }, [ad.id]);

  const openAd = () => {
    if (panel !== "closed") return;
    window.open(ad.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fake-ad-rail__unit" style={{ opacity: visible ? 1 : 0 }}>
      <div
        className="fake-ad-rail__body"
        role="link"
        tabIndex={0}
        title={ad.label}
        onClick={openAd}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openAd();
          }
        }}
      >
        <img className="fake-ad-rail__img" src={ad.image} alt={ad.label} />
        <span className="fake-ad-rail__badge">광고</span>
      </div>

      {panel === "closed" && (
        <div className="fake-ad-rail__icons">
          <button
            type="button"
            className="fake-ad-rail__icon-btn"
            aria-label="광고 옵션"
            onClick={(e) => {
              e.stopPropagation();
              setPanel("menu");
            }}
          >
            <MoreVertical size={13} />
          </button>
          <div
            className="fake-ad-rail__info-wrap"
            onMouseEnter={() => setInfoHover(true)}
            onMouseLeave={() => setInfoHover(false)}
          >
            <button
              type="button"
              className="fake-ad-rail__icon-btn"
              aria-label="광고 정보"
              onClick={(e) => {
                e.stopPropagation();
                setPanel("menu");
              }}
            >
              <Info size={13} />
            </button>
            {infoHover && <span className="fake-ad-rail__info-tip">Wakgle 광고</span>}
          </div>
        </div>
      )}

      {panel === "menu" && (
        <div className="fake-ad-rail__panel">
          <button
            type="button"
            className="fake-ad-rail__back"
            aria-label="닫기"
            onClick={() => setPanel("closed")}
          >
            <ArrowLeft size={16} />
          </button>
          <p className="fake-ad-rail__panel-title">Wakgle 광고</p>
          <button
            type="button"
            className="fake-ad-rail__panel-btn fake-ad-rail__panel-btn--primary"
            onClick={() => setPanel("reasons")}
          >
            이 광고 그만 보기
          </button>
          <button
            type="button"
            className="fake-ad-rail__panel-btn"
            onClick={() => setPanel("why")}
          >
            이 광고가 표시된 이유 <Info size={10} />
          </button>
        </div>
      )}

      {panel === "why" && (
        <div className="fake-ad-rail__panel">
          <button
            type="button"
            className="fake-ad-rail__back"
            aria-label="뒤로"
            onClick={() => setPanel("menu")}
          >
            <ArrowLeft size={16} />
          </button>
          <p className="fake-ad-rail__panel-title">Wakgle 광고</p>
          <p className="fake-ad-rail__why-text">
            회원님의 관심사 및 방문 기록 등을 기반으로 표시된 광고입니다.
          </p>
        </div>
      )}

      {panel === "reasons" && (
        <div className="fake-ad-rail__panel">
          <button
            type="button"
            className="fake-ad-rail__back"
            aria-label="뒤로"
            onClick={() => setPanel("menu")}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="fake-ad-rail__reasons">
            <button type="button" className="fake-ad-rail__reason-btn" onClick={() => setPanel("done")}>
              부적절한 광고
            </button>
            <button type="button" className="fake-ad-rail__reason-btn" onClick={() => setPanel("done")}>
              관심없는 광고
            </button>
            <button type="button" className="fake-ad-rail__reason-btn" onClick={() => setPanel("done")}>
              여러 번 표시된 광고
            </button>
          </div>
        </div>
      )}

      {panel === "done" && (
        <div className="fake-ad-rail__panel fake-ad-rail__panel--done">
          <p className="fake-ad-rail__done-text">Wakgle은 해당 광고를 더 이상 표시하지 않음</p>
        </div>
      )}
    </div>
  );
}

export function FakeAdRail() {
  usePreloadAdImages();
  const offsets = useRailOffsets();
  const half = Math.floor(fakeAds.length / 2);
  const left = useAdRotation(0, 0);
  const right = useAdRotation(half, ROTATE_INTERVAL_MS / 2);

  if (fakeAds.length === 0 || !offsets) return null;

  return (
    <>
      <div className="fake-ad-rail fake-ad-rail--left" style={{ left: offsets.left }}>
        <AdUnit ad={left.ad} visible={left.visible} />
      </div>
      <div className="fake-ad-rail fake-ad-rail--right" style={{ right: offsets.right }}>
        <AdUnit ad={right.ad} visible={right.visible} />
      </div>
    </>
  );
}
