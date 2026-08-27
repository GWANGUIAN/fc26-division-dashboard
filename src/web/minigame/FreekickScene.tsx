import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { disposeObject3D, mountThreeRenderer } from "../three-utils";
import {
  BALL_RADIUS_3D,
  GOAL_HEIGHT,
  GOAL_LINE_Z,
  GOAL_WIDTH,
  KEEPER_Z,
  SPOT_Z,
  type GameState,
} from "./freekickEngine";

const BALL_TEXTURE_SRC = "/soccer_ball.webp";
const KEEPER_HEAD_TEXTURE_SRC = "/head-goalkeeper.webp";
const CAMERA_Y = 1.1;
const CAMERA_Z = 2.4;

export function FreekickScene({
  stateRef,
  onShoot,
}: {
  stateRef: RefObject<GameState>;
  onShoot: (strikeOffsetX: number, strikeOffsetY: number, dragDx: number, dragDy: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const aimRef = useRef({ dragDx: 0, dragDy: 0 });
  // 0 = arms hanging down at rest (idle), 1 = raised out to the sides (kicked) — eased toward
  // its target each frame rather than snapping, so the arms visibly lift the moment a shot goes.
  const armRaiseRef = useRef(0);
  // The mount effect below only runs once (empty-ish deps); routing onShoot through a ref keeps
  // the Three.js scene from being torn down and rebuilt every time the parent re-renders with a
  // fresh (non-memoized) callback identity.
  const onShootRef = useRef(onShoot);
  useEffect(() => {
    onShootRef.current = onShoot;
  }, [onShoot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, CAMERA_Y, CAMERA_Z);
    camera.lookAt(0, 1, GOAL_LINE_Z);

    const { renderer, dispose: disposeRenderer } = mountThreeRenderer(container, camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(3, 8, 4);
    scene.add(sun);

    // No 3D ground plane here on purpose — the CSS background image behind this transparent
    // canvas (see .freekick-play-area) already has the pitch grass painted into it all the way
    // to the bottom edge, so a solid-color plane would just cover it up instead of blending in.

    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const postGeometry = new THREE.CylinderGeometry(0.06, 0.06, GOAL_HEIGHT, 12);
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_LINE_Z);
    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_LINE_Z);
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, GOAL_WIDTH, 12),
      postMaterial,
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, GOAL_HEIGHT, GOAL_LINE_Z);
    const net = new THREE.Mesh(
      new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
    );
    net.position.set(0, GOAL_HEIGHT / 2, GOAL_LINE_Z - 0.4);
    const goalGroup = new THREE.Group();
    goalGroup.add(leftPost, rightPost, crossbar, net);
    scene.add(goalGroup);

    // keeperGroup only ever translates (to keeper.x/y, which is forced to exactly match the
    // ball's position for a save — see freekickEngine's stepPhysics). All tilt/lean rotation
    // happens on the nested bodyPivot instead, positioned at this reference height (y=1) *within*
    // keeperGroup — so rotating it swings the body around the point that's pinned to the ball,
    // instead of around keeperGroup's own ground-level origin (which would swing the torso away
    // from that point at any real tilt angle, since the torso itself sits well above y=0).
    const keeperGroup = new THREE.Group();
    const bodyPivot = new THREE.Group();
    bodyPivot.position.y = 1;
    keeperGroup.add(bodyPivot);

    const keeperMaterial = new THREE.MeshStandardMaterial({ color: 0xffd400 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.35), keeperMaterial);
    torso.position.y = 0.7 - 1;
    bodyPivot.add(torso);

    // Each arm hangs from a pivot placed at the shoulder (where it attaches to the torso), with
    // the mesh itself offset so its *top* end sits at the pivot's local origin — rotating the
    // pivot then swings the arm around that attachment point like a real hinge, instead of the
    // whole limb sliding/translating through space.
    const ARM_LENGTH = 0.6;
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, ARM_LENGTH, 10);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.27, 1.15 - 1, 0);
    const leftArm = new THREE.Mesh(armGeometry, keeperMaterial);
    leftArm.position.y = -ARM_LENGTH / 2;
    leftArmPivot.add(leftArm);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.27, 1.15 - 1, 0);
    const rightArm = new THREE.Mesh(armGeometry, keeperMaterial);
    rightArm.position.y = -ARM_LENGTH / 2;
    rightArmPivot.add(rightArm);

    bodyPivot.add(leftArmPivot, rightArmPivot);
    // Arm pose (hanging down at rest vs. raised up-and-out once the kick happens) is animated in
    // the render loop below via pivot rotation, driven by game phase rather than fixed here.

    const textureLoader = new THREE.TextureLoader();

    // The user-supplied face image is a transparent-background portrait, not a seamless sphere
    // texture — a camera-facing Sprite (rather than a mesh) keeps it flat and always legible
    // instead of wrapping/distorting it around a head shape.
    const headMaterial = new THREE.SpriteMaterial({ transparent: true });
    const headSprite = new THREE.Sprite(headMaterial);
    // Lowered enough to overlap the torso's top edge (neck area) instead of floating just above
    // it, and sized up a bit from before. Pushed forward in z (the torso's front face sits at
    // +0.175) so the depth test doesn't let the torso's neck draw over the bottom of the face.
    headSprite.position.set(0, 1.55 - 1, 0.25);
    headSprite.scale.set(0.68, 0.68, 1);
    bodyPivot.add(headSprite);
    textureLoader.load(KEEPER_HEAD_TEXTURE_SRC, (texture) => {
      headMaterial.map = texture;
      headMaterial.needsUpdate = true;
      const aspect = texture.image.width / texture.image.height;
      const height = 0.68;
      headSprite.scale.set(height * aspect, height, 1);
    });

    keeperGroup.position.set(0, 0, KEEPER_Z);
    scene.add(keeperGroup);

    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f4f4 });
    textureLoader.load(BALL_TEXTURE_SRC, (texture) => {
      ballMaterial.map = texture;
      ballMaterial.needsUpdate = true;
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS_3D, 24, 24), ballMaterial);
    ball.position.set(0, BALL_RADIUS_3D, SPOT_Z);
    scene.add(ball);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function pointerToNdc(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return pointer;
    }

    function handlePointerDown(event: PointerEvent) {
      if (stateRef.current.phase !== "idle") return;
      pointerToNdc(event.clientX, event.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(ball)[0];
      if (!hit) return;
      const local = ball.worldToLocal(hit.point.clone());
      dragStartRef.current = { x: local.x, y: local.y };
      aimRef.current.dragDx = 0;
      aimRef.current.dragDy = 0;
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragStartRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      aimRef.current.dragDx = Math.max(-1, Math.min(1, dx * 2));
      aimRef.current.dragDy = Math.max(-1, Math.min(1, -dy * 2));
    }

    function handlePointerUp() {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!start) return;
      onShootRef.current(start.x, start.y, aimRef.current.dragDx, aimRef.current.dragDy);
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    let raf = 0;
    const animate = () => {
      const state = stateRef.current;
      ball.position.set(state.ball.x, state.ball.y, state.ball.z);
      ball.rotation.x += 0.2;

      // keeper.y is an abstract "reach height" where 1 = standing; above that the keeper jumps
      // upward off the ground, below it the keeper leans/dives down toward a low ball. No
      // clamping here (unlike before) — for a save this must reach the ball's exact height, even
      // if that means going all the way to the ground or beyond for a full-stretch low dive.
      const verticalDelta = state.keeper.y - 1;
      keeperGroup.position.x = state.keeper.x;
      keeperGroup.position.y = verticalDelta;
      bodyPivot.rotation.x = state.keeper.diving && verticalDelta < 0 ? Math.max(-0.9, verticalDelta) : 0;
      // Rotating a group positive around Z tips its top toward -X (screen-left, since the camera
      // looks down -Z with the usual +X-is-screen-right convention) — so diving toward +X (the
      // keeper's right) needs a NEGATIVE z rotation for the head/body to lead toward that side,
      // not away from it.
      const bodyTilt = state.keeper.diving ? -Math.sign(state.keeper.x) * 0.85 : 0;
      bodyPivot.rotation.z = bodyTilt;
      // Sprites always billboard to face the camera and ignore their parent's rotation for that
      // facing, so the head wouldn't otherwise visibly lean along with the body's tilt above —
      // driving the sprite's own in-plane rotation keeps the face matched to the dive angle.
      headMaterial.rotation = bodyTilt;

      const armTargetRaise = state.phase === "idle" ? 0 : 1;
      armRaiseRef.current += (armTargetRaise - armRaiseRef.current) * 0.25;
      const raise = armRaiseRef.current;
      // At raise=0 each pivot is unrotated, so its arm just hangs straight down. At raise=1 the
      // pivot has swung ~135° so the arm points up and outward (away from the body) rather than
      // straight out to the side — mirrored per side so both arms open upward like a "V".
      const raisedAngle = raise * 2.356; // ~135°
      leftArmPivot.rotation.z = -raisedAngle;
      rightArmPivot.rotation.z = raisedAngle;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      disposeObject3D(scene);
      disposeRenderer();
    };
  }, [stateRef]);

  return <div ref={containerRef} className="freekick-scene" />;
}
