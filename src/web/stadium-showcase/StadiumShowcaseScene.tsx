import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { disposeObject3D, mountThreeRenderer } from "../three-utils";
import { cameraPoseFor, modelTransform, type CameraRequest } from "./stadiumShowcaseMath";

export type SceneStatus = "loading" | "ready" | "error";

const STADIUM_URL = "/models/stadium-showcase/club-ground.glb";
const PLINTH_URL = "/models/stadium-showcase/trophy-plinth.glb";
const SOCCER_BALL_URL = "/models/stadium-showcase/soccer-ball.glb";
const SCOREBOARD_URL = "/models/stadium-showcase/scoreboard.glb";
const BALL_CART_URL = "/models/stadium-showcase/ball-cart.glb";
const TRAINING_CONE_URL = "/models/stadium-showcase/training-cone.glb";

function addCup(scene: THREE.Scene) {
  const gold = new THREE.MeshStandardMaterial({ color: 0xf7c85e, metalness: 0.88, roughness: 0.22 });
  const darkGold = new THREE.MeshStandardMaterial({ color: 0x7e5515, metalness: 0.75, roughness: 0.28 });
  const cup = new THREE.Group();
  const profile = [
    new THREE.Vector2(0.18, 0), new THREE.Vector2(0.31, 0.08), new THREE.Vector2(0.42, 0.55),
    new THREE.Vector2(0.31, 0.84), new THREE.Vector2(0.23, 0.9), new THREE.Vector2(0.2, 0.98),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 20), gold);
  bowl.position.y = 0.24;
  cup.add(bowl);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.34, 16), gold);
  stem.position.y = 0.14;
  cup.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.48, 0.13, 20), darkGold);
  base.position.y = -0.08;
  cup.add(base);
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 16), gold);
    handle.position.set(side * 0.38, 0.75, 0);
    handle.rotation.y = Math.PI / 2;
    cup.add(handle);
  }
  cup.position.set(-22, 0.9, -19);
  cup.scale.setScalar(1.45);
  cup.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  scene.add(cup);
}

function addScoreboard(scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#06110d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#00e9ae";
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = "#00e9ae";
  ctx.font = "900 112px Barlow Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("잔디동", canvas.width / 2, 142);
  ctx.fillStyle = "#f7c85e";
  ctx.font = "700 42px Noto Sans KR, sans-serif";
  ctx.fillText("STADIUM TOUR", canvas.width / 2, 232);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Match the wider CC0 scoreboard frame so the club name reads at a glance.
  const board = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.9), new THREE.MeshStandardMaterial({ map: texture, emissive: 0x004d39, emissiveMap: texture, emissiveIntensity: 0.5 }));
  board.position.set(0, 15, -32.45);
  board.castShadow = true;
  scene.add(board);
}

