import { useState } from "react";
import { Shirt } from "lucide-react";
import { Modal, useEscape } from "../Modal";
import { JANDY_TEAM_LOGO } from "../match-record/matchRecordData.js";
import { SquadDropdown } from "../squad-builder/SquadDropdown";
import { UNIFORM_KITS, getUniformTextTheme, type UniformKitId } from "./uniformKits";
import { exportUniformImage } from "./exportUniformImage";

const RIBBON_REPEAT_COUNT = 8;

/** A repeating logo+wordmark strip, like a decorative ribbon border along the preview. */
function UniformRibbon({ detail, position }: { detail: string; position: "top" | "bottom" }) {
  return (
    <div className={`uniform-customizer__ribbon uniform-customizer__ribbon--${position}`} aria-hidden="true">
      {Array.from({ length: RIBBON_REPEAT_COUNT }, (_, index) => (
        <span className="uniform-customizer__ribbon-unit" key={index}>
          <img src={JANDY_TEAM_LOGO} alt="" />
          <span className="uniform-customizer__ribbon-brand">잔디동 JANDIDONG</span>
          {detail && <span className="uniform-customizer__ribbon-detail"> · {detail}</span>}
        </span>
      ))}
    </div>
  );
}

export function UniformCustomizerModal({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  const [kitId, setKitId] = useState<UniformKitId | undefined>(UNIFORM_KITS[0]?.id);
  const [number, setNumber] = useState("40");
  const [name, setName] = useState("우왁굳");
  const [downloading, setDownloading] = useState(false);

  const selectedKit = UNIFORM_KITS.find((kit) => kit.id === kitId);
  const trimmedNumber = number.trim();
  const trimmedName = name.trim();
  const ribbonDetail = [trimmedNumber, trimmedName].filter(Boolean).join(" · ");

  async function handleDownload() {
    if (!selectedKit || downloading) return;
    setDownloading(true);
    try {
      await exportUniformImage(selectedKit, number, name);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      label="유니폼 만들기"
      header={
        <div>
          <p className="eyebrow">MY JERSEY</p>
          <h2 className="uniform-customizer__title">
            <Shirt aria-hidden="true" /> 유니폼 만들기
          </h2>
          <p className="uniform-customizer__intro">
            유니폼을 고르고 등번호와 이름을 입력해서 나만의 응원 유니폼을 만들어보세요.
          </p>
        </div>
      }
    >
      {UNIFORM_KITS.length === 0 ? (
        <p className="uniform-customizer__empty">아직 준비된 유니폼이 없습니다.</p>
      ) : (
        <>
          <div className="uniform-customizer__field uniform-customizer__field--select">
            <span>유니폼 선택</span>
            <SquadDropdown
              value={kitId ?? ""}
              onChange={(value) => setKitId(value as UniformKitId)}
              options={UNIFORM_KITS.map((kit) => ({ value: kit.id, label: kit.label }))}
              ariaLabel="유니폼 선택"
              className="uniform-customizer__kit-dropdown"
            />
          </div>

          {selectedKit &&
            (() => {
              const theme = getUniformTextTheme(selectedKit.id);
              const textStyle = { color: theme.fill, WebkitTextStrokeColor: theme.outline } as React.CSSProperties;
              return (
                <>
                  <UniformRibbon detail={ribbonDetail} position="top" />
                  <div className="uniform-customizer__preview">
                    <img src={selectedKit.image} alt={selectedKit.label} />
                    {trimmedName && (
                      <div className="uniform-customizer__preview-name" style={textStyle}>
                        {trimmedName}
                      </div>
                    )}
                    {trimmedNumber && (
                      <div className="uniform-customizer__preview-number" style={textStyle}>
                        {trimmedNumber}
                      </div>
                    )}
                  </div>
                  <UniformRibbon detail={ribbonDetail} position="bottom" />
                </>
              );
            })()}

          <div className="uniform-customizer__form">
            <label className="uniform-customizer__field">
              <span>등번호</span>
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                placeholder="7"
              />
            </label>
            <label className="uniform-customizer__field">
              <span>이름</span>
              <input
                type="text"
                maxLength={12}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="JANDIDONG"
              />
            </label>
          </div>

          <button
            type="button"
            className="uniform-customizer__download"
            onClick={handleDownload}
            disabled={!selectedKit || downloading}
          >
            {downloading ? "저장 중..." : "이미지로 저장"}
          </button>
        </>
      )}
    </Modal>
  );
}
