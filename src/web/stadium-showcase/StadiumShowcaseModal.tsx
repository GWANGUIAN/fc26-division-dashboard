import { useState } from "react";
import { Castle, Goal, LayersArrowUp, Maximize2, RotateCcw, Sparkles } from "lucide-react";
import stadiumFallback from "../assets/world/buildings/stadium.webp";
import { Modal, useEscape } from "../Modal";
import { StadiumShowcaseScene, type SceneStatus } from "./StadiumShowcaseScene";
import type { CameraPreset, CameraRequest } from "./stadiumShowcaseMath";
import "./stadium-showcase.css";

const CAMERA_BUTTONS: { id: CameraPreset; label: string; icon: typeof Maximize2 }[] = [
  { id: "overview", label: "전체", icon: Maximize2 },
  { id: "top", label: "탑뷰", icon: LayersArrowUp },
  { id: "goal", label: "골대 뒤", icon: Goal },
];

export default function StadiumShowcaseModal({ onClose }: { onClose: () => void }) {
  const [request, setRequest] = useState<CameraRequest>({ preset: "overview" });
  const [status, setStatus] = useState<SceneStatus>("loading");
  const selectPreset = (preset: CameraPreset) => setRequest({ preset });
  useEscape(onClose);

  return (
    <Modal
      onClose={onClose}
      label="잔디동 스타디움 구경하기"
      wide
      header={
        <div>
          <p className="eyebrow">잔디동 · 3D SHOWCASE</p>
          <h2 className="stadium-showcase__title"><Castle aria-hidden="true" /> 잔디동 스타디움 구경하기</h2>
          <p className="stadium-showcase__intro">드래그하여 둘러보세요 · 휠 또는 핀치로 확대할 수 있어요</p>
        </div>
      }
    >
      <div className="stadium-showcase">
        <div className="stadium-showcase__viewer">
          <StadiumShowcaseScene request={request} onStatus={setStatus} />
          {status === "loading" && <p className="stadium-showcase__loading" role="status">경기장을 준비하고 있어요…</p>}
          {status === "error" && (
            <div className="stadium-showcase__fallback" role="status">
              <img src={stadiumFallback} alt="잔디동 경기장 일러스트" />
              <p>이 기기에서는 3D 경기장을 불러오지 못했어요.</p>
            </div>
          )}
          <div className="stadium-showcase__badge"><Sparkles aria-hidden="true" /> 잔디동 HOME</div>
        </div>
        <div className="stadium-showcase__controls" aria-label="카메라 시점">
          {CAMERA_BUTTONS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={request.preset === id ? "active" : ""} onClick={() => selectPreset(id)} aria-pressed={request.preset === id}>
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
          <button type="button" onClick={() => selectPreset("overview")} aria-label="처음 시점으로 돌아가기">
            <RotateCcw aria-hidden="true" /> 처음 시점
          </button>
        </div>
      </div>
    </Modal>
  );
}