function addStadiumEnvelope(scene: THREE.Scene) {
  const structure = new THREE.MeshStandardMaterial({ color: 0x102923, roughness: 0.72, metalness: 0.18 });
  const seat = new THREE.MeshStandardMaterial({ color: 0x08a86c, emissive: 0x063b29, emissiveIntensity: 0.45, roughness: 0.48 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xf7c85e, metalness: 0.72, roughness: 0.28 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x071612, metalness: 0.62, roughness: 0.28 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3Tuple) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };

  // Low, stepped grandstands frame the CC0 ground without covering the pitch.
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 4; tier += 1) {
      const x = side * (22.2 + tier * 1.65);
      add(new THREE.BoxGeometry(2.05, 0.78, 51), structure, [x, 0.45 + tier * 0.64, 0]);
      add(new THREE.BoxGeometry(1.76, 0.18, 49.8), seat, [side * (21.78 + tier * 1.65), 0.93 + tier * 0.64, 0]);
    }
    add(new THREE.BoxGeometry(7.8, 0.38, 54), roof, [side * 28.2, 5.15, 0]);
    for (const z of [-20, 0, 20]) add(new THREE.BoxGeometry(0.3, 5.1, 0.3), structure, [side * 28.2, 2.55, z]);
    add(new THREE.BoxGeometry(0.16, 0.24, 52), trim, [side * 24.1, 3.35, 0]);
  }

  for (const end of [-1, 1]) {
    for (let tier = 0; tier < 3; tier += 1) {
      const z = end * (29.8 + tier * 1.65);
      add(new THREE.BoxGeometry(46, 0.74, 2.05), structure, [0, 0.42 + tier * 0.62, z]);
      add(new THREE.BoxGeometry(44.5, 0.16, 1.75), seat, [0, 0.89 + tier * 0.62, end * (29.38 + tier * 1.65)]);
    }
  }

  // Four architectural floodlight towers make the silhouette read as a stadium.
  const mastGeometry = new THREE.CylinderGeometry(0.2, 0.34, 11.5, 8);
  const lampGeometry = new THREE.BoxGeometry(3.4, 1.15, 0.34);
  for (const [x, z] of [[-31, -34], [-31, 34], [31, -34], [31, 34]]) {
    add(mastGeometry, structure, [x, 5.75, z]);
    add(lampGeometry, trim, [x, 11.2, z]);
    const glow = new THREE.PointLight(0x69ffd1, 5.5, 28, 2);
    glow.position.set(x, 10.8, z);
    scene.add(glow);
  }

}

function prepareModel(model: THREE.Object3D) {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        // The CC0 source is deliberately neutral. Bring its grass into the
        // dashboard palette so it remains legible against the navy exhibit.
        if (material.name === "grass") material.color.setHex(0x1a7847);
        if (material.name === "grassDark") material.color.setHex(0x0d512f);
        if (material.name === "white") material.color.setHex(0xe9f5df);
      });
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  const transform = modelTransform(box.getSize(new THREE.Vector3()), box.getCenter(new THREE.Vector3()));
  model.scale.setScalar(transform.scale);
  // Centre the pitch horizontally, but keep its lowest point on the display plinth.
  // Using the vertical centre here would bury the entire stadium inside the base mesh.
  model.position.set(transform.offset.x, -box.min.y * transform.scale, transform.offset.z);
}

