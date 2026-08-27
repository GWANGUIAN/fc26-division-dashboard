import * as THREE from "three";

/**
 * Mounts a WebGLRenderer into `container`, keeping the renderer size and the camera's aspect
 * ratio in sync with the container via ResizeObserver. Callers own the scene contents and their
 * own render-loop; this only handles the renderer lifecycle boilerplate shared by every Three.js
 * feature in this app.
 */
export function mountThreeRenderer(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  onResize?: (width: number, height: number) => void,
): { renderer: THREE.WebGLRenderer; dispose: () => void } {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onResize?.(width, height);
  };
  resize();

  const observer = new ResizeObserver(resize);
  observer.observe(container);

  return {
    renderer,
    dispose: () => {
      observer.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

/** Recursively disposes geometries/materials/textures under a scene graph node on teardown. */
export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
      if ("geometry" in child) child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose();
        });
        material.dispose();
      });
    }
  });
}
