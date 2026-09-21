export type CameraPreset = "overview" | "top" | "goal";

/** A fresh object per click, so re-selecting the active preset still re-applies it after manual orbiting. */
export interface CameraRequest {
  preset: CameraPreset;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface ModelTransform {
  scale: number;
  offset: Vec3;
}

const TARGET_SIZE = 52;

/** Keeps any stadium GLB centred and at a predictable display size. */
export function modelTransform(size: Vec3, center: Vec3, targetSize = TARGET_SIZE): ModelTransform {
  const longestSide = Math.max(size.x, size.y, size.z);
  const scale = longestSide > 0 ? targetSize / longestSide : 1;
  return {
    scale,
    offset: {
      x: -center.x * scale,
      y: -center.y * scale,
      z: -center.z * scale,
    },
  };
}

const target = { x: 0, y: 0, z: 0 };

export function cameraPoseFor(preset: CameraPreset): CameraPose {
  switch (preset) {
    case "top":
      return { position: { x: 0.1, y: 74, z: 0.1 }, target };
    case "goal":
      return { position: { x: 0, y: 9, z: 58 }, target: { x: 0, y: 1.5, z: 0 } };
    case "overview":
      return { position: { x: 40, y: 28, z: 45 }, target: { x: 0, y: 1.2, z: 0 } };
  }
}