function prepareProp(model: THREE.Object3D) {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export function StadiumShowcaseScene({ request, onStatus }: { request: CameraRequest; onStatus: (status: SceneStatus) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(request);
  const onStatusRef = useRef(onStatus);
  requestRef.current = request;
  onStatusRef.current = onStatus;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rendererDispose: (() => void) | null = null;
    let cancelled = false;
    let raf = 0;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x061812);
      scene.fog = new THREE.Fog(0x061812, 66, 126);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 240);
      const overview = cameraPoseFor("overview");
      camera.position.set(overview.position.x, overview.position.y, overview.position.z);
      const { renderer, dispose } = mountThreeRenderer(container, camera);
      rendererDispose = dispose;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia("(max-width: 680px)").matches ? 1.25 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.minDistance = 26;
      controls.maxDistance = 105;
      controls.minPolarAngle = 0.12;
      controls.maxPolarAngle = Math.PI / 2.02;
      controls.target.set(overview.target.x, overview.target.y, overview.target.z);
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotateSpeed = 0.36;
      renderer.domElement.style.touchAction = "none";
      let manualCamera = false;
      controls.addEventListener("start", () => {
        manualCamera = true;
        controls.autoRotate = false;
      });

      scene.add(new THREE.HemisphereLight(0xaee9d3, 0x061611, 1.7));
      const sun = new THREE.DirectionalLight(0xfff1bd, 2.35);
      sun.position.set(28, 45, 24);
      sun.castShadow = true;
      sun.shadow.mapSize.set(window.matchMedia("(max-width: 680px)").matches ? 512 : 1024, window.matchMedia("(max-width: 680px)").matches ? 512 : 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 120;
      scene.add(sun);
      const rim = new THREE.PointLight(0x00e9ae, 22, 78, 2);
      rim.position.set(-22, 15, -26);
      scene.add(rim);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(49, 51, 1.4, 80),
        new THREE.MeshStandardMaterial({ color: 0x06241c, roughness: 0.7, metalness: 0.08 }),
      );
      base.position.y = -1;
      base.receiveShadow = true;
      scene.add(base);
      addStadiumEnvelope(scene);
      addScoreboard(scene);
      addCup(scene);

      const loader = new GLTFLoader();
      loader.load(STADIUM_URL, (gltf) => {
        if (cancelled) return;
        prepareModel(gltf.scene);
        scene.add(gltf.scene);
        onStatusRef.current("ready");
      }, undefined, () => {
        if (!cancelled) onStatusRef.current("error");
      });
      loader.load(PLINTH_URL, (gltf) => {
        if (cancelled) return;
        gltf.scene.scale.setScalar(1.55);
        gltf.scene.position.set(-22, 0, -19);
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(gltf.scene);
      });
      loader.load(SOCCER_BALL_URL, (gltf) => {
        if (cancelled) return;
        gltf.scene.scale.setScalar(3.75);
        gltf.scene.position.set(15.5, 0.82, 18.8);
        prepareProp(gltf.scene);
        scene.add(gltf.scene);
      });
      loader.load(SCOREBOARD_URL, (gltf) => {
        if (cancelled) return;
        gltf.scene.scale.setScalar(3.25);
        gltf.scene.position.set(0, 0, -33);
        prepareProp(gltf.scene);
        scene.add(gltf.scene);
      });
      loader.load(BALL_CART_URL, (gltf) => {
        if (cancelled) return;
        gltf.scene.scale.setScalar(1.75);
        gltf.scene.position.set(19.7, 0.05, 15.3);
        gltf.scene.rotation.y = -Math.PI / 4;
        prepareProp(gltf.scene);
        scene.add(gltf.scene);
      });
      loader.load(TRAINING_CONE_URL, (gltf) => {
        if (cancelled) return;
        gltf.scene.scale.setScalar(2.05);
        prepareProp(gltf.scene);
        for (const [x, z] of [[10.5, 20], [13, 22.4], [15.5, 20], [13, 17.6]]) {
          const cone = gltf.scene.clone();
          cone.position.set(x, 0, z);
          scene.add(cone);
        }
      });

      let handledRequest = requestRef.current;
      const desiredPosition = new THREE.Vector3(overview.position.x, overview.position.y, overview.position.z);
      const desiredTarget = new THREE.Vector3(overview.target.x, overview.target.y, overview.target.z);
      controls.addEventListener("change", () => {
        // OrbitControls emits change events for wheel, pinch, and drag. Persist the
        // user-controlled view instead of letting the preset interpolation pull it back.
        if (manualCamera) {
          desiredPosition.copy(camera.position);
          desiredTarget.copy(controls.target);
        }
      });
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let previousTime = performance.now();
      const animate = (now: number) => {
        const dt = Math.min((now - previousTime) / 1000, 0.1);
        previousTime = now;
        if (requestRef.current !== handledRequest) {
          handledRequest = requestRef.current;
          manualCamera = false;
          const next = cameraPoseFor(handledRequest.preset);
          desiredPosition.set(next.position.x, next.position.y, next.position.z);
          desiredTarget.set(next.target.x, next.target.y, next.target.z);
          controls.autoRotate = false;
        }
        const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * 5.2);
        camera.position.lerp(desiredPosition, blend);
        controls.target.lerp(desiredTarget, blend);
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        controls.dispose();
        disposeObject3D(scene);
        rendererDispose?.();
      };
    } catch {
      onStatusRef.current("error");
      return () => rendererDispose?.();
    }
    // The Three scene owns its lifecycle for this modal visit; refs keep props current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="stadium-showcase__scene" aria-label="3D 잔디동 경기장" />;
}
